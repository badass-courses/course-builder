import { useCallback } from 'react'
import { Node } from '@/treehouse/model/mod'
import { Path } from '@/treehouse/workbench/path'
import { Workbench } from '@/treehouse/workbench/workbench'

import { Page } from '../com/page'
import { NodeEditor } from './node/editor'
import { OutlineEditor } from './outline'

interface PanelProps {
  path: Path
  workbench: Workbench
}

export const Panel: React.FC<PanelProps> = ({ path, workbench }) => {
  const node = path.node

  const close = useCallback(() => {
    workbench.executeCommand('close-panel', {}, path)
  }, [workbench, path])

  const goBack = useCallback(() => {
    let node = path.pop()
    if (node === path.node) {
      path.pop()
    }
  }, [path])

  const maximize = useCallback(() => {
    workbench.panels = [path]
    workbench.context.path = path
  }, [workbench, path])

  const editMarkdown = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      node.getComponent(Page).markdown = e.target.value
      node.changed()
    },
    [node],
  )

  const calcHeight = useCallback((value: string = '') => {
    let numberOfLineBreaks = (value.match(/\n/g) || []).length
    let newHeight = 20 + numberOfLineBreaks * 20
    return newHeight
  }, [])

  let viewClass = ''
  if (node.getAttr('view')) {
    viewClass = `${node.getAttr('view')}-panel`
  }

  return (
    <div className={`panel flex grow flex-col ${viewClass}`}>
      <div className="bar flex">
        {path.length > 1 && (
          <div className="panel-back" style={{ paddingRight: 'var(--padding)' }}>
            {/* SVG for goBack */}
          </div>
        )}

        <div className="panel-back-parent grow">
          {node.parent && node.parent.id !== '@root' ? (
            <span style={{ cursor: 'pointer' }} onClick={() => workbench.open(node.parent as Node)}>
              {node.parent.name}
            </span>
          ) : (
            <span> </span>
          )}
        </div>

        {workbench.panels.length > 1 && (
          <div className="panel-icons flex items-center">{/* SVGs for maximize and close */}</div>
        )}
      </div>

      <div className="body flex flex-col">
        <div className="title-node" onContextMenu={(e) => workbench.showMenu(e, { node, path })} data-menu="node">
          <NodeEditor workbench={workbench} path={path} disallowEmpty={true} />
        </div>
        {node.hasComponent(Page) && (
          <textarea
            onChange={editMarkdown}
            value={node.getComponent(Page).markdown}
            placeholder="Enter Markdown text here"
            style={{
              marginLeft: 'var(--padding)',
              padding: 'var(--padding)',
              outline: '0',
              height: `${calcHeight(node.getComponent(Page).markdown)}px`,
              border: '0',
            }}
          />
        )}
        <OutlineEditor workbench={workbench} path={path.sub()} alwaysShowNew={true} />
      </div>
    </div>
  )
}
