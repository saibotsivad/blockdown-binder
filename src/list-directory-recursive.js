import { join } from 'path'
import { promisify } from 'util'
import { readdir } from 'fs'

const readdirPromise = promisify(readdir)

export const listDirectoryRecursive = async dir => {
	const dirents = await readdirPromise(dir, { withFileTypes: true })
	const files = []
	for (const dirent of dirents) {
		if (dirent.isDirectory()) {
			files.push(...(await listDirectoryRecursive(join(dir, dirent.name))))
		} else {
			files.push(join(dir, dirent.name))
		}
	}
	return files
}
