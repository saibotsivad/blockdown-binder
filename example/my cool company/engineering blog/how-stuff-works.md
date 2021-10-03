---
title: How Stuff Works
canonical: /how-things-work/ # the optional canonical link
example_progress:
  width: 73
  bg: success
  height: 2rem
---

This is how you use block level templates:

---!template["card.md"]

<p class="card-text">
	Some quick example text to build on the card title
	and make up the bulk of the card's content.
</p>

---!md

Note that the `card.md` template is not in the scoped binder, it's
down in the root binder.

You can specify multiple templates, and they can have ids:

---!template#example2["card.md"]

<p class="card-text">
	Another example.
</p>

---!md

The `progress.md` template is in this binder folder, and doesn't require
a "slot" to insert content, but you can pass different parameters to it
to change how it displays.

Change the background style:

---!template["progress.md",width=25,bg=warning]
---!md

Change the height:

---!template["progress.md",width=25,height=5rem]
---!md

Make it striped:

---!template["progress.md",width=25,striped=true]
---!md

Make it animated:

---!template["progress.md",width=25,striped=true,animated=true]
---!md

Reference data from the Front Matter section, but override one of
the properties (in this case the `height`):

---!template["progress.md",...$.example_progress,height=20px]
---!md

Multi-line template blocks are also possible. This one also demonstrates
how templates are referenced outside a `_binder` folder.

---!template[
	"./button-group.md",
	size=lg
	buttons=[
		{title:'First'}
	]
]
