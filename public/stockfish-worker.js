self.Module = {
  locateFile: function (path) {
    if (path.endsWith('.wasm')) {
      return 'stockfish-18-lite-single.wasm'
    }
    return path
  },
}

self.importScripts('stockfish-18-lite-single.js')

const engine = Stockfish()

engine.onmessage = function (event) {
  self.postMessage(event.data)
}

self.onmessage = function (event) {
  engine.postMessage(event.data)
}
