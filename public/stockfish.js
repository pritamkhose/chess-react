self.Module = {
  locateFile: function (path) {
    if (path.endsWith('.wasm')) {
      return new URL('./stockfish-18-lite-single.wasm', self.location).href
    }
    if (path.endsWith('.js')) {
      return new URL(path, self.location).href
    }
    return new URL(path, self.location).href
  },
}

self.importScripts(new URL('./stockfish-18-lite-single.js', self.location).href)
