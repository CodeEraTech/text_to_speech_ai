import React, { useState, useRef } from 'react';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;

// Expanded multilingual voices (IDs are examples, update as needed)
const voices = [
  { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'Default (Multilingual)' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Rachel (Multilingual, English, Hindi)' },
  { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Domi (Multilingual, Hindi, English, French)' },
  { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Bella (Multilingual, Hindi, English, Spanish)' },
  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni (Multilingual, Hindi, English, German)' },
  { id: 'VR6AewLTigWG4xSOukaG', name: 'Elli (Multilingual, Hindi, English, Italian)' },
  // Add more as needed from your ElevenLabs dashboard
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

const TextSpeechScreen: React.FC = () => {
  const [text, setText] = useState('');
  const [voiceId, setVoiceId] = useState(voices[0].id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleConvert = async () => {
    if (!apiKey) {
      setError('Missing ElevenLabs API key. Please set VITE_ELEVENLABS_API_KEY in your .env file.');
      return;
    }
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
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.play();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || 'Error converting text to speech');
    } finally {
      setLoading(false);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  // Fullscreen, centered layout
  const outerStyle: React.CSSProperties = {
    minHeight: '100vh',
    minWidth: '100vw',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(120deg, #4f8cff 0%, #38c6d9 50%, #a259c6 100%)',
    backgroundSize: '200% 200%',
    animation: 'bgMove 12s ease-in-out infinite alternate',
    overflow: 'auto',
  };
  const cardStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: 480,
    padding: 40,
    background: 'rgba(255,255,255,0.18)',
    borderRadius: 24,
    boxShadow: '0 8px 40px 0 rgba(80,80,180,0.18), 0 0 0 2px #fff3',
    border: '1.5px solid #e0e0e0',
    backdropFilter: 'blur(16px)',
    display: 'flex',
    flexDirection: 'column',
    gap: 22,
    alignItems: 'center',
    position: 'relative',
  };
  const headerStyle: React.CSSProperties = {
    fontSize: 34,
    fontWeight: 800,
    letterSpacing: 1.5,
    textAlign: 'center',
    background: 'linear-gradient(90deg, #4f8cff 0%, #38c6d9 50%, #a259c6 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    filter: 'drop-shadow(0 2px 8px #4f8cff44)',
    marginBottom: 0,
    marginTop: 0,
  };
  const labelStyle: React.CSSProperties = {
    fontWeight: 600,
    color: '#333',
    fontSize: 17,
    marginBottom: 2,
    letterSpacing: 0.2,
  };
  const selectStyle: React.CSSProperties = {
    padding: '10px 16px',
    borderRadius: 10,
    border: '1.5px solid #bdbdbd',
    fontSize: 16,
    background: 'rgba(255,255,255,0.7)',
    marginLeft: 10,
    outline: 'none',
    transition: 'border-color 0.2s',
    boxShadow: '0 1px 4px 0 #4f8cff11',
  };
  const textareaStyle: React.CSSProperties = {
    width: '100%',
    minHeight: 110,
    borderRadius: 14,
    border: '1.5px solid #bdbdbd',
    padding: 18,
    fontSize: 17,
    resize: 'vertical',
    marginBottom: 8,
    background: 'rgba(255,255,255,0.85)',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxShadow: '0 1px 8px 0 #4f8cff11',
  };
  const buttonStyle: React.CSSProperties = {
    width: '100%',
    padding: '15px 0',
    borderRadius: 14,
    border: 'none',
    background: 'linear-gradient(90deg, #4f8cff 0%, #38c6d9 50%, #a259c6 100%)',
    color: '#fff',
    fontWeight: 800,
    fontSize: 20,
    cursor: loading ? 'not-allowed' : 'pointer',
    boxShadow: '0 4px 16px 0 #4f8cff33',
    marginTop: 8,
    transition: 'background 0.2s, box-shadow 0.2s, opacity 0.2s',
    opacity: loading ? 0.7 : 1,
    letterSpacing: 0.5,
  };
  const errorStyle: React.CSSProperties = {
    color: '#e53935',
    background: '#fff3f3',
    borderRadius: 10,
    padding: '10px 16px',
    marginTop: 8,
    fontWeight: 600,
    textAlign: 'center',
    fontSize: 16,
    boxShadow: '0 1px 4px 0 #e5393522',
  };
  const actionRowStyle: React.CSSProperties = {
    display: 'flex',
    width: '100%',
    gap: 16,
    marginTop: 0,
    justifyContent: 'center',
  };
  const smallButtonStyle: React.CSSProperties = {
    flex: 1,
    padding: '10px 0',
    borderRadius: 10,
    border: 'none',
    background: 'linear-gradient(90deg, #a259c6 0%, #38c6d9 100%)',
    color: '#fff',
    fontWeight: 700,
    fontSize: 16,
    cursor: 'pointer',
    boxShadow: '0 2px 8px 0 #a259c633',
    transition: 'background 0.2s, box-shadow 0.2s, opacity 0.2s',
    opacity: audioUrl ? 1 : 0.7,
  };

  return (
    <div style={outerStyle}>
      <div style={cardStyle}>
        <div style={headerStyle}>Text to Speech</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', justifyContent: 'center' }}>
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
        </div>
        <textarea
          rows={5}
          style={textareaStyle}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Enter text to convert to speech..."
        />
        <button
          onClick={handleConvert}
          disabled={loading || !text.trim()}
          style={buttonStyle}
        >
          {loading ? 'Converting...' : 'Convert & Play'}
        </button>
        <div style={actionRowStyle}>
          <button
            style={smallButtonStyle}
            onClick={handleStop}
            disabled={!audioUrl}
            type="button"
          >
            Stop
          </button>
          <a
            href={audioUrl || '#'}
            download="speech.mp3"
            style={{ ...smallButtonStyle, textAlign: 'center', textDecoration: 'none', display: 'inline-block', lineHeight: '38px', pointerEvents: audioUrl ? 'auto' : 'none' }}
            aria-disabled={!audioUrl}
            tabIndex={audioUrl ? 0 : -1}
          >
            Download
          </a>
        </div>
        {error && <div style={errorStyle}>{error}</div>}
      </div>
    </div>
  );
};

export default TextSpeechScreen; 