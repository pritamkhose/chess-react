import { defineConfig, loadEnv } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default (mode: any) => {
  // Load app-level env vars to node-level env vars.
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };
  const { VITE_APP_BASE_URL } = process.env;
  const normalizedBase = VITE_APP_BASE_URL
    ? `/${VITE_APP_BASE_URL.replace(/^\/+|\/+$/g, '')}/`
    : '/';

  return defineConfig({
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] })
    ],
    base: normalizedBase
  })
}
