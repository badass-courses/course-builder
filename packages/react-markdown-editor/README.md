<!--rehype:ignore:start-->

<p align="center">
  <a href="https://github.com/uiwjs/react-markdown-editor">
    <img alt="React Markdown Editor logo" src="https://github.com/uiwjs/react-markdown-editor/assets/1680273/d51ea355-4804-4c17-a4ab-6adf4803aa89">
  </a>
</p>


<!--rehype:ignore:end-->
<!--dividing-->

<p align="center">
  <a href="https://github.com/uiwjs/react-markdown-editor/actions">
    <img alt="Build & Deploy" src="https://github.com/uiwjs/react-markdown-editor/actions/workflows/ci.yml/badge.svg">
  </a>
  <a href="https://www.npmjs.com/package/@uiw/react-markdown-editor">
    <img alt="NPM Download" src="https://img.shields.io/npm/dm/@uiw/react-markdown-editor.svg?style=flat">
  </a>
  <a href="https://www.npmjs.com/package/@uiw/react-markdown-editor">
    <img alt="npm version" src="https://img.shields.io/npm/v/@uiw/react-markdown-editor.svg">
  </a>
</p>

<p align="center">
  A markdown editor with preview, implemented with React.js and TypeScript.
</p>

<!--rehype:ignore:start-->
[![React Markdown Editor](https://user-images.githubusercontent.com/1680273/191638380-55abdad5-09b8-45f2-952e-6b9879fcf4fa.png)](https://uiwjs.github.io/react-markdown-editor/)

<!--rehype:ignore:end-->

> Migrate from @uiw/react-markdown-editor [4.x to 5.x.](https://github.com/uiwjs/react-markdown-editor/releases/tag/v5.0.0)

## Install

```bash
npm i @uiw/react-markdown-editor
```

<!--rehype:ignore:start-->

## Document

Official document [demo preview](https://uiwjs.github.io/react-markdown-editor/) ([🇨🇳中国镜像网站](http://uiw.gitee.io/react-markdown-editor/))

<!--rehype:ignore:end-->

## Basic Usage

```jsx mdx:preview
import React from 'react';
import MarkdownEditor from '@uiw/react-markdown-editor';

const mdStr = `# This is a H1  \n## This is a H2  \n###### This is a H6`;

const Dome = () => {
  return (
    <MarkdownEditor
      value={mdStr}
      onChange={(value, viewUpdate) => {

      }}
    />
  )
};

export default Dome;
```

## Controlled Usage

[![Open in CodeSandbox](https://img.shields.io/badge/Open%20in-CodeSandbox-blue?logo=codesandbox)](https://codesandbox.io/embed/react-markdown-editor-ybpce?file=/src/App.js)

```jsx mdx:preview
import React, { useState } from 'react';
import MarkdownEditor from '@uiw/react-markdown-editor';

const mdStr = `# This is a H1  \n## This is a H2  \n###### This is a H6`;
export default function App() {
  const [markdown, setMarkdown] = useState(mdStr);
  return (
    <MarkdownEditor
      value={markdown}
      height="200px"
      onChange={(value, viewUpdate) => setMarkdown(value)}
    />
  );
}
```

## Only Markdown Preview

[![Open in CodeSandbox](https://img.shields.io/badge/Open%20in-CodeSandbox-blue?logo=codesandbox)](https://codesandbox.io/embed/react-markdown-editor-forked-qyp83q?fontsize=14&hidenavigation=1&theme=dark)

This markdown preview sub-component is a direct export [`@uiw/react-markdown-preview`](https://github.com/uiwjs/react-markdown-preview) component, API documentation, please check [`@uiw/react-markdown-preview`](https://github.com/uiwjs/react-markdown-preview).

```jsx mdx:preview
import React from 'react';
import MarkdownEditor from '@uiw/react-markdown-editor';

const mdStr = `# This is a H1  \n## This is a H2  \n###### This is a H6`;
function App() {
  return (
    <MarkdownEditor.Markdown source={mdStr} height="200px" />
  );
}

export default App;
```

## Custom Toolbars

[![Open in CodeSandbox](https://img.shields.io/badge/Open%20in-CodeSandbox-blue?logo=codesandbox)](https://codesandbox.io/embed/react-markdown-editorcustom-toolbars-forked-r9ocu?fontsize=14&hidenavigation=1&theme=dark)

```jsx mdx:preview
import React from "react";
import MarkdownEditor from '@uiw/react-markdown-editor';

const title2 = {
  name: 'title2',
  keyCommand: 'title2',
  button: { 'aria-label': 'Add title text' },
  icon: (
    <svg width="12" height="12" viewBox="0 0 512 512">
      <path fill="currentColor" d="M496 80V48c0-8.837-7.163-16-16-16H320c-8.837 0-16 7.163-16 16v32c0 8.837 7.163 16 16 16h37.621v128H154.379V96H192c8.837 0 16-7.163 16-16V48c0-8.837-7.163-16-16-16H32c-8.837 0-16 7.163-16 16v32c0 8.837 7.163 16 16 16h37.275v320H32c-8.837 0-16 7.163-16 16v32c0 8.837 7.163 16 16 16h160c8.837 0 16-7.163 16-16v-32c0-8.837-7.163-16-16-16h-37.621V288H357.62v128H320c-8.837 0-16 7.163-16 16v32c0 8.837 7.163 16 16 16h160c8.837 0 16-7.163 16-16v-32c0-8.837-7.163-16-16-16h-37.275V96H480c8.837 0 16-7.163 16-16z" />
    </svg>
  ),
  execute: ({ state, view }) => {
    if (!state || !view) return;
    const lineInfo = view.state.doc.lineAt(view.state.selection.main.from);
    let mark = '#';
    const matchMark = lineInfo.text.match(/^#+/)
    if (matchMark && matchMark[0]) {
      const txt = matchMark[0];
      if (txt.length < 6) {
        mark = txt + '#';
      }
    }
    if (mark.length > 6) {
      mark = '#';
    }
    const title = lineInfo.text.replace(/^#+/, '')
    view.dispatch({
      changes: {
        from: lineInfo.from,
        to: lineInfo.to,
        insert: `${mark} ${title}`
      },
      // selection: EditorSelection.range(lineInfo.from + mark.length, lineInfo.to),
      selection: { anchor: lineInfo.from + mark.length },
    });
  },
};

const Dome = () => (
  <MarkdownEditor
    value="Hello Markdown!"
    height="200px"
    toolbars={[
      'bold', title2
    ]}
  />
);

export default Dome;
```

Disable preview feature

[![Open in CodeSandbox](https://img.shields.io/badge/Open%20in-CodeSandbox-blue?logo=codesandbox)](https://codesandbox.io/embed/react-markdown-editor-https-github-com-uiwjs-react-markdown-editor-issues-205-c3kqhd?fontsize=14&hidenavigation=1&theme=dark)

```jsx mdx:preview
import React from "react";
import MarkdownEditor from '@uiw/react-markdown-editor';

const Dome = () => (
  <MarkdownEditor
    value="Hello Markdown!"
    height="200px"
    enablePreview={false}
  />
);

export default Dome;
```
## Support Nextjs

Use examples in [nextjs](https://nextjs.org/). 

[![Open in CodeSandbox](https://img.shields.io/badge/Open%20in-CodeSandbox-blue?logo=codesandbox)](https://codesandbox.io/embed/nextjs-example-react-markdown-editor-72s9d?fontsize=14&hidenavigation=1&theme=dark)
[![#52](https://img.shields.io/github/issues/detail/state/uiwjs/react-md-editor/52)](https://github.com/uiwjs/react-md-editor/issues/52#issuecomment-848969341)
[![#224](https://img.shields.io/github/issues/detail/state/uiwjs/react-md-editor/224)](https://github.com/uiwjs/react-md-editor/issues/224#issuecomment-901112079)

```bash
npm install next-remove-imports
npm install @uiw/react-markdown-editor
```

```js
// next.config.js
const removeImports = require('next-remove-imports')();
module.exports = removeImports({});
```

```jsx
import dynamic from 'next/dynamic';
import '@uiw/react-markdown-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';

const MarkdownEditor = dynamic(
  () => import("@uiw/react-markdown-editor").then((mod) => mod.default),
  { ssr: false }
);

function HomePage() {
  return (
    <div>
      <MarkdownEditor value="Hello Markdown!" />
    </div>
  );
}

export default HomePage;
```

## Support dark-mode/night-mode

By default, the [`dark-mode`](https://github.com/jaywcjlove/dark-mode/) is automatically switched according to the system. If you need to switch manually, just set the `data-color-mode="dark"` parameter for html Element. 

```html
<html data-color-mode="dark">
```

```js
document.documentElement.setAttribute('data-color-mode', 'dark')
document.documentElement.setAttribute('data-color-mode', 'light')
```

Inherit custom color variables by adding `.wmde-markdown-var` selector.

```jsx
const Demo = () => {
  return (
    <div>
      <div className="wmde-markdown-var"> </div>
      <MarkdownEditor value="Hello Markdown!" />
    </div>
  )
}
```

## Props

- `value (string)` - the raw markdown that will be converted to html (**required**)
- `visible?: boolean` - Shows a preview that will be converted to html.
- `toolbars?: ICommand[] | string[]` - Tool display settings.
- `toolbarsMode?: ICommand[] | string[]` - Tool display settings.
- `onChange?:function(editor: IInstance, data: CodeMirror.EditorChange, value: string)` - called when a change is made
- `onBlur?: function(editor: IInstance, event: Event)` - event occurs when an object loses focus
- `onPreviewMode?: (isHide: boolean) => void` - Edit mode and preview mode switching event
- `previewProps` - [react-markdown options](https://github.com/uiwjs/react-markdown-preview/tree/v2.1.0#options-props)

```ts
import { ReactCodeMirrorProps } from '@uiw/react-codemirror';
export interface IMarkdownEditor extends ReactCodeMirrorProps {
  className?: string;
  prefixCls?: string;
  /** The raw markdown that will be converted to html (**required**) */
  value?: string;
  /** Shows a preview that will be converted to html. */
  visible?: boolean;
  visibleEditor?: boolean;
  /** Override the default preview component */
  renderPreview?: (props: MarkdownPreviewProps, initVisible: boolean) => React.ReactNode;
  /** Preview expanded width @default `50%` */
  previewWidth?: string;
  /** Whether to enable preview function @default `true` */
  enablePreview?: boolean;
  /** Whether to enable scrolling */
  enableScroll?: boolean;
  /** Tool display settings. */
  toolbars?: Commands[];
  /** The tool on the right shows the settings. */
  toolbarsMode?: Commands[];
  /** Tool display filter settings. */
  toolbarsFilter?: (tool: Commands, idx: number) => boolean;
  /** Toolbar on bottom */
  toolbarBottom?: boolean;
  /** Option to hide the tool bar. @deprecated The next major version will be deprecated. Please use `showToolbar`. */
  hideToolbar?: boolean;
  /** Option to hide the tool bar. */
  showToolbar?: boolean;
  /** [@uiw/react-markdown-preview](https://github.com/uiwjs/react-markdown-preview#options-props) options */
  previewProps?: MarkdownPreviewProps;
  /** replace the default `extensions` */
  reExtensions?: ReactCodeMirrorProps['extensions'];
  /** Edit mode and preview mode switching event */
  onPreviewMode?: (isHide: boolean) => void;
}
```

```ts
import React from 'react';
import { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { MarkdownPreviewProps, MarkdownPreviewRef } from '@uiw/react-markdown-preview';
export * from '@uiw/react-markdown-preview';
export interface ToolBarProps {
  editor: React.RefObject<ReactCodeMirrorRef>;
  preview: React.RefObject<HTMLDivElement>;
  container: React.RefObject<HTMLDivElement>;
  containerEditor: React.RefObject<HTMLDivElement>;
  editorProps: IMarkdownEditor;
}
export interface MarkdownEditorRef {
  editor: React.RefObject<ReactCodeMirrorRef> | null;
  preview?: React.RefObject<MarkdownPreviewRef> | null;
}
export declare type Commands = keyof typeof defaultCommands | ICommand;
export interface IToolBarProps<T = Commands> extends ToolBarProps {
  className?: string;
  editorProps: IMarkdownEditor;
  mode?: boolean;
  prefixCls?: string;
  toolbars?: T[];
  onClick?: (type: string) => void;
}
declare const MarkdownEditor: MarkdownEditorComponent;
declare type MarkdownEditorComponent = React.FC<React.PropsWithRef<IMarkdownEditor>> & {
  Markdown: typeof MarkdownPreview;
};
export default MarkdownEditor;
```

```ts
import { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { MarkdownPreviewProps, MarkdownPreviewRef } from '@uiw/react-markdown-preview';
export declare type ButtonHandle = (command: ICommand, props: IMarkdownEditor, options: ToolBarProps) => JSX.Element;
export declare type ICommand = {
  icon?: React.ReactElement;
  name?: string;
  keyCommand?: string;
  button?: ButtonHandle | React.ButtonHTMLAttributes<HTMLButtonElement>;
  execute?: (editor: ReactCodeMirrorRef) => void;
};
export declare const defaultCommands: {
  undo: ICommand;
  redo: ICommand;
  bold: ICommand;
  italic: ICommand;
  header: ICommand;
  strike: ICommand;
  underline: ICommand;
  quote: ICommand;
  olist: ICommand;
  ulist: ICommand;
  todo: ICommand;
  link: ICommand;
  image: ICommand;
  code: ICommand;
  codeBlock: ICommand;
  fullscreen: ICommand;
  preview: ICommand;
};
export declare const getCommands: () => ICommand[];
export declare const getModeCommands: () => ICommand[];
export declare const defaultTheme: import("@codemirror/state").Extension;
```

### Development

```bash
npm run watch # Listen create type and .tsx files.
npm run start # Preview code example.

npm run doc
```

### Related

- [@uiw/react-textarea-code-editor](https://github.com/uiwjs/react-textarea-code-editor): A simple code editor with syntax highlighting.
- [@uiw/react-codemirror](https://github.com/uiwjs/react-codemirror): CodeMirror component for React. @codemirror
- [@uiw/react-monacoeditor](https://github.com/jaywcjlove/react-monacoeditor): Monaco Editor component for React.
- [@uiw/react-md-editor](https://github.com/uiwjs/react-md-editor): A simple markdown editor with preview, implemented with React.js and TypeScript.
- [@uiw/react-markdown-preview](https://github.com/uiwjs/react-markdown-preview): React component preview markdown text in web browser. 

## Contributors

As always, thanks to our amazing contributors!

<a href="https://github.com/uiwjs/react-markdown-editor/graphs/contributors">
  <img src="https://uiwjs.github.io/react-markdown-editor/CONTRIBUTORS.svg" />
</a>

Made with [action-contributors](https://github.com/jaywcjlove/github-action-contributors).

## License

Licensed under the MIT License.
