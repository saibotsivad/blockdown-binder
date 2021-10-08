import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { compile } from 'svelte/compiler'

export default async ({ configuration, binderDirectory, cacheDirectory}) => {

	return async ({ filename, metadata, blocks }) => {

		const outputDir = join(cacheDirectory, 'svelte', filename)
		await mkdir(outputDir, { recursive: true })

		return async ({ block, index }) => {
			const { js: { code } } = compile(block.content, { generate: 'ssr' })
			const componentFilename = join(outputDir, `block-${index}.js`)
			await writeFile(componentFilename, code, 'utf8')
			const { default: Component } = await import(componentFilename)
			const { head, html, css } = Component.render({ _: metadata, metadata: block.metadata })
			return { head, html, css: css.code }
		}
	}
}
