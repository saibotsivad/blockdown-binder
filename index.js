import { join } from 'path'
import { safeLoad } from 'js-yaml'
import { openBinder } from './src/open-binder.js'

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
openBinder({
	binderPath: join(__dirname, 'example'),
	renderers: {
		frontmatter: async ({ content }) => safeLoad(content),
		md: async ({ content }) => {
			return 'foo'
		}
	},
	cache
})
	.then(binder => binder
		.renderFile({
			file: 'my cool company/engineering blog/how-stuff-works.md'
		})
	)
	.then(() => {
		console.log(` ----- Done in ${new Date().getTime() - start}ms -----`)
	})
	.catch(error => {
		console.error(error)
	})
