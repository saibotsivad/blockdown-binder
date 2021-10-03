---
title: Card Template
description: |
  This is an example of a template. It uses Svelte as a
  templating language but you could specify your own, such
  as Nunjucks, LiquidJS, or Mustache. This template also
  uses Bootstrap 4 so the "card" styles will come from there.

---!svelte

<!-- Here is a comment, it's allowed. -->

<div class="card" style="width: 18rem;">
	{{#if image}}
		<img
			src={{image.src}}
			class="card-img-top"
			alt={{img.alt}}
		>
	{{/if}}
	<div class="card-body">
		{{#if title}}
			<h5 class="card-title">
				{{title}}
			</h5>
		{{/if}}
		<slot />
	</div>
</div>
