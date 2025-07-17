import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Files() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [user, setUser] = useState(null);
  const [downloadingFile, setDownloadingFile] = useState(null);
  const [deletingFile, setDeletingFile] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [viewType, setViewType] = useState('grid'); // 'grid' or 'list'
  const [isDeleting, setIsDeleting] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState(3);
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const navigate = useNavigate();

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUser(response.data.user);
      setShowOtpVerification(true);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  };

  const requestOTP = async () => {
    try {
      setSendingOtp(true);
      setOtpError('');
      const token = localStorage.getItem('token');
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/files/request-otp`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setOtpSent(true);
      showToast('OTP sent to your email');
    } catch (error) {
      console.error('Error requesting OTP:', error);
      setOtpError('Failed to send OTP. Please try again.');
    } finally {
      setSendingOtp(false);
    }
  };

  const verifyOTP = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${import.meta.env.VITE_API_URL}/api/files/verify-otp`, 
        { otp },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setOtpVerified(true);
      setOtpError('');
      showToast('OTP verified successfully');
      fetchFiles(1);
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setOtpError(error.response?.data?.message || 'Invalid OTP');
      if (error.response?.data?.remainingAttempts !== undefined) {
        setRemainingAttempts(error.response.data.remainingAttempts);
      }
    }
  };

  const fetchFiles = async (page) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/files/files`, {
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
    
    const handleFileUploaded = () => {
      fetchFiles(1);
    };
    window.addEventListener('filesuploaded', handleFileUploaded);
    
    return () => {
      window.removeEventListener('filesuploaded', handleFileUploaded);
    };
  }, []);

  const showToast = (message) => {
    setToastMessage(message);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const handleDownload = async (fileId, fileName) => {
    try {
      setError(null);
      setDownloadingFile(fileId);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/files/download/${fileId}`, {
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
      showToast('File downloaded successfully!');
    } catch (error) {
      console.error('Error downloading file:', error);
      setError('Failed to download file');
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setDownloadingFile(null);
    }
  };

  const handleDelete = async (fileId) => {
    try {
      setError(null);
      setDeletingFile(fileId);
      setIsDeleting(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      await axios.delete(`${import.meta.env.VITE_API_URL}/api/files/files/${fileId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      showToast('File deleted successfully!');
      await fetchFiles(currentPage);
    } catch (error) {
      console.error('Error deleting file:', error);
      setError('Failed to delete file');
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setDeletingFile(null);
      setShowDeleteConfirm(false);
      setFileToDelete(null);
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes) => {
    if (typeof bytes !== 'number' || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading && otpVerified) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your files...</p>
        </div>
      </div>
    );
  }

  if (!otpVerified && showOtpVerification) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full relative">
          {/* Back Button */}
          <button
            onClick={() => navigate('/dashboard')}
            className="absolute top-4 left-4 text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back</span>
          </button>

          <div className="text-center mb-8">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Identity</h2>
            <p className="text-gray-600">Please verify your identity to access files</p>
            {user?.email && (
              <p className="text-sm text-gray-500 mt-2">{user.email}</p>
            )}
          </div>

          {otpError && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-center">{otpError}</p>
              {remainingAttempts > 0 && otpError.includes('Invalid OTP') && (
                <p className="text-red-600 text-center mt-2">Remaining attempts: {remainingAttempts}</p>
              )}
            </div>
          )}

          <div className="space-y-6">
            {!otpSent ? (
              <button
                onClick={requestOTP}
                disabled={sendingOtp}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {sendingOtp ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending OTP...
                  </>
                ) : (
                  'Send OTP'
                )}
              </button>
            ) : (
              <>
                <div>
                  <input
                    type="text"
                    maxLength="6"
                    className="w-full px-4 py-3 text-center text-2xl tracking-widest rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  />
                  <p className="text-xs text-gray-500 mt-2 text-center">OTP will expire in 3 minutes</p>
                </div>

                <button
                  onClick={verifyOTP}
                  disabled={otp.length !== 6}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Verify OTP
                </button>

                <div className="text-center">
                  <button
                    onClick={requestOTP}
                    disabled={sendingOtp}
                    className="text-green-600 hover:text-green-700 font-medium flex items-center justify-center mx-auto"
                  >
                    {sendingOtp ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Resending...
                      </>
                    ) : (
                      'Resend OTP'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-24 sm:top-32 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-100/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl border border-gray-100">
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Deletion</h3>
              <p className="text-gray-600">Are you sure you want to delete this file? This action cannot be undone.</p>
            </div>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(fileToDelete)}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Greeting */}
        <div className="mb-8">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Welcome back, <span className="text-green-600">{user?.username || 'User'}</span>
              </h1>
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-base"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span>Dashboard</span>
              </button>
            </div>
            <p className="text-base sm:text-lg text-gray-600">Here are all your encrypted files</p>
          </div>
        </div>

        {/* Files Section */}
        <div className="bg-white overflow-hidden shadow-lg rounded-xl">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="bg-green-100 p-3 rounded-xl">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Your Files</h2>
                  <p className="text-sm text-gray-500">{files.length} files stored securely</p>
                </div>
              </div>

              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewType('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewType === 'grid'
                      ? 'bg-white text-green-600 shadow-sm'
                      : 'text-gray-600 hover:text-green-600'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewType('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewType === 'list'
                      ? 'bg-white text-green-600 shadow-sm'
                      : 'text-gray-600 hover:text-green-600'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-red-600">{error}</span>
                </div>
              </div>
            )}

            {!files || files.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p className="text-lg font-medium text-gray-900 mb-2">No files yet</p>
                <p className="text-gray-500">Upload your first file to get started</p>
              </div>
            ) : (
              <div className={viewType === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
                {files.map((file) => (
                  <div
                    key={file._id}
                    className={`bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow ${
                      viewType === 'list' ? 'flex items-center' : ''
                    }`}
                  >
                    <div className={`flex ${viewType === 'list' ? 'items-center w-full' : 'flex-col'}`}>
                      <div className="flex items-start flex-grow min-w-0">
                        <div className="bg-green-100 p-3 rounded-xl mr-4 flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="group/filename relative">
                            <h3 className={`text-lg font-medium text-gray-900 group-hover/filename:text-green-600 transition-colors ${
                              viewType === 'list' ? 'truncate max-w-[300px] sm:max-w-[400px]' : 'line-clamp-1'
                            }`}>
                              {file.originalName}
                            </h3>
                            {/* Show tooltip only if text is truncated */}
                            <div className="hidden group-hover/filename:block absolute left-0 top-full mt-2 z-50">
                              <div className="bg-gray-900 text-white text-sm rounded-lg py-2 px-3 shadow-xl relative">
                                <div className="absolute -top-2 left-4 w-4 h-4 bg-gray-900 transform rotate-45"></div>
                                <div className="relative z-10">
                                  <p className="max-w-[300px] break-all whitespace-normal">{file.originalName}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          <p className={`text-sm text-gray-500 ${viewType === 'list' ? 'truncate' : 'line-clamp-1'}`}>
                            {formatFileSize(file.size)} • Uploaded on {formatDate(file.uploadDate)}
                          </p>
                        </div>
                      </div>

                      <div className={`flex items-center gap-2 ${
                        viewType === 'list' 
                          ? 'ml-4 flex-shrink-0' 
                          : 'justify-end pt-4 mt-4 border-t'
                      }`}>
                        {/* Download Button */}
                        <button
                          onClick={() => handleDownload(file._id, file.originalName)}
                          disabled={downloadingFile === file._id}
                          className={`${
                            viewType === 'list'
                              ? 'p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors'
                              : 'flex-1 sm:flex-initial px-4 py-2 flex items-center justify-center gap-2 text-green-600 bg-green-50 hover:bg-green-100 transition-colors rounded-lg'
                          } ${downloadingFile === file._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title="Download"
                        >
                          {downloadingFile === file._id ? (
                            viewType === 'list' ? (
                              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-green-600"></div>
                            ) : (
                              <>
                                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-green-600"></div>
                                <span className="text-sm font-medium">Downloading...</span>
                              </>
                            )
                          ) : (
                            viewType === 'list' ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                            ) : (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                <span className="text-sm font-medium">Download</span>
                              </>
                            )
                          )}
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => {
                            setFileToDelete(file._id);
                            setShowDeleteConfirm(true);
                          }}
                          disabled={deletingFile === file._id}
                          className={`${
                            viewType === 'list'
                              ? 'p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors'
                              : 'flex-1 sm:flex-initial px-4 py-2 flex items-center justify-center gap-2 text-red-600 bg-red-50 hover:bg-red-100 transition-colors rounded-lg'
                          } ${deletingFile === file._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title="Delete"
                        >
                          {deletingFile === file._id ? (
                            viewType === 'list' ? (
                              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-red-600"></div>
                            ) : (
                              <>
                                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-red-600"></div>
                                <span className="text-sm font-medium">Deleting...</span>
                              </>
                            )
                          ) : (
                            viewType === 'list' ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            ) : (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                <span className="text-sm font-medium">Delete</span>
                              </>
                            )
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Files;