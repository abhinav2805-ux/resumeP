import React, { useState } from 'react';
import { Upload, FileText, Briefcase, Code, FolderGit2, AlertCircle, Info, MessageSquare, Award, Send } from 'lucide-react';

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

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedResume | null>(null);
  
  // Interview states
  const [interviewActive, setInterviewActive] = useState(false);
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [interviewStatus, setInterviewStatus] = useState<'not_started' | 'in_progress' | 'completed'>('not_started');
  const [interviewMessages, setInterviewMessages] = useState<InterviewMessage[]>([]);
  const [userResponse, setUserResponse] = useState('');
  const [interviewLoading, setInterviewLoading] = useState(false);
  const [interviewScore, setInterviewScore] = useState<number | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setDebug(null);
    setParsedData(null);
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);
    setDebug(null);
    setParsedData(null);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const response = await fetch('http://localhost:5000/parse-resume', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to parse resume');
      }

      // Check for missing keys
      const keys = Object.keys(data);
      if (!data.skills || !data.experience || !data.projects) {
        setDebug(`Missing expected fields in API response. Received keys: ${JSON.stringify(keys)}`);
      }

      // Update state with defaults for safety
      setParsedData({
        skills: {
          skills: Array.isArray(data.skills) ? data.skills : [],
        },
        experience: Array.isArray(data.experience)
          ? data.experience.map((exp: any) => ({
              ...exp,
              achievements: exp.description ? [exp.description] : []
            }))
          : [],
        projects: Array.isArray(data.projects)
          ? data.projects.map((proj: any) => ({
              ...proj,
              link: proj.link || ""
            }))
          : []
      });
      
    } catch (error) {
      console.error('Error parsing resume:', error);
      setError(error instanceof Error ? error.message : 'Failed to parse resume. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startInterview = async () => {
    if (!parsedData) return;
    
    setInterviewLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:5000/start-interview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeData: parsedData
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start interview');
      }

      setInterviewId(data.interviewId);
      setInterviewStatus(data.interviewStatus);
      setInterviewActive(true);
      
      // Add the first message from the interviewer
      setInterviewMessages([
        {
          type: 'interviewer',
          content: data.message,
          feedback: data.feedback,
          score: data.score
        }
      ]);
      
    } catch (error) {
      console.error('Error starting interview:', error);
      setError(error instanceof Error ? error.message : 'Failed to start interview. Please try again.');
    } finally {
      setInterviewLoading(false);
    }
  };

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
    setInterviewActive(false);
    setInterviewId(null);
    setInterviewStatus('not_started');
    setInterviewMessages([]);
    setUserResponse('');
    setInterviewScore(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">AI Interview Simulator</h1>
          <p className="text-lg text-gray-600">Upload your resume and practice with an AI interviewer</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {debug && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
            <Info className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-blue-700 text-sm">{debug}</p>
          </div>
        )}

        {!interviewActive && (
          <form onSubmit={handleSubmit} className="mb-12">
            <div className="max-w-xl mx-auto">
              <label className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50 transition-colors ${error ? 'border-red-300' : file ? 'border-green-500' : 'border-gray-300'}`}>
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className={`w-12 h-12 mb-4 ${error ? 'text-red-500' : file ? 'text-green-500' : 'text-gray-400'}`} />
                  <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                  <p className="text-xs text-gray-500">PDF or DOCX (MAX. 10MB)</p>
                </div>
                <input type="file" className="hidden" accept=".pdf,.docx" onChange={handleFileChange} />
              </label>

              {file && !error && (
                <div className="mt-4 flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 text-gray-500 mr-2" />
                    <span className="text-sm text-gray-700">{file.name}</span>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`px-4 py-2 rounded-md text-white text-sm font-medium ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} transition-colors`}
                  >
                    {loading ? 'Processing...' : 'Parse Resume'}
                  </button>
                </div>
              )}
            </div>
          </form>
        )}

        {parsedData && !interviewActive && (
          <div className="mb-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center mb-4">
                  <Code className="w-5 h-5 text-blue-500 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-900">Skills</h2>
                </div>
                {Object.entries(parsedData.skills).length > 0 ? (
                  Object.entries(parsedData.skills).map(([category, list]) => (
                    <div key={category} className="mb-3">
                      <h4 className="text-sm font-semibold text-gray-700 mb-1 capitalize">{category}</h4>
                      <div className="flex flex-wrap gap-2">
                        {list?.map((skill, i) => (
                          <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No skills detected</p>
                )}
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center mb-4">
                  <Briefcase className="w-5 h-5 text-green-500 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-900">Experience</h2>
                </div>
                {parsedData.experience.length > 0 ? (
                  <div className="space-y-4">
                    {parsedData.experience.map((exp, index) => (
                      <div key={index} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                        <h3 className="font-medium text-gray-900">{exp.title}</h3>
                        <p className="text-sm text-gray-600">{exp.company} • {exp.duration}</p>
                        <ul className="list-disc list-inside text-sm text-gray-700 mt-2">
                          {exp.achievements.map((point, i) => (
                            <li key={i}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No experience detected</p>
                )}
              </div>

              <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center mb-4">
                  <FolderGit2 className="w-5 h-5 text-purple-500 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-900">Projects</h2>
                </div>
                {parsedData.projects.length > 0 ? (
                  <div className="grid gap-4">
                    {parsedData.projects.map((project, index) => (
                      <div key={index} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                        <h3 className="font-medium text-gray-900">{project.title}</h3>
                        <p className="mt-1 text-sm text-gray-700">{project.description}</p>
                        {project.link && (
                          <a href={project.link} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-800">
                            View Project →
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No projects detected</p>
                )}
              </div>
            </div>
            
            <div className="flex justify-center">
              <button
                onClick={startInterview}
                disabled={interviewLoading}
                className={`flex items-center px-6 py-3 rounded-lg text-white text-lg font-medium ${interviewLoading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} transition-colors`}
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                {interviewLoading ? 'Starting...' : 'Start Virtual Interview'}
              </button>
            </div>
          </div>
        )}

        {interviewActive && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-12">
            <div className="border-b border-gray-200 p-4 flex justify-between items-center">
              <div className="flex items-center">
                <Briefcase className="w-5 h-5 text-green-500 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Virtual Interview</h2>
              </div>
              
              {interviewScore !== null && (
                <div className="flex items-center bg-blue-50 px-3 py-1 rounded-full">
                  <Award className="w-4 h-4 text-blue-500 mr-1" />
                  <span className="text-sm font-medium text-blue-700">Score: {interviewScore.toFixed(1)}/10</span>
                </div>
              )}
              
              {interviewStatus === 'completed' && (
                <button 
                  onClick={resetInterview}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-sm text-gray-700"
                >
                  Restart Interview
                </button>
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
                  <button
                    onClick={resetInterview}
                    className="mt-3 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
                  >
                    Start New Interview
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;