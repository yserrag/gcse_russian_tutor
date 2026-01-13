// Chat Interface Component
// Displays conversation history and handles user interactions

import React, { useRef, useEffect } from 'react';
import { Volume2, User, Bot } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  feedback?: string | null;
  transliteration?: string | null;
  topic?: string | null;
}

interface ChatProps {
  messages: Message[];
  onSpeak: (text: string) => void;
  speaking: boolean;
}

export default function Chat({ messages, onSpeak, speaking }: ChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-400">
          <div className="text-center">
            <Bot className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">Привет! 👋</p>
            <p className="text-sm mt-2">Start practicing Russian by typing or speaking below</p>
          </div>
        </div>
      ) : (
        messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {/* Message header with icon */}
              <div className="flex items-center gap-2 mb-1">
                {message.role === 'user' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
                <span className="text-xs font-semibold opacity-75">
                  {message.role === 'user' ? 'You' : 'Tutor'}
                </span>
              </div>

              {/* Main message content */}
              <div className="space-y-2">
                <p className="text-base leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>

                {/* Transliteration for beginners */}
                {message.transliteration && (
                  <div className="text-xs opacity-70 italic border-t border-current pt-2 mt-2">
                    <span className="font-semibold">Pronunciation:</span> {message.transliteration}
                  </div>
                )}

                {/* English feedback (corrections) */}
                {message.feedback && (
                  <div className="mt-3 p-2 bg-yellow-50 border-l-4 border-yellow-400 rounded text-sm text-gray-700">
                    <span className="font-semibold">📝 Note:</span> {message.feedback}
                  </div>
                )}

                {/* Topic alignment badge */}
                {message.topic && (
                  <div className="mt-2">
                    <span className="inline-block text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                      📚 {message.topic}
                    </span>
                  </div>
                )}

                {/* Play audio button for assistant messages */}
                {message.role === 'assistant' && (
                  <button
                    onClick={() => onSpeak(message.content)}
                    disabled={speaking}
                    className={`mt-2 flex items-center gap-1 text-xs px-3 py-1 rounded-full transition-colors ${
                      speaking
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    <Volume2 className="w-3 h-3" />
                    {speaking ? 'Speaking...' : 'Play Audio'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
