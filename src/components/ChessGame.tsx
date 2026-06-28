import { useEffect, useMemo, useState } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import './ChessGame.css'

type StatusTone = 'neutral' | 'warning' | 'danger'

type GameStatus = {
  label: string
  tone: StatusTone
}

const getGameStatus = (game: Chess): GameStatus => {
  const turn = game.turn() === 'w' ? 'White' : 'Black'

  if (game.isCheckmate()) {
    return { label: `${turn} is checkmated.`, tone: 'danger' }
  }

  if (game.isStalemate()) {
    return { label: 'Stalemate — draw.', tone: 'warning' }
  }

  if (game.isInsufficientMaterial()) {
    return { label: 'Insufficient material — draw.', tone: 'warning' }
  }

  if (game.isThreefoldRepetition()) {
    return { label: 'Threefold repetition — draw.', tone: 'warning' }
  }

  if (game.isDraw()) {
    return { label: 'Draw by rule.', tone: 'warning' }
  }

  if (game.inCheck()) {
    return { label: `${turn} is in check.`, tone: 'warning' }
  }

  return { label: `${turn} to move.`, tone: 'neutral' }
}

const getMovePairs = (history: string[]) => {
  const pairs: string[][] = []

  history.forEach((move, index) => {
    if (index % 2 === 0) {
      pairs.push([move])
    } else {
      pairs[pairs.length - 1].push(move)
    }
  })

  return pairs
}

function ChessGame() {
  const [game, setGame] = useState(() => new Chess())
  const [moveHistory, setMoveHistory] = useState<string[]>([])
  const [boardWidth, setBoardWidth] = useState(() => {
    if (typeof window === 'undefined') {
      return 560
    }

    return Math.min(620, Math.max(320, window.innerWidth > 768 ? 560 : window.innerWidth - 32))
  })

  useEffect(() => {
    const updateBoardWidth = () => {
      setBoardWidth(
        Math.min(620, Math.max(320, window.innerWidth > 768 ? 560 : window.innerWidth - 32)),
      )
    }

    updateBoardWidth()
    window.addEventListener('resize', updateBoardWidth)

    return () => {
      window.removeEventListener('resize', updateBoardWidth)
    }
  }, [])

  const status = useMemo(() => getGameStatus(game), [game])
  const movePairs = useMemo(() => getMovePairs(moveHistory), [moveHistory])
  const turnLabel = game.turn() === 'w' ? 'White' : 'Black'

  const handlePieceDrop = ({
    sourceSquare,
    targetSquare,
  }: {
    sourceSquare: string
    targetSquare: string | null
  }) => {
    if (!sourceSquare || !targetSquare) {
      return false
    }

    const nextGame = new Chess(game.fen())
    const move = nextGame.move({ from: sourceSquare, to: targetSquare, promotion: 'q' })

    if (!move) {
      return false
    }

    setGame(nextGame)
    setMoveHistory((previous) => [...previous, move.san])
    return true
  }

  const startNewGame = () => {
    setGame(new Chess())
    setMoveHistory([])
  }

  const resetCurrentGame = () => {
    setGame(new Chess())
  }

  const undoLastMove = () => {
    const nextGame = new Chess(game.fen())
    const undoneMove = nextGame.undo()

    if (!undoneMove) {
      return
    }

    setGame(nextGame)
    setMoveHistory((previous) => previous.slice(0, -1))
  }

  return (
    <div className="chess-game">
      <header className="game-header">
        <div>
          <p className="eyebrow"></p>
          <h1> React + chess.js Local Chess Match</h1>
        </div>
      </header>

      <div className="game-shell">
        <section className="board-panel" aria-label="Chessboard">
          <Chessboard
            options={{
              position: game.fen(),
              onPieceDrop: handlePieceDrop,
              animationDurationInMs: 220,
              allowDragging: true,
              boardStyle: {
                width: boardWidth,
                height: boardWidth,
                borderRadius: '20px',
                boxShadow: '0 18px 45px rgba(15, 23, 42, 0.32)',
              },
              darkSquareStyle: { backgroundColor: '#6c8456' },
              lightSquareStyle: { backgroundColor: '#f0e9d2' },
            }}
          />
        </section>

        <aside className="sidebar">

        <header className="game-header">
        <div className="status-card">
          <span className={`status-pill ${status.tone}`}>{status.label}</span>
          <p className="status-meta">{turnLabel} to move</p>
        </div>
      </header>

          <div className="button-panel">
            <button type="button" className="primary" onClick={startNewGame}>
              New Game
            </button>
            <button type="button" onClick={resetCurrentGame}>
              Reset
            </button>
            <button type="button" onClick={undoLastMove}>
              Undo Move
            </button>
          </div>

          <div className="panel-card">
            <h2>Move History</h2>
            {movePairs.length > 0 ? (
              <div className="move-list">
                {movePairs.map((pair, index) => (
                  <div className="move-row" key={`${pair.join('-')}-${index}`}>
                    <span className="move-number">{index + 1}.</span>
                    <span>{pair[0]}</span>
                    {pair[1] ? <span>{pair[1]}</span> : <span className="move-placeholder">—</span>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-state">Your moves will appear here as you play.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

export default ChessGame
