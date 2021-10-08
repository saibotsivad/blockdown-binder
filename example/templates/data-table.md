---
title: Data Table
description: |
  In this template, you pass in the spreadsheet reference and it
  gets imported and then rendered here.
---

<table>
	{{#each data as row}}
		<tr>
			{{#each row as column}}
				<td>
					{{column}}
				</td>
			{{/each}}
		</tr>
	{{/each}}
</table>
