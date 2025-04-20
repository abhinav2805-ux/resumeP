import { Link } from 'react-router-dom';
import { FileText, Github as GitHub, Twitter, Linkedin } from 'lucide-react'; // Ensure lucide-react is installed

const Footer = () => {
  return (
    // Changed background to solid, dark slate. Updated text colors for consistency.
    <footer className="bg-slate-900 text-slate-400">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 xl:gap-12">
          {/* Logo and description */}
          {/* Adjusted column span for better balance on large screens */}
          <div className="md:col-span-2">
            <div className="flex items-center mb-4">
              {/* Consistent blue accent */}
              <FileText className="h-8 w-8 text-blue-500 mr-2 flex-shrink-0" />
              {/* Brighter text for logo */}
              <span className="font-bold text-xl text-slate-100">AI Interviewer</span>
            </div>
            <p className="text-sm max-w-md">
              Practice your interview skills with our AI-powered platform. Upload your resume, get personalized interview questions, and receive feedback to improve your performance.
            </p>
            <div className="flex mt-6 space-x-5">
              {/* Updated social link colors and hover effect */}
              <a href="#" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-blue-400 transition-colors">
                <GitHub className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </a>
              <a href="#" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-blue-400 transition-colors">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </a>
              <a href="#" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-blue-400 transition-colors">
                <Linkedin className="h-5 w-5" />
                <span className="sr-only">LinkedIn</span>
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            {/* Slightly brighter heading */}
            <h3 className="text-sm font-semibold text-slate-300 tracking-wider uppercase mb-4">
              Resources
            </h3>
            <ul className="space-y-3">
              <li>
                {/* Consistent link styling */}
                <Link to="/" className="hover:text-blue-400 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-blue-400 transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/resume-upload" className="hover:text-blue-400 transition-colors">
                  Upload Resume
                </Link>
              </li>
               {/* Add other relevant links if needed */}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 tracking-wider uppercase mb-4">
              Legal
            </h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="hover:text-blue-400 transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-400 transition-colors">
                  Terms of Service
                </a>
              </li>
               {/* Keep Cookie Policy if applicable */}
              <li>
                <a href="#" className="hover:text-blue-400 transition-colors">
                  Cookie Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Updated border and copyright text color */}
        <div className="mt-12 border-t border-slate-800 pt-8">
          <p className="text-slate-500 text-sm text-center">
            &copy; {new Date().getFullYear()} AI Interviewer. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;