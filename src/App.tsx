// Main Application Component
// Russian GCSE Tutor - Pearson Edexcel Aligned - IMPROVED VERSION

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Settings, Volume2, VolumeX, MessageCircle } from 'lucide-react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import Chat from './components/Chat';
import { useSpeech } from './hooks/useSpeech';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  feedback?: string | null;
  transliteration?: string | null;
  topic?: string | null;
}

type Level = 'beginner' | 'foundation' | 'higher';

function App() {
  // State management
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [level, setLevel] = useState<Level>('beginner');
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  
  const wasListeningRef = useRef(false);

  // Speech rate mapping based on level
  const speechRates: Record<Level, number> = {
    beginner: 0.75,
    foundation: 0.90,
    higher: 1.10,
  };

  // Text-to-Speech hook
  const { speak, stop, speaking, hasVoice, selectedVoice } = useSpeech({
    rate: speechRates[level],
    pitch: 1.0,
    lang: 'ru-RU',
  });

  // Speech-to-Text (Speech Recognition)
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  // Check for browser support
  useEffect(() => {
    if (!browserSupportsSpeechRecognition) {
      setError('Your browser does not support speech recognition. Please use Chrome or Edge.');
    }
  }, [browserSupportsSpeechRecognition]);

  // Update input field when transcript changes
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  // AUTO-SEND after speech recognition stops
  useEffect(() => {
    // Track if we were listening
    if (listening) {
      wasListeningRef.current = true;
    }
    
    // If we were listening and now stopped, and there's a transcript
    if (wasListeningRef.current && !listening && transcript.trim()) {
      // Auto-send after a short delay to ensure transcript is complete
      const timer = setTimeout(() => {
        if (transcript.trim()) {
          sendMessage();
          wasListeningRef.current = false;
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [listening, transcript]);

  // Send welcome message when first starting
  const startConversation = async () => {
    setHasStarted(true);
    setLoading(true);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [],
          userLevel: level,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      const welcomeMessage: Message = {
        role: 'assistant',
        content: data.russian || 'Привет!',
        feedback: data.english_feedback || null,
        transliteration: data.transliteration || null,
        topic: data.topic_alignment || null,
      };

      setMessages([welcomeMessage]);

      // Auto-play the welcome message
      if (data.russian && hasVoice) {
        setTimeout(() => speak(data.russian), 300);
      }

    } catch (err) {
      console.error('Error starting conversation:', err);
      setError(err instanceof Error ? err.message : 'Failed to start conversation');
    } finally {
      setLoading(false);
    }
  };

  // Handle microphone button
  const toggleListening = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      resetTranscript();
      setInput('');
      SpeechRecognition.startListening({ 
        language: 'ru-RU',
        continuous: false 
      });
    }
  };

  // Send message to AI tutor
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    resetTranscript();
    setLoading(true);
    setError(null);

    try {
      // Call Cloudflare Function (API proxy)
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: input.trim() },
          ],
          userLevel: level,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.russian || data.content || 'Извините, я не понял.',
        feedback: data.english_feedback || null,
        transliteration: data.transliteration || null,
        topic: data.topic_alignment || null,
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Auto-play the Russian response
      if (data.russian && hasVoice) {
        setTimeout(() => speak(data.russian), 300);
      }

    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key in input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Level descriptions for UI
  const levelDescriptions: Record<Level, string> = {
    beginner: 'Year 8-9: Basic grammar, present tense only, simple vocabulary',
    foundation: 'Grades 1-5: Past/future tenses, more complex sentences',
    higher: 'Grades 4-9: Advanced grammar, complex topics, debate & analysis',
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              🇷🇺 Russian GCSE Tutor
            </h1>
            <p className="text-sm text-gray-500">
              Pearson Edexcel Specification · Latymer School
            </p>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Settings"
          >
            <Settings className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="border-t border-gray-200 bg-gray-50 px-4 py-4">
            <div className="max-w-7xl mx-auto space-y-4">
              {/* Level Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📚 Learning Level
                </label>
                <div className="flex flex-col gap-2">
                  {(['beginner', 'foundation', 'higher'] as Level[]).map(lvl => (
                    <button
                      key={lvl}
                      onClick={() => setLevel(lvl)}
                      className={`px-4 py-3 rounded-lg font-medium transition-colors text-left ${
                        level === lvl
                          ? 'bg-blue-500 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="font-bold capitalize">{lvl}</div>
                      <div className="text-sm opacity-90">{levelDescriptions[lvl]}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Voice Info */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {hasVoice ? (
                  <>
                    <Volume2 className="w-4 h-4 text-green-500" />
                    <span>
                      Voice: <strong>{selectedVoice?.name}</strong> (Speed: {speechRates[level]}x)
                    </span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-4 h-4 text-red-500" />
                    <span>No Russian voice available</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2">
          <p className="text-sm text-red-600 max-w-7xl mx-auto">
            ⚠️ {error}
          </p>
        </div>
      )}

      {/* Chat Area or Welcome Screen */}
      {!hasStarted ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md text-center">
            <MessageCircle className="w-20 h-20 mx-auto mb-6 text-blue-500" />
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Привет! 👋
            </h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Welcome to your Russian GCSE Tutor! I'll help you practice conversation 
              in Russian with corrections and guidance tailored to your level.
            </p>
            <p className="text-sm text-gray-500 mb-8">
              Current level: <strong className="capitalize">{level}</strong> - {levelDescriptions[level]}
            </p>
            <button
              onClick={startConversation}
              disabled={loading}
              className="px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg 
                       transition-colors shadow-lg hover:shadow-xl disabled:bg-gray-300 
                       disabled:cursor-not-allowed text-lg"
            >
              {loading ? 'Starting...' : 'Start Conversation'}
            </button>
            <p className="text-xs text-gray-400 mt-4">
              💡 Tip: Use the microphone to practice speaking!
            </p>
          </div>
        </div>
      ) : (
        <Chat
          messages={messages}
          onSpeak={speak}
          speaking={speaking}
        />
      )}

      {/* Input Area - Only show after starting */}
      {hasStarted && (
        <div className="bg-white border-t border-gray-200 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex gap-2 items-end">
              {/* Microphone Button (Push-to-Talk) */}
              <button
                onClick={toggleListening}
                disabled={!browserSupportsSpeechRecognition || loading}
                className={`p-3 rounded-full transition-all ${
                  listening
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                    : 'bg-blue-500 hover:bg-blue-600'
                } text-white disabled:bg-gray-300 disabled:cursor-not-allowed`}
                title={listening ? 'Click to stop recording (will auto-send)' : 'Click to start speaking'}
              >
                {listening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>

              {/* Text Input */}
              <div className="flex-1">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type in Russian or click the microphone to speak..."
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={2}
                  disabled={loading || listening}
                />
                {listening && (
                  <p className="text-xs text-red-500 mt-1 animate-pulse font-medium">
                    🎤 Listening... (will auto-send when you stop speaking)
                  </p>
                )}
              </div>

              {/* Send Button */}
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim() || listening}
                className="p-3 rounded-full bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                title="Send Message"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-6 h-6" />
                )}
              </button>
            </div>

            {/* Helpful Tips */}
            <div className="mt-2 text-xs text-gray-500 flex gap-4">
              <span>💡 Press Enter to send manually</span>
              <span>🎤 Speech auto-sends when you finish speaking</span>
              <span>📊 Click "Play Audio" to hear pronunciations</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
