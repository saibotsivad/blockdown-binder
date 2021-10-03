import { listDirectoryRecursive } from './list-directory-recursive.js'
import { parseBlockdownFile } from './parse-blockdown-file.js'

const parseAndRecurseAndRenderFile = async ({ file, binderFiles, binderPath, cache, renderers }) => {
	if (!binderFiles.includes(file)) {
		throw 'file to render not found in binder'
	}
	if (!file.endsWith('.md')) {
		throw 'can only render .md files'
	}

	let blocks = await cache.get(file)
	if (!blocks) {
		blocks = await parseBlockdownFile(binderPath, file)
		await cache.put(file, 'blocks', blocks)
	}

	const page = {}

	if (blocks[0].name === 'frontmatter') {
		page.metadata = await renderers.frontmatter(blocks[0])
		// TODO maybe save the metadata in the cache?
		// TODO recursively look through metadata to look for imports
		blocks.splice(0, 1) // skip parsing the first line
	}

	for (const block of blocks) {
		console.log('-----------------', block)
	}

	console.log(page.metadata)
}

export const openBinder = async ({ binderPath, renderers, cache }) => {
	const binderFiles = (await listDirectoryRecursive(binderPath))
		.map(filepath => filepath.replace(binderPath, '').replace(/^\//, ''))

	return {
		renderFile: async ({ file }) => parseAndRecurseAndRenderFile({
			file,
			binderPath,
			binderFiles,
			cache,
			renderers
		})
	}
}
