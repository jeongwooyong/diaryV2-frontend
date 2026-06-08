import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'; // 👈 방금 만든 파일을 여기서 불러옵니다!

import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
