import { useState } from 'react';
import { Chess } from '`chess.js`';
import { Chessboard } from 'react-chessboard';
import '`./App.css`';

function App() {
  const [position, setPosition] = useState('start');

  function onDrop(sourceSquare, targetSquare) {
    const game = new Chess(position);
    const move = game.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q', // always promote to a queen for simplicity
    });

    // illegal move
    if (move === null) return false;

    setPosition(game.fen());
    return true;
  }

  function resetGame() {
    setPosition('start');
  }

  return (
    <div id="center">
      <h1>2-Player Chess</h1>
      <Chessboard position={position} onPieceDrop={onDrop} />
      <button onClick={resetGame}>New Game</button>
    </div>
  );
}

export default App;