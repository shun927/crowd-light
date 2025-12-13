import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    host: true, // Expose to network (0.0.0.0)
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true
      }
    },
    // allowedHosts: true // basicSsl handles host checks usually, but keeping it is fine
  }
})
