import { join, resolve } from 'node:path'
import { readdir } from 'node:fs/promises'


export const listBinderFiles = async binderDirectory => {
	const absolutePath = resolve(binderDirectory)
	const dirents = await readdir(absolutePath, { withFileTypes: true })
	const files = []
	for (const dirent of dirents) {
		if (dirent.isDirectory()) {
			files.push(...(await listBinderFiles(join(binderDirectory, dirent.name))).files)
		} else {
			files.push(join(absolutePath, dirent.name))
		}
	}
	return { binder: absolutePath, files: files.map(f => f.replace()) }
}
