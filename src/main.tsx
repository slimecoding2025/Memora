import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

const saved = localStorage.getItem('theme')
const dark = window.matchMedia('(prefers-color-scheme: dark)').matches
document.documentElement.dataset.theme = saved ?? (dark ? 'dark' : 'light')

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
