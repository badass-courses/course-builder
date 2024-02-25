import { Path } from '@/treehouse/workbench/path'
import { Workbench } from '@/treehouse/workbench/workbench'

import type { Node } from '../model/mod'
import { OutlineEditor } from './outline'

type QuickAddProps = {
  workbench: Workbench
  node: Node
}

export const QuickAdd: React.FC<QuickAddProps> = ({ workbench, node }) => {
  const path = new Path(node, 'quickadd') // Make sure Path is defined or imported

  return (
    <div className="notice">
      <h3>Quick Add</h3>
      <OutlineEditor path={path} alwaysShowNew={true} /> {/* Make sure OutlineEditor is defined or imported */}
      <div className="button-bar">
        <button
          className="primary"
          onClick={() => {
            workbench.commitQuickAdd()
            workbench.closeDialog()
          }}
        >
          Add to Today
        </button>
      </div>
    </div>
  )
}
