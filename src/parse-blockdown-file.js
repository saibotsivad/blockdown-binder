import { parse } from '@saibotsivad/blockdown'
import { join } from 'path'
import { promisify } from 'util'
import { readFile } from 'fs'

const readFilePromise = promisify(readFile)

export const parseBlockdownFile = async (binderPath, filePath) => {
	// TODO what if the file type is different, like a jpeg?
	const data = await readFilePromise(join(binderPath, filePath), { encoding: 'utf8' })
	return parse(data).blocks
}
