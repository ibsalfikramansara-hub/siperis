import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// Dev: proxy /api ke backend Express (jalankan `npm run server` / deploy.bat di port 4173)
export default defineConfig({ plugins: [react()], server: { proxy: { '/api': 'http://127.0.0.1:4173' } } })
