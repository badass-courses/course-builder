import { useEffect, useRef, useState } from 'react'
import * as React from 'react'
import { useTreehouseStore } from '@/treehouse/mod'
import { Path } from '@/treehouse/workbench/path'

type NodeEditorProps = {
  path: Path
  onkeydown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  oninput?: (e: React.FormEvent<HTMLTextAreaElement>) => void
  disallowEmpty?: boolean
  editValue?: boolean
  placeholder?: string
}

export const NodeEditor: React.FC<NodeEditorProps> = ({
  path,
  onkeydown,
  oninput,
  disallowEmpty,
  editValue,
  placeholder,
}) => {
  const { context } = useTreehouseStore()
  const node = path.node
  let prop: 'value' | 'name' = editValue ? 'value' : 'name'

  const display = () => {
    if (prop === 'name') {
      return node.displayName(node)
    }
    return node[prop] || ''
  }

  const initialValue = useRef(node[prop])

  const onfocus = () => {
    useTreehouseStore.setState({ context: { node, path } })
  }

  const getter = () => node[prop]

  const setter = (v: string, finished?: boolean) => {
    if (!node.isDestroyed) {
      if (disallowEmpty && v.length === 0) {
        node[prop] = initialValue.current
      } else {
        node[prop] = v
      }
    }
    if (finished) {
      useTreehouseStore.setState({ context: { ...context, node } })
    }
  }

  if (node.raw.Rel === 'Fields') {
    placeholder = editValue ? 'Value' : 'Field'
  }

  let id = `input-${path.id}-${node.id}`
  if (prop === 'value') {
    id += '-value'
  }

  // TODO
  //  Assuming CodeMirrorEditor and Description components are converted to React and imported
  //  let editorComponent = node.parent && node.parent.hasComponent(Document) && window.Editor ? CodeMirrorEditor : TextAreaEditor;
  //  let descComponent = node.hasComponent(Description) ? node.getComponent(Description).editor() : null;

  return (
    <div className="node-editor flex flex-col">
      <TextAreaEditor
        id={id}
        path={path}
        getter={getter}
        setter={setter}
        display={display}
        onkeydown={onkeydown}
        onfocus={onfocus}
        oninput={oninput}
        placeholder={placeholder}
      />
      {/* descComponent */}
    </div>
  )
}

type TextAreaEditorProps = {
  id?: string
  onkeydown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onfocus?: (e: React.FocusEvent<HTMLTextAreaElement>) => void
  onblur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void
  oninput?: (e: React.FormEvent<HTMLTextAreaElement>) => void
  getter: () => string
  setter: (value: string, commit?: boolean) => void
  display?: () => string
  placeholder?: string
  path: Path
}

const TextAreaEditor = ({
  id,
  path,
  onkeydown,
  onfocus,
  onblur,
  oninput,
  getter,
  setter,
  display,
  placeholder,
}: TextAreaEditorProps) => {
  const [editing, setEditing] = useState(false)
  const [buffer, setBuffer] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const spanRef = useRef<HTMLSpanElement | null>(null)
  const { newWorkspace, focus } = useTreehouseStore()

  useEffect(() => {
    const textarea = textareaRef.current
    const span = spanRef.current
    if (!textarea || !span) return

    const initialHeight = textarea.offsetHeight

    const updateHeight = () => {
      span.style.width = `${Math.max(textarea.offsetWidth, 100)}px`
      span.innerHTML = textarea.value.replace('\n', '<br/>')
      let height = span.offsetHeight
      if (height === 0 && initialHeight > 0) {
        height = initialHeight
      }
      textarea.style.height = height > 0 ? `${height}px` : `var(--body-line-height)`
    }

    const handleInput = (e: any) => {
      updateHeight()
      if (oninput) {
        oninput(e)
      }
    }

    textarea.addEventListener('input', handleInput)
    textarea.addEventListener('blur', () => (span.innerHTML = ''))
    setTimeout(() => updateHeight(), 50)

    return () => {
      textarea.removeEventListener('input', handleInput)
    }
  }, [oninput])

  const value = editing ? buffer : display ? display() : getter()

  const defaultKeydown = (e: any) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  const startEdit = (e: any) => {
    if (onfocus) onfocus(e)
    setEditing(true)
    setBuffer(getter())
  }

  const finishEdit = (e: any) => {
    if (editing) {
      setEditing(false)
      setter(buffer, true)
    }
    if (onblur) onblur(e)
  }

  const edit = (e: any) => {
    setBuffer(e.target.value)
    setter(e.target.value, false)
  }

  const handlePaste = (e: any) => {
    const textData = e.clipboardData.getData('Text')
    if (textData.length > 0) {
      e.preventDefault()
      e.stopPropagation()

      const lines = textData
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0)
      setBuffer(lines.shift())
      setter(buffer, true)

      let node = path.node // Assuming `path` is part of the workspace object
      for (const line of lines) {
        const newNode = newWorkspace(line)
        newNode.parent = node.parent
        newNode.siblingIndex = node.siblingIndex + 1
        // Assuming there's a method to trigger focus on the new node
        const p = path.clone()
        p.pop()
        const newPath = p.append(node)
        setTimeout(() => {
          focus(newPath)
        }, 0)
      }
    }
  }

  return (
    <div className="text-editor">
      <textarea
        ref={textareaRef}
        id={id}
        rows={1}
        onFocus={startEdit}
        onBlur={finishEdit}
        onInput={edit}
        onPaste={handlePaste}
        placeholder={placeholder}
        onKeyDown={onkeydown || defaultKeydown}
        value={value}
      />
      <span ref={spanRef} style={{ visibility: 'hidden', position: 'fixed' }}></span>
    </div>
  )
}
