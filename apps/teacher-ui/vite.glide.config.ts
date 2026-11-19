import { defineConfig, mergeConfig } from 'vite'
import { glideSourceStamping } from '@srivarsank/glide/vite-plugin'
import baseConfig from './vite.config'

// Only loaded by `npm run dev:glide`. Regular builds use vite.config.ts.
export default defineConfig((env) => mergeConfig(baseConfig(env), {
  plugins: [glideSourceStamping()]
}))
