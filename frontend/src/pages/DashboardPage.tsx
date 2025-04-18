import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Plus, 
  Clock, 
  PieChart, 
  Calendar, 
  ArrowUpRight,
  BarChart
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';

interface Interview {
  id: string;
  date: Date;
  score: number;
  status: 'completed' | 'in_progress';
  resumeName: string;
}

const DashboardPage = () => {
  const { currentUser } = useAuth();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalInterviews: 0,
    avgScore: 0,
    improvement: 0,
    completedInterviews: 0
  });

  useEffect(() => {
    const fetchInterviews = async () => {
      if (!currentUser) return;
      
      try {
        // In a real app, we would fetch this data from Firestore
        // For demo purposes, we're creating fake data
        const mockInterviews: Interview[] = [
          {
            id: '1',
            date: new Date('2025-01-15'),
            score: 85,
            status: 'completed',
            resumeName: 'Software Engineer Resume'
          },
          {
            id: '2',
            date: new Date('2025-02-10'),
            score: 78,
            status: 'completed',
            resumeName: 'Product Manager Resume'
          },
          {
            id: '3',
            date: new Date('2025-03-05'),
            score: 92,
            status: 'completed',
            resumeName: 'Software Engineer Resume'
          },
          {
            id: '4',
            date: new Date(Date.now() - 24 * 60 * 60 * 1000),
            score: 0,
            status: 'in_progress',
            resumeName: 'Data Scientist Resume'
          }
        ];
        
        setInterviews(mockInterviews);
        
        // Calculate stats
        const completed = mockInterviews.filter(i => i.status === 'completed');
        const totalScore = completed.reduce((sum, i) => sum + i.score, 0);
        
        setStats({
          totalInterviews: mockInterviews.length,
          avgScore: completed.length > 0 ? Math.round(totalScore / completed.length) : 0,
          improvement: 8, // Fake improvement percentage
          completedInterviews: completed.length
        });
        
      } catch (error) {
        console.error('Error fetching interviews:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInterviews();
  }, [currentUser]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-12 h-12 border-4 border-primary-300 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-neutral-800">Welcome, {currentUser?.displayName}</h1>
        <p className="text-neutral-600 mt-2">
          Manage your interview practice sessions and track your progress
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white rounded-xl shadow-card p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 rounded-lg bg-primary-100">
              <PieChart className="h-5 w-5 text-primary-600" />
            </div>
            <span className="text-primary-600 text-sm font-medium flex items-center">
              <ArrowUpRight className="h-4 w-4 mr-1" />
              {stats.improvement}% growth
            </span>
          </div>
          <h3 className="text-neutral-500 text-sm font-medium">Total Interviews</h3>
          <p className="text-2xl font-bold text-neutral-800 mt-1">{stats.totalInterviews}</p>
        </div>

        <div className="bg-white rounded-xl shadow-card p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 rounded-lg bg-green-100">
              <BarChart className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <h3 className="text-neutral-500 text-sm font-medium">Average Score</h3>
          <p className="text-2xl font-bold text-neutral-800 mt-1">{stats.avgScore}%</p>
        </div>

        <div className="bg-white rounded-xl shadow-card p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 rounded-lg bg-blue-100">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <h3 className="text-neutral-500 text-sm font-medium">Completed Interviews</h3>
          <p className="text-2xl font-bold text-neutral-800 mt-1">{stats.completedInterviews}</p>
        </div>

        <div className="bg-white rounded-xl shadow-card p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 rounded-lg bg-purple-100">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <h3 className="text-neutral-500 text-sm font-medium">Last Practice</h3>
          <p className="text-2xl font-bold text-neutral-800 mt-1">
            {interviews.length > 0 
              ? formatDate(new Date(Math.max(...interviews.map(i => i.date.getTime()))))
              : 'No interviews yet'}
          </p>
        </div>
      </div>

      {/* Recent Interviews */}
      <div className="bg-white rounded-xl shadow-card mb-10">
        <div className="flex justify-between items-center p-6 border-b border-neutral-200">
          <h2 className="text-xl font-semibold text-neutral-800">Recent Interviews</h2>
          <Link 
            to="/resume-upload" 
            className="flex items-center text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            <Plus className="h-4 w-4 mr-1" />
            New Interview
          </Link>
        </div>

        {interviews.length === 0 ? (
          <div className="p-8 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-neutral-400" />
            </div>
            <h3 className="text-neutral-700 font-medium mb-2">No interviews yet</h3>
            <p className="text-neutral-500 mb-4">
              Upload your resume and start practicing for your next interview.
            </p>
            <Link
              to="/resume-upload"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Start New Interview
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Resume
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {interviews.map((interview) => (
                  <tr key={interview.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-neutral-400 mr-3" />
                        <span className="text-sm font-medium text-neutral-700">{interview.resumeName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      {formatDate(interview.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        interview.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {interview.status === 'completed' ? 'Completed' : 'In Progress'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                      {interview.status === 'completed' ? `${interview.score}%` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link 
                        to={`/interview/${interview.id}`}
                        className="text-primary-600 hover:text-primary-800"
                      >
                        {interview.status === 'completed' ? 'View' : 'Continue'}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-card p-6">
          <div className="p-3 rounded-lg bg-primary-100 inline-block mb-4">
            <FileText className="h-6 w-6 text-primary-600" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-800 mb-2">Upload New Resume</h3>
          <p className="text-neutral-600 mb-4">
            Add a new resume to practice interviews for different job positions.
          </p>
          <Link 
            to="/resume-upload"
            className="text-primary-600 hover:text-primary-700 font-medium inline-flex items-center"
          >
            Upload Resume
            <ArrowUpRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
        
        <div className="bg-white rounded-xl shadow-card p-6">
          <div className="p-3 rounded-lg bg-secondary-100 inline-block mb-4">
            <PieChart className="h-6 w-6 text-secondary-600" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-800 mb-2">View Analytics</h3>
          <p className="text-neutral-600 mb-4">
            Track your progress and see detailed performance analytics.
          </p>
          <a 
            href="#"
            className="text-secondary-600 hover:text-secondary-700 font-medium inline-flex items-center"
          >
            Coming Soon
            <ArrowUpRight className="h-4 w-4 ml-1" />
          </a>
        </div>
        
        <div className="bg-white rounded-xl shadow-card p-6">
          <div className="p-3 rounded-lg bg-purple-100 inline-block mb-4">
            <BarChart className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-800 mb-2">Practice Interview</h3>
          <p className="text-neutral-600 mb-4">
            Start a new interview practice session with your uploaded resume.
          </p>
          <Link 
            to="/resume-upload"
            className="text-purple-600 hover:text-purple-700 font-medium inline-flex items-center"
          >
            Start Now
            <ArrowUpRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;