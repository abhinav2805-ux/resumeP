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
    <div className="bg-neutral-50">
      {/* Hero section */}
      <section className="relative overflow-hidden bg-primary-700 text-white">
        <div className="absolute inset-0">
          <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-primary-900 to-primary-700 opacity-90"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="py-20 md:py-32">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-3xl mx-auto"
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Ace Your Next Interview with AI-Powered Practice
              </h1>
              <p className="text-xl md:text-2xl mb-10 text-primary-100">
                Upload your resume and get personalized interview simulations to help you prepare for your dream job.
              </p>
              <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                <button 
                  onClick={handleGetStarted}
                  className="bg-white text-primary-700 px-6 py-3 rounded-md font-medium text-lg hover:bg-neutral-100 transition duration-150 ease-in-out shadow-button"
                >
                  Get Started
                </button>
                <a 
                  href="#how-it-works" 
                  className="border border-white text-white px-6 py-3 rounded-md font-medium text-lg hover:bg-primary-600 transition duration-150 ease-in-out"
                >
                  Learn More
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it works section */}
      <section id="how-it-works" className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-800 mb-4">How It Works</h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Our platform makes it easy to practice your interview skills with just a few simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-white p-8 rounded-xl shadow-card"
            >
              <div className="bg-primary-100 rounded-full w-14 h-14 flex items-center justify-center mb-6">
                <FileText className="h-7 w-7 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-800 mb-3">Upload Your Resume</h3>
              <p className="text-neutral-600">
                Simply upload your resume in PDF or DOCX format, and our AI will parse your skills and experience.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-white p-8 rounded-xl shadow-card"
            >
              <div className="bg-primary-100 rounded-full w-14 h-14 flex items-center justify-center mb-6">
                <MessageSquare className="h-7 w-7 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-800 mb-3">Practice with AI</h3>
              <p className="text-neutral-600">
                Engage in a realistic interview conversation tailored to your background and the job you're targeting.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-white p-8 rounded-xl shadow-card"
            >
              <div className="bg-primary-100 rounded-full w-14 h-14 flex items-center justify-center mb-6">
                <BarChart className="h-7 w-7 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-800 mb-3">Get Feedback</h3>
              <p className="text-neutral-600">
                Receive detailed feedback on your responses and practical tips to improve your interview performance.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features section */}
      <section className="py-16 md:py-24 bg-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-800 mb-4">Key Features</h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Everything you need to prepare for your next job interview
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="flex">
              <div className="mr-4 flex-shrink-0">
                <div className="bg-secondary-100 rounded-full p-3">
                  <FileText className="h-6 w-6 text-secondary-600" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-neutral-800 mb-2">Resume Analysis</h3>
                <p className="text-neutral-600">
                  Our advanced AI analyzes your resume to identify key skills, experiences, and potential areas for improvement to focus on during interviews.
                </p>
              </div>
            </div>

            <div className="flex">
              <div className="mr-4 flex-shrink-0">
                <div className="bg-secondary-100 rounded-full p-3">
                  <MessageSquare className="h-6 w-6 text-secondary-600" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-neutral-800 mb-2">AI Interviewer</h3>
                <p className="text-neutral-600">
                  Practice with our AI interviewer that adapts questions based on your responses, creating a realistic interview experience.
                </p>
              </div>
            </div>

            <div className="flex">
              <div className="mr-4 flex-shrink-0">
                <div className="bg-secondary-100 rounded-full p-3">
                  <Award className="h-6 w-6 text-secondary-600" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-neutral-800 mb-2">Performance Scoring</h3>
                <p className="text-neutral-600">
                  Get a detailed score for each of your responses, helping you identify strengths and areas for improvement.
                </p>
              </div>
            </div>

            <div className="flex">
              <div className="mr-4 flex-shrink-0">
                <div className="bg-secondary-100 rounded-full p-3">
                  <BarChart className="h-6 w-6 text-secondary-600" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-neutral-800 mb-2">Progress Tracking</h3>
                <p className="text-neutral-600">
                  Track your interview performance over time and see your improvement as you practice more interviews.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-16 md:py-24 bg-secondary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Ace Your Next Interview?</h2>
          <p className="text-xl mb-10 max-w-2xl mx-auto">
            Join thousands of job seekers who have improved their interview skills and landed their dream jobs.
          </p>
          <button 
            onClick={handleGetStarted}
            className="bg-white text-secondary-700 px-8 py-3 rounded-md font-medium text-lg hover:bg-neutral-100 transition duration-150 ease-in-out shadow-button"
          >
            Get Started Now
          </button>
        </div>
      </section>
    </div>
  );
};

export default HomePage;