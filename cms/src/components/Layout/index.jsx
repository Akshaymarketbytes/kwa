import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { motion } from 'framer-motion';
import apiClient from '../../api/apiClient';

const MEDIA_URL = 'http://127.0.0.1:8000';

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [userAvatar, setUserAvatar] = useState(null);
  const [username, setUsername] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiClient.get('/auth/profile/');
        setUserAvatar(response.data.avatar ? `${MEDIA_URL}${response.data.avatar}` : 'https://via.placeholder.com/80');
        setUsername(response.data.username || 'User'); 
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        setUserAvatar('https://via.placeholder.com/80');
        setUsername('User');
      }
    };

    fetchProfile();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar 
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
        userAvatar={userAvatar}
        username={username}
      />
      <div className="flex flex-1">
        <Sidebar isOpen={isSidebarOpen} />
        <motion.main 
          className="flex-1 p-6 bg-gradient-to-t from-gray-50 to-gray-100"
          initial={{ marginLeft: 300 }}
          animate={{ marginLeft: isSidebarOpen ? 300 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
};

export default Layout;