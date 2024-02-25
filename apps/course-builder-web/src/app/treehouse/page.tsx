import { Treehouse } from '@/treehouse/Treehouse'
import { TreehouseApp } from '@/treehouse/ui/app'

import './main.css'

export default async function TreehousePage() {
  return (
    <Treehouse>
      <TreehouseApp />
    </Treehouse>
  )
}
