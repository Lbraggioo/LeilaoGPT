import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/api': { // Se a rota que o frontend está chamando começar com /api
        target: 'http://localhost:5000', // URL do seu backend
        changeOrigin: true, // Necessário para reescrever o cabeçalho Host
        secure: false,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            proxyReq.setHeader('Origin', 'http://localhost:5173');
        });
      },
    },
  },
}
})