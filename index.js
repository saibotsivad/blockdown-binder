import { listBinderFiles } from './src/read-binder.js'

const IN_MEMORY_CACHE = {}
const cache = {
	async get(filepath, property) {
		return IN_MEMORY_CACHE[filepath] && IN_MEMORY_CACHE[filepath][property]
	},
	async put(filepath, property, data) {
		IN_MEMORY_CACHE[filepath] = IN_MEMORY_CACHE[filepath] || {}
		IN_MEMORY_CACHE[filepath][property] = data
	}
}

const start = new Date().getTime()
const end = () => new Date().getTime() - start

const work = async () => {
	const files = await listBinderFiles('./example')
	console.log(files)
}

work()
	.then(() => {
		console.log('done', end())
	})
	.catch(error => {
		console.error('error', end(), error)
	})
