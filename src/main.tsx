import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// ── PWA Service Worker + In-App Update ───────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      console.log('✅ SW registered:', registration.scope)

      // Naya update check karo har 30 second mein
      setInterval(() => {
        registration.update()
      }, 30 * 1000)

      // Service Worker se message suno
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'UPDATE_AVAILABLE') {
          showUpdateBanner()
        }
      })

      // Agar new SW waiting hai toh banner dikhao
      if (registration.waiting) {
        showUpdateBanner()
      }

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              showUpdateBanner()
            }
          })
        }
      })

    } catch (err) {
      console.log('SW registration failed:', err)
    }
  })
}

// ── Update Banner Function ────────────────────────────────
function showUpdateBanner() {
  // Agar banner already hai toh dobara mat dikhao
  if (document.getElementById('update-banner')) return

  const banner = document.createElement('div')
  banner.id = 'update-banner'
  banner.innerHTML = `
    <div style="
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #0A1628, #0F2241);
      color: white;
      padding: 14px 20px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      gap: 14px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1);
      z-index: 99999;
      font-family: 'DM Sans', sans-serif;
      font-size: 14px;
      max-width: 340px;
      width: 90%;
      animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    ">
      <span style="font-size: 22px;">🔄</span>
      <div style="flex: 1;">
        <div style="font-weight: 600; margin-bottom: 2px;">New Update Available!</div>
        <div style="font-size: 12px; color: rgba(255,255,255,0.6);">Tap update for latest features</div>
      </div>
      <button onclick="window.location.reload()" style="
        background: linear-gradient(135deg, #0d9488, #14B8A6);
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 8px;
        font-family: 'DM Sans', sans-serif;
        font-weight: 600;
        font-size: 13px;
        cursor: pointer;
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(13,148,136,0.4);
      ">Update</button>
      <button onclick="this.parentElement.parentElement.remove()" style="
        background: rgba(255,255,255,0.1);
        color: rgba(255,255,255,0.6);
        border: none;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">✕</button>
    </div>
    <style>
      @keyframes slideUp {
        from { opacity: 0; transform: translateX(-50%) translateY(20px); }
        to   { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
    </style>
  `
  document.body.appendChild(banner)
}
