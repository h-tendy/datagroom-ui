# markdown-it-mermaid

Mermaid plugin for markdown-it. (Forked from iradb2000/markdown-it-mermaid)

- Update Mermaid to 8.5!
- Support all mermaid diagrams
- Add external title support
- Use stable id for mermaid (good for static sites)

This version uses a different syntax to support mermaid.  The syntax
uses the syntax highlighting notation by putting the word `mermaid`
directly after the opening fence marker.

## Installation

```
npm install @DatatracCorporation/markdown-it-mermaid
```

## Usage

```js
import markdownIt from "markdown-it";
import markdownItMermaid from "@DatatracCorporation/markdown-it-mermaid";
const mdi = markdownIt();
mdi.use(markdownItMermaid);
mdi.render(`~~~mermaid optional title goes here
  graph TD
    A[Christmas] -->|Get money| B(Go shopping)
    B --> C{Let me think}
    C -->|One| D[Laptop]
    C -->|Two| E[iPhone]
    C -->|Three| F[Car]
~~~`);
```

The word `mermaid` after the fence code block opening indicates that the
rest of the fenced block should be passed to mermaid for processing.
This example used the `~~~` fence marker since the multi-line string
in javascript is the same character,
but either `~~~` or ` ``` ` works.

## Titles

Mermaid does not support titles on the diagrams today.  We have added an
external title that you can use.  Include the title on the code fence
line after the word `mermaid` and it will be rendered as a div inside
the parent div as a sibling to the svg image.  The title element has a
class of `mermaid-title` so you can style the title to fit your app.

We use:

~~~css
/* image container */
div.mermaid {
    width: fit-content;
}

/* image title */
.mermaid-title {
    width: fit-content;
    margin: auto;
    font-weight: 900;
    font-size: 2em;
    color: white;
    padding-bottom: 0.5em;
}

/* image itself */
.mermaid > svg {
    margin: auto;
    display: block;
}
~~~

### Customize mermaid

```js
import MarkdownIt from 'markdown-it';
import MarkdownItKatex from '@DatatracCorporation/markdown-it-mermaid';

var md = MarkdownIt({
        html: false,
        linkify: true,
        typographer: true,
        breaks: true,
        xhtmlOut: false,
    });

md.use(MarkdownItMermaid,{
  startOnLoad: false,
  securityLevel: true,
  theme: "default",
  flowchart:{
    htmlLabels: false,
    useMaxWidth: true,
  }
  ...or any options
})
```

## Development

### Test

At this time, there are no unit tests since mermaid has to run in a
browser (uses document apis).  At some point in the future, we might go
with a headless browser.

### Distribution

```
npm version <newver> && npm publish
```
