import {env} from '@/env.mjs'
import * as Y from 'yjs'
import {yCollab} from 'y-codemirror.next'
import {EditorView, basicSetup} from 'codemirror'
import {EditorState} from '@codemirror/state'
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
    <div>
      <div ref={ref}></div>
    </div>
  )
}
