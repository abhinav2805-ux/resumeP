import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Briefcase, Award, Send, MessageSquare, ArrowLeft } from 'lucide-react';
import './index.css'

interface ParsedResume {
  skills: {
    skills?: string[];
  };
  experience: {
    title: string;
    company: string;
    duration: string;
    achievements: string[];
  }[];
  projects: {
    title: string;
    description: string;
    link: string;
  }[];
}

interface InterviewMessage {
  type: 'interviewer' | 'candidate';
  content: string;
  feedback?: string;
  score?: number;
}

interface LocationState {
  initialMessage?: string;
  interviewStatus?: 'not_started' | 'in_progress' | 'completed';
}

function InterviewPage() {
  const { interviewId } = useParams<{ interviewId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;
  
  const [parsedData, setParsedData] = useState<ParsedResume | null>(null);
  const [interviewStatus, setInterviewStatus] = useState<'not_started' | 'in_progress' | 'completed'>(
    state?.interviewStatus || 'in_progress'
  );
  const [interviewMessages, setInterviewMessages] = useState<InterviewMessage[]>([]);
  const [userResponse, setUserResponse] = useState('');
  const [interviewLoading, setInterviewLoading] = useState(false);
  const [interviewScore, setInterviewScore] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load resume data from localStorage on component mount
  useEffect(() => {
    try {
      const savedResumeData = localStorage.getItem('resumeData');
      if (savedResumeData) {
        setParsedData(JSON.parse(savedResumeData));
      } else {
        setError('Resume data not found. Please return to the home page.');
      }
      
      // Initialize with the first interviewer message if provided
      if (state?.initialMessage) {
        setInterviewMessages([
          {
            type: 'interviewer',
            content: state.initialMessage
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading resume data:', error);
      setError('Error loading resume data. Please return to the home page.');
    }
  }, [state]);

  const sendResponse = async () => {
    if (!parsedData || !interviewId || !userResponse.trim()) return;
    
    setInterviewLoading(true);
    
    // Add user's message to the conversation
    const updatedMessages = [
      ...interviewMessages,
      {
        type: 'candidate',
        content: userResponse
      }
    ];
    setInterviewMessages(updatedMessages);
    setUserResponse('');
    
    try {
      const response = await fetch('http://localhost:5000/continue-interview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeData: parsedData,
          interviewId: interviewId,
          userResponse: userResponse,
          conversationHistory: interviewMessages
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to continue interview');
      }

      setInterviewStatus(data.interviewStatus);
      
      // Add interviewer's response with feedback
      setInterviewMessages([
        ...updatedMessages,
        {
          type: 'interviewer',
          content: data.message,
          feedback: data.feedback,
          score: data.score
        }
      ]);
      
      // Update total score if provided
      if (data.score) {
        // If we already have a score, average them
        if (interviewScore !== null) {
          setInterviewScore((interviewScore + data.score) / 2);
        } else {
          setInterviewScore(data.score);
        }
      }
      
    } catch (error) {
      console.error('Error in interview response:', error);
      setError(error instanceof Error ? error.message : 'Failed to get interview response. Please try again.');
    } finally {
      setInterviewLoading(false);
    }
  };

  const resetInterview = () => {
    // Clear the interview state and navigate back to home page
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="mb-8">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center text-gray-700 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            Back to Home
          </button>
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Virtual Interview</h1>
          <p className="text-gray-600">Answer the interviewer's questions to practice your interview skills</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md"
            >
              Return to Home
            </button>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-12">
          <div className="border-b border-gray-200 p-4 flex justify-between items-center">
            <div className="flex items-center">
              <Briefcase className="w-5 h-5 text-green-500 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Interview Session</h2>
            </div>
            
            {interviewScore !== null && (
              <div className="flex items-center bg-blue-50 px-3 py-1 rounded-full">
                <Award className="w-4 h-4 text-blue-500 mr-1" />
                <span className="text-sm font-medium text-blue-700">Score: {interviewScore.toFixed(1)}/10</span>
              </div>
            )}
          </div>
          
          <div className="p-4 max-h-96 overflow-y-auto">
            <div className="space-y-4">
              {interviewMessages.map((message, index) => (
                <div 
                  key={index} 
                  className={`flex ${message.type === 'interviewer' ? 'justify-start' : 'justify-end'}`}
                >
                  <div 
                    className={`max-w-3/4 rounded-lg p-4 ${
                      message.type === 'interviewer' 
                        ? 'bg-gray-100 text-gray-800' 
                        : 'bg-blue-600 text-white'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    
                    {message.feedback && message.type === 'interviewer' && index > 0 && (
                      <div className="mt-2 p-2 bg-white bg-opacity-20 rounded">
                        <p className="text-xs font-semibold">Feedback:</p>
                        <p className="text-xs">{message.feedback}</p>
                      </div>
                    )}
                    
                    {message.score !== undefined && message.type === 'interviewer' && index > 0 && (
                      <div className="mt-2 flex items-center">
                        <Award className={`w-4 h-4 ${message.type === 'interviewer' ? 'text-blue-500' : 'text-white'} mr-1`} />
                        <span className="text-xs font-medium">Score: {message.score}/10</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {interviewLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-800 rounded-lg p-4">
                    <p>Thinking...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {interviewStatus === 'in_progress' ? (
            <div className="border-t border-gray-200 p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={userResponse}
                  onChange={(e) => setUserResponse(e.target.value)}
                  disabled={interviewLoading}
                  placeholder="Type your response here..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !interviewLoading) {
                      sendResponse();
                    }
                  }}
                />
                <button
                  onClick={sendResponse}
                  disabled={interviewLoading || !userResponse.trim()}
                  className={`px-4 py-2 rounded-md text-white ${
                    interviewLoading || !userResponse.trim()
                      ? 'bg-gray-400'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : interviewStatus === 'completed' && (
            <div className="border-t border-gray-200 p-4 bg-green-50">
              <div className="text-center">
                <h3 className="text-lg font-medium text-green-800">Interview Completed</h3>
                <p className="text-green-700">Your final score: {interviewScore?.toFixed(1) || 'N/A'}/10</p>
                <div className="mt-4 flex justify-center space-x-4">
                  <button
                    onClick={resetInterview}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md"
                  >
                    Return Home
                  </button>
                  <button
                    onClick={() => navigate('/')} 
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
                  >
                    New Interview
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default InterviewPage;