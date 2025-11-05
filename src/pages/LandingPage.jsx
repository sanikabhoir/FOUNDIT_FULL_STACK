import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, MessageCircle, Bell, Upload, Sparkles, Award, Zap, Shield, Users, ArrowRight, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const LandingPage = () => {
  const [activeNav, setActiveNav] = useState('home');
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="min-h-screen bg-[#e8e5dc]">
      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/90 backdrop-blur-xl shadow-lg' : 'bg-transparent'
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-3 cursor-pointer"
            >
              <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
                <Search className="w-5 h-5 text-[#f4d471]" />
              </div>
              <span className="text-2xl font-bold text-gray-900">FoundIT</span>
            </motion.div>
            
            <div className="hidden md:flex items-center gap-8">
              {['home', 'features', 'how-it-works', 'about'].map((item) => (
                <motion.a
                  key={item}
                  href={`#${item}`}
                  onClick={() => setActiveNav(item)}
                  whileHover={{ y: -2 }}
                  className={`font-medium transition-colors capitalize ${
                    activeNav === item ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {item.replace('-', ' ')}
                </motion.a>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition rounded-lg hover:bg-gray-100"
            >
              <Shield className="w-5 h-5" />
              Support
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section id="home" className="pt-40 pb-20 px-6">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#f4d471] rounded-full mb-6"
              >
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-semibold">AI-Powered Technology</span>
              </motion.div>
              
              <h1 className="text-5xl md:text-6xl font-light text-gray-900 mb-6 leading-tight">
                AI-Driven Smart
                <span className="block font-semibold mt-2">Lost and Found System</span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed font-light">
                Harnessing cutting-edge AI to effortlessly reunite lost items with their rightful owners, ensuring peace of mind for everyone.
              </p>
              
              <div className="flex gap-4">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/user-login')}
                  className="flex items-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-2xl font-medium hover:bg-gray-800 transition-all shadow-lg"
                >
                  <Users className="w-5 h-5" />
                  User Login
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/admin-login')}
                  className="flex items-center gap-2 px-8 py-4 bg-white border border-gray-300 text-gray-900 rounded-2xl font-medium hover:bg-gray-50 transition-all"
                >
                  <Shield className="w-5 h-5" />
                  Admin Access
                </motion.button>
              </div>
              
              {/* Trust Indicators */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex items-center gap-12 mt-12 pt-8 border-t border-gray-300"
              >
                <div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">AI</div>
                  <div className="text-sm text-gray-600">Powered</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">24/7</div>
                  <div className="text-sm text-gray-600">Available</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">Secure</div>
                  <div className="text-sm text-gray-600">Platform</div>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="relative bg-white rounded-3xl p-8 shadow-2xl border border-gray-200">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="w-full h-80 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl flex items-center justify-center"
                >
                  <div className="text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="w-24 h-24 bg-[#f4d471] rounded-full mx-auto mb-4 flex items-center justify-center"
                    >
                      <Search className="w-12 h-12 text-gray-900" />
                    </motion.div>
                    <p className="text-gray-600 font-medium">AI Matching Active</p>
                  </div>
                </motion.div>
                
                <motion.div
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                  className="absolute top-12 -right-4 bg-gray-900 text-white rounded-2xl p-4 shadow-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#f4d471] rounded-lg flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-gray-900" />
                    </div>
                    <div>
                      <div className="text-sm font-bold">AI Matching</div>
                      <div className="text-xs opacity-60">Active Now</div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ scale: 0, rotate: 10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
                  className="absolute bottom-12 -left-4 bg-white rounded-2xl p-4 shadow-xl border border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">95% Match</div>
                      <div className="text-xs text-gray-600">Success Rate</div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gray-900 py-16">
        <div className="max-w-[1400px] mx-auto px-6">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-12"
          >
            {[
              { icon: Zap, title: 'Lightning Fast', desc: 'Instant AI matching in seconds', gradient: 'from-[#f4d471] to-yellow-300' },
              { icon: Shield, title: '100% Secure', desc: 'Your data is protected always', gradient: 'from-gray-400 to-gray-300' },
              { icon: Users, title: 'Community First', desc: 'Built for everyone to help', gradient: 'from-[#f4d471] to-yellow-300' }
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                whileHover={{ y: -10 }}
                className="text-center"
              >
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                  className={`w-16 h-16 bg-gradient-to-br ${stat.gradient} rounded-2xl flex items-center justify-center mx-auto mb-6`}
                >
                  <stat.icon className="w-8 h-8 text-gray-900" />
                </motion.div>
                <h3 className="text-2xl font-bold text-white mb-2">{stat.title}</h3>
                <p className="text-gray-400">{stat.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Key Capabilities */}
      <section id="features" className="py-20 bg-[#f4ece0] px-6">
        <div className="max-w-[1400px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-light text-gray-900 mb-4">
              Key <span className="font-semibold">Capabilities</span>
            </h2>
            <p className="text-xl text-gray-600 font-light">Powerful features designed to reunite you with what matters</p>
          </motion.div>
          
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-4 gap-6"
          >
            {[
              { 
                icon: Search, 
                title: 'AI-Powered Matching',
                desc: 'Advanced system intelligently cross-references item characteristics with reported losses through AI, ensuring highly accurate matches instantly.',
                color: 'bg-gray-900',
                textColor: 'text-white'
              },
              { 
                icon: MapPin, 
                title: 'Location-Based Search',
                desc: 'Utilize integrated map system to pinpoint exact locations where items were lost or found, streamlining the search process.',
                color: 'bg-white border border-gray-200',
                textColor: 'text-gray-900'
              },
              { 
                icon: MessageCircle, 
                title: 'Real-Time Chat',
                desc: 'Securely connect and communicate directly with finders or owners through in-app chat, coordinating smooth and safe retrieval.',
                color: 'bg-[#f4d471]',
                textColor: 'text-gray-900'
              },
              { 
                icon: Bell, 
                title: 'Smart Notifications',
                desc: 'Receive instant alerts about potential matches, new activity on reported items, or important updates keeping you informed.',
                color: 'bg-white border border-gray-200',
                textColor: 'text-gray-900'
              }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                whileHover={{ y: -10, scale: 1.02 }}
                className={`${feature.color} rounded-2xl p-8 shadow-lg transition-all duration-300 h-full`}
              >
                <div className={`w-14 h-14 ${feature.color === 'bg-gray-900' ? 'bg-[#f4d471]' : 'bg-gray-900'} rounded-xl flex items-center justify-center mb-6`}>
                  <feature.icon className={`w-7 h-7 ${feature.color === 'bg-gray-900' ? 'text-gray-900' : 'text-white'}`} />
                </div>
                <h3 className={`text-xl font-semibold ${feature.textColor} mb-3`}>{feature.title}</h3>
                <p className={`${feature.color === 'bg-gray-900' ? 'text-gray-300' : 'text-gray-600'} text-sm leading-relaxed`}>
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Our Simple Process */}
      <section id="how-it-works" className="py-20 bg-[#e8e5dc] px-6">
        <div className="max-w-[1400px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-light text-gray-900 mb-4">
              Our Simple <span className="font-semibold">Process</span>
            </h2>
            <p className="text-xl text-gray-600 font-light">Three easy steps to get reunited with your belongings</p>
          </motion.div>
          
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8 relative"
          >
            {/* Connection Lines */}
            <div className="hidden md:block absolute top-20 left-1/4 right-1/4 h-0.5 bg-gray-300" />
            
            {[
              { 
                icon: Upload,
                number: '1',
                title: 'Report Lost or Found',
                desc: 'Quickly submit item details and attach photos. Our intuitive interface guides you through the process.',
                delay: 0
              },
              { 
                icon: Sparkles,
                number: '2',
                title: 'AI Matches & Notifies',
                desc: 'Our intelligent system uses AI to match your report. Receive instant notifications upon potential match.',
                delay: 0.2
              },
              { 
                icon: Award,
                number: '3',
                title: 'Connect & Retrieve',
                desc: 'Once matched, communicate securely to arrange convenient and safe retrieval of your valuable item.',
                delay: 0.4
              }
            ].map((step, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                transition={{ delay: step.delay }}
                whileHover={{ y: -10 }}
                className="relative"
              >
                <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-200 h-full">
                  <div className="relative">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="w-20 h-20 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg relative z-10"
                    >
                      <step.icon className="w-10 h-10 text-[#f4d471]" />
                    </motion.div>
                    <div className="absolute -top-2 -right-2 w-12 h-12 bg-[#f4d471] rounded-full flex items-center justify-center font-bold text-xl text-gray-900 shadow-lg">
                      {step.number}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed text-center text-sm">
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Our Mission */}
      <section id="about" className="py-20 bg-white px-6">
        <div className="max-w-[1200px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-light text-gray-900 mb-6">
              Our <span className="font-semibold">Mission</span>
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed font-light max-w-3xl mx-auto">
              FoundIT is dedicated to simplifying the lost and found process for public spaces. Our mission is to leverage cutting-edge AI technology to connect people with their lost valuables, fostering a community of trust and efficiency.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="w-full h-96 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
              <div className="text-center">
                <Users className="w-24 h-24 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-600 font-medium text-lg">Building Community Together</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 px-6">
        <div className="max-w-[1400px] mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-light text-white mb-6">
              Ready to <span className="font-semibold">Get Started?</span>
            </h2>
            <p className="text-xl text-gray-400 mb-8 font-light">
              Join thousands of users who trust FoundIT to reunite them with their belongings
            </p>
            <div className="flex gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/user-login')}
                className="px-8 py-4 bg-[#f4d471] text-gray-900 rounded-2xl font-semibold hover:bg-yellow-300 transition-all shadow-lg"
              >
                Start Now
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-white/10 text-white rounded-2xl font-semibold hover:bg-white/20 transition-all border border-white/20"
              >
                Learn More
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1a1a1a] text-white py-16 px-6">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
                  <Search className="w-5 h-5 text-[#f4d471]" />
                </div>
                <span className="text-2xl font-bold">FoundIT</span>
              </div>
              <p className="text-gray-400 leading-relaxed text-sm">
                AI-Powered Lost & Found System for Public Spaces
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-4">Company</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#home" className="text-gray-400 hover:text-white transition">Home</a></li>
                <li><a href="#about" className="text-gray-400 hover:text-white transition">About</a></li>
                <li><a href="#features" className="text-gray-400 hover:text-white transition">Features</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-4">Legal</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="text-gray-400 hover:text-white transition">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Terms of Service</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Cookie Policy</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-4">Contact</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="text-gray-400 hover:text-white transition">Support</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Partnerships</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-400 text-sm">
              &copy; 2025 FoundIT. All rights reserved. Built with ❤️ and AI
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;