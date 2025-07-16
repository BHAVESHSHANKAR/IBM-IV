import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import filesImage from '../assets/images/files.jpg';

function Home() {
  const animatedRefs = useRef([]);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);

    const elements = animatedRefs.current;
    elements.forEach(el => observer.observe(el));

    return () => elements.forEach(el => observer.unobserve(el));
  }, []);

  const addToRefs = (el) => {
    if (el && !animatedRefs.current.includes(el)) {
      animatedRefs.current.push(el);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <style>
        {`
          @keyframes slideUp {
            from { transform: translateY(50px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes scaleIn {
            from { transform: scale(0.9); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
            100% { transform: translateY(0px); }
          }
          .animate-hidden {
            opacity: 0;
            transform: translateY(50px);
          }
          .animate-in {
            animation: slideUp 0.6s ease-out forwards;
          }
          .fade-in {
            animation: fadeIn 0.6s ease-out forwards;
          }
          .scale-in {
            animation: scaleIn 0.6s ease-out forwards;
          }
          .float {
            animation: float 6s ease-in-out infinite;
          }
          .gradient-text {
            background: linear-gradient(120deg, #059669, #10B981);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
        `}
      </style>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center bg-gradient-to-br from-green-50 via-white to-green-50 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxIDAgNiAyLjY5IDYgNnMtMi42OSA2LTYgNi02LTIuNjktNi02IDIuNjktNiA2LTZ6IiBzdHJva2U9IiMwMDgwMDAiIG9wYWNpdHk9Ii4yIi8+PC9nPjwvc3ZnPg==')] opacity-10"></div>
        <div className="container mx-auto px-6 py-24">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2 lg:pr-12" ref={addToRefs}>
              <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 mb-8">
                <span className="gradient-text">Secure</span> Your Data with Advanced Fragmentation
              </h1>
              <p className="text-xl text-gray-600 mb-12 leading-relaxed">
                Experience next-generation file security with our innovative fragmentation system.
                Military-grade encryption combined with smart file splitting ensures your data remains
                impenetrable.
              </p>
              <div className="flex gap-6">
                <Link
                  to="/signup"
                  className="px-8 py-4 bg-green-600 text-white text-lg rounded-xl hover:bg-green-700 transition-colors transform hover:scale-105 duration-200 shadow-lg hover:shadow-xl"
                >
                  Get Started Free
                </Link>
                <Link
                  to="/login"
                  className="px-8 py-4 border-2 border-green-600 text-green-600 text-lg rounded-xl hover:bg-green-50 transition-colors shadow-lg hover:shadow-xl"
                >
                  Login
                </Link>
              </div>
            </div>
            <div className="lg:w-1/2" ref={addToRefs}>
              <div className="relative w-full max-w-xl mx-auto lg:max-w-none">
                <div className="absolute inset-0 bg-gradient-to-r from-green-200 to-green-100 rounded-full blur-3xl opacity-30"></div>
                <div className="relative transform hover:scale-105 transition-transform duration-300 float">
                  <img 
                    src={filesImage} 
                    alt="Secure File Storage System" 
                    className="w-full h-[300px] md:h-[350px] lg:h-[400px] object-contain drop-shadow-xl rounded-3xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16" ref={addToRefs}>
            Advanced Security Features
          </h2>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                icon: '🔄',
                title: 'Smart Fragmentation',
                description: 'Intelligent file splitting with redundancy and optimal chunk sizing for maximum security.'
              },
              {
                icon: '🔐',
                title: 'AES-256 Encryption',
                description: 'Each fragment is protected with military-grade encryption, making unauthorized access virtually impossible.'
              },
              {
                icon: '🔑',
                title: 'Access Control',
                description: 'Granular permissions and multi-factor authentication ensure only authorized users can reconstruct files.'
              }
            ].map((feature, index) => (
              <div
                key={index}
                ref={addToRefs}
                className="p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                  <span className="text-3xl">{feature.icon}</span>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 text-lg leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-gradient-to-b from-green-50 to-white" ref={addToRefs}>
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-8">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 text-center mb-16 max-w-3xl mx-auto px-4">
            Our advanced system ensures your files are protected through a sophisticated process
            of fragmentation, encryption, and secure storage.
          </p>
          <div className="relative">
            {/* Timeline line - hidden on mobile */}
            <div className="absolute top-0 left-1/2 w-1 h-full bg-green-200 transform -translate-x-1/2 rounded hidden lg:block"></div>
            
            {[
              {
                step: '01',
                title: 'Secure Upload',
                description: 'Files are uploaded through an encrypted channel with end-to-end protection.',
                icon: '📤',
                details: ['SSL/TLS encryption', 'Integrity verification', 'Upload resumption']
              },
              {
                step: '02',
                title: 'Smart Fragmentation',
                description: 'Files are intelligently split into multiple fragments with redundancy.',
                icon: '🔄',
                details: ['Optimal chunk sizing', 'Redundancy allocation', 'Fragment validation']
              },
              {
                step: '03',
                title: 'Advanced Encryption',
                description: 'Each fragment is encrypted using AES-256 with unique keys.',
                icon: '🔐',
                details: ['AES-256 encryption', 'Unique IV per fragment', 'Secure key management']
              },
              {
                step: '04',
                title: 'Distributed Storage',
                description: 'Encrypted fragments are stored across secure, distributed locations.',
                icon: '☁️',
                details: ['Geographic distribution', 'Redundant storage', 'Continuous monitoring']
              }
            ].map((step, index) => (
              <div
                key={index}
                className={`relative flex flex-col lg:flex-row items-center gap-8 mb-16 ${
                  index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
                }`}
                ref={addToRefs}
              >
                {/* Content */}
                <div className={`flex-1 w-full lg:w-auto ${
                  index % 2 === 0 ? 'lg:text-right lg:pr-16' : 'lg:text-left lg:pl-16'
                }`}>
                  <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg">
                    <div className="flex items-center gap-4 mb-4 justify-center lg:justify-start">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center lg:hidden">
                        <span className="text-2xl">{step.icon}</span>
                      </div>
                      <h3 className="text-2xl font-semibold text-gray-900">
                        <span className="text-green-600">{step.step}.</span> {step.title}
                      </h3>
                    </div>
                    <p className="text-gray-600 text-lg mb-6">{step.description}</p>
                    <ul className="space-y-3">
                      {step.details.map((detail, idx) => (
                        <li key={idx} className="text-gray-500 flex items-center gap-2">
                          <span className="text-green-500">✓</span>
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Step number circle - visible only on larger screens */}
                <div className="hidden lg:flex items-center justify-center w-20">
                  <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg z-10">
                    {step.step}
                  </div>
                </div>

                {/* Empty space for alternating layout */}
                <div className="flex-1 hidden lg:block"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Highlight Section */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2" ref={addToRefs}>
              <h2 className="text-4xl font-bold text-gray-900 mb-8">
                Why Choose Our Solution?
              </h2>
              <div className="space-y-6">
                {[
                  {
                    title: 'Unbreakable Security',
                    description: 'Fragment-level encryption makes unauthorized access virtually impossible',
                    icon: '🔒'
                  },
                  {
                    title: 'Smart Storage',
                    description: 'Secure metadata storage in MongoDB for reliable file reconstruction',
                    icon: '💾'
                  },
                  {
                    title: 'Enterprise Ready',
                    description: 'Built on proven MERN stack technology for scalability and performance',
                    icon: '🏢'
                  },
                  {
                    title: 'Compliance Ready',
                    description: 'Perfect for organizations requiring highest level of data security',
                    icon: '✅'
                  }
                ].map((item, index) => (
                  <div key={index} className="bg-white p-6 rounded-xl shadow-lg transform hover:scale-102 transition-all duration-300">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center gap-3">
                      <span className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-2xl">
                        {item.icon}
                      </span>
                      {item.title}
                    </h3>
                    <p className="text-gray-600 pl-[52px]">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:w-1/2" ref={addToRefs}>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-200 to-green-100 rounded-full blur-3xl opacity-30"></div>
                <div className="relative bg-white p-8 rounded-2xl shadow-2xl transform hover:scale-105 transition-transform duration-300">
                  <div className="h-[400px] bg-gradient-to-br from-green-50 to-white rounded-xl flex items-center justify-center">
                    <div className="relative">
                      <div className="absolute inset-0 bg-green-100 rounded-full blur-2xl opacity-30"></div>
                      <div className="relative text-8xl animate-float flex flex-col items-center">
                        <span className="text-green-600 text-9xl mb-4">🛡️</span>
                        <div className="text-sm font-semibold text-green-700 bg-green-50 px-4 py-2 rounded-full">
                          Enterprise-Grade Security
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-gradient-to-b from-white to-green-50" ref={addToRefs}>
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12">
            {[
              { number: '99.99%', label: 'Uptime Guarantee', icon: '⚡' },
              { number: '256-bit', label: 'AES Encryption', icon: '🔒' },
              { number: '24/7', label: 'Expert Support', icon: '💬' },
              { number: '100%', label: 'Satisfaction', icon: '⭐' }
            ].map((stat, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-lg text-center">
                <div className="text-4xl mb-4">{stat.icon}</div>
                <div className="text-5xl font-bold text-green-600 mb-4">{stat.number}</div>
                <div className="text-gray-600 text-lg">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24" ref={addToRefs}>
        <div className="container mx-auto px-6">
          <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-3xl p-16 text-center">
            <h2 className="text-4xl font-bold text-white mb-8">
              Ready to Secure Your Data?
            </h2>
            <p className="text-green-50 text-xl mb-12 max-w-3xl mx-auto">
              Join thousands of organizations that trust our secure file storage system.
              Start protecting your sensitive data today with our advanced security solution.
            </p>
            <Link
              to="/signup"
              className="inline-block px-12 py-6 bg-white text-green-600 rounded-xl text-xl font-semibold hover:bg-green-50 transition-colors transform hover:scale-105 duration-200 shadow-xl"
            >
              Get Started Now
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;