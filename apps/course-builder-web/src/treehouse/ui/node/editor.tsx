import { useEffect, useState } from 'react'
import { Node } from '@/treehouse/model/mod'
import { Path } from '@/treehouse/workbench/path'
import { Workbench } from '@/treehouse/workbench/workbench'

import { objectCall, objectHas } from '../../model/hooks'

interface NodeEditorProps {
  workbench: Workbench
  path: Path
  onkeydown?: (e: React.KeyboardEvent) => void
  oninput?: (e: React.ChangeEvent<HTMLInputElement>) => void
  disallowEmpty?: boolean
  editValue?: boolean
  placeholder?: string
}

export const NodeEditor: React.FC<NodeEditorProps> = ({
  workbench,
  path,
  onkeydown,
  oninput,
  disallowEmpty,
  editValue,
  placeholder,
}) => {
  const node = path.node
  let prop = editValue ? 'value' : 'name'
  // @ts-expect-error
  const [value, setValue] = useState<string>(node[prop] || '')

  useEffect(() => {
    // @ts-expect-error
    setValue(node[prop] || '')
  }, [node, prop])

  const display = () => {
    if (prop === 'name') {
      return objectHas(node, 'displayName') ? objectCall(node, 'displayName', node) : node.name
    }
    return value
  }

  const onfocus = () => {
    workbench.context.node = node
    workbench.context.path = path
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setValue(newValue)
    if (oninput) oninput(e as unknown as React.ChangeEvent<HTMLInputElement>)
  }

  const handleBlur = () => {
    if (!node.isDestroyed) {
      if (disallowEmpty && value.length === 0) {
        // @ts-expect-error
        setValue(node[prop])
      } else {
        // @ts-expect-error
        node[prop] = value
      }
    }
    workbench.context.node = null
  }

  if (node.raw.Rel === 'Fields') {
    placeholder = editValue ? 'Value' : 'Field'
  }

  let id = `input-${path.id}-${node.id}${prop === 'value' ? '-value' : ''}`

  // Placeholder for TextAreaEditor or CodeMirrorEditor component
  // Assuming TextAreaEditor is a simple textarea for the sake of example
  let EditorComponent = (
    <textarea
      id={id}
      value={display()}
      onKeyDown={onkeydown}
      onChange={handleChange}
      onFocus={onfocus}
      onBlur={handleBlur}
      placeholder={placeholder}
    />
  )

  // Placeholder for conditional editor logic
  // if (node.parent && node.parent.hasComponent(Document) && window.Editor) {
  //   EditorComponent = <CodeMirrorEditor ... />;
  // }

  let desc = undefined
  // if (node.hasComponent(Description)) {
  //   desc = node.getComponent(Description);
  // }

  return (
    <div className="node-editor flex flex-col">
      {EditorComponent}
      {/* Conditional rendering for description editor */}
      {/* {desc ? <DescriptionEditor node={node} /> : null} */}
    </div>
  )
}
