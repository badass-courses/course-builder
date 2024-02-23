import * as React from 'react'
import { useEffect, useState } from 'react'
import { getView } from '@/treehouse/views/views'

interface TabsViewProps {
  workbench: any // Define more specific type based on usage
  path: any // Define more specific type based on usage
  alwaysShowNew?: boolean
}

const TabsView: React.FC<TabsViewProps> = ({ workbench, path }) => {
  const node = path.node
  const [tabs, setTabs] = useState(new Set())
  const [selectedTab, setSelectedTab] = useState('')

  useEffect(() => {
    const newTabs = new Set()
    let firstTabId = ''
    node.children.forEach((n: any) => {
      newTabs.add(n.raw)
      if (firstTabId === '') firstTabId = n.raw.ID
    })
    setTabs(newTabs)
    setSelectedTab((prevSelectedTab) => prevSelectedTab || firstTabId)
  }, [node.children])

  const handleTabClick = (id: string) => {
    setSelectedTab(id)
  }

  const selectedNode = node.children.find((n: any) => n.id === selectedTab)

  return (
    <div className="tabs-view">
      <div className="tabs">
        {[...tabs].map((n: any) => (
          <div key={n.ID} className={n.ID === selectedTab ? 'active' : ''} onClick={() => handleTabClick(n.ID)}>
            {n.Name}
          </div>
        ))}
        <div style={{ flexGrow: 1 }}></div>
      </div>
      <div className="tab-content">
        {/* Render the view for the selected tab */}
        {/* Assuming getView returns a React component */}
        {selectedNode &&
          React.createElement(getView(selectedNode.getAttr('view') || 'list'), {
            workbench,
            path: path.append(selectedNode),
          })}
      </div>
    </div>
  )
}

export default TabsView
