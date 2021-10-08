import { readFile } from 'node:fs/promises'

export default async ({ configuration, binderDirectory, cacheDirectory}) => {
	let cache = {}
	return async ({ filename, relativeFilename }) => {
		if (!cache[filename]) {
			let file
			try {
				file = await readFile(filename, 'utf8')
			} catch (error) {
				if (error.code === 'ENOENT') throw new Error(`Could not locate "${relativeFilename}" at "${filename}"`)
				throw error
			}
			try {
				cache[filename] = JSON.parse(file)
			} catch (error) {
				if (error.name === 'SyntaxError') throw new Error(`Invalid JSON data for "${relativeFilename}" at "${filename}"`)
				throw error
			}
		}
		return cache[filename]
	}
}
