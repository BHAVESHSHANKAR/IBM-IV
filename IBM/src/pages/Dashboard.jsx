import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import uploadingAnimation from '../assets/animations/uploading files.json';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-4">Please try refreshing the page or logging in again.</p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadState, setUploadState] = useState('idle'); // 'idle', 'uploading', 'fragmenting', 'encrypting', 'success'
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const fileInputRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/profile`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setUser(response.data.user);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Failed to load user data');
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleFileUpload = async (event) => {
    const files = event?.target?.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadState('uploading');
    setError(null);
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        // Simulate different states with delays
        setUploadState('fragmenting');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setUploadState('encrypting');
        await new Promise(resolve => setTimeout(resolve, 2000));

        await axios.post(`${import.meta.env.VITE_API_URL}/api/files/upload`, formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      }
      
      setUploadState('success');
      // Show success message
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
        setUploadState('idle');
      }, 3000); // Hide after 3 seconds
      
      // Trigger a refresh of the Files component
      window.dispatchEvent(new CustomEvent('filesuploaded'));
    } catch (error) {
      console.error('Error uploading file:', error);
      setError('Failed to upload file');
      setUploadState('idle');
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setUploading(false);
    }
  };

  // Helper function to get upload state message
  const getUploadStateMessage = () => {
    switch(uploadState) {
      case 'uploading':
        return 'Uploading your files...';
      case 'fragmenting':
        return 'Fragmenting files for enhanced security...';
      case 'encrypting':
        return 'Encrypting file fragments...';
      case 'success':
        return 'Files uploaded successfully!';
      default:
        return '';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* Success Message Toast */}
        {showSuccessMessage && (
          <div className="fixed top-24 sm:top-32 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium">Files uploaded successfully!</span>
            </div>
          </div>
        )}

        {/* Floating Navbar */}
        <header className="fixed w-full top-2 sm:top-4 z-50 px-2 sm:px-4">
          <div className="max-w-[98%] sm:max-w-[95%] mx-auto">
            <div className="bg-white rounded-full shadow-lg border border-green-500 py-2 sm:py-3 px-4 sm:px-10">
              <div className="flex justify-between items-center">
                {/* Left side - FragmentGuard */}
                <div className="flex items-center space-x-4">
                  <span className="bg-green-100 text-green-800 px-4 sm:px-8 py-1.5 sm:py-2.5 rounded-full text-base sm:text-xl font-semibold hover:bg-green-200 transition-colors whitespace-nowrap">
                    FragmentGuard
                  </span>
                  <button
                    onClick={() => navigate('/files')}
                    className="bg-green-600 text-white px-4 sm:px-6 py-1.5 sm:py-2.5 rounded-full text-base sm:text-lg font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>My Files</span>
                  </button>
                </div>

                {/* Right side - Profile */}
                <div className="relative" ref={profileDropdownRef}>
                  <button
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className="flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-green-100 hover:bg-green-200 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 sm:w-8 sm:h-8 text-green-600">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </button>

                  {/* Enhanced Profile Dropdown */}
                  {showProfileDropdown && (
                    <div className="absolute right-0 mt-3 w-[280px] sm:w-[320px] bg-white rounded-2xl shadow-2xl py-3 z-10 border-2 border-green-100">
                      <div className="px-4 sm:px-6 py-3 border-b border-gray-100">
                        <div className="flex items-center space-x-3">
                          <div className="bg-green-100 p-2 rounded-full flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 sm:w-7 sm:h-7 text-green-600">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                            </svg>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="group relative">
                              <p className="text-base sm:text-lg text-gray-900 truncate pr-4">
                                {user?.email || 'No email'}
                              </p>
                              <div className="invisible group-hover:visible absolute left-0 -bottom-1 translate-y-full bg-gray-900 text-white text-sm rounded-lg py-1 px-2 z-20 w-fit max-w-[250px] break-all">
                                {user?.email || 'No email'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="px-2 pt-2">
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-3 flex items-center space-x-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors group"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6 group-hover:text-red-700">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                          </svg>
                          <span className="text-base sm:text-lg font-medium group-hover:text-red-700">Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Adjust padding for different screen sizes */}
        <div className="pt-20 sm:pt-28">
          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7">
            {/* Greeting Section */}
            <div className="mb-7">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Hey! <span className="text-green-600">{user?.username || 'User'}</span>
              </h1>
              <p className="mt-2 text-base sm:text-lg text-gray-600">Welcome to your secure file management dashboard</p>
            </div>

            {/* Upload Files Card - Full Width */}
            <div className="bg-white overflow-hidden shadow-lg rounded-xl transform transition-all duration-200 hover:shadow-xl">
              <div className="p-5 sm:p-7">
                <div className="flex items-center mb-5">
                  <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-green-600">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Upload Files</h2>
                    <p className="text-sm sm:text-base text-gray-600">Supported: DOC, DOCX, JPG, PNG, GTXT</p>
                  </div>
                </div>
                
                <div 
                  className={`border-2 border-dashed border-gray-300 rounded-xl p-7 text-center hover:border-green-500 transition-colors cursor-pointer bg-gray-50 hover:bg-green-50 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const files = e.dataTransfer.files;
                    if (files?.length) {
                      const event = { target: { files } };
                      handleFileUpload(event);
                    }
                  }}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <input 
                    type="file" 
                    className="hidden" 
                    multiple 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt"
                  />
                  <div className="text-gray-500">
                    {uploadState !== 'idle' ? (
                      <div className="flex flex-col items-center">
                        <div className="w-48 h-48 mx-auto mb-4">
                          <Lottie animationData={uploadingAnimation} loop={true} />
                        </div>
                        <p className="text-lg font-medium mb-2">{getUploadStateMessage()}</p>
                        {uploadState !== 'success' && (
                          <div className="w-full max-w-xs mx-auto">
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-green-600 rounded-full transition-all duration-500"
                                style={{ 
                                  width: uploadState === 'uploading' ? '33%' : 
                                         uploadState === 'fragmenting' ? '66%' : 
                                         uploadState === 'encrypting' ? '90%' : '100%' 
                                }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <p className="text-lg font-medium mb-3">Drop files here or click to browse</p>
                        <button className="px-7 py-2.5 bg-green-600 text-white rounded-lg text-base font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 shadow-sm hover:shadow-md">
                          Browse Files
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Project Information Section */}
            <div className="mt-8 space-y-6">
              {/* Main Feature Card */}
              <div className="bg-white overflow-hidden shadow-lg rounded-xl p-5 sm:p-7">
                <div className="flex items-center mb-5">
                  <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-green-600">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Advanced File Security</h2>
                </div>
                <p className="text-gray-600 mb-6">
                  FragmentGuard employs cutting-edge fragmentation encryption technology to ensure your files remain secure and private. Our system splits your files into multiple encrypted fragments, making unauthorized access virtually impossible.
                </p>
                
                {/* Security Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Fragmentation Process */}
                  <div className="bg-green-50 rounded-xl p-5">
                    <div className="flex items-center mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-green-600 mr-2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <h3 className="text-lg font-semibold text-gray-900">Fragmentation Process</h3>
                    </div>
                    <ul className="space-y-2 text-gray-600">
                      <li>• File splitting into multiple encrypted fragments</li>
                      <li>• Unique encryption key for each fragment</li>
                      <li>• Distributed storage across secure servers</li>
                      <li>• Real-time fragment verification</li>
                    </ul>
                  </div>

                  {/* Security Features */}
                  <div className="bg-green-50 rounded-xl p-5">
                    <div className="flex items-center mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-green-600 mr-2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                      </svg>
                      <h3 className="text-lg font-semibold text-gray-900">Security Features</h3>
                    </div>
                    <ul className="space-y-2 text-gray-600">
                      <li>• End-to-end encryption</li>
                      <li>• Zero-knowledge architecture</li>
                      <li>• Secure key management</li>
                      <li>• Automatic fragment rotation</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* How It Works */}
              <div className="bg-white overflow-hidden shadow-lg rounded-xl p-5 sm:p-7">
                <div className="flex items-center mb-5">
                  <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-green-600">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                    </svg>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">How It Works</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {/* Upload */}
                  <div className="bg-green-50 rounded-xl p-5">
                    <div className="flex items-center mb-3">
                      <span className="bg-green-200 text-green-800 rounded-full w-8 h-8 flex items-center justify-center font-semibold mr-3">1</span>
                      <h3 className="text-lg font-semibold text-gray-900">Upload</h3>
                    </div>
                    <p className="text-gray-600">Your file is securely uploaded and immediately prepared for fragmentation</p>
                  </div>

                  {/* Fragment & Encrypt */}
                  <div className="bg-green-50 rounded-xl p-5">
                    <div className="flex items-center mb-3">
                      <span className="bg-green-200 text-green-800 rounded-full w-8 h-8 flex items-center justify-center font-semibold mr-3">2</span>
                      <h3 className="text-lg font-semibold text-gray-900">Fragment & Encrypt</h3>
                    </div>
                    <p className="text-gray-600">Files are split into fragments and each piece is individually encrypted</p>
                  </div>

                  {/* Secure Storage */}
                  <div className="bg-green-50 rounded-xl p-5">
                    <div className="flex items-center mb-3">
                      <span className="bg-green-200 text-green-800 rounded-full w-8 h-8 flex items-center justify-center font-semibold mr-3">3</span>
                      <h3 className="text-lg font-semibold text-gray-900">Secure Storage</h3>
                    </div>
                    <p className="text-gray-600">Encrypted fragments are distributed across multiple secure locations</p>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default Dashboard;