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
