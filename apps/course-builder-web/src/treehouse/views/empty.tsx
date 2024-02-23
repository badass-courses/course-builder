import React from 'react'
import { Path } from '@/treehouse/workbench/path'
import { Workbench } from '@/treehouse/workbench/workbench'

import { Node } from '../model/mod'

interface EmptyViewProps {
  node: Node
  workbench: Workbench
  panel: Path
}

const EmptyView: React.FC<EmptyViewProps> = ({ node, workbench, panel }) => {
  return <div className="empty-view"></div>
}

export default EmptyView
