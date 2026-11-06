import { mergeConfig } from 'vite'
import base from './vite.config.ts'
// Keep SSR verification and the operator's live dev server out of isolated browser fixtures.
export default mergeConfig(base, { cacheDir: 'node_modules/.vite-ops-20261106' })
