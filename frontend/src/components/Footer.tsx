import { Link } from 'react-router-dom';
import { FileText, Github as GitHub, Twitter, Linkedin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-neutral-800 text-neutral-300">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-4">
              <FileText className="h-8 w-8 text-primary-500 mr-2" />
              <span className="font-bold text-xl text-white">Resume Interviewer</span>
            </div>
            <p className="text-neutral-400 text-sm max-w-md">
              Practice your interview skills with our AI-powered platform. Upload your resume, get personalized interview questions, and receive feedback to improve your performance.
            </p>
            <div className="flex mt-6 space-x-4">
              <a href="#" className="text-neutral-400 hover:text-white">
                <GitHub className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </a>
              <a href="#" className="text-neutral-400 hover:text-white">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </a>
              <a href="#" className="text-neutral-400 hover:text-white">
                <Linkedin className="h-5 w-5" />
                <span className="sr-only">LinkedIn</span>
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
              Resources
            </h3>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-neutral-400 hover:text-white">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-neutral-400 hover:text-white">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/resume-upload" className="text-neutral-400 hover:text-white">
                  Upload Resume
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
              Legal
            </h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-neutral-400 hover:text-white">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-neutral-400 hover:text-white">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="text-neutral-400 hover:text-white">
                  Cookie Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-neutral-700 pt-8">
          <p className="text-neutral-400 text-sm text-center">
            &copy; {new Date().getFullYear()} Resume Interviewer. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;