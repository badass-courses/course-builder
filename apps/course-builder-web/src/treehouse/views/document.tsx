import { Path } from '@/treehouse/workbench/path'
import { Workbench } from '@/treehouse/workbench/workbench'

import { NewNode } from '../ui/node/new'
import { OutlineNode } from '../ui/outline'

interface DocumentViewProps {
  workbench: Workbench
  path: Path
  alwaysShowNew?: boolean
}

const DocumentView: React.FC<DocumentViewProps> = ({ workbench, path, alwaysShowNew }) => {
  let node = path.node
  if (path.node.refTo) {
    node = path.node.refTo
  }
  let showNew = false
  if ((node.childCount === 0 && node.getLinked('Fields').length === 0) || alwaysShowNew) {
    showNew = true
  }

  return (
    <div className="document-view">
      <div className="fields">
        {node.getLinked('Fields').length > 0 &&
          node
            .getLinked('Fields')
            .map((n: any) => <OutlineNode key={n.id} workbench={workbench} path={path.append(n)} />)}
      </div>
      <div className="children">
        {node.childCount > 0 &&
          node.children.map((n: any) => <OutlineNode key={n.id} workbench={workbench} path={path.append(n)} />)}
        {showNew && <NewNode workbench={workbench} path={path} />}
      </div>
    </div>
  )
}

export default DocumentView
