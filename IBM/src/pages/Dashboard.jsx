import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

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
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
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
        const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/profile`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setUser(response.data.user);
        await fetchFiles(1);
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

  const fetchFiles = async (page) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/files/files`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data) {
        setFiles(response.data || []);
        setCurrentPage(1);
        setTotalPages(1);
        setError(null);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
      setError('Failed to load files');
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  };

  const handleFileUpload = async (event) => {
    const files = event?.target?.files;
    if (!files || files.length === 0) return;

    setUploading(true);
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

        await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/files/upload`, formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      }
      await fetchFiles(currentPage);
      setError(null);
    } catch (error) {
      console.error('Error uploading file:', error);
      setError('Failed to upload file');
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (fileId, fileName) => {
    try {
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/files/download/${fileId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      setError('Failed to download file');
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;

    try {
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/files/files/${fileId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      await fetchFiles(currentPage);
    } catch (error) {
      console.error('Error deleting file:', error);
      setError('Failed to delete file');
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatFileSize = (bytes) => {
    if (typeof bytes !== 'number' || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h1 className="text-2xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
            <div className="flex items-center gap-4">
              <div className="text-center sm:text-right">
                <p className="text-sm sm:text-base font-medium text-gray-900">{user?.username || 'User'}</p>
                <p className="text-xs sm:text-sm text-gray-500">{user?.email || ''}</p>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 sm:px-5 py-2 border border-transparent rounded-lg shadow-sm text-sm sm:text-base font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upload Files Card */}
            <div className="bg-white overflow-hidden shadow-lg rounded-2xl transform transition-all duration-200 hover:shadow-xl">
              <div className="p-6 sm:p-8">
                <div className="flex items-center justify-center w-14 sm:w-16 h-14 sm:h-16 bg-green-100 rounded-2xl mb-4 sm:mb-5">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 sm:w-8 h-7 sm:h-8 text-green-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Upload Files</h2>
                <p className="text-sm sm:text-base text-gray-600 mb-6">
                  Drag and drop your files here or click to browse
                  <br />
                  <span className="text-xs text-gray-500">
                    Supported: PDF, DOC, DOCX, JPG, PNG, GIF, TXT (Max 10MB)
                  </span>
                </p>
                <div 
                  className={`border-2 border-dashed border-gray-300 rounded-xl p-6 sm:p-8 text-center hover:border-green-500 transition-colors cursor-pointer bg-gray-50 hover:bg-green-50 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
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
                    {uploading ? (
                      <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500 mb-2"></div>
                        <p className="text-sm">Uploading...</p>
                      </div>
                    ) : (
                      <>
                        <p className="text-base sm:text-lg font-medium mb-2">Drop files here</p>
                        <p className="text-sm mb-3">or</p>
                        <button className="px-6 py-3 bg-green-600 text-white rounded-lg text-sm sm:text-base font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 shadow-sm hover:shadow-md">
                          Browse Files
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Get Files Card */}
            <div className="bg-white overflow-hidden shadow-lg rounded-2xl transform transition-all duration-200 hover:shadow-xl">
              <div className="p-6 sm:p-8">
                <div className="flex items-center justify-center w-14 sm:w-16 h-14 sm:h-16 bg-blue-100 rounded-2xl mb-4 sm:mb-5">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 sm:w-8 h-7 sm:h-8 text-blue-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0-6.75h-3m3 0h3M12 3v1.5m0 0h-3m3 0h3" />
                  </svg>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Your Files</h2>
                <p className="text-sm sm:text-base text-gray-600 mb-6">Access and manage your uploaded files</p>
                <div className="bg-gray-50 rounded-xl p-4 sm:p-5">
                  <div className="space-y-3">
                    {!files || files.length === 0 ? (
                      <div className="flex items-center justify-between p-3 sm:p-4 bg-white rounded-lg shadow-sm">
                        <div className="flex items-center space-x-3">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 sm:w-7 h-6 sm:h-7 text-gray-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                          <span className="text-sm sm:text-base font-medium text-gray-700">No files uploaded yet</span>
                        </div>
                      </div>
                    ) : (
                      files.map((file) => (
                        <div key={file._id} className="flex items-center justify-between p-3 sm:p-4 bg-white rounded-lg shadow-sm hover:shadow transition-shadow">
                          <div className="flex items-center space-x-3 flex-grow min-w-0">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 sm:w-7 h-6 sm:h-7 text-gray-400">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm sm:text-base font-medium text-gray-900 truncate">{file.originalName}</p>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(file.size)} • {formatDate(file.uploadDate)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => handleDownload(file._id, file.originalName)}
                              className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                              title="Download"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(file._id)}
                              className="p-2 text-red-600 hover:text-red-800 transition-colors"
                              title="Delete"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default Dashboard;