import { createRoot } from 'react-dom/client'
import '@fontsource-variable/figtree'
import '@fontsource-variable/red-hat-display'
import './styles.css'
import './styles-match.css'
import './styles-account.css'
import { App } from './App'

createRoot(document.getElementById('root')!).render(<App />)
