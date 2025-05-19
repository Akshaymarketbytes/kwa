import React, { useState } from 'react';
import { Text, Settings, User, LogOut, Bell } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router';
import apiClient from '../../api/apiClient';

const Topbar = ({ toggleSidebar, userAvatar, username }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  const getPageName = () => {
    const path = location.pathname.split('/')[1];
    return path.charAt(0).toUpperCase() + path.slice(1) || 'Dashboard';
  };

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');
    try {
      await apiClient.post('/auth/logout/', { refresh: refreshToken });
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('refresh_token');
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="fixed top-0 left-0 right-0 h-16 bg-white shadow-md flex items-center justify-between px-4 z-50 md:px-6">
      <div className="flex items-center">
        <div className='flex items-center justify-center w-[255px] md:w-auto'>
          <img src="https://img.onmanorama.com/content/dam/mm/en/kerala/top-news/images/2024/3/11/kerala-water-authority-ls.jpg?w=1120&h=583" alt="Kerala Water Authority" className="w-28 md:w-32" />
        </div>
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-xs transition-all duration-200 relative overflow-hidden group md:ml-4"
        >
          <div className="absolute inset-0" />
          <Text
            className="w-10 h-10 border p-2 border-gray-200 hover:border-none hover:bg-gray-200 rounded-lg text-gray-800 relative transition-colors duration-300 group-hover:text-gray-800"
            strokeWidth={1.5}
          />
        </button>
        <div className="hidden md:block ml-4 text-sm font-medium text-gray-800">
          {getPageName()}
        </div>
      </div>
      <div className="relative flex items-center">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="p-2 rounded-xs transition-all duration-200 relative overflow-hidden group"
        >
          <div className="absolute inset-0" />
          <Settings
            className="w-10 h-10 border p-2 border-gray-200 hover:border-none hover:bg-gray-200 rounded-full text-gray-800 relative transition-colors duration-300 group-hover:text-gray-800"
            strokeWidth={1.5}
          />
        </button>
        {isDropdownOpen && (
          <div className="absolute top-16 right-0 w-48 bg-white rounded-md shadow-lg z-20">
            <button
              onClick={() => {
                navigate('/profile');
                setIsDropdownOpen(false);
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-800 rounded-t-md transition-all duration-200 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gray-100 transition-opacity duration-300 opacity-0 group-hover:opacity-100" />
              <User
                strokeWidth={1.5}
                className="w-5 h-5 mr-2 text-gray-800 relative transition-colors duration-300 group-hover:text-gray-800"
              />
              <span className="relative transition-colors duration-300 group-hover:text-gray-800">
                Profile Settings
              </span>
            </button>
            <button
              onClick={() => {
                handleLogout();
                setIsDropdownOpen(false);
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-800 rounded-b-md transition-all duration-200 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gray-100 transition-opacity duration-300 opacity-0 group-hover:opacity-100" />
              <LogOut
                strokeWidth={1.5}
                className="w-5 h-5 mr-2 text-gray-800 relative transition-colors duration-300 group-hover:text-gray-800"
              />
              <span className="relative transition-colors duration-300 group-hover:text-gray-800">
                Logout
              </span>
            </button>
          </div>
        )}
        <div className="flex items-center space-x-2 ml-4">
          <img
            src={userAvatar || 'https://placehold.co/80x80'}
            alt="Profile"
            className="w-10 h-10 object-cover rounded-full cursor-pointer"
            onError={(e) => e.target.src = 'https://placehold.co/80x80'}
          />
          <span className="hidden md:block text-sm font-medium text-gray-800">
            {username}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Topbar;
