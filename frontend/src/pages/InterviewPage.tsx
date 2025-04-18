import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, User, Bot, XCircle, Award, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';
import { interviewService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  type: 'interviewer' | 'user';
  content: string;
  timestamp: Date;
  score?: number;
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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Mock resume data for demo purposes
  const mockResumeData = {
    name: 'Alex Johnson',
    skills: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'Express', 'MongoDB'],
    experience: [
      {
        title: 'Senior Frontend Developer',
        company: 'TechCorp Inc.',
        duration: '2022 - Present'
      },
      {
        title: 'Web Developer',
        company: 'Digital Solutions',
        duration: '2019 - 2022'
      }
    ],
    projects: [
      'E-commerce Platform',
      'Content Management System',
      'Real-time Chat Application'
    ]
  };

  // Mock initial interview message
  const mockInterviewStart = {
    type: 'interviewer' as const,
    content: `Hi ${currentUser?.displayName || 'there'}! I'm your interview practice partner today. I see you have experience with React and JavaScript. Let's start with something simple - can you tell me a bit about yourself and your background in web development?`,
    timestamp: new Date()
  };

  // Initialize interview
  useEffect(() => {
    const initializeInterview = async () => {
      try {
        setLoading(true);
        
        // In a real app, fetch the interview from the backend or start a new one
        // For demo purposes, we'll create a mock interview
        if (interviewId === 'new') {
          // Create a new interview
          setTimeout(() => {
            setInterview({
              id: 'new-interview-id',
              status: 'in_progress',
              resumeData: mockResumeData,
              conversationHistory: [mockInterviewStart],
              currentScore: null,
              lowScoreStreak: 0
            });
            setLoading(false);
          }, 1500);
        } else {
          // Mock fetching an existing interview
          setTimeout(() => {
            setInterview({
              id: interviewId || 'existing-interview-id',
              status: 'in_progress',
              resumeData: mockResumeData,
              conversationHistory: [
                mockInterviewStart,
                {
                  type: 'user',
                  content: 'I have 5 years of experience in web development, focusing mainly on frontend technologies like React and Angular. I\'ve worked on various projects ranging from e-commerce platforms to real-time applications.',
                  timestamp: new Date(Date.now() - 1000 * 60 * 5)
                },
                {
                  type: 'interviewer',
                  content: 'That sounds like great experience! Could you tell me about a challenging project you worked on and how you overcame the technical difficulties?',
                  timestamp: new Date(Date.now() - 1000 * 60 * 4)
                }
              ],
              currentScore: 7,
              lowScoreStreak: 0
            });
            setLoading(false);
          }, 1500);
        }
      } catch (error) {
        console.error('Error initializing interview:', error);
        setError('Failed to load the interview. Please try again.');
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
    
    // In a real app, we would send this to the backend
    // For demo purposes, we'll simulate an API call with a timeout
    try {
      setTimeout(() => {
        const botResponse: Message = {
          type: 'interviewer',
          content: generateMockResponse(userInput),
          timestamp: new Date(),
          score: Math.floor(Math.random() * 4) + 7 // Random score between 7-10
        };
        
        setInterview(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            conversationHistory: [...prev.conversationHistory, botResponse],
            currentScore: botResponse.score || prev.currentScore
          };
        });
        
        setIsTyping(false);
        setSendingResponse(false);
      }, 2000 + Math.random() * 2000); // Random delay between 2-4 seconds
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send your message. Please try again.');
      setSendingResponse(false);
      setIsTyping(false);
    }
  };

  const generateMockResponse = (userInput: string): string => {
    // Very simple mock response generation
    const responses = [
      "That's a great point! Could you elaborate on how you've applied these skills in your past projects?",
      "I see you have experience with React. Can you tell me about a challenging React component you've built and how you approached it?",
      "Interesting approach. How would you handle a situation where the requirements change midway through the project?",
      "That's a good answer. Let's dive deeper into your experience with team collaboration. How do you handle disagreements within your team?",
      "I appreciate your thoroughness. When it comes to performance optimization, what strategies have you implemented in your previous work?",
      "That makes sense. Now, let's talk about your approach to learning new technologies. How do you stay updated with the rapidly evolving tech landscape?"
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
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
    <div className="bg-neutral-50 min-h-[calc(100vh-4rem)]">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-neutral-200 px-4 py-3 sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="mr-3 text-neutral-600 hover:text-neutral-800"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-lg font-semibold text-neutral-800">Interview Practice</h1>
            </div>
            
            {interview.status === 'in_progress' && (
              <button
                onClick={handleEndInterview}
                className="text-sm text-neutral-600 hover:text-neutral-800 flex items-center"
              >
                <XCircle className="h-4 w-4 mr-1" />
                End Interview
              </button>
            )}
          </div>
        </div>
        
        {/* Messages container */}
        <div className="h-[calc(100vh-14rem)] overflow-y-auto p-4 space-y-6">
          {interview.conversationHistory.map((message, index) => (
            <div key={index} className={`flex ${message.type === 'interviewer' ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[80%] ${message.type === 'interviewer' ? 'bg-white' : 'bg-primary-600 text-white'} rounded-2xl p-4 shadow-sm`}>
                <div className="flex items-center mb-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${message.type === 'interviewer' ? 'bg-neutral-100' : 'bg-primary-500'}`}>
                    {message.type === 'interviewer' ? (
                      <Bot className="h-4 w-4 text-neutral-700" />
                    ) : (
                      <User className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${message.type === 'interviewer' ? 'text-neutral-800' : 'text-white'}`}>
                      {message.type === 'interviewer' ? 'Interviewer' : 'You'}
                    </p>
                    <p className={`text-xs ${message.type === 'interviewer' ? 'text-neutral-400' : 'text-primary-100'}`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                  {message.type === 'user' && message.score && (
                    <div className="ml-auto flex items-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        message.score >= 8 ? 'bg-green-100 text-green-800' : 
                        message.score >= 6 ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {message.score}/10
                      </span>
                    </div>
                  )}
                </div>
                <div className={`text-sm whitespace-pre-wrap ${message.type === 'interviewer' ? 'text-neutral-700' : 'text-white'}`}>
                  {message.content}
                </div>
              </div>
            </div>
          ))}
          
          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl p-4 shadow-sm max-w-[80%]">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-neutral-100 rounded-full flex items-center justify-center mr-2">
                    <Bot className="h-4 w-4 text-neutral-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-800">Interviewer</p>
                    <p className="text-xs text-neutral-400">Typing...</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-neutral-300 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-neutral-300 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-2 h-2 bg-neutral-300 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input */}
        {interview.status === 'in_progress' ? (
          <div className="bg-white border-t border-neutral-200 p-4 sticky bottom-0">
            <div className="flex items-end">
              <div className="flex-grow relative">
                <textarea
                  ref={textareaRef}
                  value={userInput}
                  onChange={e => setUserInput(e.target.value)}
                  onKeyDown={handleTextareaKeyDown}
                  placeholder="Type your response..."
                  className="w-full border border-neutral-300 rounded-lg py-3 px-4 pr-12 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none max-h-32"
                  rows={1}
                  disabled={sendingResponse}
                ></textarea>
                <button
                  onClick={handleSendMessage}
                  disabled={!userInput.trim() || sendingResponse}
                  className={`absolute right-3 bottom-3 text-white p-1.5 rounded-full ${
                    userInput.trim() && !sendingResponse ? 'bg-primary-600 hover:bg-primary-700' : 'bg-neutral-300 cursor-not-allowed'
                  }`}
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border-t border-neutral-200 p-6 text-center">
            <div className="max-w-md mx-auto">
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-800 mb-2">Interview Completed</h3>
              <p className="text-neutral-600 mb-6">
                You've completed this practice interview session. Review the conversation and feedback to improve your skills.
              </p>
              <div className="flex space-x-4 justify-center">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="bg-neutral-800 text-white py-2 px-6 rounded-md font-medium hover:bg-neutral-900"
                >
                  Back to Dashboard
                </button>
                <button
                  onClick={() => navigate('/resume-upload')}
                  className="bg-primary-600 text-white py-2 px-6 rounded-md font-medium hover:bg-primary-700"
                >
                  Start New Interview
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewPage;