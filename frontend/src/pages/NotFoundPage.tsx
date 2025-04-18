import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-neutral-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-primary-100 p-4 rounded-full">
            <FileQuestion className="h-12 w-12 text-primary-600" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-neutral-800 mb-4">Page Not Found</h1>
        <p className="text-neutral-600 mb-8">
          Sorry, the page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Link
            to="/"
            className="bg-neutral-800 text-white py-2 px-6 rounded-md font-medium hover:bg-neutral-900 transition"
          >
            Go to Homepage
          </Link>
          <Link
            to="/dashboard"
            className="bg-primary-600 text-white py-2 px-6 rounded-md font-medium hover:bg-primary-700 transition"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;