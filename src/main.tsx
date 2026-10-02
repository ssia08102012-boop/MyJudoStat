import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import '@/styles/global.css'
import App from './App'
import ErrorBoundary from '@/components/UI/ErrorBoundary'
import { t } from '@/services/i18n'

let updatePromptVisible = false

// The app checks for a new service worker on launch and once per hour. When a
// deploy is available, the user gets one prominent, safe-to-dismiss update action.
const updateSW = registerSW({
  onNeedRefresh() {
    if (updatePromptVisible) return
    updatePromptVisible = true
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
    const message = document.createElement('span')
    message.textContent = t('updateAvailable')
    message.style.cssText = 'color:#e2dbd0;font-size:12px;font-family:Cinzel,serif;letter-spacing:.08em'
    const button = document.createElement('button')
    button.textContent = t('updateApp')
    button.style.cssText = 'background:#e8720a;border:none;border-radius:8px;color:#fff;padding:8px 13px;font-size:12px;cursor:pointer;font-family:Cinzel,serif;letter-spacing:.05em'
    toast.append(message, button)
    document.body.appendChild(toast)
    button.onclick = () => void updateSW(true)
  },
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return
    void registration.update()
    window.setInterval(() => void registration.update(), 60 * 60 * 1000)
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
