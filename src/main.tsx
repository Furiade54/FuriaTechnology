import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { DatabaseProvider } from './context/DatabaseContext'
import { StoreSettingsProvider } from './context/StoreSettingsContext'
import { NotificationProvider } from './context/NotificationContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DatabaseProvider>
      <StoreSettingsProvider>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </StoreSettingsProvider>
    </DatabaseProvider>
  </StrictMode>,
)
