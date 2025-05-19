import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import apiClient from '../../../api/apiClient';
import { Eye, EyeOff } from 'lucide-react'; 
import authBg from "../../../assets/images/waterlog.jpg";

const ResetPassword = () => {
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmNewPassword: '',
  });
  const [warnings, setWarnings] = useState({
    newPassword: '',
    confirmNewPassword: '',
    general: '',
  });
  const [success, setSuccess] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    newPassword: false,
    confirmNewPassword: false,
  });
  const navigate = useNavigate();
  const location = useLocation();
  const { email } = location.state || {};

  const handleChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    setWarnings({ ...warnings, [e.target.name]: '', general: '' });
    setSuccess('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let hasError = false;
    const newWarnings = { newPassword: '', confirmNewPassword: '', general: '' };
  
    if (!passwordData.newPassword) {
      newWarnings.newPassword = 'New password is required';
      hasError = true;
    } else if (passwordData.newPassword.length < 6) {
      newWarnings.newPassword = 'Password must be at least 6 characters long';
      hasError = true;
    }
  
    if (!passwordData.confirmNewPassword) {
      newWarnings.confirmNewPassword = 'Please confirm your new password';
      hasError = true;
    } else if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      newWarnings.confirmNewPassword = 'Passwords do not match';
      hasError = true;
    }
  
    if (hasError) {
      setWarnings(newWarnings);
      return;
    }
  
    apiClient.post('/auth/reset-password/', {
      email,
      new_password: passwordData.newPassword,
      confirm_new_password: passwordData.confirmNewPassword,
    })
      .then(response => {
        setSuccess(response.data.message);
        setTimeout(() => navigate('/login'), 2000);
      })
      .catch(error => {
        setWarnings({
          ...warnings,
          general: error.response?.data?.error || 'Failed to reset password. Please try again.',
        });
      });
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50"           style={{
      backgroundImage: `url(${authBg})`,
      objectFit: 'fill',
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'cover',
      backgroundPosition:"center 30%"
    }}>
      <div className="w-full max-w-md flex rounded-xl shadow-lg overflow-hidden">
        <div className="w-full p-8 bg-white">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h1>
          <p className="text-sm text-gray-600 mb-6">Set a new password for your account ({email || 'your email'}).</p>
          {warnings.general && <p className="text-sm text-red-500 mb-4">{warnings.general}</p>}
          {success && <p className="text-sm text-green-500 mb-4">{success}</p>}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <label className="block text-sm text-gray-700 mb-2">New Password</label>
              <input
                type={showPasswords.newPassword ? 'text' : 'password'}
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('newPassword')}
                className="absolute right-2 top-[48px] transform -translate-y-1/2 text-gray-600 hover:text-gray-800"
              >
                {showPasswords.newPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              {warnings.newPassword && <p className="text-sm text-red-500 mt-1">{warnings.newPassword}</p>}
            </div>
            <div className="relative">
              <label className="block text-sm text-gray-700 mb-2">Confirm New Password</label>
              <input
                type={showPasswords.confirmNewPassword ? 'text' : 'password'}
                name="confirmNewPassword"
                value={passwordData.confirmNewPassword}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                placeholder="Re-enter new password"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirmNewPassword')}
                className="absolute right-2 top-[48px] transform -translate-y-1/2 text-gray-600 hover:text-gray-800"
              >
                {showPasswords.confirmNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              {warnings.confirmNewPassword && <p className="text-sm text-red-500 mt-1">{warnings.confirmNewPassword}</p>}
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reset Password
            </button>
            <p className="text-xs text-gray-500 text-center">By continuing, you agree to our <a href="#" className="text-blue-600 hover:underline">privacy policy</a> and <a href="#" className="text-blue-600 hover:underline">terms of use</a></p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;