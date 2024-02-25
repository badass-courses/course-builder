import { useState } from 'react'
import { useTreehouseStore } from '@/treehouse/mod'
import { Workbench } from '@/treehouse/workbench/workbench'
import { useShallow } from 'zustand/react/shallow'

interface SettingsProps {
  workbench: Workbench
}

export const Settings: React.FC<SettingsProps> = ({ workbench }) => {
  const { settings, save } = useTreehouseStore(
    useShallow((s) => {
      return {
        settings: s.settings,
        save: s.save,
      }
    }),
  )
  const currentTheme = settings.theme
  const [selectedTheme, setSelectedTheme] = useState(currentTheme)

  const oninput = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTheme(e.target.value)
  }

  return (
    <div className="notice">
      <h3>Settings</h3>
      <div className="flex flex-row">
        <div className="grow">Theme</div>
        <div>
          <select name="theme" value={selectedTheme} onChange={oninput}>
            <option value="">Light</option>
            <option value="darkmode">Dark</option>
            <option value="sepia">Sepia</option>
            <option value="sublime">Sublime</option>
          </select>
        </div>
      </div>
      <div className="button-bar">
        <button
          onClick={() => {
            workbench.closeDialog()
          }}
        >
          Cancel
        </button>
        <button
          className="primary"
          onClick={async () => {
            if (currentTheme !== selectedTheme) {
              settings.theme = selectedTheme
              await save(true)
              window.location.reload()
            } else {
              workbench.closeDialog()
            }
          }}
        >
          Save Changes
        </button>
      </div>
    </div>
  )
}
