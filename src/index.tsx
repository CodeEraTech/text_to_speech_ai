import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import  TextSpeechTextSpeechScreen from './TextSpeechScreen'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TextSpeechTextSpeechScreen />
  </StrictMode>,
)
