import { useEffect, useState } from 'react'
import { Path } from '@/treehouse/workbench/path'

import { NodeEditor } from '../ui/node/editor'
import { OutlineNode } from '../ui/outline'

interface TableViewProps {
  path: Path
  alwaysShowNew?: boolean
}

const TableView: React.FC<TableViewProps> = ({ path }) => {
  const node = path.node
  const [fields, setFields] = useState(new Set<string>())

  useEffect(() => {
    const newFields = new Set<string>()
    node.children.forEach((n: any) => {
      n.getLinked('Fields').forEach((f: any) => newFields.add(f.name))
    })
    setFields(newFields)
  }, [node.children])

  const getFieldEditor = (node: any, field: string) => {
    const fields = node.getLinked('Fields').filter((f: any) => f.name === field)
    if (fields.length === 0) return null
    return <NodeEditor editValue={true} path={path.append(fields[0])} />
  }

  return (
    <table
      className="table-view"
      style={{ gridTemplateColumns: `repeat(${fields.size + 1}, 1fr)` }}
    >
      <thead>
        <tr>
          <th>Title</th>
          {[...fields].map((f) => (
            <th key={f}>{f}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {node.children.map((n: any) => (
          <tr key={n.id}>
            <td>
              <OutlineNode path={path.append(n)} />
            </td>
            {[...fields].map((f) => (
              <td key={f}>{getFieldEditor(n, f)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default TableView
