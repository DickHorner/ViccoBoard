import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

function vendorChunkName(id: string): string | undefined {
  const normalizedId = id.replace(/\\/g, '/')
  if (!normalizedId.includes('node_modules/')) {
    return undefined
  }

  const parts = normalizedId.split('node_modules/')[1]?.split('/') ?? []
  if (parts.length === 0) {
    return 'vendor'
  }

  const packageName = parts[0].startsWith('@')
    ? `${parts[0]}-${parts[1] ?? 'pkg'}`
    : parts[0]

  return `vendor-${packageName.replace(/[@/]/g, '-')}`
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const localIpadBuild = mode === 'ipad-local'

  return {
    base: localIpadBuild ? './' : '/',
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    build: {
      assetsInlineLimit: localIpadBuild ? Number.MAX_SAFE_INTEGER : 4096,
      cssCodeSplit: !localIpadBuild,
      rollupOptions: {
        onwarn(warning, warn) {
          if (warning.code === 'CHUNK_SIZE_LIMIT') {
            return
          }
          warn(warning)
        },
        output: localIpadBuild
          ? {
              inlineDynamicImports: true
            }
          : {
              manualChunks: vendorChunkName
            }
      }
    }
  }
})
