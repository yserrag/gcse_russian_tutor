// Custom React Hook for Web Speech API (Text-to-Speech)
// Handles Russian voice selection and dynamic rate control

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseSpeechOptions {
  rate: number;
  pitch?: number;
  lang?: string;
}

interface UseSpeechReturn {
  speak: (text: string) => void;
  stop: () => void;
  speaking: boolean;
  hasVoice: boolean;
  voices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
}

export function useSpeech(options: UseSpeechOptions): UseSpeechReturn {
  const { rate = 1.0, pitch = 1.0, lang = 'ru-RU' } = options;
  
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load and filter Russian voices
  useEffect(() => {
    function loadVoices() {
      const allVoices = window.speechSynthesis.getVoices();
      
      // Filter for Russian voices
      const russianVoices = allVoices.filter(voice => 
        voice.lang.startsWith('ru')
      );

      setVoices(russianVoices);

      if (russianVoices.length > 0) {
        // Voice selection heuristic based on quality markers
        // Priority: Google > Microsoft > Yandex > other
        const preferredVoice = 
          russianVoices.find(v => v.name.toLowerCase().includes('google')) ||
          russianVoices.find(v => v.name.toLowerCase().includes('microsoft')) ||
          russianVoices.find(v => v.name.toLowerCase().includes('yandex')) ||
          russianVoices.find(v => v.name.toLowerCase().includes('irina')) ||
          russianVoices.find(v => v.name.toLowerCase().includes('pavel')) ||
          russianVoices.find(v => v.name.toLowerCase().includes('milena')) ||
          russianVoices.find(v => v.name.toLowerCase().includes('yuri')) ||
          russianVoices[0]; // Fallback to first Russian voice

        setSelectedVoice(preferredVoice);
        
        // Debug logging
        console.log('🗣️ Russian voices available:', russianVoices.length);
        console.log('🎯 Selected voice:', preferredVoice?.name);
      } else {
        console.warn('⚠️ No Russian voices found. Speech synthesis may not work correctly.');
      }
    }

    // Initial load
    loadVoices();

    // Some browsers load voices asynchronously
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Speak function with dynamic rate control
  const speak = useCallback((text: string) => {
    if (!selectedVoice) {
      console.warn('⚠️ No Russian voice selected. Cannot speak.');
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Create new utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = selectedVoice;
    utterance.lang = lang;
    utterance.rate = rate; // Dynamic speed control (0.75 for beginners → 1.1 for advanced)
    utterance.pitch = pitch;

    // Event handlers
    utterance.onstart = () => {
      setSpeaking(true);
      console.log('🔊 Speaking:', text.substring(0, 50) + '...');
    };

    utterance.onend = () => {
      setSpeaking(false);
      console.log('✅ Speech complete');
    };

    utterance.onerror = (event) => {
      setSpeaking(false);
      console.error('❌ Speech error:', event.error);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [selectedVoice, lang, rate, pitch]);

  // Stop function
  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  return {
    speak,
    stop,
    speaking,
    hasVoice: !!selectedVoice,
    voices,
    selectedVoice,
  };
}
