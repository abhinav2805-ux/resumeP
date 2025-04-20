import  { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Briefcase, Code, FolderGit2, AlertCircle, Info, MessageSquare } from 'lucide-react';

const ResumeUploadPage = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [interviewLoading, setInterviewLoading] = useState(false);

  const handleFileChange = (e: { target: { files: any[]; }; }) => {
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

  const handleSubmit = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    if (!file) {return;}

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
        name: data.name || '',
        skills: {
          skills: Array.isArray(data.skills) ? data.skills : [],
        },
        experience: Array.isArray(data.experience)
          ? data.experience.map((exp) => ({
              ...exp,
              achievements: exp.description ? [exp.description] : []
            }))
          : [],
        projects: Array.isArray(data.projects)
          ? data.projects.map((proj) => ({
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
    if (!parsedData) {
      console.error('No parsedData available');
      return;
    }
  
    setInterviewLoading(true);
    setError(null);
  
    try {
      console.log('Starting interview with data:', parsedData); // Debug log
      
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
      console.log('API Response:', data); // Debug log
      
      if (!response.ok) {
        const errorMsg = data.error || 'Failed to start interview';
        console.error('API Error:', errorMsg); // Debug log
        throw new Error(errorMsg);
      }
  
      if (!data.interviewId) {
        throw new Error('Missing interviewId in response');
      }
  
      // Store parsed resume data
      localStorage.setItem('resumeData', JSON.stringify(parsedData));
      console.log('Stored resumeData in localStorage'); // Debug log
      
      // Prepare navigation state
      const navigationState = {
        initialMessage: data.message,
        interviewStatus: data.interviewStatus,
        interviewId: data.interviewId // Include interviewId in state as backup
      };
      
      console.log('Navigating to:', `/interview/${data.interviewId}`); // Debug log
      console.log('With state:', navigationState); // Debug log
      
      // Navigate to interview page
      navigate(`/interview/${data.interviewId}`, { 
        state: navigationState
      });
  
    } catch (error) {
      console.error('Error in startInterview:', error);
      setError(error instanceof Error ? error.message : 'Failed to start interview. Please try again.');
    } finally {
      setInterviewLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="max-w-6xl mx-auto py-12 px-4">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-4">
            AI Interview Simulator
          </h1>
          <p className="text-lg text-gray-400">Upload your resume and begin your virtual interview experience</p>
        </div>

        {/* Error and Debug Messages */}
        {error && (
          <div className="mb-6 bg-red-900/50 border border-red-500/50 rounded-lg p-4 flex items-start backdrop-blur-sm">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {debug && (
          <div className="mb-6 bg-blue-900/50 border border-blue-500/50 rounded-lg p-4 flex items-start backdrop-blur-sm">
            <Info className="w-5 h-5 text-blue-400 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-blue-400 text-sm">{debug}</p>
          </div>
        )}

        {/* Upload Form */}
        <form onSubmit={handleSubmit} className="mb-12">
          <div className="max-w-xl mx-auto">
            <label className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-800/50 hover:bg-gray-800 transition-colors backdrop-blur-sm ${
              error ? 'border-red-500' : file ? 'border-green-500' : 'border-gray-600'
            }`}>
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className={`w-12 h-12 mb-4 ${
                  error ? 'text-red-500' : file ? 'text-green-500' : 'text-gray-400'
                }`} />
                <p className="mb-2 text-sm text-gray-300">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-400">PDF or DOCX (MAX. 10MB)</p>
              </div>
              <input type="file" className="hidden" accept=".pdf,.docx" onChange={handleFileChange} />
            </label>

            {file && !error && (
              <div className="mt-4 flex items-center justify-between bg-gray-800/50 p-4 rounded-lg border border-gray-700 backdrop-blur-sm">
                <div className="flex items-center">
                  <FileText className="w-5 h-5 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-300">{file.name}</span>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-4 py-2 rounded-md text-white text-sm font-medium ${
                    loading ? 'bg-gray-700' : 'bg-blue-600 hover:bg-blue-700'
                  } transition-colors`}
                >
                  {loading ? 'Processing...' : 'Parse Resume'}
                </button>
              </div>
            )}
          </div>
        </form>

        {/* Parsed Data Display */}
        {parsedData && (
          <div className="mb-12 space-y-8">
            {parsedData.name && (
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Welcome, {parsedData.name}
                </h2>
                <div className="h-1 w-32 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto mt-4 rounded-full"></div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Skills Section */}
              <div className="bg-gray-800/50 p-8 rounded-2xl border border-gray-700/50 backdrop-blur-sm hover:transform hover:scale-[1.02] transition-all">
                <div className="flex items-center mb-6">
                  <Code className="w-6 h-6 text-cyan-400 mr-3" />
                  <h2 className="text-2xl font-bold text-gray-100">Technical Arsenal</h2>
                </div>
                <div className="space-y-4">
                  {Object.entries(parsedData.skills).map(([category, list]) => (
                    <div key={category} className="space-y-2">
                      <h4 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider">{category}</h4>
                      <div className="flex flex-wrap gap-2">
                        {list?.map((skill, i) => (
                          <span key={i} className="px-3 py-1 bg-cyan-900/30 text-cyan-300 rounded-full text-sm border border-cyan-800/50">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Experience Section */}
              <div className="bg-gray-800/50 p-8 rounded-2xl border border-gray-700/50 backdrop-blur-sm hover:transform hover:scale-[1.02] transition-all">
                <div className="flex items-center mb-6">
                  <Briefcase className="w-6 h-6 text-purple-400 mr-3" />
                  <h2 className="text-2xl font-bold text-gray-100">Mission Log</h2>
                </div>
                <div className="space-y-6">
                  {parsedData.experience.map((exp, index) => (
                    <div key={index} className="border-b border-gray-700/50 pb-4 last:border-0 last:pb-0">
                      <h3 className="text-lg font-semibold text-purple-300">{exp.title}</h3>
                      <p className="text-sm text-gray-400 mt-1">{exp.company} • {exp.duration}</p>
                      <ul className="mt-3 space-y-2">
                        {exp.achievements.map((point, i) => (
                          <li key={i} className="text-sm text-gray-300 flex items-start">
                            <span className="text-purple-400 mr-2">▹</span>
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Projects Section */}
              <div className="md:col-span-2 bg-gray-800/50 p-8 rounded-2xl border border-gray-700/50 backdrop-blur-sm hover:transform hover:scale-[1.02] transition-all">
                <div className="flex items-center mb-6">
                  <FolderGit2 className="w-6 h-6 text-pink-400 mr-3" />
                  <h2 className="text-2xl font-bold text-gray-100">Project Database</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  {parsedData.projects.map((project, index) => (
                    <div key={index} className="bg-gray-900/50 p-6 rounded-xl border border-gray-700/50">
                      <h3 className="text-lg font-semibold text-pink-300">{project.title}</h3>
                      <p className="mt-2 text-sm text-gray-300">{project.description}</p>
                      {project.link && (
                        <a
                          href={project.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 inline-flex items-center text-sm text-pink-400 hover:text-pink-300 transition-colors"
                        >
                          View Project <span className="ml-1">→</span>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Start Interview Button */}
            <div className="flex justify-center mt-12">
              <button
                onClick={startInterview}
                disabled={interviewLoading}
                className={`flex items-center px-8 py-4 rounded-xl text-white text-lg font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 ${
                  interviewLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <MessageSquare className="w-6 h-6 mr-3" />
                {interviewLoading ? 'Initializing...' : 'Launch Virtual Interview'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeUploadPage;