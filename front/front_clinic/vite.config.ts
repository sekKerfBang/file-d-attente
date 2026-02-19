import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  // Charger les variables d'environnement
  const env = loadEnv(mode, process.cwd(), '');
  
  // Utiliser 127.0.0.1 pour éviter le blocage adblocker
  // const API_URL = env.VITE_API_URL || 'http://127.0.0.1:8000'
  // const WS_URL = env.VITE_WS_URL || 'ws://127.0.0.1:8000'
  const API_URL = (env.VITE_API_URL || 'http://127.0.0.1:8000').trim();
  const WS_URL = (env.VITE_WS_URL || 'ws://127.0.0.1:8000').trim();
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@services': path.resolve(__dirname, './src/services'),
        '@store': path.resolve(__dirname, './src/store'),
        '@types': path.resolve(__dirname, './src/types'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@pages': path.resolve(__dirname, './src/pages'),
      },
    },

    server: {
      port: 5173,
      host: true,
      proxy: {
        '/api': {
          target: ('http://127.0.0.1:8000').trim(),
          changeOrigin: true,
          secure: false,
          // Réécriture pour éviter le blocage
          // rewrite: (path) => path.replace(/^\/api/, '/api'),
        },
        '/ws': {
          target: ('ws://127.0.0.1:8000').trim(),
          ws: true,
          changeOrigin: true,
          secure: false,
        },
      },
      // CORS pour le développement
      cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
      },
    },
    build: {
      target: 'es2022',
      outDir: 'dist',
      sourcemap: true,
    },
    // Définir les variables pour le client
    define: {
      __API_URL__: JSON.stringify(API_URL),
      __WS_URL__: JSON.stringify(WS_URL),
    },
  }
})

