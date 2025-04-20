import { useNavigate } from 'react-router-dom';
import { FileText, BarChart, MessageSquare, Award } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'framer-motion';

const HomePage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleGetStarted = () => {
    if (currentUser) {
      navigate('/dashboard');
    } else {
      navigate('/signup');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Hero section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-y-0 w-full bg-gradient-to-b from-blue-900/50 via-purple-900/50 to-gray-900"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="py-20 md:py-32">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-3xl mx-auto"
            >
              <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Master Your Interview with AI
              </h1>
              <p className="text-xl md:text-2xl mb-10 text-gray-300">
                Practice interviews tailored to your resume, powered by advanced AI technology.
              </p>
              <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                <button 
                  onClick={handleGetStarted}
                  className="px-8 py-4 rounded-xl text-white text-lg font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
                >
                  Begin Your Journey
                </button>
                <a 
                  href="#how-it-works" 
                  className="px-8 py-4 rounded-xl text-lg font-medium border border-gray-700 hover:bg-gray-800/50 transition-all backdrop-blur-sm"
                >
                  Explore Features
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it works section */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Three simple steps to elevate your interview game
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-gray-800/50 p-8 rounded-2xl border border-gray-700/50 backdrop-blur-sm hover:transform hover:scale-[1.02] transition-all"
            >
              <div className="bg-blue-900/30 rounded-xl w-14 h-14 flex items-center justify-center mb-6">
                <FileText className="h-7 w-7 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-100 mb-3">Upload Resume</h3>
              <p className="text-gray-400">
                Our AI analyzes your resume to create personalized interview questions.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-gray-800/50 p-8 rounded-2xl border border-gray-700/50 backdrop-blur-sm hover:transform hover:scale-[1.02] transition-all"
            >
              <div className="bg-purple-900/30 rounded-xl w-14 h-14 flex items-center justify-center mb-6">
                <MessageSquare className="h-7 w-7 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-100 mb-3">Practice with AI</h3>
              <p className="text-gray-400">
                Engage in dynamic conversations with our advanced AI interviewer.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-gray-800/50 p-8 rounded-2xl border border-gray-700/50 backdrop-blur-sm hover:transform hover:scale-[1.02] transition-all"
            >
              <div className="bg-pink-900/30 rounded-xl w-14 h-14 flex items-center justify-center mb-6">
                <BarChart className="h-7 w-7 text-pink-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-100 mb-3">Get Insights</h3>
              <p className="text-gray-400">
                Receive detailed feedback and track your improvement over time.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features section */}
      <section className="py-20 bg-gray-800/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
              Advanced Features
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Cutting-edge technology to enhance your interview preparation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="flex bg-gray-800/50 p-6 rounded-2xl border border-gray-700/50 backdrop-blur-sm hover:transform hover:scale-[1.02] transition-all"
            >
              <div className="mr-4">
                <div className="bg-blue-900/30 rounded-xl p-3">
                  <FileText className="h-6 w-6 text-blue-400" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-100 mb-2">AI Resume Analysis</h3>
                <p className="text-gray-400">
                  Our AI examines your resume to create targeted interview questions and scenarios.
                </p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="flex bg-gray-800/50 p-6 rounded-2xl border border-gray-700/50 backdrop-blur-sm hover:transform hover:scale-[1.02] transition-all"
            >
              <div className="mr-4">
                <div className="bg-purple-900/30 rounded-xl p-3">
                  <MessageSquare className="h-6 w-6 text-purple-400" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-100 mb-2">Dynamic Conversations</h3>
                <p className="text-gray-400">
                  Experience natural, flowing conversations with contextual follow-up questions.
                </p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="flex bg-gray-800/50 p-6 rounded-2xl border border-gray-700/50 backdrop-blur-sm hover:transform hover:scale-[1.02] transition-all"
            >
              <div className="mr-4">
                <div className="bg-cyan-900/30 rounded-xl p-3">
                  <Award className="h-6 w-6 text-cyan-400" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-100 mb-2">Real-time Scoring</h3>
                <p className="text-gray-400">
                  Get instant feedback on your responses with detailed scoring metrics.
                </p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="flex bg-gray-800/50 p-6 rounded-2xl border border-gray-700/50 backdrop-blur-sm hover:transform hover:scale-[1.02] transition-all"
            >
              <div className="mr-4">
                <div className="bg-pink-900/30 rounded-xl p-3">
                  <BarChart className="h-6 w-6 text-pink-400" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-100 mb-2">Progress Analytics</h3>
                <p className="text-gray-400">
                  Track your improvement with detailed performance analytics and insights.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-y-0 w-full bg-gradient-to-b from-gray-900 via-purple-900/50 to-blue-900/50"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-6">
            Ready to Transform Your Interview Skills?
          </h2>
          <p className="text-xl mb-10 text-gray-300 max-w-2xl mx-auto">
            Join thousands of professionals who have mastered their interview skills with our AI platform.
          </p>
          <button 
            onClick={handleGetStarted}
            className="px-8 py-4 rounded-xl text-white text-lg font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
          >
            Start Your Journey
          </button>
        </div>
      </section>
    </div>
  );
};

export default HomePage;