# Chess React

A polished React + TypeScript chess app built with Vite, chess.js, react-chessboard, and a local Stockfish engine integration. The project provides a full single-page chess experience with local play, AI-assisted moves, engine analysis, legal-move highlighting, evaluation display, and PGN import/export.

## Repository Summary

This repository contains a front-end chess application focused on gameplay, analysis, and user interaction. The main app is located in the [chess-react](.) folder and includes:

- A responsive chessboard UI with drag-and-drop and click-to-move controls
- Full chess rules enforcement using chess.js
- An AI mode powered by Stockfish running in a web worker
- Move hints, engine analysis, and best-move highlighting
- Evaluation score and a simple evaluation bar for the current position
- PGN import/export and move history
- Game controls for new game, reset, undo, flip board, and coordinate/move display toggles

## Tech Stack

- React 19
- TypeScript
- Vite
- chess.js
- react-chessboard
- Stockfish WebAssembly / worker integration


# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)


## Promot

```
Act as an expert React developer. I need a fully functional, 2-player local chess game built with React, chess.js for game rules/validation, and react-chessboard for the UI. [1]
Include the following features and functionalities:
1. Drag and Drop: Users should be able to drag and drop pieces intuitively across a responsive board. [1]
2. Move Validation: It must strictly enforce chess rules using chess.js (e.g., checking for checkmate, stalemate, and valid moves). [1, 2]
3. Control Buttons:
    * New Game: Clears the board and starts a fresh match.
    * Reset: Restarts the current game without wiping the move history.
    * Undo Last Move: Reverts the last played move using the chess engine's built-in undo method. [1, 2, 3, 4, 5]
4. Game Status: Display whose turn it is (White/Black) and if there is a check, checkmate, or draw. [1]
Technical Requirements:
* Use React hooks like useState to maintain board state.
* Import Chess from chess.js to manage the game logic.
* Import Chessboard from react-chessboard to render the interactive UI.
* Provide clean, modern, and responsive CSS styling so the board and buttons look great on any screen size.
* Ensure the code is split into logical components and is free of syntax errors. [1, 2, 3]

```

## Project Structure

- [src/components/ChessGame.tsx](src/components/ChessGame.tsx) — main game logic, engine integration, UI state, and controls
- [src/components/ChessGame.css](src/components/ChessGame.css) — styling for the board, sidebar, engine panel, and overlays
- [public/stockfish.js](public/stockfish.js) — public worker entrypoint for the engine
- [public/stockfish-18-lite-single.js](public/stockfish-18-lite-single.js) and [public/stockfish-18-lite-single.wasm](public/stockfish-18-lite-single.wasm) — Stockfish assets used by the app

## Getting Started

From the [chess-react](.) folder, install dependencies and start the app:

```bash
npm install
npm run dev
```

Then open the local Vite URL shown in the terminal.

## Build

To create a production build:

```bash
npm run build
```

## Notes

- The engine runs locally in the browser through a web worker and does not require a backend.
- The app is designed for local experimentation and educational chess play with built-in analysis assistance.



## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```
