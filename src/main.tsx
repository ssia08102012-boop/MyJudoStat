import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import '@/styles/global.css'
import App from './App'
import ErrorBoundary from '@/components/UI/ErrorBoundary'

// Show update banner when a new SW version is waiting — user decides when to reload
const updateSW = registerSW({
  onNeedRefresh() {
    const toast = document.createElement('div')
    toast.id = 'pwa-update-toast'
    toast.style.cssText = [
      'position:fixed', 'bottom:72px', 'left:50%', 'transform:translateX(-50%)',
      'background:#0b0f14', 'border:1px solid rgba(232,114,10,.6)',
      'border-radius:12px', 'padding:10px 14px',
      'display:flex', 'align-items:center', 'gap:12px',
      'z-index:9999', 'box-shadow:0 4px 24px rgba(0,0,0,.6)',
      'white-space:nowrap',
    ].join(';')
    toast.innerHTML = `
      <span style="color:#e2dbd0;font-size:12px;font-family:Cinzel,serif;letter-spacing:.08em">
        Нова версія доступна
      </span>
      <button id="pwa-update-btn" style="
        background:#e8720a;border:none;border-radius:8px;
        color:#fff;padding:5px 13px;font-size:12px;
        cursor:pointer;font-family:Cinzel,serif;letter-spacing:.05em
      ">Оновити</button>
    `
    document.body.appendChild(toast)
    document.getElementById('pwa-update-btn')!.onclick = () => void updateSW(true)
  },
})

const root = document.getElementById('root')!
createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
