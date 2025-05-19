import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import apiClient from '../../../api/apiClient';
import authBg from "../../../assets/images/waterlog.jpg";

const OTPVerification = () => {
  const [otp, setOtp] = useState('');
  const [warning, setWarning] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { email } = location.state || {};

  const handleChange = (e) => {
    setOtp(e.target.value);
    setWarning('');
    setSuccess('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!otp) {
      setWarning('OTP is required');
      return;
    }
    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      setWarning('OTP must be a 6-digit number');
      return;
    }
  
    apiClient.post('/auth/otp-verification/', { email, otp })
      .then(response => {
        setSuccess(response.data.message);
        setTimeout(() => navigate('/reset-password', { state: { email } }), 2000);
      })
      .catch(error => {
        setWarning(error.response?.data?.error || 'Failed to verify OTP. Please try again.');
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">OTP Verification</h1>
          <p className="text-sm text-gray-600 mb-6">Enter the OTP sent to your email ({email || 'your email'}) to verify your identity.</p>
          {warning && <p className="text-sm text-red-500 mb-4">{warning}</p>}
          {success && <p className="text-sm text-green-500 mb-4">{success}</p>}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Enter OTP</label>
              <input
                type="text"
                name="otp"
                value={otp}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter OTP"
              />
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Verify OTP
            </button>
            <p className="text-xs text-gray-500 text-center">By continuing, you agree to our <a href="#" className="text-blue-600 hover:underline">privacy policy</a> and <a href="#" className="text-blue-600 hover:underline">terms of use</a></p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;