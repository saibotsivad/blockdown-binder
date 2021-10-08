import { renderBlockdownFile } from './src/read-binder.js'

const start = Date.now()
const end = () => `${Math.round((Date.now() - start) / 1000) / 1000}s`

const work = async () => {
	await renderBlockdownFile('./example', 'essays/tabs-vs-spaces.md', './example-output', 'html')
}

work()
	.then(() => {
		console.log('done', end())
	})
	.catch(error => {
		console.error('error', end(), error)
	})
