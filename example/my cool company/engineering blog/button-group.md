---
title: Button Group
description: |
  Because this file is not inside a `_binder` folder, when you
  use it, the file path of the template needs to be a relative
  file path, e.g. `template["./button-group.md"]`

---!svelte

<div class="btn-group btn-group-{{size || 'lg'}}" role="group" aria-label="Basic example">
	{{#each buttons as button}}
		<button type="button" class="btn btn-secondary">
			{{button.title}}
		</button>
	{{/each}}
</div>
