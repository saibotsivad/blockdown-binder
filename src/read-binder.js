import { execSync } from 'node:child_process'
import { basename, dirname, join, resolve } from 'node:path'
import { access, mkdir, readdir, readFile, writeFile  } from 'node:fs/promises'

import symlink from 'fs-symlink'
import tableize from 'tableize-object'
import { parse } from '@saibotsivad/blockdown'
import { load } from 'js-yaml'
import { dset } from 'dset'
import { get } from 'pointer-props'

import { logBlockdownWarnings } from './logger.js'

const BINDER_DIR = '.binder'
const BINDER_NPM_PREFIX = '_'
const BINDER_PLUGINS_DIR = 'plugins'
const BINDER_YAML = '.binder.yaml'
const IMPORT_REGEX = /^\s*\$import\(\s*(?:"(?<name1>[^"]+)"|'(?<name2>[^']+)')\s+with\s+(?:"(?<with1>[^"]+)"|'(?<with2>[^']+)')\s*\)\s*$/
const REF_REGEX = /^\s*\$ref\(\s*(?:"(?<path1>[^"]+)"|'(?<path2>[^']+)')\s*\)\s*$/

const recursiveReadBinder = async (binderDirectory, pluginDir, currentDir = '.') => {
	if (currentDir === BINDER_DIR || currentDir === pluginDir) return []
	const dirents = await readdir(join(binderDirectory, currentDir), { withFileTypes: true })
	const files = []
	for (const dirent of dirents) {
		if (dirent.isDirectory()) {
			files.push(...(await recursiveReadBinder(binderDirectory, pluginDir, join(currentDir, dirent.name))))
		} else if (join(currentDir, dirent.name) !== BINDER_YAML) {
			files.push(join(currentDir, dirent.name))
		}
	}
	return files
}

const buildNpmLocal = async (directory, binderConfiguration) => {
	let pkg = {
		name: 'blockdown-binder',
		private: true,
		type: 'module',
		dependencies: {}
	}
	for (const name in (binderConfiguration.dependencies || {})) {
		pkg.dependencies[name] = binderConfiguration.dependencies[name]
	}
	await mkdir(join(directory, BINDER_DIR), { recursive: true })
	await writeFile(join(directory, BINDER_DIR, 'package.json'), JSON.stringify(pkg, undefined, 2), 'utf8')
	execSync('npm install', {
		cwd: join(directory, BINDER_DIR),
		stdio: [ 0, 1, 2 ]
	})
}

export const installPluginsAndSymlink = async (directory, configuration) => {
	try {
		await access(join(directory, BINDER_DIR, 'node_modules'))
	} catch (error) {
		if (error.code !== 'ENOENT') throw error
		console.log('No cache found. Fetching plugins now, this may take a minute, but is a one-time action.')
		await buildNpmLocal(directory, configuration)
	}
	if (configuration.binder.plugins) {
		const npmFolder = join(directory, BINDER_DIR, 'node_modules', BINDER_NPM_PREFIX)
		try {
			await mkdir(npmFolder)
		} catch (error) {
			if (error.code !== 'EEXIST') throw error
		}
		symlink(join(directory, configuration.binder.plugins), join(npmFolder, BINDER_PLUGINS_DIR))
	}
}

export const filterBlockdownFiles = (files, configuration) => {
	const extensions = configuration.binder?.extensions || [ 'md', 'bd' ]
	return files.filter(file => extensions.find(ext => file.endsWith('.' + ext)))
}

export const loadAndInitializeBinder = async (directory) => {
	let configuration
	try {
		configuration = await readFile(join(directory, BINDER_YAML), 'utf8')
		configuration = load(configuration)
	} catch (error) {
		if (error.code === 'ENOENT') throw new Error(`Could not locate root "${BINDER_YAML}" file, is this really a Blockdown Binder?`)
		else throw error
	}
	if (!configuration || !configuration.binder || !configuration.binder.version) throw new Error('Binder configuration file must have at least the version set.')
	const files = await recursiveReadBinder(directory, configuration.binder.plugins)
	await installPluginsAndSymlink(directory, configuration)
	const blockdownFiles = filterBlockdownFiles(files, configuration)
	return { configuration, blockdownFiles }
}

const parseBlockdown = async (directory, filename) => {
	const string = await readFile(join(directory, filename), 'utf8')
	const { blocks, warnings } = parse(string)
	if (warnings.length) { logBlockdownWarnings(filename, string, warnings) }
	return blocks
}

export const initializeParser = () => {
	const parserCache = {
		frontmatter: ({ content }) => load(content)
	}
	const importerCache = {}
	const filenameToCache = {}

	const resolveImports = async (configuration, directory, filename, metadata) => {
		const table = tableize(metadata)
		for (const key in table) {
			const match = IMPORT_REGEX.exec(table[key].toString() || '')
			if (match) {
				const importerName = match.groups.with1 || match.groups.with2
				if (!configuration.importers?.[importerName]?.file) throw new Error(`Encountered import using "${importerName}" without corresponding importer.`)
				if (!importerCache[importerName]) {
					const { default: importer } = await import(join(directory, BINDER_DIR, 'node_modules', BINDER_NPM_PREFIX, BINDER_PLUGINS_DIR, configuration.importers[importerName].file))
					importerCache[importerName] = await importer({
						configuration,
						binderDirectory: directory,
						cacheDirectory: join(directory, BINDER_DIR)
					})
				}
				const relativeFilename = match.groups.name1 || match.groups.name2
				const absoluteFilename = relativeFilename.startsWith('./')
					? resolve(join(directory, filename), '..', relativeFilename)
					: resolve(directory, relativeFilename)
				if (!absoluteFilename.startsWith(directory)) throw new Error(`Import filename was outside the Binder: "${relativeFilename}" resolves to "${absoluteFilename}"`)
				const imported = await importerCache[importerName]({
					relativeFilename,
					filename: absoluteFilename
				})
				dset(metadata, key, imported)
			}
		}
		return metadata
	}

	const resolveRefs = (fileMetadata, blockMetadata) => {
		const table = tableize(blockMetadata)
		for (const key in table) {
			const match = REF_REGEX.exec(table[key].toString() || '')
			if (match) {
				dset(blockMetadata, key, get(fileMetadata, match.groups.path1 || match.groups.path2))
			}
		}
		return blockMetadata
	}

	return async (filename, { directory, configuration, blockdownFiles }) => {
		if (!blockdownFiles.includes(filename)) throw new Error(`Could not locate "${filename}" in Binder or was not a valid Blockdown extension.`)
		if (!filenameToCache[filename]) filenameToCache[filename] = {}

		if (!filenameToCache[filename].parsed) {
			const blocks = await parseBlockdown(directory, filename)

			// loop 1: make sure all plugins are initialized
			for (const { name } of blocks) {
				if (!configuration.parsers?.[name]?.file) throw new Error(`Encountered block named "${name}" without corresponding parser.`)
				if (!parserCache[name]) {
					const { default: parser } = await import(join(directory, BINDER_DIR, 'node_modules', BINDER_NPM_PREFIX, BINDER_PLUGINS_DIR, configuration.parsers[name].file))
					parserCache[name] = await parser({
						configuration,
						binderDirectory: directory,
						cacheDirectory: join(directory, BINDER_DIR)
					})
				}
			}

			// load frontmatter yaml and resolve imports
			if (!filenameToCache[filename].metadata && blocks[0]?.name === 'frontmatter') {
				filenameToCache[filename].metadata = await resolveImports(configuration, directory, filename, load(blocks[0].content))
			}
			if (blocks[0]?.name === 'frontmatter') blocks.shift()

			// loop 2: resolve imports and refs for metadata in the blocks
			for (const block of blocks) {
				// TODO can there be circular imports?
				if (block.metadata) {
					block.metadata = await resolveImports(configuration, directory, filename, load(block.metadata))
					block.metadata = resolveRefs(filenameToCache[filename].metadata, block.metadata)
				}
			}

			// loop 3: parse for each block
			let output = []
			let perFilePluginCache = {}
			for (const block of blocks) {
				if (!perFilePluginCache[block.name]) {
					perFilePluginCache[block.name] = await parserCache[block.name]({
						filename,
						metadata: filenameToCache[filename].metadata,
						blocks,
					})
				}
				output.push(await perFilePluginCache[block.name]({
					block,
					index: output.length,
				}))
			}

			const concatenated = output.reduce((map, { head, css, html }) => {
				if (head) map.head.push(head)
				if (css) map.css.push(css)
				if (html) map.html.push(html)
				return map
			}, { head: [], css: [], html: [] })
			filenameToCache[filename].parsed = {
				head: concatenated.head.join('\n'),
				css: concatenated.css.join('\n'),
				html: concatenated.html.join('\n'),
			}
		}
		return [ filenameToCache[filename].metadata, filenameToCache[filename].parsed ]
	}
}

const HTML = ({ metadata, head, css, html }) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${metadata.title ? `<title>${metadata.title}</title>` : '' }
${head}
</head>
${css ? `<style>${css}</style>` : '' }
<body>
${html}
</body>
</html>`

const initializeRenderer = async (configuration, directory) => {
	const cachedRenderers = {
		html: async params => ({ rendered: HTML(params), extension: 'html' })
	}
	return async ({ format, metadata, parsed: { head, css, html } }) => {
		if (!format) {
			// TODO get from metadata I suppose? a plugin here probably?
			// throw at the end if not? or warn and skip?
		}

		if (!cachedRenderers[format]) {
			if (!configuration.exporters?.[format]?.file) throw new Error(`Encountered export of format "${format}" without corresponding exporter.`)
			const { default: renderer } = await import(join(directory, BINDER_DIR, 'node_modules', BINDER_NPM_PREFIX, BINDER_PLUGINS_DIR, configuration.exporters[format].file))
			cachedRenderers[format] = await renderer({
				configuration,
				binderDirectory: directory,
				cacheDirectory: join(directory, BINDER_DIR)
			})
		}
		return cachedRenderers[format]({ metadata, head, css, html })
	}
}

const exportSingleFile = async ({ configuration, parse, render, directory, blockdownFiles, file, format, output }) => {
	const [ metadata, parsed ] = await parse(file, { directory, configuration, blockdownFiles })
	const { rendered, extension } = await render({ format, metadata, parsed })

	let filename = basename(file).split('.')
	filename.pop()
	filename = filename.join('') + '.' + extension

	const fileDirectory = dirname(file)
	const outputDirectory = join(resolve(output), fileDirectory)
	await mkdir(outputDirectory, { recursive: true })
	await writeFile(join(resolve(output), fileDirectory, filename), rendered, 'utf8')
}

// ======= here are what I propose are the main exported things

/**
 * Render a single Blockdown file from a Binder. Note that a single Blockdown file can
 * output multiple files, depending on what plugins etc. are configured. If the output
 * path is not a directory, a directory will be created at that output path.
 *
 * @param {String} binderDirectory - The relative or fully resolved path to the Blockdown Binder file.
 * @param {String} file - The markdown/blockdown file to be rendered.
 * @param {String} output - The relative or fully resolved path to the directory where rendered files are placed.
 * @param {String} [format] - If provided here, this will attempt to override any output format specifications of the file.
 * @return {Promise<void>} - Returns when all files are rendered.
 */
export const renderBlockdownFile = async (binderDirectory, file, output, format) => {
	const absoluteBinderDirectory = resolve(binderDirectory)
	const parse = initializeParser()
	const { configuration, blockdownFiles } = await loadAndInitializeBinder(absoluteBinderDirectory)
	const render = await initializeRenderer(configuration, absoluteBinderDirectory)

	await exportSingleFile({ configuration, parse, render, directory: absoluteBinderDirectory, blockdownFiles, file, format, output })
}

/**
 * Render a list of Blockdown files from a Binder, or the entire Binder if no files are
 * specified. If the output directory does not exist, it will be created.
 *
 * @param {String} binderDirectory - The relative or fully resolved path to the Blockdown Binder file.
 * @param {String} output - The relative or fully resolved path to the directory where rendered files are placed.
 * @param {Array<String>} [files] - The markdown/blockdown files to be rendered. If none are specified, the full Binder will be rendered.
 * @return {Promise<void>} - Returns when all files are rendered.
 */
export const renderBlockdownFiles = async (binderDirectory, output, files) => {
	const absoluteBinderDirectory = resolve(binderDirectory)
	const parse = initializeParser()
	const { configuration, blockdownFiles } = await loadAndInitializeBinder(absoluteBinderDirectory)
	const render = await initializeRenderer(configuration, absoluteBinderDirectory)

	for (const file of files) {
		await exportSingleFile({ configuration, parse, render, directory: absoluteBinderDirectory, blockdownFiles, file, output })
	}
}
