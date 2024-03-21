import { useEffect, useRef, useState } from 'react'

export interface State {
  selected: number
  input: string
  items: any[]
}

export interface Attrs {
  input: string
  inputview: (onkeydown: Function, oninput: Function) => any
  itemview: (item: any, idx: number) => any
  onpick: (item: any) => void
  onchange: (state: State) => void
}

export interface PickerProps {
  input?: string
  inputview: (
    onkeydown: (e: React.KeyboardEvent) => void,
    oninput: (e: React.ChangeEvent<HTMLInputElement>) => void,
    input: string,
  ) => JSX.Element
  itemview: (item: any, idx: number) => JSX.Element
  onpick: (item: any) => void
  onchange: (state: State) => void
}

export const Picker: React.FC<PickerProps> = ({
  input = '',
  inputview,
  itemview,
  onpick,
  onchange,
}) => {
  const [state, setState] = useState<State>({
    selected: 0,
    input: input || '',
    items: [],
  })
  const itemsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (itemsRef.current) {
      const items = itemsRef.current.children
      if (state.selected !== undefined && items.length > 0) {
        ;(items[state.selected] as HTMLElement).scrollIntoView({
          block: 'nearest',
        })
      }
    }
  }, [state.selected])

  useEffect(() => {
    onchange(state)
  }, [state.input])

  const onkeydown = (e: React.KeyboardEvent) => {
    const mod = (a: number, b: number) => ((a % b) + b) % b
    if (e.key === 'ArrowDown') {
      setState((prevState) => ({
        ...prevState,
        selected: mod(prevState.selected + 1, prevState.items.length),
      }))
      e.preventDefault()
    } else if (e.key === 'ArrowUp') {
      setState((prevState) => ({
        ...prevState,
        selected: mod(prevState.selected - 1, prevState.items.length),
      }))
      e.preventDefault()
    } else if (e.key === 'Enter') {
      if (state.selected !== undefined) {
        onpick(state.items[state.selected])
      }
      e.preventDefault()
    }
  }

  const oninput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState((prevState) => ({
      ...prevState,
      input: e.target.value,
      selected: 0,
    }))
  }

  return (
    <div className="picker">
      {inputview(onkeydown, oninput, state.input)}
      <div className="items" ref={itemsRef}>
        {state.items.map((item, idx) => (
          <div
            key={item.title}
            className={state.selected === idx ? 'item selected' : 'item'}
            onClick={() => onpick(item)}
            onMouseOver={() =>
              setState((prevState) => ({ ...prevState, selected: idx }))
            }
          >
            {itemview(item, idx)}
          </div>
        ))}
      </div>
    </div>
  )
}
