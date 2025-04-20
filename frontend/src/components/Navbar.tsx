import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, FileText, LogOut, LayoutDashboard, Upload } from 'lucide-react';
import { useAuth } from '../hooks/useAuth'; // Assuming correct path

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { currentUser, logout } = useAuth();
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

  // Updated isActive for consistent styling logic
  const getLinkClasses = (path: string, isMobile: boolean = false) => {
    const baseClasses = `px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${isMobile ? 'text-base flex items-center w-full' : 'inline-flex items-center'}`;
    const activeClasses = 'text-blue-400 bg-slate-700/50'; // Subtle background for active
    const inactiveClasses = 'text-slate-300 hover:text-blue-400 hover:bg-slate-700/30';

    return `${baseClasses} ${location.pathname === path ? activeClasses : inactiveClasses}`;
  };

  const getButtonClasses = (isMobile: boolean = false) => {
     return `px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${isMobile ? 'text-base flex items-center w-full' : 'inline-flex items-center'} text-slate-300 hover:text-red-400 hover:bg-slate-700/30`;
  }

  return (
    // Changed background to darker slate, increased opacity slightly, updated border
    <nav className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center group" onClick={closeMenu}>
              {/* Slightly adjusted logo background and icon color */}
              <div className="bg-blue-600/20 p-2 rounded-lg mr-3 group-hover:bg-blue-600/30 transition-colors">
                <FileText className="h-6 w-6 text-blue-400" />
              </div>
              {/* Removed gradient for minimalism, using a bright text color */}
              <span className="font-bold text-xl text-slate-100">
                AI Interviewer
              </span>
            </Link>
          </div>

          {/* Desktop menu - using getLinkClasses for consistency */}
          <div className="hidden md:flex md:items-center md:space-x-1 lg:space-x-4">
            <Link to="/" className={getLinkClasses('/')}>
               Home
            </Link>

            {currentUser ? (
              <>
                <Link to="/dashboard" className={getLinkClasses('/dashboard')}>
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
                <Link to="/resume-upload" className={getLinkClasses('/resume-upload')}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Resume
                </Link>
                <button onClick={handleLogout} className={getButtonClasses()}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className={getLinkClasses('/login')}>
                  Login
                </Link>
                 {/* Simplified Sign Up button - solid color */}
                <Link
                  to="/signup"
                  className="inline-flex items-center text-sm font-medium px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white transition-colors duration-150"
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
              // Consistent hover effect
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors"
              aria-controls="mobile-menu"
              aria-expanded={isMenuOpen}
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

      {/* Mobile menu - using getLinkClasses and ensuring closeMenu is called */}
      {isMenuOpen && (
        // Darker background for mobile dropdown
        <div className="md:hidden bg-slate-900/95 border-t border-slate-800" id="mobile-menu">
          <div className="flex flex-col space-y-1 px-2 pt-2 pb-3">
            <Link to="/" className={getLinkClasses('/', true)} onClick={closeMenu}>
               Home
            </Link>

            {currentUser ? (
              <>
                <Link to="/dashboard" className={getLinkClasses('/dashboard', true)} onClick={closeMenu}>
                  <LayoutDashboard className="h-5 w-5 mr-2" />
                  Dashboard
                </Link>
                <Link to="/resume-upload" className={getLinkClasses('/resume-upload', true)} onClick={closeMenu}>
                  <Upload className="h-5 w-5 mr-2" />
                  Upload Resume
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    closeMenu();
                  }}
                  className={getButtonClasses(true)}
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className={getLinkClasses('/login', true)} onClick={closeMenu}>
                  Login
                </Link>
                {/* Simplified Sign Up button */}
                <Link
                  to="/signup"
                  className="flex items-center justify-center px-3 py-2 mt-1 rounded-md text-base font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors duration-150"
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