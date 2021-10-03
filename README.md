# Blockdown Binder

Your own collection of Blockdown documents, some private, some public.

## What?

Write your private essays, PDF templates, blog posts, email auto-response snippets, and whatever else helps you be productive in [Blockdown](https://github.com/saibotsivad/blockdown) syntax.

The *Blockdown Binder* is an additional syntax and file structure to cross-reference files, so you can use templates, link across websites, and more.

## Overview

You've got one folder, call that your "binder".

Inside that folder, any Blockdown file (text file with an extension `.md` that is valid Blockdown) can:

* Import data from any other file in your binder,
* Link to any other file, public or private, in or outside the binder,
* Use files inside your Binder as templates,
* Be rendered to HTML or PDF using defined plugins,
* And more.

## Blockdown Differences

The Blockdown specs are very permissive, and the Blockdown Binder attempts to keep those permissive specs, while adding a handful of constraints to make the added functionality easier to understand.

### Metadata

Blockdown doesn't specify any metadata style, but in Blockdown Binder the metadata style is parsed using YAML style syntax.

Here are some examples in Blockdown Binder, then JSON:

* Single key-value
  * `---[[name|foo: bar]]` => `{ "foo": "bar" }`
  * `---[[name|foo: 3]]` => `{ "foo": 3 }`
  * `---[[name|foo]]` => `"foo"`
  * `---[[name|foo: { fizz: buzz }]]` => `{ "foo": { "fizz": "buzz" } }`
  * Note that for valid YAML, multiple key-value, single-line, needs to be wrapped in curly-braces
  * `---[[name|{ foo: bar, fizz: buzz }]]` => `{ "foo": "bar", "fizz": "buzz" }`
* Or wrapped in square brackets for arrays
  * `---[[name|[fizz, buzz]]]` => `[ "fizz", "buzz" ]`
* Adding spaces for clarity is fine, if you like
  * `---[[name| [fizz, buzz] ]]` => `[ "fizz", "buzz" ]`

Multi-line is also okay, but again, will be parsed using YAML syntax:

```md
---[[name|
foo: bar
fizz: buzz
]]
```

becomes `{ "foo": "bar", "fizz": "buzz" }` and so on.

Additionally, the `$` character as a property name is reserved for the Blockdown Binder internals: you can't have metadata like this:

```yaml
$: foo
# or
foo:
  $: bar
```

That is valid YAML, but the `$` is reserved for use by plugins and templates.

## Extra Functionality

The main value proposition of Blockdown Binder is the added functionality.

### Binder References

A Blockdown Binder is simply a folder, containing any number of files and sub-folders, which can reference anything internal to the Binder. The root of a Blockdown Binder folder is denoted using a file named `.binder.yaml`, which contains any configurations necessary for that specific Binder.

Consider a folder structure like this:

```
/Users
	/saibotsivad
		/Documents
			document-0.md
			/Demo Binder
				.binder.yaml
				/folder-1
					document-1.md
				/folder-2
					document-2.md
```

Since the files `document-1.md` and `document-2.md` are within the "Demo Binder", they can reference each other, but neither of them can reference the `document-0.md` file, since it is outside the Binder.

References within the Binder use forward-slash path separators, with a `/` prefix denoting the Binder root. Relative paths are allowed, but references outside the Binder must be considered invalid and unsafe.

For example, to reference `document-2.md` from `document-1.md` the following are valid:

* `../folder-2/document-2.md`
* `/folder-2/document-2.md`

### Imports

Blockdown Binder adds importing as a functionality available in either the Front Matter (the first YAML block of the Blockdown document) or inside any metadata block.

Imports must pass through an import handler, to be interpreted to in-memory representation. For example, importing a CSV file likely means that you want to turn it into an in-memory array of values, not that you want the overall string.

The syntax for an import is `$import("PATH" with "HANDLER")`, where `PATH` is the relative or Binder-absolute filepath (again noting that references outside the Binder are forbidden) and `HANDLER` is the import handler name.

For example, a block delimiter `---[[name|data: $import("/path/to/file.csv", "csv")]]` would import the file `path/to/file.csv` from the root of the Binder, and the handler responsible for loading and parsing the CSV file is the one named `csv`.

Although the Blockdown Binder spec does register some import handler *names* as a defined data type, e.g. `csv` is [RFC-4180](https://datatracker.ietf.org/doc/html/rfc4180), it does not specify an actual loader or parser library for any type. Picking specific handler libraries is left to the Binder as part of configuration in the root `.binder.yaml` file.

### Document Self Reference

Metadata in the document can reference data in the Blockdown's first YAML section (aka the Front Matter) using the syntax `$ref("POINTER")` where `POINTER` is the [JSON Pointer (RFC-6901)](https://datatracker.ietf.org/doc/html/rfc6901) to that property.

For example, given this Front Matter section:

```yaml
---
title: foo
car:
  color: red
```

The reference `$ref("/car/color")` would resolve to `red` if used in a metadata section, e.g. `---[[name|color: $ref("/car/color")]]

References are resolved as part of parsing the YAML of each metadata section, after the Front Matter is parsed and imports in it are resolved, so if you import data into the Front Matter section you'll have access to it in the metadata.

### Markdown Inline Blocks

The original Blockdown specs do not include an inline component, so the Blockdown Binder specs add that functionality.

Inside blocks that are tagged as markdown (using either `md` or `markdown`) a Blockdown-like syntax is used for inline references:

```blockdown
---!md
line with words [[name#id|metadata]] and more words
```

* `[[` and `]]` - These are the prefix and suffix delimiting the reference
* `name` - What to interpret it as, e.g. `mermaid` or `template`
* `id` - An optional identifier
* `metadata` - Same as the metadata in normal Blockdown block level delimiters.

The same rules as block level delimiters also apply here:

You can import data

```blockdown
---!md
inline words [[name#id|data: $import("./file.txt", "csv")]] and more words
```

You can reference data from the Frontmatter

```blockdown
---!md
inline words [[name#id|data: $ref("/car/color")]] and more words
```

And multi-line is also supported:

```blockdown
---!md
inline words [[name#id|
foo: bar
]] and more words
```

## Defined Import Handler Names

The following names should be interpreted to mean a specific kind of data, and should use handlers that interpret that data in a way meaningful to the description.

> **Note:** to be clear, the Blockdown Binder specs do not specify any particular plugin or handler for any of these import names, simply that they should be used to mean the same thing across all Binders.

* `bd` Means a parsed and resolved Blockdown file, which will use the same rules as the Blockdown Binder. (Note that this allows for recursion! Your Binder implementation will need to handle resolving that in whatever way is appropriate.)
* `csv` Means a text file with newline delimited rows, and comma delimited columns, e.g. [RFC-4180](https://datatracker.ietf.org/doc/html/rfc4180).
* `md` A file that conforms to some form of Markdown-like syntax.
* `txt` Means a plain text file with no additional metadata or information, represented in JavaScript as a plain `string`.
* `xml` [Extensible markup language](https://www.w3.org/XML/) that the world has come to know and ... use.

## Reserved Names

For increased portability, Blockdown Binder reserves the following name values, both for block and inline delimiters:

- `link` - Generates a URL to a resource inside the Binder
- `template` - Expands a template, using the context provided, with rules and such

```markdown
line with [an internal link]([[link|url: /path/to/file.ext]]) that goes to a downloadable file
or internal document, depending on the target output

---[[template|url: /path/to/template.bd]]
Block level delimiter
```

### Links: `link`

This generates a [URL](https://url.spec.whatwg.org/) to a file internal to your Blockdown Binder:

```markdown
[[link#id|PATH]]
```

The `PATH` is the Binder filepath, which is the relative path or absolute with `/` being the root of the Binder. (Note: accessing files outside the Binder is invalid.)

If the `PATH` has a file extension that is not specified as a valid output by the linked file (e.g. if the extension is `pdf` and the linked file only specifies `html` output) the Binder renderer will throw an error.

### Templates: `template`

Templates are normal Binder files. You don't need to denote the file itself at all, but templates do stretch the meaning of the identifier portion of the Blockdown syntax by using it for the file identifier instead:

```markdown
[[template#PATH|OPTIONAL_PARAMS]]

```

When a template is called, the calling file's metadata (the Frontmatter), the parsed Blockdown sections, and the optional parameters, are all available on the reserved root parameter `$`.

* `$.metadata <Object>` *(optional)* - The metadata (Frontmatter) of the calling file.
* `$.blocks <Array>` - The list of parsed, but not rendered, Blockdown blocks of the calling file.
* `$.index <Number>` - The index of the `$.blocks` array for the specific template call.
* `$.inlineIndex <Number>` *(optional)* - If called as a template within an inline section, this will be the index within that section.

If a template calls another template, the same thing will happen, meanining that you'll potentially end up with a chain of `$.$.$.$` that repeats for the depth of the template calling stack.

For example, suppose in our Blockdown file that we're rendering, we have Frontmatter and block metadata, like this:

```markdown
---
title: Template Example
---[[template#/template1.md|title: Alternate Title]]
```

Then, inside the `template1.md` file suppose it calls a second template:

```markdown
---
title: Template One
---[[template#/template2.md|title: Template One Alternate Title]]
```

Finally, inside `template2.md` suppose it has a named block:

```markdown
---
title: Template Two
---[[example#numbertwo|title: Example Title]]
```

The total object structure that the `example` plugin would be called with would be:

```json
{
	"index": 1,
	"id": "numbertwo"
}

index: 1
id: numbertwo
metadata:
  title: Example Title
blocks:
  - name: frontmatter
    metadata:
      title: Template Two
  - name: example
    id: numbertwo
    metadata:
      title: Example Title
$:
  index: 1
  metadata:
    title: Template One Alternate Title
  blocks:
    - name: frontmatter
      metadata:
        title: Template One
    - name: template
      id: /template2.md
      metadata:
        title: Template One Alternate Title
  $:
    meta
```


```markdown
inline or block level is the same, but here is a block

---[[template#PATH|PARAMS]]
```

Note in this 





## External Binders

TODO this could come later?

You could do a thing where you reference an external binder, maybe in the `.binder.yaml` you have like:

```yaml
external_binders:
  - name: my_fancy_other_binder
    description: a long form description to help you know what it is
    url: if the binder is read only maybe?
    # or maybe
    npm: npm-name@^1.2.3
```

You'd need to be able to reference things on disk, which feels like it should be its own file, so maybe something like `.binder-external.yaml` that would be configured to your specific filesystem, and it'd have something like:

```yaml
binders:
	my_fancy_other_binder: ../../../../relative/or/absolute/path/to/binder
```








--------------------------------------------------------
--------------------------------------------------------
--------------------------------------------------------

Strictly speaking, the `$import` is a function, and that `ini` property value is evaluated in JavaScript, so you can actually use string concatenation or template literals:

```
---!mermaid[myKey=$import(`path/to/${$.metadata.filename}.csv`, 'csv')]
```

### Referencing data

you need to import in the frontmatter

then reference in file

$data ??? maybe that's the metadata of the document?

or maybe {{$import(path/to/file.csv)[1][5]}}







okay so each file has reference to data through the special character `$` which has

- `$.metadata <Object>` the front matter metadata, if it exists
- `$.blocks <Array>` the list of blocks, but before passing to plugins

there is also this special keyword

- `$import <Function>` use it in places

if your blockdown section has metadata
the plugin gets called with the properties of that document
but also merged on top of `$.metadata` it gets whatever is in the blockdown metadata

```
---
foo: bar1
fizz: buzz1
---!thing[foo=bar2]
```

then the `thing` plugin would get called with `$.metadata.foo` would be `bar2`
and `$.metadata.fizz` would be `buzz1`

if you call a template, so like

```
text
---!template['filename.md',foo=bar1]
```

then the template would be called with `$.metadata.foo`





noddity syntax:

an inline or block template ::filename|param1|param2|param_etc::

a link [[filename|text of link]]



link syntax like [[path/to/file.md|text of link|alt text]]

so it goes up, up, up until it finds
	a _README.md
		that has a frontmatter
			with public=true
	then go to path/to/file.md
	does it have a 'canonical' property?
		if yes
			use that as link
		if no
			use normal rules that would turn it into an html link

```yaml
public: true
domain: site1.com
```

if a document is inside one domain and links to another domain
that's actually fine
it just needs to construct the link to point to the other site
but how will it know?
[[path/to/file.md|link1]]
vs
[[other-domain-path/to/file.md|link2]]
could you have
a _README.md down below those
that defines public sites?

```yaml
sites:
	- domain: site1.com
	  folder: path-to-site1
	- domain: site2.com
	  folder: path-to-site2
```

