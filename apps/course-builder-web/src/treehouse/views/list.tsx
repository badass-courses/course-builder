import { Path } from '@/treehouse/workbench/path'

import { SmartNode } from '../com/smartnode'
import { NewNode } from '../ui/node/new'
import { OutlineNode } from '../ui/outline'

interface ListViewProps {
  path: Path
  alwaysShowNew?: boolean
}

const ListView: React.FC<ListViewProps> = ({ path, alwaysShowNew }) => {
  let node = path.node
  if (path.node.refTo) {
    node = path.node.refTo
  }
  let showNew = false

  if ((node.childCount === 0 && node.getLinked('Fields').length === 0) || alwaysShowNew) {
    showNew = true
  }
  // TODO: find some way to not hardcode this rule
  if (node.hasComponent(SmartNode)) {
    showNew = false
  }

  return (
    <div key={node.hash} className="list-view">
      {node.hash}
      <div className="fields">
        {node.getLinked('Fields').length > 0 &&
          node.getLinked('Fields').map((n: any) => <OutlineNode key={n.hash} path={path.append(n)} />)}
      </div>
      <div className="children">
        {node.childCount > 0 && node.children.map((n: any) => <OutlineNode key={n.hash} path={path.append(n)} />)}
        {showNew && <NewNode path={path} />}
      </div>
    </div>
  )
}

export default ListView
