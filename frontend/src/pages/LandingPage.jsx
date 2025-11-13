import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, MessageCircle, Bell, Upload, Sparkles, Award, Zap, Shield, Users, ArrowRight, CheckCircle } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e8e5dc] to-[#f4ece0]">
      {/* Hero Section */}
      <section id="home" className="pt-32 pb-20 px-6">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#f4d471] rounded-full mb-6 shadow-md">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-semibold">AI-Powered Technology</span>
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-light text-gray-900 mb-6 leading-tight">
                AI-Driven Smart
                <span className="block font-bold mt-2 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Lost and Found System
                </span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Harnessing cutting-edge AI to effortlessly reunite lost items with their rightful owners, ensuring peace of mind for everyone.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => navigate('/user-login')}
                  className="flex items-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-2xl font-medium hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <Users className="w-5 h-5" />
                  User Login
                  <ArrowRight className="w-5 h-5" />
                </button>
                
                <button
                  onClick={() => navigate('/admin-login')}
                  className="flex items-center gap-2 px-8 py-4 bg-white border-2 border-gray-300 text-gray-900 rounded-2xl font-medium hover:bg-gray-50 transition-all hover:scale-105 shadow-md"
                >
                  <Shield className="w-5 h-5" />
                  Admin Access
                </button>
              </div>
              
              {/* Trust Indicators */}
              <div className="flex items-center gap-8 mt-12 pt-8 border-t border-gray-300">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-1">AI</div>
                  <div className="text-sm text-gray-600">Powered</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-1">24/7</div>
                  <div className="text-sm text-gray-600">Available</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-1">Secure</div>
                  <div className="text-sm text-gray-600">Platform</div>
                </div>
              </div>
            </div>

            {/* Right Image - Real Life Photo */}
            <div className="relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                {/* Lost and Found service counter/desk image */}
                <img 
                  src="https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=800&h=600&fit=crop" 
                  alt="Lost and Found Service Counter"
                  className="w-full h-[500px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent"></div>
                
                {/* Floating Cards */}
                <div className="absolute top-8 left-8 bg-white rounded-2xl p-4 shadow-xl animate-float">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#f4d471] rounded-xl flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-gray-900" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">AI Match Found</div>
                      <div className="text-xs text-gray-600">95% Accuracy</div>
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-8 right-8 bg-gray-900 text-white rounded-2xl p-4 shadow-xl animate-float-delayed">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-bold">Item Returned</div>
                      <div className="text-xs opacity-75">Just now</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gray-900 py-20">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { icon: Zap, title: 'Lightning Fast', desc: 'AI matching in seconds', gradient: 'from-[#f4d471] to-yellow-300' },
              { icon: Shield, title: '100% Secure', desc: 'Protected data always', gradient: 'from-gray-400 to-gray-300' },
              { icon: Users, title: 'Community First', desc: 'Built for everyone', gradient: 'from-[#f4d471] to-yellow-300' }
            ].map((stat, idx) => (
              <div key={idx} className="text-center group cursor-pointer">
                <div className={`w-20 h-20 bg-gradient-to-br ${stat.gradient} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                  <stat.icon className="w-10 h-10 text-gray-900" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{stat.title}</h3>
                <p className="text-gray-400">{stat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-light text-gray-900 mb-4">
              Key <span className="font-bold">Features</span>
            </h2>
            <p className="text-xl text-gray-600">Everything you need to find what matters</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { 
                icon: Search, 
                title: 'AI Matching',
                desc: 'Smart algorithm matches lost items with found reports instantly.',
                color: 'bg-gray-900',
                iconBg: 'bg-[#f4d471]',
                textColor: 'text-white'
              },
              { 
                icon: MapPin, 
                title: 'Location Tracking',
                desc: 'Pinpoint where items were lost or found on interactive maps.',
                color: 'bg-white',
                iconBg: 'bg-gray-900',
                textColor: 'text-gray-900'
              },
              { 
                icon: MessageCircle, 
                title: 'Real-Time Chat',
                desc: 'Connect instantly with finders through secure messaging.',
                color: 'bg-[#f4d471]',
                iconBg: 'bg-gray-900',
                textColor: 'text-gray-900'
              },
              { 
                icon: Bell, 
                title: 'Instant Alerts',
                desc: 'Get notified immediately when potential matches are found.',
                color: 'bg-white',
                iconBg: 'bg-gray-900',
                textColor: 'text-gray-900'
              }
            ].map((feature, idx) => (
              <div
                key={idx}
                className={`${feature.color} rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 border border-gray-200`}
              >
                <div className={`w-16 h-16 ${feature.iconBg} rounded-2xl flex items-center justify-center mb-6 shadow-md`}>
                  <feature.icon className={`w-8 h-8 ${feature.color === 'bg-gray-900' ? 'text-gray-900' : 'text-white'}`} />
                </div>
                <h3 className={`text-xl font-bold ${feature.textColor} mb-3`}>{feature.title}</h3>
                <p className={`${feature.color === 'bg-gray-900' ? 'text-gray-300' : 'text-gray-600'} leading-relaxed`}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-white px-6">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-light text-gray-900 mb-4">
              How It <span className="font-bold">Works</span>
            </h2>
            <p className="text-xl text-gray-600">Three simple steps to reunite with your items</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                icon: Upload,
                number: '1',
                title: 'Report Lost or Found',
                desc: 'Submit details with photos through our easy interface.',
                image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop'
              },
              { 
                icon: Sparkles,
                number: '2',
                title: 'AI Matches Instantly',
                desc: 'Our AI analyzes and finds potential matches automatically.',
                image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop'
              },
              { 
                icon: Award,
                number: '3',
                title: 'Connect & Retrieve',
                desc: 'Chat securely and arrange safe item retrieval.',
                image: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=400&h=300&fit=crop'
              }
            ].map((step, idx) => (
              <div key={idx} className="relative group">
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all border border-gray-200">
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={step.image} 
                      alt={step.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-4 right-4 w-14 h-14 bg-[#f4d471] rounded-full flex items-center justify-center font-bold text-2xl text-gray-900 shadow-lg">
                      {step.number}
                    </div>
                  </div>
                  <div className="p-8">
                    <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <step.icon className="w-8 h-8 text-[#f4d471]" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">{step.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section id="about" className="py-20 bg-gradient-to-br from-gray-900 to-gray-800 px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-5xl font-light text-white mb-6">
                Our <span className="font-bold">Mission</span>
              </h2>
              <p className="text-xl text-gray-300 leading-relaxed mb-8">
                FoundIT is dedicated to simplifying the lost and found process for public spaces. We leverage cutting-edge AI technology to connect people with their lost valuables, fostering a community of trust and efficiency.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#f4d471] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-6 h-6 text-gray-900" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">AI-Powered</h4>
                    <p className="text-gray-400 text-sm">Advanced matching algorithms</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#f4d471] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-gray-900" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">Secure & Private</h4>
                    <p className="text-gray-400 text-sm">Your data is always protected</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#f4d471] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-gray-900" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">Community-Driven</h4>
                    <p className="text-gray-400 text-sm">Built for people helping people</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=500&fit=crop" 
                alt="Community helping each other"
                className="rounded-3xl shadow-2xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-[#f4d471] rounded-2xl p-6 shadow-xl">
                <div className="text-4xl font-bold text-gray-900 mb-1">1000+</div>
                <div className="text-sm text-gray-800">Items Reunited</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#f4d471] to-yellow-300 px-6">
        <div className="max-w-[1400px] mx-auto text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-800 mb-10 max-w-2xl mx-auto">
            Join thousands of users who trust FoundIT to reunite them with their belongings
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => navigate('/user-login')}
              className="px-10 py-4 bg-gray-900 text-white rounded-2xl font-bold text-lg hover:bg-gray-800 transition-all shadow-xl hover:shadow-2xl hover:scale-105"
            >
              Start Now - It's Free
            </button>
            <button
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-10 py-4 bg-white text-gray-900 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all shadow-xl hover:scale-105"
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1a1a1a] text-white py-16 px-6">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center">
                  <Search className="w-6 h-6 text-[#f4d471]" />
                </div>
                <span className="text-2xl font-bold">FoundIT</span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                AI-Powered Lost & Found System for Public Spaces
              </p>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4">Company</h4>
              <ul className="space-y-3">
                <li>
                  <button 
                    onClick={() => document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' })}
                    className="text-gray-400 hover:text-[#f4d471] transition"
                  >
                    Home
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
                    className="text-gray-400 hover:text-[#f4d471] transition"
                  >
                    About
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                    className="text-gray-400 hover:text-[#f4d471] transition"
                  >
                    Features
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4">Legal</h4>
              <ul className="space-y-3">
                <li>
                  <button 
                    onClick={() => alert('Privacy Policy page coming soon!')}
                    className="text-gray-400 hover:text-[#f4d471] transition"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => alert('Terms of Service page coming soon!')}
                    className="text-gray-400 hover:text-[#f4d471] transition"
                  >
                    Terms of Service
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => alert('Cookie Policy page coming soon!')}
                    className="text-gray-400 hover:text-[#f4d471] transition"
                  >
                    Cookie Policy
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4">Contact</h4>
              <ul className="space-y-3">
                <li>
                  <button 
                    onClick={() => alert('Support page coming soon!')}
                    className="text-gray-400 hover:text-[#f4d471] transition"
                  >
                    Support
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => alert('Partnerships page coming soon!')}
                    className="text-gray-400 hover:text-[#f4d471] transition"
                  >
                    Partnerships
                  </button>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-400">
              &copy; 2025 FoundIT. All rights reserved. Built with ❤️ and AI
            </p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 3s ease-in-out infinite 1.5s;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;