import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, FileText, LogOut, LayoutDashboard, Upload } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { currentUser, logout } = useAuth(); // Now properly typed
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center group">
              <div className="bg-blue-900/30 p-2 rounded-lg mr-3 group-hover:bg-blue-800/40 transition-colors">
                <FileText className="h-6 w-6 text-blue-400" />
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                AI Interviewer
              </span>
            </Link>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex md:items-center md:space-x-6">
            <Link 
              to="/" 
              className={`text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
                isActive('/') 
                  ? 'text-blue-400 bg-blue-900/20' 
                  : 'text-gray-300 hover:text-blue-400 hover:bg-gray-800/50'
              }`}
            >
              Home
            </Link>
            
            {currentUser ? (
              <>
                <Link 
                  to="/dashboard" 
                  className={`flex items-center text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
                    isActive('/dashboard') 
                      ? 'text-purple-400 bg-purple-900/20' 
                      : 'text-gray-300 hover:text-purple-400 hover:bg-gray-800/50'
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
                <Link 
                  to="/resume-upload"
                  className={`flex items-center text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
                    isActive('/resume-upload') 
                      ? 'text-cyan-400 bg-cyan-900/20' 
                      : 'text-gray-300 hover:text-cyan-400 hover:bg-gray-800/50'
                  }`}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Resume
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center text-sm font-medium px-3 py-2 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="text-sm font-medium px-4 py-2 rounded-lg text-gray-300 hover:text-blue-400 hover:bg-gray-800/50 transition-colors"
                >
                  Login
                </Link>
                <Link 
                  to="/signup" 
                  className="text-sm font-medium px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all transform hover:scale-105"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-gray-800/50 transition-colors"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-gray-900/95 backdrop-blur-sm border-t border-gray-800/50">
          <div className="flex flex-col space-y-2 pt-2 pb-4 px-4">
            <Link 
              to="/" 
              className={`flex items-center px-3 py-2 rounded-lg text-base font-medium transition-colors ${
                isActive('/') 
                  ? 'text-blue-400 bg-blue-900/20' 
                  : 'text-gray-300 hover:text-blue-400 hover:bg-gray-800/50'
              }`}
              onClick={closeMenu}
            >
              Home
            </Link>
            
            {currentUser ? (
              <>
                <Link 
                  to="/dashboard" 
                  className={`flex items-center px-3 py-2 rounded-lg text-base font-medium transition-colors ${
                    isActive('/dashboard') 
                      ? 'text-purple-400 bg-purple-900/20' 
                      : 'text-gray-300 hover:text-purple-400 hover:bg-gray-800/50'
                  }`}
                  onClick={closeMenu}
                >
                  <LayoutDashboard className="h-5 w-5 mr-2" />
                  Dashboard
                </Link>
                <Link 
                  to="/resume-upload"
                  className={`flex items-center px-3 py-2 rounded-lg text-base font-medium transition-colors ${
                    isActive('/resume-upload') 
                      ? 'text-cyan-400 bg-cyan-900/20' 
                      : 'text-gray-300 hover:text-cyan-400 hover:bg-gray-800/50'
                  }`}
                  onClick={closeMenu}
                >
                  <Upload className="h-5 w-5 mr-2" />
                  Upload Resume
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    closeMenu();
                  }}
                  className="flex items-center w-full px-3 py-2 rounded-lg text-base font-medium text-gray-300 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="px-3 py-2 rounded-lg text-base font-medium text-gray-300 hover:text-blue-400 hover:bg-gray-800/50 transition-colors"
                  onClick={closeMenu}
                >
                  Login
                </Link>
                <Link 
                  to="/signup" 
                  className="px-3 py-2 rounded-lg text-base font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all"
                  onClick={closeMenu}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;