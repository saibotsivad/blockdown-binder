export const logBlockdownWarnings = (filename, string, warnings) => {
	// TODO look up the right codes or document them at least
	if (process.env.LOG_LEVEL === 'warn') {
		console.log('Warnings found while parsing Blockdown file:', filename)
		const lines = string.split('\n')
		warnings.forEach(w => {
			console.log(`Line ${w.index}: ${w.code}`)
			const p = i => lines[i - 1] !== undefined && `${i === w.index ? '>' : ' '} ${i}: ${lines[i - 1]}`
			console.warn(
				[
					p(w.index - 2),
					p(w.index - 1),
					p(w.index),
					p(w.index + 1),
					p(w.index + 2),
				].filter(Boolean).join('\n')
			)
		})
	}
}
