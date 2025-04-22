import { useNavigate } from 'react-router-dom';
import { FileText, Zap, MessageSquare, BarChart, Award, Cpu } from 'lucide-react'; // Added Zap and Cpu icons
import { useAuth } from '../hooks/useAuth';
import { motion } from 'framer-motion';

// Optional: Consider adding a subtle SVG background pattern via CSS for extra sci-fi feel
// E.g., body { background-image: url('/path/to/subtle-grid.svg'); }

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

  // Reusable animation variants
  const fadeInY = {
    hidden: { opacity: 0, y: 20 },
    visible: (delay = 0) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, delay }
    })
  };

  const fadeInX = (direction = 'left') => ({
    hidden: { opacity: 0, x: direction === 'left' ? -30 : 30 },
    visible: (delay = 0) => ({
      opacity: 1,
      x: 0,
      transition: { duration: 0.6, delay }
    })
  });


  return (
    // Changed base background to black for higher contrast
    <div className="min-h-screen bg-black text-slate-200">
      {/* Hero section */}
      <section className="relative overflow-hidden pt-24 pb-20 md:pt-32 md:pb-28">
        {/* Subtle background gradient - more digital feel */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-radial from-cyan-900/30 via-black/50 to-black"></div>
           {/* Optional: Add animated background elements here if desired */}
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
             <motion.div
                variants={fadeInY}
                initial="hidden"
                animate="visible"
             >
              {/* Updated heading gradient - cyan/blue/emerald */}
              <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent tracking-tight">
                HR-Sahab: Precision Practice
              </h1>
              <p className="text-xl md:text-2xl mb-10 text-slate-300">
                Harness AI trained on your resume. Experience interviews powered by cutting-edge technology.
              </p>
              </motion.div>
              <motion.div
                variants={fadeInY}
                initial="hidden"
                animate="visible"
                custom={0.2} // Delay animation
                className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4"
              >
                {/* Updated primary CTA button - solid cyan with hover glow */}
                <button
                  onClick={handleGetStarted}
                  className="px-8 py-3 rounded-md text-white text-lg font-semibold bg-cyan-600 hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-black transition-all duration-150 shadow-md hover:shadow-lg hover:shadow-cyan-500/30"
                >
                  Begin Your Journey
                </button>
                {/* Updated secondary button - border accent */}
                <a
                  href="#how-it-works"
                  className="px-8 py-3 rounded-md text-lg font-medium border border-cyan-600 text-cyan-400 hover:bg-cyan-900/40 hover:border-cyan-500 transition-colors duration-150"
                >
                  Explore Features
                </a>
             </motion.div>
               {/* --- GROQ Mention --- */}
               <motion.div
                  variants={fadeInY}
                  initial="hidden"
                  animate="visible"
                  custom={0.4} // Delay animation
                  className="mt-10 text-sm text-slate-500 flex items-center justify-center space-x-2"
               >
                   <Zap size={16} className="text-yellow-400"/>
                   <span>Blazing fast AI responses powered by</span>
                   <a href="https://groq.com/" target="_blank" rel="noopener noreferrer" className="font-semibold text-slate-400 hover:text-yellow-400 transition-colors">
                       Groq LPU™ Inference Engine
                   </a>
               </motion.div>
               {/* --- End GROQ Mention --- */}
          </div>
        </div>
      </section>

      {/* How it works section */}
      <section id="how-it-works" className="py-20 bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
             <motion.h2
                variants={fadeInY} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-4 tracking-wide"
              >
                How It Works
             </motion.h2>
             <motion.p
                variants={fadeInY} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0.1}
                className="text-lg text-slate-400 max-w-2xl mx-auto"
             >
               Three simple steps to elevate your interview game
             </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1: Upload Resume */}
            <motion.div
              variants={fadeInY} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0}
              // Updated card style: darker bg, sharper border, less rounded, subtle hover border change
              className="bg-slate-900/70 p-8 rounded-xl border border-slate-800 backdrop-blur-sm hover:border-cyan-700/50 transition-colors duration-200"
            >
              <div className="bg-cyan-900/40 rounded-lg w-14 h-14 flex items-center justify-center mb-6 border border-cyan-800/50">
                <FileText className="h-7 w-7 text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-100 mb-3">1. Upload Resume</h3>
              <p className="text-slate-400">
                Our AI analyzes your skills and experience to tailor the interview.
              </p>
            </motion.div>

            {/* Card 2: Practice with AI */}
            <motion.div
              variants={fadeInY} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0.1}
              className="bg-slate-900/70 p-8 rounded-xl border border-slate-800 backdrop-blur-sm hover:border-blue-700/50 transition-colors duration-200"
            >
              <div className="bg-blue-900/40 rounded-lg w-14 h-14 flex items-center justify-center mb-6 border border-blue-800/50">
                <MessageSquare className="h-7 w-7 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-100 mb-3">2. Practice with AI</h3>
              <p className="text-slate-400">
                Engage in dynamic, realistic interview conversations.
              </p>
            </motion.div>

            {/* Card 3: Get Insights */}
            <motion.div
              variants={fadeInY} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0.2}
              className="bg-slate-900/70 p-8 rounded-xl border border-slate-800 backdrop-blur-sm hover:border-emerald-700/50 transition-colors duration-200"
            >
              <div className="bg-emerald-900/40 rounded-lg w-14 h-14 flex items-center justify-center mb-6 border border-emerald-800/50">
                <BarChart className="h-7 w-7 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-100 mb-3">3. Get Insights</h3>
              <p className="text-slate-400">
                Receive actionable feedback and performance analytics.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features section */}
      <section className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
             <motion.h2
                variants={fadeInY} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent mb-4 tracking-wide"
             >
               Advanced Features
             </motion.h2>
             <motion.p
               variants={fadeInY} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0.1}
               className="text-lg text-slate-400 max-w-2xl mx-auto"
             >
               Cutting-edge tech for unparalleled interview preparation
             </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Feature 1: AI Resume Analysis */}
            <motion.div
              variants={fadeInX('left')} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="flex items-start bg-slate-900/60 p-6 rounded-xl border border-slate-800 backdrop-blur-sm hover:border-cyan-700/50 transition-colors duration-200"
            >
              <div className="mr-5 flex-shrink-0">
                <div className="bg-cyan-900/40 rounded-lg p-3 border border-cyan-800/50">
                  <FileText className="h-6 w-6 text-cyan-400" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-100 mb-2">AI Resume Analysis</h3>
                <p className="text-slate-400">
                  Generates targeted questions based on your specific profile and experience.
                </p>
              </div>
            </motion.div>

            {/* Feature 2: Dynamic Conversations & Groq */}
            <motion.div
              variants={fadeInX('right')} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="flex items-start bg-slate-900/60 p-6 rounded-xl border border-slate-800 backdrop-blur-sm hover:border-blue-700/50 transition-colors duration-200"
            >
              <div className="mr-5 flex-shrink-0">
                <div className="bg-blue-900/40 rounded-lg p-3 border border-blue-800/50">
                  <MessageSquare className="h-6 w-6 text-blue-400" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-100 mb-2">Dynamic AI Conversations</h3>
                <p className="text-slate-400">
                  Experience natural, flowing interviews with contextual follow-ups.
                  {/* Integrated Groq Mention */}
                  <span className="block mt-2 text-sm text-yellow-300/80 flex items-center">
                    <Cpu size={14} className="mr-1.5"/> Accelerated by Groq for real-time interaction.
                  </span>
                </p>
              </div>
            </motion.div>

            {/* Feature 3: Real-time Feedback */}
             <motion.div
              variants={fadeInX('left')} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0.1}
              className="flex items-start bg-slate-900/60 p-6 rounded-xl border border-slate-800 backdrop-blur-sm hover:border-emerald-700/50 transition-colors duration-200"
            >
              <div className="mr-5 flex-shrink-0">
                <div className="bg-emerald-900/40 rounded-lg p-3 border border-emerald-800/50">
                   <Award className="h-6 w-6 text-emerald-400" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-100 mb-2">Real-time Feedback</h3>
                 <p className="text-slate-400">
                  Receive instant, constructive insights on your answers and delivery.
                 </p>
              </div>
             </motion.div>

            {/* Feature 4: Progress Analytics */}
             <motion.div
               variants={fadeInX('right')} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0.1}
               className="flex items-start bg-slate-900/60 p-6 rounded-xl border border-slate-800 backdrop-blur-sm hover:border-slate-700/50 transition-colors duration-200"
             >
               <div className="mr-5 flex-shrink-0">
                 <div className="bg-slate-700/40 rounded-lg p-3 border border-slate-600/50">
                   <BarChart className="h-6 w-6 text-slate-400" />
                 </div>
               </div>
               <div>
                 <h3 className="text-xl font-semibold text-slate-100 mb-2">Progress Analytics</h3>
                 <p className="text-slate-400">
                   Track your performance over time with detailed metrics and visualizations.
                 </p>
               </div>
             </motion.div>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-20 relative overflow-hidden">
         {/* Mirrored Hero background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-radial from-blue-900/30 via-black/50 to-black"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
           <motion.h2
               variants={fadeInY} initial="hidden" whileInView="visible" viewport={{ once: true }}
               className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent mb-6 tracking-tight"
            >
             Ready to Master Your Next Interview?
           </motion.h2>
           <motion.p
              variants={fadeInY} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0.1}
              className="text-xl mb-10 text-slate-300 max-w-2xl mx-auto"
           >
             Join professionals worldwide leveraging AI for peak interview performance.
           </motion.p>
           <motion.div
              variants={fadeInY} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0.2}
           >
              <button
                 onClick={handleGetStarted}
                 className="px-8 py-3 rounded-md text-white text-lg font-semibold bg-cyan-600 hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-black transition-all duration-150 shadow-md hover:shadow-lg hover:shadow-cyan-500/30"
              >
                Start Your AI Practice Now
              </button>
           </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;