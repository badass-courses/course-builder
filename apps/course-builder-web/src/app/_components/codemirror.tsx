import {env} from '@/env.mjs'
import * as Y from 'yjs'
import {yCollab} from 'y-codemirror.next'
import {basicSetup, EditorView} from 'codemirror'
import {
  EditorState,
  Extension,
  StateEffect,
  StateField,
  Range,
} from '@codemirror/state'
import {useCallback, useEffect, useState} from 'react'
import {markdown} from '@codemirror/lang-markdown'
import YPartyKitProvider from 'y-partykit/provider'
import {useSession} from 'next-auth/react'
import {SearchCursor, SearchQuery} from '@codemirror/search'
import {Decoration} from '@codemirror/view'
import {FeedbackMarker} from '@/lib/feedback-marker'

async function generateHash(message: string) {
  const encoder = new TextEncoder()
  const data = encoder.encode(message)
  const hash = await window.crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export const CodemirrorEditor = ({
  roomName,
  value,
  onChange,
  markers,
}: {
  roomName: string
  value: string
  onChange: (data: any) => void
  markers: FeedbackMarker[]
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
  markers: FeedbackMarker[]
}) => {
  const [element, setElement] = useState<HTMLElement>()
  const [yUndoManager, setYUndoManager] = useState<Y.UndoManager>()
  const [currentText, setCurrentText] = useState<string>('')

  const {data: session} = useSession()

  useEffect(() => {
    let view: EditorView

    const highlight_effect = StateEffect.define<Range<Decoration>[]>()

    const highlight_extension = StateField.define({
      create() {
        return Decoration.none
      },
      update(value, transaction) {
        value = value.map(transaction.changes)

        for (let effect of transaction.effects) {
          if (effect.is(highlight_effect))
            value = value.update({add: effect.value, sort: true})
        }

        return value
      },
      provide: (f) => EditorView.decorations.from(f),
    })

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

    let updateListenerExtension = EditorView.updateListener.of(
      async (update) => {
        if (update.docChanged) {
          const docText = update.state.doc.toString()
          const hash = await generateHash(docText)
          if (hash !== currentText) {
            onChange(docText)
            setCurrentText(hash)
          }

          if (update.state.doc.toString().length !== 0) {
            for (let marker of markers) {
              let cursor = new SearchCursor(view.state.doc, marker.originalText)

              let query = new SearchQuery({
                search: marker.originalText,
                caseSensitive: false,
              })

              console.log('-----', query.getCursor(view.state.doc).next())

              while (!cursor.done) {
                cursor.next()

                // TODO: this disrupts the typing experience and we need to not do that at
                //  all costs ☠️

                // console.log('+++++', query.getCursor(view.state.doc).next())
                // const highlight_decoration = Decoration.mark({
                //   attributes: {style: 'background-color: yellow'},
                // })
                //
                // view.dispatch({
                //   effects: highlight_effect.of([
                //     highlight_decoration.range(
                //       cursor.value.from,
                //       cursor.value.to,
                //     ),
                //   ]),
                // })
              }
            }
          }
        }
      },
    )

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
        highlight_extension,
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

    // Set up awareness

    return () => {
      provider?.doc?.destroy()
      provider?.destroy()
      view?.destroy()
    }
  }, [element, roomName, value, session, markers])

  return {
    codemirrorElementRef: useCallback((node: HTMLElement | null) => {
      if (!node) return
      setElement(node)
    }, []),
  }
}
