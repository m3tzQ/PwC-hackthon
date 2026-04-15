import type { Player, PositionKey } from '../types/domain'

interface FieldBoardProps {
  lineup: Partial<Record<PositionKey, Player>>
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

function FieldBoard({ lineup }: FieldBoardProps) {
  return (
    <section className="field-board">
      <div className="field-grid" role="img" aria-label="Football field lineup board">
        {spotOrder.map((position) => {
          const player = lineup[position]
          return (
            <article key={position} className={`spot spot-${position.toLowerCase()}`}>
              <p className="spot-position">{position}</p>
              <p className="spot-player">{player ? player.name : 'TBD'}</p>
              {player ? (
                <p className="spot-score">Fit {player.fitnessScore}%</p>
              ) : (
                <p className="spot-score">Awaiting choice</p>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default FieldBoard
