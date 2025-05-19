import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import apiClient from '../../../api/apiClient';
import authBg from "../../../assets/images/waterlog.jpg";

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [warning, setWarning] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setEmail(e.target.value);
    setWarning('');
    setSuccess('');
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      setWarning('Email is required');
      return;
    }
    if (!validateEmail(email)) {
      setWarning('Please enter a valid email address');
      return;
    }
  
    apiClient.post('/auth/forgot-password/', { email })
      .then(response => {
        setSuccess(response.data.message);
        setTimeout(() => navigate('/otp-verification', { state: { email } }), 2000);
      })
      .catch(error => {
        setWarning(error.response?.data?.error || 'Failed to send OTP. Please try again.');
      });
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Forgot Password</h1>
          <p className="text-sm text-gray-600 mb-6">Enter your email address to receive an OTP for password reset.</p>
          {warning && <p className="text-sm text-red-500 mb-4">{warning}</p>}
          {success && <p className="text-sm text-green-500 mb-4">{success}</p>}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Email address</label>
              <input
                type="email"
                name="email"
                value={email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Email address"
              />
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Send OTP
            </button>
            <p className="text-xs text-gray-500 text-center">By continuing, you agree to our <a href="#" className="text-blue-600 hover:underline">privacy policy</a> and <a href="#" className="text-blue-600 hover:underline">terms of use</a></p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;