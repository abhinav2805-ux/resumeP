import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, FileText, LogOut } from 'lucide-react';
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
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <FileText className="h-8 w-8 text-primary-600 mr-2" />
              <span className="font-bold text-xl text-primary-800">Resume Interviewer</span>
            </Link>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            <Link 
              to="/" 
              className={`text-sm font-medium ${isActive('/') ? 'text-primary-600' : 'text-neutral-600 hover:text-primary-500'}`}
            >
              Home
            </Link>
            
            {currentUser ? (
              <>
                <Link 
                  to="/dashboard" 
                  className={`text-sm font-medium ${isActive('/dashboard') ? 'text-primary-600' : 'text-neutral-600 hover:text-primary-500'}`}
                >
                  Dashboard
                </Link>
                <Link 
                  to="/resume-upload"
                  className={`text-sm font-medium ${isActive('/resume-upload') ? 'text-primary-600' : 'text-neutral-600 hover:text-primary-500'}`}
                >
                  Upload Resume
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center text-sm font-medium text-neutral-600 hover:text-primary-500"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="text-sm font-medium text-neutral-600 hover:text-primary-500"
                >
                  Login
                </Link>
                <Link 
                  to="/signup" 
                  className="bg-primary-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
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
              className="inline-flex items-center justify-center p-2 rounded-md text-neutral-600 hover:text-primary-600 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
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
        <div className="md:hidden bg-white py-2 px-4 shadow-lg rounded-b-lg">
          <div className="flex flex-col space-y-4 pt-2 pb-4">
            <Link 
              to="/" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/') ? 'text-primary-600 bg-primary-50' : 'text-neutral-600 hover:text-primary-500 hover:bg-neutral-100'}`}
              onClick={closeMenu}
            >
              Home
            </Link>
            
            {currentUser ? (
              <>
                <Link 
                  to="/dashboard" 
                  className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/dashboard') ? 'text-primary-600 bg-primary-50' : 'text-neutral-600 hover:text-primary-500 hover:bg-neutral-100'}`}
                  onClick={closeMenu}
                >
                  Dashboard
                </Link>
                <Link 
                  to="/resume-upload"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/resume-upload') ? 'text-primary-600 bg-primary-50' : 'text-neutral-600 hover:text-primary-500 hover:bg-neutral-100'}`}
                  onClick={closeMenu}
                >
                  Upload Resume
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    closeMenu();
                  }}
                  className="flex items-center px-3 py-2 rounded-md text-base font-medium text-neutral-600 hover:text-primary-500 hover:bg-neutral-100 w-full text-left"
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="block px-3 py-2 rounded-md text-base font-medium text-neutral-600 hover:text-primary-500 hover:bg-neutral-100"
                  onClick={closeMenu}
                >
                  Login
                </Link>
                <Link 
                  to="/signup" 
                  className="block px-3 py-2 rounded-md text-base font-medium bg-primary-600 text-white hover:bg-primary-700"
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