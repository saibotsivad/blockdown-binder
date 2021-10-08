---
title: Tabs vs Spaces
foo:
  bar: fizz
  fizz: $import("./data.json" with 'json')
---

The answer is to indent with tabs, and align with spaces.

---

It's not that complicated.

Here is a [[my cool company/engineering blog/how-stuff-works.md|normal link]].

The URL will resolve to `cool-company.com/canonical-link/` based on the site mapping and canonical Front Matter property.

Because this is a Markdown block, it will first turn into a Markdown link like this:

```
[normal link](cool-company.com/canonical-link/)
```

Then it will get passed into the configured Markdown renderer.

If you want a fancier link, you could use an inline Binder template, which would look like this ::link.md|my cool company/engineering blog/how-stuff-works.md|fancy link:: to make a Markdown one, or ::link.md|my cool company/engineering blog/how-stuff-works.md|fancy link|html:: for a template output of HTML.

This is an escaped inline template: \::link.md|foo.md|bar::

---[[svelte|
title: example
name: $ref('/foo/fizz/hello')
more: $import('./other-data.json' with 'json')
]]

<svelte:head>
	<link rel="stylesheet" href="tutorial/dark-theme.css">
</svelte:head>

<script>
	export let _
	export let metadata
</script>

<h1>The title for this is {metadata?.title}</h1>
{#if _?.title}
	<h2>{_?.title}</h2>
{/if}

<p>Hello {metadata.name}</p>
<p>{metadata.more.text}</p>
