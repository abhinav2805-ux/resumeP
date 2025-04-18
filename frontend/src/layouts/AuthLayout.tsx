import { Outlet } from 'react-router-dom';
import { FileText } from 'lucide-react';

const AuthLayout = () => {
  return (
    <div className="flex min-h-screen bg-neutral-50">
      {/* Left side - brand/logo area */}
      <div className="hidden md:flex md:w-1/2 bg-primary-700 text-white p-8 flex-col justify-between">
        <div>
          <div className="flex items-center mb-8">
            <FileText size={32} className="mr-2" />
            <h1 className="text-2xl font-bold">Resume Interviewer</h1>
          </div>
          <div className="mt-12 pr-12">
            <h2 className="text-3xl font-bold mb-6">Practice your interviews with AI assistance</h2>
            <p className="text-xl text-primary-100 mb-8">
              Upload your resume and get personalized interview practice based on your experience and skills.
            </p>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="bg-primary-500 rounded-full p-1 mr-3 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-primary-100">AI-powered resume parsing</p>
              </div>
              <div className="flex items-start">
                <div className="bg-primary-500 rounded-full p-1 mr-3 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-primary-100">Realistic interview simulations</p>
              </div>
              <div className="flex items-start">
                <div className="bg-primary-500 rounded-full p-1 mr-3 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-primary-100">Personalized feedback and scoring</p>
              </div>
            </div>
          </div>
        </div>
        <p className="text-primary-200 text-sm">© 2025 Resume Interviewer. All rights reserved.</p>
      </div>
      
      {/* Right side - auth forms */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;