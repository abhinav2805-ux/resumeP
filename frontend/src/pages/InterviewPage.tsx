/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, User, Bot, XCircle, Award, ArrowLeft, CheckCircle, AlertTriangle, Mic, Volume2, VolumeX } from 'lucide-react';
import { interviewService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  type: 'interviewer' | 'user';
  content: string;
  timestamp: Date;
  score?: number;
  isPlaying?: boolean; // Add this
}

interface InterviewState {
  id: string;
  status: 'in_progress' | 'completed';
  resumeData: any;
  conversationHistory: Message[];
  currentScore: number | null;
  lowScoreStreak: number;
}

const InterviewPage = () => {
  const { interviewId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sendingResponse, setSendingResponse] = useState(false);
  const [interview, setInterview] = useState<InterviewState | null>(null);
  const [error, setError] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported] = useState('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize interview
  useEffect(() => {
    const initializeInterview = async () => {
      try {
        setLoading(true);
        
        if (!interviewId) {
          throw new Error('No interview ID provided');
        }

        // Get interview data from localStorage
        const resumeData = JSON.parse(localStorage.getItem('resumeData') || '{}');
        const storedState = JSON.parse(localStorage.getItem(`interview_${interviewId}`) || '{}');

        // If we have stored conversation history, use it
        if (storedState.conversationHistory?.length > 0) {
          setInterview({
            id: interviewId,
            status: 'in_progress',
            resumeData: resumeData,
            conversationHistory: storedState.conversationHistory.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            })),
            currentScore: storedState.currentScore || null,
            lowScoreStreak: storedState.lowScoreStreak || 0
          });
        } else {
          // Start new interview
          const response = await fetch('http://localhost:5000/start-interview', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ resumeData }),
          });

          if (!response.ok) {
            throw new Error('Failed to start interview');
          }

          const data = await response.json();

          const newInterview = {
            id: interviewId,
            status: 'in_progress',
            resumeData: resumeData,
            conversationHistory: [{
              type: 'interviewer' as const,
              content: data.message,
              timestamp: new Date(),
              score: null
            }],
            currentScore: null,
            lowScoreStreak: 0
          };

          setInterview(newInterview);
          localStorage.setItem(`interview_${interviewId}`, JSON.stringify(newInterview));
        }

      } catch (error) {
        console.error('Error initializing interview:', error);
        setError('Failed to load the interview. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    initializeInterview();
  }, [interviewId, currentUser]);

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [interview?.conversationHistory]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [userInput]);

  useEffect(() => {
    // Initialize speech synthesis
    synthRef.current = window.speechSynthesis;
    
    // Initialize speech recognition
    if (speechSupported) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map(result => result.transcript)
          .join('');
        
        setUserInput(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [speechSupported]);

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() || !interview || sendingResponse) return;
    
    const userMessage: Message = {
      type: 'user',
      content: userInput.trim(),
      timestamp: new Date()
    };
    
    // Update state with user message
    setInterview(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        conversationHistory: [...prev.conversationHistory, userMessage]
      };
    });
    
    setUserInput('');
    setSendingResponse(true);
    setIsTyping(true);
    
    try {
      const response = await fetch('http://localhost:5000/continue-interview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interviewId: interviewId,
          userResponse: userInput,
          resumeData: JSON.parse(localStorage.getItem('resumeData') || '{}'),
          conversationHistory: interview.conversationHistory
        }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to get response from interviewer');
      }
  
      const data = await response.json();
      
      const botResponse: Message = {
        type: 'interviewer',
        content: data.message,
        timestamp: new Date(),
        score: data.score || interview.currentScore
      };
      
      setInterview(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          conversationHistory: [...prev.conversationHistory, botResponse],
          currentScore: botResponse.score || prev.currentScore
        };
      });
      
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send your message. Please try again.');
    } finally {
      setIsTyping(false);
      setSendingResponse(false);
    }
  };

  const handleEndInterview = () => {
    // In a real app, we would update the interview status in the backend
    if (!interview) {return;}
    
    setInterview({
      ...interview,
      status: 'completed'
    });
    
    // Add a final message
    const finalMessage: Message = {
      type: 'interviewer',
      content: "Thank you for participating in this practice interview. You've done a great job! I hope the feedback was helpful for your preparation. Feel free to review our conversation and practice again anytime.",
      timestamp: new Date()
    };
    
    setInterview(prev => {
      if (!prev) {return prev;}
      return {
        ...prev,
        conversationHistory: [...prev.conversationHistory, finalMessage],
        status: 'completed'
      };
    });
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };

  const toggleSpeech = (message: Message) => {
    if (synthRef.current) {
      if (synthRef.current.speaking) {
        synthRef.current.cancel();
        setInterview(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            conversationHistory: prev.conversationHistory.map(msg => ({
              ...msg,
              isPlaying: false
            }))
          };
        });
        return;
      }

      const utterance = new SpeechSynthesisUtterance(message.content);
      utteranceRef.current = utterance;
      
      utterance.onend = () => {
        setInterview(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            conversationHistory: prev.conversationHistory.map(msg => ({
              ...msg,
              isPlaying: false
            }))
          };
        });
      };

      setInterview(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          conversationHistory: prev.conversationHistory.map(msg => ({
            ...msg,
            isPlaying: msg === message
          }))
        };
      });

      synthRef.current.speak(utterance);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) return;
  
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setUserInput('');
      recognitionRef.current.start();
  
      // Add this handler for detecting silence
      let silenceTimeout: NodeJS.Timeout;
      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map(result => result.transcript)
          .join('');
        
        setUserInput(transcript);
        
        // Reset silence detection timer
        clearTimeout(silenceTimeout);
        silenceTimeout = setTimeout(() => {
          if (isListening) {
            recognitionRef.current.stop();
          }
        }, 2000); // Stop after 2 seconds of silence
      };
    }
    setIsListening(!isListening);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-12 h-12 border-4 border-primary-300 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-neutral-800 mb-4">Something went wrong</h2>
        <p className="text-neutral-600 mb-6">{error}</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-primary-600 text-white py-2 px-6 rounded-md font-medium hover:bg-primary-700"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  if (!interview){ return null;}

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="max-w-6xl mx-auto py-12 px-4">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-4">
            Virtual Interview Session
          </h1>
          <div className="flex items-center justify-center gap-4 text-gray-400">
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${
                interview?.status === 'completed' ? 'bg-green-500' : 'bg-blue-500 animate-pulse'
              }`} />
              <span>Session {interviewId?.slice(0, 8)}</span>
            </div>
            {interview?.currentScore && (
              <div className="flex items-center">
                <span className="text-cyan-400 font-semibold">{interview.currentScore}</span>
                <span className="ml-1">pts</span>
              </div>
            )}
          </div>
        </div>

        {/* Chat Interface */}
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 backdrop-blur-sm overflow-hidden">
          {/* Messages Container */}
          <div className="h-[60vh] overflow-y-auto p-6 space-y-6">
            {interview?.conversationHistory.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
            <div className="max-w-[80%] ${
              message.type === 'user'
                ? 'bg-blue-600/40 border-blue-500/50'
                : 'bg-gray-700/40 border-gray-600/50'
            } rounded-2xl px-6 py-4 border backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      message.type === 'user' ? 'bg-blue-400' : 'bg-purple-400'
                    }`}
                  />
                  <span className="text-sm text-gray-400">
                    {message.type === 'user' ? 'You' : 'AI Interviewer'} • {formatTime(message.timestamp)}
                  </span>
                </div>
                {message.type === 'interviewer' && (
                  <button
                    onClick={() => toggleSpeech(message)}
                    className="text-gray-400 hover:text-gray-200 transition-colors"
                  >
                    {message.isPlaying ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
              <p className="text-gray-100 whitespace-pre-wrap">{message.content}</p>
              {message.score && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-cyan-400">Score: {message.score}</span>
                </div>
              )}
            </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-700/40 border-gray-600/50 rounded-2xl px-6 py-4 border backdrop-blur-sm">
                  <div className="flex gap-2">
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-100"></span>
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-200"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          {/* Input Area */}
          <div className="p-4 border-t border-gray-700/50">
            <div className="flex gap-4">
              <div className="flex-grow relative">
                <textarea
                  ref={textareaRef}
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={handleTextareaKeyDown}
                  placeholder="Type your response..."
                  className="w-full bg-gray-900/50 border border-gray-700/50 rounded-xl p-4 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors resize-none min-h-[60px]"
                  disabled={sendingResponse || interview?.status === 'completed' || isListening}
                />
                {speechSupported && (
                  <button
                    onClick={toggleListening}
                    disabled={sendingResponse || interview?.status === 'completed'}
                    className={`absolute right-4 top-4 p-2 rounded-full transition-colors ${
                      isListening 
                        ? 'bg-red-500/20 text-red-400' 
                        : 'hover:bg-gray-700/50 text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <Mic className={`w-4 h-4 ${isListening ? 'animate-pulse' : ''}`} />
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSendMessage}
                  disabled={!userInput.trim() || sendingResponse || interview?.status === 'completed'}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send
                </button>
                <button
                  onClick={handleEndInterview}
                  disabled={interview?.status === 'completed'}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  End Test
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewPage;