import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, AlertCircle, FileText, Check, X } from 'lucide-react';
import { resumeService } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const ResumeUploadPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [resumeData, setResumeData] = useState<any>(null);
  const [processingStep, setProcessingStep] = useState<'idle' | 'uploading' | 'parsing' | 'complete' | 'error'>('idle');
  
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    validateAndSetFile(droppedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    setUploadError('');
    
    // Check file type
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Please upload a PDF or DOCX file.');
      return;
    }
    
    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size should be less than 5MB.');
      return;
    }
    
    setFile(file);
  };

  const handleUpload = async () => {
    if (!file){ return;}
    
    try {
      setIsUploading(true);
      setProcessingStep('uploading');
      setUploadError('');
      
      // Upload the file
      setTimeout(() => {
        setProcessingStep('parsing');
      }, 1500);
      
      const data = await resumeService.uploadResume(file);
      setResumeData(data);
      setProcessingStep('complete');
    } catch (error: any) {
      console.error('Error uploading resume:', error);
      setUploadError(error.response?.data?.error || 'Failed to upload resume. Please try again.');
      setProcessingStep('error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleStartInterview = () => {
    // In a real app, we would store the resume data and navigate to the interview page
    // For demo purposes, we'll just navigate to a mock interview
    navigate('/interview/new');
  };

  const resetUpload = () => {
    setFile(null);
    setResumeData(null);
    setProcessingStep('idle');
    setUploadError('');
  };

  const renderProgressSteps = () => {
    const steps = [
      { id: 'uploading', label: 'Uploading Resume' },
      { id: 'parsing', label: 'Parsing Content' },
      { id: 'complete', label: 'Analysis Complete' },
    ];
    
    return (
      <div className="space-y-4 my-6">
        {steps.map((step, index) => {
          const isActive = processingStep === step.id;
          const isComplete = 
            (processingStep === 'parsing' && index === 0) || 
            (processingStep === 'complete' && (index === 0 || index === 1));
          
          return (
            <div key={step.id} className="flex items-center">
              <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                isActive ? 'bg-primary-500' : 
                isComplete ? 'bg-green-500' : 
                'bg-neutral-200'
              }`}>
                {isComplete ? (
                  <Check className="h-5 w-5 text-white" />
                ) : isActive ? (
                  <div className="h-2 w-2 bg-white rounded-full animate-pulse" />
                ) : (
                  <span className="text-xs text-white">{index + 1}</span>
                )}
              </div>
              <div className="ml-4">
                <p className={`text-sm font-medium ${
                  isActive ? 'text-primary-600' : 
                  isComplete ? 'text-green-600' : 
                  'text-neutral-500'
                }`}>
                  {step.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderResumeData = () => {
    if (!resumeData) {return null;}

    return (
      <div className="mt-8 bg-white border border-green-200 rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-neutral-800 flex items-center">
            <Check className="h-5 w-5 text-green-500 mr-2" />
            Resume Parsed Successfully
          </h3>
          <button 
            onClick={resetUpload}
            className="text-neutral-500 hover:text-neutral-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-neutral-500 mb-1">Name</h4>
            <p className="text-neutral-800">{resumeData.name || 'Not detected'}</p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-neutral-500 mb-1">Skills</h4>
            <div className="flex flex-wrap gap-2">
              {resumeData.skills && resumeData.skills.length > 0 ? (
                resumeData.skills.map((skill: string, index: number) => (
                  <span 
                    key={index}
                    className="bg-primary-50 text-primary-700 text-xs px-2 py-1 rounded-full"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <p className="text-neutral-600">No skills detected</p>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-neutral-500 mb-1">Experience</h4>
            {resumeData.experience && resumeData.experience.length > 0 ? (
              <ul className="list-disc list-inside text-neutral-700 space-y-1">
                {resumeData.experience.map((exp: any, index: number) => (
                  <li key={index}>
                    {exp.title} {exp.company ? `at ${exp.company}` : ''}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-neutral-600">No experience detected</p>
            )}
          </div>
        </div>
        
        <div className="mt-8">
          <button
            onClick={handleStartInterview}
            className="w-full bg-primary-600 text-white py-3 px-4 rounded-md font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-button"
          >
            Start Interview Practice
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-neutral-800 mb-2">Upload Your Resume</h1>
        <p className="text-neutral-600">
          Upload your resume to start practicing interviews tailored to your experience
        </p>
      </div>
      
      {resumeData ? (
        renderResumeData()
      ) : (
        <div className="bg-white rounded-xl shadow-card p-8">
          {processingStep === 'idle' ? (
            <>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center ${
                  isDragging ? 'border-primary-500 bg-primary-50' : 'border-neutral-300 hover:border-primary-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="mx-auto flex justify-center mb-4">
                  <Upload className={`h-10 w-10 ${isDragging ? 'text-primary-500' : 'text-neutral-400'}`} />
                </div>
                <p className="text-neutral-800 font-medium mb-2">
                  {isDragging ? 'Drop your file here' : 'Drag and drop your resume here'}
                </p>
                <p className="text-neutral-500 text-sm mb-4">
                  Supports PDF, DOCX files up to 5MB
                </p>
                <span className="relative z-0 inline-flex">
                  <label className="cursor-pointer bg-primary-600 text-white py-2 px-4 rounded-md font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-button">
                    Browse Files
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={handleFileChange}
                    />
                  </label>
                </span>
              </div>
              
              {file && (
                <div className="mt-6 p-4 border border-neutral-200 rounded-lg bg-neutral-50 flex justify-between items-center">
                  <div className="flex items-center">
                    <FileText className="h-6 w-6 text-neutral-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-neutral-700">{file.name}</p>
                      <p className="text-xs text-neutral-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className={`bg-primary-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-button ${
                      isUploading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isUploading ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              )}
              
              {uploadError && (
                <div className="mt-4 bg-red-50 text-red-700 p-4 rounded-md flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-400 mr-3 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{uploadError}</p>
                </div>
              )}
            </>
          ) : processingStep === 'error' ? (
            <div className="text-center py-6">
              <div className="bg-red-100 p-4 rounded-full inline-flex mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-neutral-800 mb-2">Resume Processing Failed</h3>
              <p className="text-neutral-600 mb-6">{uploadError || 'There was an error processing your resume. Please try again.'}</p>
              <button
                onClick={resetUpload}
                className="bg-neutral-800 text-white py-2 px-6 rounded-md font-medium hover:bg-neutral-900"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="py-6">
              <h3 className="text-lg font-medium text-neutral-800 mb-6 text-center">Processing Your Resume</h3>
              {renderProgressSteps()}
              
              {processingStep === 'complete' && (
                <div className="text-center mt-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
                    <Check className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-medium text-neutral-800 mb-2">Resume Processing Complete!</h3>
                  <p className="text-neutral-600 mb-6">Your resume has been successfully parsed and analyzed.</p>
                  <button
                    onClick={handleStartInterview}
                    className="bg-primary-600 text-white py-2 px-6 rounded-md font-medium hover:bg-primary-700"
                  >
                    Continue to Interview
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ResumeUploadPage;