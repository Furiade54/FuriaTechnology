import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/space-grotesk/300.css';
import '@fontsource/space-grotesk/400.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/600.css';
import '@fontsource/space-grotesk/700.css';
import 'material-symbols/outlined.css';
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
