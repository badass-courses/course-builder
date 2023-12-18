import {env} from '@/env.mjs'
import * as Y from 'yjs'
import {yCollab} from 'y-codemirror.next'
import {EditorView, basicSetup} from 'codemirror'
import {EditorState, Extension} from '@codemirror/state'
import {useCallback, useEffect, useState} from 'react'
import {markdown} from '@codemirror/lang-markdown'
import YPartyKitProvider from 'y-partykit/provider'

export const CodemirrorEditor = ({roomName}: {roomName: string}) => {
  const [element, setElement] = useState<HTMLElement>()
  const [yUndoManager, setYUndoManager] = useState<Y.UndoManager>()
  const ref = useCallback((node: HTMLElement | null) => {
    if (!node) return
    setElement(node)
  }, [])

  useEffect(() => {
    let view: EditorView
    let yDoc = new Y.Doc()
    let provider = new YPartyKitProvider(
      env.NEXT_PUBLIC_PARTY_KIT_URL,
      roomName,
      yDoc,
    )

    if (!element) {
      return
    }

    const ytext = provider.doc.getText('codemirror')
    const undoManager = new Y.UndoManager(ytext)
    setYUndoManager(undoManager)

    // Set up CodeMirror and extensions
    const state = EditorState.create({
      doc: ytext.toString(),
      extensions: [
        basicSetup,
        markdown(),
        yCollab(ytext, provider.awareness, {undoManager}),
        ...styles,
      ],
    })

    // Attach CodeMirror to element
    view = new EditorView({
      state,
      parent: element,
    })

    return () => {
      provider?.destroy()
      view?.destroy()
      yDoc?.destroy()
    }
  }, [element, roomName])

  return (
    <div className="h-full flex-shrink-0 border-y">
      <div ref={ref}></div>
    </div>
  )
}

const styles: Extension[] = [
  EditorView.theme({
    '.cm-content, .cm-gutter': {
      minHeight: '100%',
      height: '100%',
    },
    '.cm-content': {
      padding: '2rem 0',
      fontSize: '14px',
    },
    '.cm-line': {
      padding: '0 2rem',
    },
    '.cm-gutters': {
      backgroundColor: 'hsl(var(--background))',
      borderRight: 'none',
      opacity: 0.35,
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'transparent',
    },
    '.cm-lineNumbers': {
      fontSize: '10px',
    },
    '&.cm-focused': {
      outline: 'none',
    },
    '.cm-activeLine': {
      backgroundColor: 'hsl(var(--foreground) / 3%)',
    },
  }),
]
