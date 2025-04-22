/* eslint-disable @typescript-eslint/no-unused-vars */
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
    <div className="min-h-screen bg-black text-slate-200">
    <div className="max-w-7xl mx-auto py-12 px-4">
      {/* Header Section with updated styling */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent mb-4">
          Interview Command Center
        </h1>
        <p className="text-lg text-slate-400">
          Track your progress and manage interview simulations
        </p>
      </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 backdrop-blur-sm hover:border-cyan-700/50 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 rounded-lg bg-cyan-900/30 border border-cyan-800/50">
              <PieChart className="h-5 w-5 text-cyan-400" />
            </div>
            <span className="text-cyan-400 text-sm font-medium flex items-center">
              <ArrowUpRight className="h-4 w-4 mr-1" />
              {stats.improvement}% growth
            </span>
          </div>
          <h3 className="text-slate-400 text-sm font-medium">Total Interviews</h3>
          <p className="text-2xl font-bold text-slate-100 mt-1">{stats.totalInterviews}</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 backdrop-blur-sm hover:border-blue-700/50 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 rounded-lg bg-blue-900/30 border border-blue-800/50">
              <BarChart className="h-5 w-5 text-blue-400" />
            </div>
          </div>
          <h3 className="text-slate-400 text-sm font-medium">Average Score</h3>
          <p className="text-2xl font-bold text-slate-100 mt-1">{stats.avgScore}%</p>
        </div>

          <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6 backdrop-blur-sm hover:transform hover:scale-[1.02] transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 rounded-lg bg-cyan-900/30">
                <Clock className="h-5 w-5 text-cyan-400" />
              </div>
            </div>
            <h3 className="text-gray-400 text-sm font-medium">Completed Interviews</h3>
            <p className="text-2xl font-bold text-gray-100 mt-1">{stats.completedInterviews}</p>
          </div>

          <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6 backdrop-blur-sm hover:transform hover:scale-[1.02] transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 rounded-lg bg-purple-900/30">
                <Calendar className="h-5 w-5 text-purple-400" />
              </div>
            </div>
            <h3 className="text-gray-400 text-sm font-medium">Last Practice</h3>
            <p className="text-2xl font-bold text-gray-100 mt-1">
              {interviews.length > 0 
                ? formatDate(new Date(Math.max(...interviews.map(i => i.date.getTime()))))
                : 'No interviews yet'}
            </p>
          </div>
        </div>

        {/* Recent Interviews Table */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl backdrop-blur-sm mb-10">
        <div className="flex justify-between items-center p-6 border-b border-slate-800">
          <h2 className="text-xl font-semibold text-slate-100">Recent Simulations</h2>
          <Link 
            to="/resume-upload" 
            className="flex items-center text-cyan-400 hover:text-cyan-300 text-sm font-medium"
          >
            <Plus className="h-4 w-4 mr-1" />
            New Interview
          </Link>
        </div>

          {interviews.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-gray-300 font-medium mb-2">No interviews yet</h3>
              <p className="text-gray-400 mb-4">
                Upload your resume and start practicing for your next interview.
              </p>
              <Link
                to="/resume-upload"
                className="inline-flex items-center px-6 py-3 rounded-xl text-white text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
              >
                <Plus className="h-4 w-4 mr-2" />
                Start New Interview
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-950/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Resume
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                {interviews.map((interview) => (
                    <tr key={interview.id} className="hover:bg-gray-800/30">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-gray-400 mr-3" />
                          <span className="text-sm font-medium text-gray-300">{interview.resumeName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {formatDate(interview.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          interview.status === 'completed' 
                            ? 'bg-green-900/30 text-green-400 border border-green-500/50' 
                            : 'bg-yellow-900/30 text-yellow-400 border border-yellow-500/50'
                        }`}>
                          {interview.status === 'completed' ? 'Completed' : 'In Progress'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {interview.status === 'completed' ? `${interview.score}%` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link 
                          to={`/interview/${interview.id}`}
                          className="text-blue-400 hover:text-blue-300"
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

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6 backdrop-blur-sm hover:transform hover:scale-[1.02] transition-all">
            <div className="p-3 rounded-lg bg-blue-900/30 inline-block mb-4">
              <FileText className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-100 mb-2">Upload New Resume</h3>
            <p className="text-gray-400 mb-4">
              Add a new resume to practice interviews for different positions.
            </p>
            <Link 
              to="/resume-upload"
              className="text-blue-400 hover:text-blue-300 font-medium inline-flex items-center"
            >
              Upload Resume
              <ArrowUpRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6 backdrop-blur-sm hover:transform hover:scale-[1.02] transition-all">
            <div className="p-3 rounded-lg bg-purple-900/30 inline-block mb-4">
              <PieChart className="h-6 w-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-100 mb-2">View Analytics</h3>
            <p className="text-gray-400 mb-4">
              Track your progress and see detailed performance metrics.
            </p>
            <span className="text-purple-400 font-medium inline-flex items-center">
              Coming Soon
              <ArrowUpRight className="h-4 w-4 ml-1" />
            </span>
          </div>
          
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6 backdrop-blur-sm hover:transform hover:scale-[1.02] transition-all">
            <div className="p-3 rounded-lg bg-cyan-900/30 inline-block mb-4">
              <BarChart className="h-6 w-6 text-cyan-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-100 mb-2">Practice Interview</h3>
            <p className="text-gray-400 mb-4">
              Start a new interview simulation with your resume.
            </p>
            <Link 
              to="/resume-upload"
              className="text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center"
            >
              Start Now
              <ArrowUpRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;