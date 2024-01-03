import {env} from '@/env.mjs'
import * as Y from 'yjs'
import {yCollab} from 'y-codemirror.next'
import {basicSetup, EditorView} from 'codemirror'
import {EditorState, Extension} from '@codemirror/state'
import {useCallback, useEffect, useState} from 'react'
import {markdown} from '@codemirror/lang-markdown'
import YPartyKitProvider from 'y-partykit/provider'
import {useSession} from 'next-auth/react'

export const CodemirrorEditor = ({
  roomName,
  value,
  onChange,
  markers,
}: {
  roomName: string
  value: string
  onChange: (data: any) => void
  markers?: any[]
}) => {
  const {codemirrorElementRef} = useCodemirror({
    roomName,
    value,
    onChange,
    markers,
  })

  return (
    <div className="h-full flex-shrink-0 border-t">
      <div ref={codemirrorElementRef}></div>
    </div>
  )
}

const CourseBuilderEditorTheme = {
  '.cm-content, .cm-gutter': {
    minHeight: '100%',
    height: '100%',
  },
  '.cm-content': {
    padding: '2rem 0',
    fontSize: '14px',
    fontFamily: 'var(--font-mono)',
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
}

const styles: Extension[] = [
  EditorView.theme(CourseBuilderEditorTheme),
  EditorView.lineWrapping,
  EditorView.domEventHandlers({}),
]

/**
 * @see {@link https://codemirror.net/docs/ref/#codemirror.basicSetup Code Mirror Basic Setup}
 * @param options
 * @constructor
 */
const useCodemirror = ({
  roomName,
  value,
  onChange,
  markers,
}: {
  roomName: string
  value: string
  onChange: (data: any) => void
  markers?: any[]
}) => {
  const [element, setElement] = useState<HTMLElement>()
  const [yUndoManager, setYUndoManager] = useState<Y.UndoManager>()

  const {data: session} = useSession()

  useEffect(() => {
    let view: EditorView

    let provider = new YPartyKitProvider(
      env.NEXT_PUBLIC_PARTY_KIT_URL,
      roomName,
    )

    if (!element) {
      return
    }

    const ytext = provider.doc.getText('codemirror')

    const undoManager = new Y.UndoManager(ytext)
    setYUndoManager(undoManager)

    let updateListenerExtension = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        onChange(update.state.doc.toString())
      }
    })

    const awareness = provider.awareness

    if (session) {
      awareness.setLocalStateField('user', {
        ...session.user,
        color: '#ffb61e', // should be a hex color
      })
    }

    // Set up CodeMirror and extensions
    const state = EditorState.create({
      doc: ytext.toString(),
      extensions: [
        basicSetup,
        updateListenerExtension,
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
    }
  }, [element, roomName, value, session])

  return {
    codemirrorElementRef: useCallback((node: HTMLElement | null) => {
      if (!node) return
      setElement(node)
    }, []),
  }
}
