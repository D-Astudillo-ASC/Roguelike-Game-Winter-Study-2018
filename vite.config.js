import { defineConfig } from 'vite'
import legacy from '@vitejs/plugin-legacy'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig(({ command, mode }) => {
  const isProduction = mode === 'production'
  const isAnalyze = mode === 'analyze'
  const isStaging = mode === 'staging'

  return {
    base: './',
    plugins: [
      legacy({
        targets: ['defaults', 'not IE 11'],
        additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
        renderLegacyChunks: true,
        polyfills: [
          'es.symbol',
          'es.promise',
          'es.promise.finally',
          'es/map',
          'es/set',
          'es.array.filter',
          'es.array.for-each',
          'es.array.flat-map',
          'es.object.define-properties',
          'es.object.define-property',
          'es.object.get-own-property-descriptor',
          'es.object.get-own-property-descriptors',
          'es.object.keys',
          'es.object.to-string',
          'web.dom-collections.for-each',
          'esnext.global-this',
          'esnext.string.match-all'
        ]
      }),
      // Bundle analyzer for production builds
      isAnalyze && visualizer({
        filename: 'dist/bundle-analysis.html',
        open: true,
        gzipSize: true,
        brotliSize: true,
        template: 'treemap', // or 'sunburst', 'network'
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
          pure_funcs: ['console.log', 'console.info', 'console.debug'],
          passes: 1,
          unsafe: false,
          unsafe_comps: false,
          unsafe_Function: false,
          unsafe_math: false,
          unsafe_proto: false,
          unsafe_regexp: false,
          unsafe_undefined: false,
        },
        mangle: {
          safari10: true,
          toplevel: false,
        },
        format: {
          comments: false,
        },
      } : undefined,
      
      // Optimize chunk splitting for better caching
      rollupOptions: {
        input: {
          main: 'index.html'
        },
        output: {
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
          // Manual chunk splitting for better caching
          manualChunks: isProduction ? {
            vendor: ['rot-js'],
            // Let Vite handle the rest automatically to avoid circular dependencies
          } : undefined,
        },
      },
      
      // Optimize build performance
      target: 'es2015',
      cssCodeSplit: true,
      reportCompressedSize: true,
      chunkSizeWarningLimit: 1000,
      // Clean output directory
      emptyOutDir: true,
      // Optimize for modern browsers
      modulePreload: {
        polyfill: false
      },
    },
    
    // Development server configuration
    server: {
      port: 3000,
      open: true,
      host: true,
      // Enable HMR for better development experience
      hmr: {
        overlay: true
      }
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
      // Remove process.env.NODE_ENV for smaller bundle
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    
    // Optimize dependencies
    optimizeDeps: {
      include: ['rot-js'],
      exclude: [],
      // Force pre-bundling for better performance
      force: false,
    },
    
    // CSS optimization
    css: {
      devSourcemap: !isProduction,
    },

    // Performance optimizations
    esbuild: {
      // Remove console.logs in production
      drop: isProduction ? ['console', 'debugger'] : [],
      // Optimize for modern browsers
      target: isProduction ? 'es2015' : 'esnext',
      // Disable tree shaking to avoid circular dependency issues
      treeShaking: false,
    },
  }
}) 