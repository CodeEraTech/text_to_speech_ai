import React, { useState, useRef } from 'react';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;

const funPhrases = [
  // English
  "Why did the JavaScript developer wear glasses? Because they couldn't C#.",
  "I'm not lazy, I'm just on energy-saving mode!",
  "Reacting to life, one component at a time.",
  "If at first you don't succeed, call it version 1.0.",
  "Debugging: Being the detective in a crime movie where you are also the murderer.",
  "I told my computer I needed a break, and it said 'No problem, I'll go to sleep.'",
  "Keep calm and code on!",
  "Why do programmers prefer dark mode? Because light attracts bugs!",
  "404: Joke not found.",
  "To be or not to be, that is the semicolon.",
  // Hindi
  "नमस्ते! यह एक हिंदी वाक्य है।",
  "क्या आप मुझे सुन सकते हैं?",
  "आज मौसम बहुत सुहाना है।",
  "कोडिंग में मज़ा आ रहा है!",
  "आपका दिन शुभ हो!",
  "कृपया यहाँ अपना संदेश दर्ज करें।",
  "हँसते रहो, मुस्कुराते रहो!",
  "यह एक सरप्राइज हिंदी वाक्य है!",
  "कंप्यूटर भी कभी-कभी थक जाता है।",
  "आप बहुत अच्छे हैं!",
];

// Curated ElevenLabs voices (add more as needed)
const voices = [
  { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Monika (Multilingual, English, Hindi)' },
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam (Natural, English)' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Rachel (Multilingual, English, Hindi)' },
  { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Domi (Expressive, English, French)' },
  { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Bella (Warm, English, Spanish)' },
  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni (Deep, English, German)' },
  { id: 'VR6AewLTigWG4xSOukaG', name: 'Elli (Soft, English, Italian)' },
  { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'Default (Multilingual)' },
];

async function streamToArrayBuffer(stream: ReadableStream<Uint8Array>): Promise<ArrayBuffer> {
  const reader = stream.getReader();
  const chunks = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const length = chunks.reduce((acc, curr) => acc + curr.length, 0);
  const result = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result.buffer;
}

const PREVIEW_TEXT = "This is a sample of the selected voice.";
const RECENT_PHRASES_LIMIT = 5;

const TextSpeechScreen: React.FC = () => {
  const [text, setText] = useState('');
  const [voiceId, setVoiceId] = useState(voices[0].id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recentPhrases, setRecentPhrases] = useState<string[]>([]);
  const utteranceRef = useRef<HTMLAudioElement | null>(null);

  const handleConvert = async () => {
    if (!apiKey) {
      setError('Missing ElevenLabs API key. Please set VITE_ELEVENLABS_API_KEY in your .env file.');
      return;
    }
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const elevenlabs = new ElevenLabsClient({ apiKey });
      const audioStream = await elevenlabs.textToSpeech.convert(voiceId, {
        text,
        modelId: 'eleven_multilingual_v2',
        outputFormat: 'mp3_44100_128',
      });
      const arrayBuffer = await streamToArrayBuffer(audioStream);
      const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      // Play audio
      if (utteranceRef.current) {
        utteranceRef.current.pause();
        utteranceRef.current.currentTime = 0;
      }
      const audio = new Audio(url);
      utteranceRef.current = audio;
      setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
      audio.play();
      // Add to recent phrases
      setRecentPhrases(prev => {
        const newList = [text, ...prev.filter(p => p !== text)].slice(0, RECENT_PHRASES_LIMIT);
        return newList;
      });
    } catch (err: any) {
      setError(err.message || 'Error converting text to speech');
      setIsPlaying(false);
    } finally {
      setLoading(false);
    }
  };

  const handleStop = () => {
    if (utteranceRef.current) {
      utteranceRef.current.pause();
      utteranceRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  };

  const handleRandomVoice = () => {
    const idx = Math.floor(Math.random() * voices.length);
    setVoiceId(voices[idx].id);
  };

  const handleSurpriseMe = () => {
    const idx = Math.floor(Math.random() * funPhrases.length);
    setText(funPhrases[idx]);
  };

  const handleClear = () => {
    setText('');
  };

  const handlePreviewVoice = async () => {
    if (!apiKey) {
      setError('Missing ElevenLabs API key. Please set VITE_ELEVENLABS_API_KEY in your .env file.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const elevenlabs = new ElevenLabsClient({ apiKey });
      const audioStream = await elevenlabs.textToSpeech.convert(voiceId, {
        text: PREVIEW_TEXT,
        modelId: 'eleven_multilingual_v2',
        outputFormat: 'mp3_44100_128',
      });
      const arrayBuffer = await streamToArrayBuffer(audioStream);
      const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      if (utteranceRef.current) {
        utteranceRef.current.pause();
        utteranceRef.current.currentTime = 0;
      }
      const audio = new Audio(url);
      utteranceRef.current = audio;
      setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
      audio.play();
    } catch (err: any) {
      setError(err.message || 'Error playing preview');
      setIsPlaying(false);
    } finally {
      setLoading(false);
    }
  };

  // --- Modern, soft, elegant styles ---
  const outerStyle: React.CSSProperties = {
    minHeight: '100vh',
    minWidth: '100vw',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(120deg, #e0e7ef 0%, #f7faff 100%)',
    overflow: 'auto',
    padding: 0,
  };
  const cardStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: 420,
    padding: '22px 8px 16px 8px',
    background: 'rgba(255,255,255,0.97)',
    borderRadius: 18,
    boxShadow: '0 6px 24px 0 rgba(80,120,180,0.10), 0 0 0 2px #e0e7ef',
    border: '1.5px solid #e0e0e0',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    alignItems: 'center',
    position: 'relative',
  };
  const headerStyle: React.CSSProperties = {
    fontSize: 24,
    fontWeight: 800,
    letterSpacing: 1.1,
    textAlign: 'center',
    color: '#3b3b3b',
    marginBottom: 0,
    marginTop: 0,
  };
  const subtitleStyle: React.CSSProperties = {
    textAlign: 'center',
    color: '#5a5a7a',
    fontSize: 13,
    marginBottom: 6,
    marginTop: 2,
    fontWeight: 500,
    letterSpacing: 0.1,
    opacity: 0.85,
  };
  const selectorCol: React.CSSProperties = {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 2,
    marginBottom: 2,
  };
  const labelStyle: React.CSSProperties = {
    fontWeight: 600,
    color: '#2d2d3a',
    fontSize: 13,
    letterSpacing: 0.2,
    minWidth: 54,
    marginBottom: 1,
  };
  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '7px 8px',
    borderRadius: 7,
    border: '1.5px solid #bdbdbd',
    fontSize: 13,
    background: '#f7faff',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxShadow: '0 1px 4px 0 #a259c611',
  };
  const textareaStyle: React.CSSProperties = {
    width: '100%',
    minHeight: 70,
    borderRadius: 10,
    border: '1.5px solid #bdbdbd',
    padding: 10,
    fontSize: 13,
    resize: 'vertical',
    marginBottom: 4,
    background: '#f7faff',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxShadow: '0 1px 8px 0 #a259c611',
  };
  const charCountStyle: React.CSSProperties = {
    width: '100%',
    textAlign: 'right',
    color: '#888',
    fontSize: 11,
    marginBottom: 1,
    marginTop: -2,
    letterSpacing: 0.1,
  };
  const funRowStyle: React.CSSProperties = {
    display: 'flex',
    width: '100%',
    gap: 6,
    marginBottom: 1,
    justifyContent: 'space-between',
  };
  const funButtonStyle: React.CSSProperties = {
    flex: 1,
    padding: '6px 0',
    borderRadius: 6,
    border: 'none',
    background: 'linear-gradient(90deg, #38c6d9 0%, #a259c6 100%)',
    color: '#fff',
    fontWeight: 700,
    fontSize: 12,
    cursor: 'pointer',
    boxShadow: '0 1px 4px 0 #a259c633',
    transition: 'background 0.2s, box-shadow 0.2s, opacity 0.2s',
    opacity: 0.95,
  };
  const buttonStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 0',
    borderRadius: 10,
    border: 'none',
    background: 'linear-gradient(90deg, #4f8cff 0%, #38c6d9 100%)',
    color: '#fff',
    fontWeight: 800,
    fontSize: 15,
    cursor: loading ? 'not-allowed' : 'pointer',
    boxShadow: '0 4px 16px 0 #4f8cff22',
    marginTop: 4,
    transition: 'background 0.2s, box-shadow 0.2s, opacity 0.2s',
    opacity: loading ? 0.7 : 1,
    letterSpacing: 0.5,
  };
  const errorStyle: React.CSSProperties = {
    color: '#e53935',
    background: '#fff3f3',
    borderRadius: 7,
    padding: '7px 10px',
    marginTop: 4,
    fontWeight: 600,
    textAlign: 'center',
    fontSize: 12,
    boxShadow: '0 1px 4px 0 #e5393522',
  };
  const actionRowStyle: React.CSSProperties = {
    display: 'flex',
    width: '100%',
    gap: 7,
    marginTop: 0,
    justifyContent: 'center',
  };
  const smallButtonStyle: React.CSSProperties = {
    flex: 1,
    padding: '6px 0',
    borderRadius: 7,
    border: 'none',
    background: 'linear-gradient(90deg, #a259c6 0%, #38c6d9 100%)',
    color: '#fff',
    fontWeight: 700,
    fontSize: 12,
    cursor: 'pointer',
    boxShadow: '0 2px 8px 0 #a259c633',
    transition: 'background 0.2s, box-shadow 0.2s, opacity 0.2s',
    opacity: 0.7,
  };
  const emojiStyle: React.CSSProperties = {
    fontSize: 28,
    margin: '0 auto 4px auto',
    opacity: isPlaying ? 1 : 0,
    transition: 'opacity 0.3s',
    filter: 'drop-shadow(0 2px 8px #a259c655)',
    pointerEvents: 'none',
    userSelect: 'none',
    textAlign: 'center',
    width: '100%',
  };
  const recentPhraseStyle: React.CSSProperties = {
    width: '100%',
    marginTop: 6,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  };
  const recentPhraseBtn: React.CSSProperties = {
    background: '#f7faff',
    border: '1px solid #bdbdbd',
    borderRadius: 6,
    padding: '4px 7px',
    fontSize: 12,
    color: '#333',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background 0.2s, border 0.2s',
  };

  return (
    <div style={outerStyle}>
      <div style={cardStyle}>
        <div style={headerStyle}>Text to Speech</div>
        <div style={subtitleStyle}>Convert your text to speech in multiple languages and voices (powered by ElevenLabs).</div>
        <div style={selectorCol}>
          <span style={labelStyle}>Voice:</span>
          <select
            value={voiceId}
            onChange={e => setVoiceId(e.target.value)}
            style={selectStyle}
          >
            {voices.map(v => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
          <button style={{ ...funButtonStyle, marginTop: 5, width: '100%' }} onClick={handlePreviewVoice} type="button">Preview Voice</button>
        </div>
        <div style={funRowStyle}>
          <button style={funButtonStyle} onClick={handleRandomVoice} type="button">Random Voice</button>
          <button style={funButtonStyle} onClick={handleSurpriseMe} type="button">Surprise Me</button>
          <button style={funButtonStyle} onClick={handleClear} type="button">Clear</button>
        </div>
        <textarea
          rows={5}
          style={textareaStyle}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Enter text to convert to speech..."
        />
        <div style={charCountStyle}>{text.length} characters</div>
        <div style={emojiStyle}>{isPlaying ? '🎉🎤🦄' : ''}</div>
        <button
          onClick={handleConvert}
          disabled={loading || !text.trim()}
          style={buttonStyle}
        >
          {isPlaying ? 'Pause' : 'Convert & Play'}
        </button>
        <div style={actionRowStyle}>
          <button
            style={smallButtonStyle}
            onClick={handleStop}
            disabled={!isPlaying}
            type="button"
          >
            Stop
          </button>
        </div>
        {recentPhrases.length > 0 && (
          <div style={recentPhraseStyle}>
            <div style={{ color: '#666', fontSize: 12, marginBottom: 2 }}>Recent Phrases:</div>
            {recentPhrases.map((phrase, idx) => (
              <button
                key={idx}
                style={recentPhraseBtn}
                onClick={() => setText(phrase)}
                type="button"
              >
                {phrase}
              </button>
            ))}
          </div>
        )}
        {error && <div style={errorStyle}>{error}</div>}
      </div>
    </div>
  );
};

export default TextSpeechScreen; 