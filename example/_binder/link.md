---
title: Link Template
description: |
  You don't need the template to output HTML, in fact you can
  switch on properties and output HTML or some other syntax.

---!svelte

{{#if $.3 === 'html'}}
	<a href={{$.0}}>
		{{$.1}}
	</a>
{{elseif $.3 === 'plain'}}
	$.1
{{else}}
	[$.1]($.0)
{{/if}}
