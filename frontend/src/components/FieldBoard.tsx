import { useMemo } from 'react'
import type { LineupBoardItem, PositionKey } from '../types/domain'

interface FieldBoardProps {
  lineup: LineupBoardItem[]
  selectedPosition?: PositionKey
  onSelectPosition?: (position: PositionKey) => void
}

const spotOrder: PositionKey[] = [
  'GK',
  'RB',
  'CB',
  'LB',
  'DM',
  'CM',
  'AM',
  'RW',
  'LW',
  'ST',
]

function FieldBoard({ lineup, selectedPosition, onSelectPosition }: FieldBoardProps) {
  const lineupByPosition = useMemo(() => {
    const map = new Map<PositionKey, LineupBoardItem>()
    lineup.forEach((item) => map.set(item.position, item))
    return map
  }, [lineup])

  return (
    <section className="field-board">
      <div className="field-grid" role="img" aria-label="Football field lineup board">
        {spotOrder.map((position) => {
          const item = lineupByPosition.get(position)
          const isSelected = selectedPosition === position
          const sourceLabel = item ? item.source.toUpperCase() : 'EMPTY'

          return (
            <button
              type="button"
              key={position}
              className={`spot spot-${position.toLowerCase()} ${isSelected ? 'spot-selected' : ''}`}
              onClick={() => onSelectPosition?.(position)}
            >
              <p className="spot-position">{position}</p>
              <p className="spot-player">{item ? item.player_name : 'TBD'}</p>
              {item ? (
                <p className="spot-score">Fit {Math.round(item.fitness_score)}%</p>
              ) : (
                <p className="spot-score">Awaiting choice</p>
              )}
              <p className="spot-source">{sourceLabel}</p>
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default FieldBoard
