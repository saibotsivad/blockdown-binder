import markdown from 'markdown-it'

export default async ({ configuration, binderDirectory, cacheDirectory}) => {
	const md = markdown({
		typographer: true,
		quotes: '“”‘’',
	})

	return async ({ filename, frontmatter, blocks }) => {

		return async ({ block: { content } }) => {
			return {
				html: md.render(content)
			}
		}
	}
}
