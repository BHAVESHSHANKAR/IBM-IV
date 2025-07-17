import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Lottie from 'lottie-react';
import fileTransferAnimation from '../assets/animations/Files Transfer Lottie animation.json';

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
          .gradient-text {
            background: linear-gradient(120deg, #059669, #10B981);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
        `}
      </style>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center bg-gradient-to-br from-green-50 via-white to-green-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-24">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            <div className="lg:w-1/2" ref={addToRefs}>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-gray-900 mb-6 lg:mb-8">
                <span className="gradient-text">FragmentGuard</span>
                <br />
                <span className="text-3xl sm:text-4xl lg:text-5xl">Advanced File Security</span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 mb-8 lg:mb-12 leading-relaxed">
                Experience next-generation file security with our innovative fragmentation system.
                Military-grade encryption combined with smart file splitting ensures your data remains
                impenetrable.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                <Link
                  to="/signup"
                  className="px-8 py-4 bg-green-600 text-white text-lg rounded-xl hover:bg-green-700 transition-all transform hover:scale-105 duration-200 text-center"
                >
                  Get Started
                </Link>
                <Link
                  to="/login"
                  className="px-8 py-4 border-2 border-green-600 text-green-600 text-lg rounded-xl hover:bg-green-50 transition-all text-center"
                >
                  Login
                </Link>
              </div>
            </div>
            <div className="lg:w-1/2" ref={addToRefs}>
              <div className="w-full max-w-xl mx-auto lg:max-w-none">
                <Lottie 
                  animationData={fileTransferAnimation}
                  className="w-full h-[300px] md:h-[400px] lg:h-[500px]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-12 lg:mb-16" ref={addToRefs}>
            Advanced Security Features
          </h2>
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
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
                className="p-6 lg:p-8 bg-gradient-to-br from-white to-green-50 rounded-2xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                  <span className="text-2xl">{feature.icon}</span>
                </div>
                <h3 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 text-lg leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-white to-green-50" ref={addToRefs}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-6">
            How It Works
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 text-center mb-12 lg:mb-16 max-w-3xl mx-auto">
            Our advanced system ensures your files are protected through a sophisticated process
            of fragmentation, encryption, and secure storage.
          </p>
          
          <div className="space-y-12 lg:space-y-24">
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
              }
            ].map((step, index) => (
              <div
                key={index}
                className="flex flex-col lg:flex-row items-start gap-8 lg:gap-16"
                ref={addToRefs}
              >
                <div className="flex items-center gap-4 lg:w-48">
                  <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {step.step}
                  </div>
                  <div className="text-3xl hidden lg:block">{step.icon}</div>
                </div>
                
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 text-lg mb-4">{step.description}</p>
                  <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {step.details.map((detail, idx) => (
                      <li key={idx} className="text-gray-500 flex items-center gap-2 bg-white px-4 py-2 rounded-lg">
                        <span className="text-green-500">✓</span>
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Highlight Section */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-start gap-12 lg:gap-16">
            <div className="lg:w-1/2" ref={addToRefs}>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8">
                Why Choose FragmentGuard?
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
                  <div key={index} className="flex items-start gap-4 p-4 rounded-xl transition-all duration-300 hover:bg-green-50">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                      <p className="text-gray-600">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:w-1/2 flex justify-center items-center" ref={addToRefs}>
              <div className="w-full max-w-md">
                <Lottie 
                  animationData={fileTransferAnimation}
                  className="w-full h-[400px]"
                  loop={true}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24" ref={addToRefs}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-3xl p-8 lg:p-16 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Ready to Secure Your Data?
            </h2>
            <p className="text-green-50 text-lg sm:text-xl mb-8 lg:mb-12 max-w-3xl mx-auto">
              Join thousands of organizations that trust FragmentGuard.
              Start protecting your sensitive data today with our advanced security solution.
            </p>
            <Link
              to="/signup"
              className="inline-block px-8 sm:px-12 py-4 sm:py-6 bg-white text-green-600 rounded-xl text-lg sm:text-xl font-semibold hover:bg-green-50 transition-all transform hover:scale-105 duration-200"
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