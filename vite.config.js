import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    proxy: {
      '/graphql': {
        target: 'http://localhost',
        changeOrigin: true,
        secure: false,      
        ws: true,
      }
    }
  }
})