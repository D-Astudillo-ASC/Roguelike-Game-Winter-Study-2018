import { defineConfig } from 'vite'
import legacy from '@vitejs/plugin-legacy'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig(({ command, mode }) => {
  const isProduction = mode === 'production'
  const isAnalyze = mode === 'analyze'
  const isStaging = mode === 'staging'

  return {
    plugins: [
      legacy({
        targets: ['defaults', 'not IE 11']
      }),
      // Bundle analyzer for production builds
      isAnalyze && visualizer({
        filename: 'dist/bundle-analysis.html',
        open: true,
        gzipSize: true,
        brotliSize: true,
      })
    ].filter(Boolean),
    
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: !isProduction, // Disable sourcemaps in production for security
      minify: isProduction ? 'terser' : false,
      terserOptions: isProduction ? {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
        mangle: {
          safari10: true,
        },
      } : undefined,
      
      // Optimize chunk splitting
      rollupOptions: {
        input: {
          main: 'index.html'
        },
        output: {
          // Optimize chunk splitting for better caching
          manualChunks: {
            vendor: ['rot-js'],
            game: ['./js_src/game.js'],
            ui: ['./js_src/ui_mode.js'],
            entities: ['./js_src/entity_mixins.js', './js_src/entity_templates.js'],
            utils: ['./js_src/util.js', './js_src/message.js', './js_src/datastore.js'],
          },
          // Optimize asset naming for better caching
          chunkFileNames: isProduction 
            ? 'assets/js/[name]-[hash].js'
            : 'assets/js/[name].js',
          entryFileNames: isProduction 
            ? 'assets/js/[name]-[hash].js'
            : 'assets/js/[name].js',
          assetFileNames: isProduction 
            ? 'assets/[ext]/[name]-[hash].[ext]'
            : 'assets/[ext]/[name].[ext]',
        },
      },
      
      // Optimize build performance
      target: 'es2015',
      cssCodeSplit: true,
      reportCompressedSize: true,
      chunkSizeWarningLimit: 1000,
    },
    
    // Development server configuration
    server: {
      port: 3000,
      open: true,
      host: true,
    },
    
    // Preview server configuration
    preview: {
      port: 4173,
      host: true,
    },
    
    // Environment-specific configurations
    define: {
      __DEV__: !isProduction,
      __STAGING__: isStaging,
      __PRODUCTION__: isProduction,
    },
    
    // Optimize dependencies
    optimizeDeps: {
      include: ['rot-js'],
      exclude: [],
    },
    
    // CSS optimization
    css: {
      devSourcemap: !isProduction,
    },
  }
}) 