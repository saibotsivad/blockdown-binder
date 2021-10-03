---
title: Progress Bar
description: |
  Example scoped template, it's only available inside the Engineering
  Blog binder, it's a progress bar using Bootstrap.

---!svelte

<div class="progress">
	<div
		class="progress-bar {{$.bg ? `bg-${bg}` : ''}}"
		class:progress-bar-striped={{striped}}
		class:progress-bar-animated={{animated}}
		role="progressbar"
		style="width: {{$.width}}%"
		aria-valuenow="{{$.width}}"
		aria-valuemin="0"
		aria-valuemax="100"></div>
</div>
