import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Chess, type Square } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import './ChessGame.css'

type StatusTone = 'neutral' | 'warning' | 'danger'

type GameStatus = {
  label: string
  tone: StatusTone
}

type GameEndState = {
  type: 'checkmate' | 'draw' | null
  winner: 'White' | 'Black' | null
  message: string
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

  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white')
  const [showCoordinates, setShowCoordinates] = useState(true)
  const [showLegalMoves, setShowLegalMoves] = useState(true)
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null)
  const [copiedFen, setCopiedFen] = useState(false)
  const [playMode, setPlayMode] = useState<'local' | 'ai'>('ai')
  const [aiColor, setAiColor] = useState<'white' | 'black'>('black')
  const [skillLevel, setSkillLevel] = useState(10)
  const [searchDepth, setSearchDepth] = useState(12)
  const [analysisDepth, setAnalysisDepth] = useState(16)
  const [analysisMode, setAnalysisMode] = useState(false)
  const [multiPV, setMultiPV] = useState(3)
  const [engineLines, setEngineLines] = useState<string[]>([])
  const [engineReady, setEngineReady] = useState(false)
  const [engineThinking, setEngineThinking] = useState(false)
  const [bestEngineMove, setBestEngineMove] = useState<string | null>(null)
  const [engineScore, setEngineScore] = useState<string | null>(null)
  const [engineDepth, setEngineDepth] = useState<number>(0)
  const [hintMessage, setHintMessage] = useState<string | null>(null)
  const [pgnText, setPgnText] = useState('')

  const engineRef = useRef<Worker | null>(null)
  const autoMoveRef = useRef(false)
  const searchPendingRef = useRef(false)
  const multiPVRef = useRef(multiPV)

  useEffect(() => {
    const updateBoardWidth = () => {
      setBoardWidth(Math.min(620, Math.max(320, window.innerWidth > 768 ? 560 : window.innerWidth - 32)))
    }

    updateBoardWidth()
    window.addEventListener('resize', updateBoardWidth)

    return () => {
      window.removeEventListener('resize', updateBoardWidth)
    }
  }, [])

  useEffect(() => {
    const worker = new Worker('/stockfish-worker.js')

    worker.onmessage = (event: MessageEvent<string>) => {
      const line = event.data?.toString?.() ?? ''
      if (!line) {
        return
      }

      if (line === 'uciok') {
        setEngineReady(true)
        worker.postMessage('setoption name UCI_LimitStrength value true')
        worker.postMessage(`setoption name Skill Level value ${skillLevel}`)
        worker.postMessage(`setoption name MultiPV value ${multiPVRef.current}`)
        return
      }

      if (line.startsWith('info')) {
        const depthMatch = line.match(/ depth (\d+)/)
        const scoreMatch = line.match(/ score (cp|mate) (-?\d+)/)
        const multipvMatch = line.match(/ multipv (\d+)/)
        const pvMatch = line.match(/ pv (.+)$/)

        if (depthMatch) {
          setEngineDepth(Number(depthMatch[1]))
        }

        if (scoreMatch) {
          const type = scoreMatch[1]
          const value = Number(scoreMatch[2])
          setEngineScore(type === 'mate' ? `Mate ${value}` : `${(value / 100).toFixed(2)}`)
        }

        if (multipvMatch && pvMatch) {
          const lineNumber = Number(multipvMatch[1]) - 1
          const value = scoreMatch ? Number(scoreMatch[2]) : 0
          const scoreText = scoreMatch ? (scoreMatch[1] === 'mate' ? `Mate ${value}` : `${(value / 100).toFixed(2)}`) : '-'
          const nextLine = `#${lineNumber + 1} ${scoreText} ${pvMatch[1]}`

          setEngineLines((previous) => {
            const next = [...previous]
            next[lineNumber] = nextLine
            return next.slice(0, multiPVRef.current)
          })
        } else if (pvMatch) {
          setBestEngineMove(pvMatch[1].split(' ')[0])
        }
      }

      if (line.startsWith('bestmove')) {
        const moveMatch = line.match(/bestmove ([a-h][1-8][a-h][1-8][nbrq]?)/)
        if (moveMatch) {
          const bestMove = moveMatch[1]
          setBestEngineMove(bestMove)
          setEngineThinking(false)
          searchPendingRef.current = false

          if (
            autoMoveRef.current &&
            playMode === 'ai' &&
            !game.isGameOver() &&
            game.turn() === (aiColor === 'white' ? 'w' : 'b')
          ) {
            const from = bestMove.slice(0, 2) as Square
            const to = bestMove.slice(2) as Square
            applyMove(from, to)
            autoMoveRef.current = false
          }
        }
      }
    }

    engineRef.current = worker
    worker.onmessageerror = () => {
      setHintMessage('Engine worker failed to receive messages.')
    }
    worker.onerror = (event) => {
      console.error('Engine worker error:', event.message)
      setHintMessage('Stockfish failed to load. Check console for details.')
      setEngineReady(false)
    }

    worker.postMessage('uci')

    return () => {
      worker.postMessage('quit')
      worker.terminate()
    }
  }, [])

  useEffect(() => {
    if (!engineReady || playMode !== 'ai' || engineThinking || game.isGameOver()) {
      return
    }

    const activeColor = game.turn() === 'w' ? 'white' : 'black'
    if (activeColor === aiColor) {
      autoMoveRef.current = true
      setHintMessage(`${aiColor} engine is thinking...`)
      setEngineThinking(true)
      setBestEngineMove(null)
      engineRef.current?.postMessage(`position fen ${game.fen()}`)
      engineRef.current?.postMessage(`go depth ${searchDepth}`)
    }
  }, [game, engineReady, playMode, aiColor, searchDepth, engineThinking])

  useEffect(() => {
    if (!engineReady) {
      return
    }

    engineRef.current?.postMessage(`setoption name Skill Level value ${skillLevel}`)
  }, [engineReady, skillLevel])

  useEffect(() => {
    if (!engineReady) {
      return
    }

    multiPVRef.current = multiPV
    engineRef.current?.postMessage(`setoption name MultiPV value ${multiPV}`)
  }, [engineReady, multiPV])

  const sendHintRequest = () => {
    if (!engineReady || !engineRef.current) {
      return
    }

    autoMoveRef.current = false
    setAnalysisMode(false)
    setEngineThinking(true)
    setHintMessage('Finding best move...')
    engineRef.current.postMessage(`position fen ${game.fen()}`)
    engineRef.current.postMessage(`go depth ${searchDepth}`)
  }

  const stopEngine = () => {
    engineRef.current?.postMessage('stop')
    setEngineThinking(false)
    setHintMessage('Engine stopped.')
  }

  const sendAnalysisRequest = () => {
    if (!engineReady || !engineRef.current) {
      return
    }

    autoMoveRef.current = false
    setAnalysisMode(true)
    setEngineThinking(true)
    setEngineLines(Array(multiPV).fill('Waiting for analysis...'))
    setHintMessage('Running full analysis...')
    engineRef.current.postMessage(`position fen ${game.fen()}`)
    engineRef.current.postMessage(`go depth ${analysisDepth}`)
  }

  const exportPgn = async () => {
    const pgn = game.pgn({ maxWidth: 0 })

    try {
      await navigator.clipboard.writeText(pgn)
      setHintMessage('PGN copied to clipboard.')
    } catch {
      setHintMessage('PGN ready to copy.')
    }
  }

  const importPgn = () => {
    const nextGame = new Chess()

    try {
      nextGame.loadPgn(pgnText)
    } catch {
      setHintMessage('Invalid PGN. Please check the text and try again.')
      return
    }

    setGame(nextGame)
    setMoveHistory(nextGame.history())
    setSelectedSquare(null)
    setBestEngineMove(null)
    setEngineScore(null)
    setEngineDepth(0)
    setEngineLines([])
    setAnalysisMode(false)
    setHintMessage('PGN imported successfully.')
  }

  const status = useMemo(() => getGameStatus(game), [game])
  const movePairs = useMemo(() => getMovePairs(moveHistory), [moveHistory])
  const turnLabel = game.turn() === 'w' ? 'White' : 'Black'
  const gameEndState = useMemo<GameEndState>(() => {
    if (game.isCheckmate()) {
      const winner = game.turn() === 'w' ? 'Black' : 'White'
      return {
        type: 'checkmate',
        winner,
        message: `${winner} wins by checkmate!`,
      }
    }

    if (game.isDraw()) {
      return {
        type: 'draw',
        winner: null,
        message: 'It is a draw!',
      }
    }

    return {
      type: null,
      winner: null,
      message: '',
    }
  }, [game])

  const lastMoveStyles = useMemo(() => {
    const history = game.history({ verbose: true })
    const lastMove = history[history.length - 1]

    if (!lastMove) {
      return {}
    }

    return {
      [lastMove.from]: { backgroundColor: 'rgba(250, 204, 21, 0.42)' },
      [lastMove.to]: { backgroundColor: 'rgba(250, 204, 21, 0.62)' },
    } as Record<string, CSSProperties>
  }, [game])

  const legalMoveStyles = useMemo(() => {
    if (!selectedSquare || !showLegalMoves) {
      return {}
    }

    const moves = game.moves({ square: selectedSquare, verbose: true })

    return Object.fromEntries(
      moves.map((move) => [
        move.to,
        { backgroundColor: 'rgba(34, 197, 94, 0.34)', borderRadius: '50%' },
      ]),
    ) as Record<string, CSSProperties>
  }, [game, selectedSquare, showLegalMoves])

  const bestEngineMoveStyles = useMemo(() => {
    if (!bestEngineMove) {
      return {}
    }

    const from = bestEngineMove.slice(0, 2)
    const to = bestEngineMove.slice(2, 4)

    return {
      [from]: { backgroundColor: 'rgba(59, 130, 246, 0.35)', border: '2px solid #60a5fa' },
      [to]: { backgroundColor: 'rgba(59, 130, 246, 0.5)', border: '2px solid #3b82f6' },
    } as Record<string, CSSProperties>
  }, [bestEngineMove])

  const squareStyles = useMemo(() => {
    return {
      ...lastMoveStyles,
      ...legalMoveStyles,
      ...bestEngineMoveStyles,
      ...(selectedSquare ? { [selectedSquare]: { backgroundColor: 'rgba(96, 165, 250, 0.35)' } } : {}),
    }
  }, [lastMoveStyles, legalMoveStyles, bestEngineMoveStyles, selectedSquare])

  const applyMove = (from: Square, to: Square) => {
    const nextGame = new Chess(game.fen())
    const move = nextGame.move({ from, to, promotion: 'q' })

    if (!move) {
      return false
    }

    setGame(nextGame)
    setMoveHistory((previous) => [...previous, move.san])
    setSelectedSquare(null)
    return true
  }

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

    if (playMode === 'ai' && game.turn() === (aiColor === 'white' ? 'w' : 'b')) {
      return false
    }

    return applyMove(sourceSquare as Square, targetSquare as Square)
  }

  const handleSquareClick = ({ square }: { square: string }) => {
    const targetSquare = square as Square
    const piece = game.get(targetSquare)

    if (selectedSquare && selectedSquare !== targetSquare) {
      const moved = applyMove(selectedSquare, targetSquare)
      if (!moved) {
        if (piece && piece.color === game.turn()) {
          setSelectedSquare(targetSquare)
        } else {
          setSelectedSquare(null)
        }
      }
      return
    }

    if (piece && piece.color === game.turn()) {
      setSelectedSquare(targetSquare)
      return
    }

    setSelectedSquare(null)
  }

  const startNewGame = () => {
    engineRef.current?.postMessage('stop')
    setGame(new Chess())
    setMoveHistory([])
    setSelectedSquare(null)
    setBestEngineMove(null)
    setEngineScore(null)
    setEngineDepth(0)
    setEngineLines([])
    setAnalysisMode(false)
    setHintMessage(null)
  }

  const resetCurrentGame = () => {
    engineRef.current?.postMessage('stop')
    setGame(new Chess())
    setSelectedSquare(null)
    setEngineLines([])
    setAnalysisMode(false)
    setHintMessage(null)
  }

  const undoLastMove = () => {
    engineRef.current?.postMessage('stop')
    const nextGame = new Chess(game.fen())
    const undoneMove = nextGame.undo()

    if (!undoneMove) {
      return
    }

    setGame(nextGame)
    setMoveHistory((previous) => previous.slice(0, -1))
    setSelectedSquare(null)
    setBestEngineMove(null)
    setEngineScore(null)
    setEngineDepth(0)
  }

  const flipBoard = () => {
    setBoardOrientation((previous) => (previous === 'white' ? 'black' : 'white'))
  }

  const copyFen = async () => {
    try {
      await navigator.clipboard.writeText(game.fen())
      setCopiedFen(true)
      window.setTimeout(() => setCopiedFen(false), 1400)
    } catch {
      setCopiedFen(false)
    }
  }

  return (
    <div className="chess-game">
      <header className="game-header">
        <div>
          <p className="eyebrow">React + chess.js + Stockfish</p>
          <p className="subtitle">Local Chess Match with AI - Play against Stockfish or switch to two-player mode with analysis and engine-assisted hints.</p>
        </div>

        <div className="status-card">
          <span className={`status-pill ${status.tone}`}>{status.label}</span>
          <p className="status-meta">{turnLabel} to move. Mode: {playMode === 'ai' ? `AI vs Player (${aiColor})` : 'Local two-player'}</p>
        </div>
      </header>

      <div className="game-shell">
        {gameEndState.type && (
          <div className="celebration-overlay" role="status" aria-live="polite">
            <div className="confetti-layer" aria-hidden="true">
              {Array.from({ length: 24 }).map((_, index) => (
                <span
                  key={index}
                  className="confetti-piece"
                  style={{ ['--delay' as string]: `${index * 0.08}s`, ['--x' as string]: `${(index % 6) * 18 - 54}%` }}
                />
              ))}
            </div>
            <div className="celebration-card">
              <p className="celebration-badge">{gameEndState.type === 'checkmate' ? '🏆 Game Over' : '🤝 Draw'}</p>
              <h2>{gameEndState.message}</h2>
              <p>{gameEndState.winner ? `${gameEndState.winner} takes the win.` : 'No winner this round.'}</p>
            </div>
          </div>
        )}

        <section className="board-panel" aria-label="Chessboard">
          <Chessboard
            options={{
              position: game.fen(),
              onPieceDrop: handlePieceDrop,
              onSquareClick: handleSquareClick,
              animationDurationInMs: 220,
              allowDragging: playMode === 'local' || game.turn() !== (aiColor === 'white' ? 'w' : 'b'),
              boardOrientation,
              showNotation: showCoordinates,
              squareStyles,
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
          <div className="engine-card">
            <div className="engine-card-row">
              <button type="button" className="toggle-button" onClick={() => setPlayMode((prev) => (prev === 'local' ? 'ai' : 'local'))}>
                Switch to {playMode === 'local' ? 'AI mode' : 'Local mode'}
              </button>
              {playMode === 'ai' && (
                <button type="button" className="toggle-button" onClick={() => setAiColor((prev) => (prev === 'white' ? 'black' : 'white'))}>
                  AI as {aiColor === 'white' ? 'Black' : 'White'}
                </button>
              )}
            </div>

            <div className="engine-summary">
              <span>Engine status</span>
              <strong>{engineReady ? (engineThinking ? 'Thinking…' : 'Ready') : 'Loading…'}</strong>
            </div>

            <div className="engine-stats">
              <div>
                <span>Depth</span>
                <strong>{engineDepth || '-'}</strong>
              </div>
              <div>
                <span>Eval</span>
                <strong>{engineScore || '-'}</strong>
              </div>
              <div>
                <span>Best</span>
                <strong>{bestEngineMove || '-'}</strong>
              </div>
            </div>

            <div className="engine-controls">
              <label>
                Skill Level {skillLevel}
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={skillLevel}
                  onChange={(event) => setSkillLevel(Number(event.target.value))}
                />
              </label>

              <label>
                Search Depth {searchDepth}
                <input
                  type="range"
                  min="4"
                  max="20"
                  value={searchDepth}
                  onChange={(event) => setSearchDepth(Number(event.target.value))}
                />
              </label>

              <div className="engine-buttons">
                <button type="button" onClick={sendHintRequest}>
                  Hint
                </button>
                <button type="button" onClick={sendAnalysisRequest}>
                  Analyze
                </button>
                <button type="button" onClick={stopEngine}>
                  Stop
                </button>
              </div>

              <label>
                Analysis depth {analysisDepth}
                <input
                  type="range"
                  min="6"
                  max="28"
                  value={analysisDepth}
                  onChange={(event) => setAnalysisDepth(Number(event.target.value))}
                />
              </label>

              <label>
                Lines {multiPV}
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={multiPV}
                  onChange={(event) => setMultiPV(Number(event.target.value))}
                />
              </label>

              {analysisMode && engineLines.length > 0 && (
                <div className="analysis-lines">
                  <h3>Engine lines</h3>
                  <ol>
                    {engineLines.map((line, index) => (
                      <li key={index}>{line || 'Waiting...'}</li>
                    ))}
                  </ol>
                </div>
              )}

              {hintMessage && <p className="hint-message">{hintMessage}</p>}
            </div>
          </div>

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

          <div className="utility-panel">
            <button type="button" onClick={flipBoard}>
              {boardOrientation === 'white' ? 'Flip Board' : 'Unflip Board'}
            </button>
            <button type="button" onClick={() => setShowCoordinates((previous) => !previous)}>
              {showCoordinates ? 'Hide Coordinates' : 'Show Coordinates'}
            </button>
            <button type="button" onClick={() => setShowLegalMoves((previous) => !previous)}>
              {showLegalMoves ? 'Hide Moves' : 'Show Moves'}
            </button>
            <button type="button" onClick={copyFen}>
              {copiedFen ? 'FEN Copied' : 'Copy FEN'}
            </button>
          </div>

          <div className="panel-card">
            <h2>PGN Import / Export</h2>
            <textarea
              className="pgn-textarea"
              value={pgnText}
              onChange={(event) => setPgnText(event.target.value)}
              rows={6}
              placeholder="Paste PGN here to import, or leave empty and copy current PGN."
            />
            <div className="engine-buttons">
              <button type="button" onClick={importPgn}>
                Import PGN
              </button>
              <button type="button" onClick={exportPgn}>
                Copy PGN
              </button>
            </div>
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
