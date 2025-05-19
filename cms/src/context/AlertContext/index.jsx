import React, { createContext, useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const [alert, setAlert] = useState(null);

  const showAlert = (message) => {
    setAlert(message);
    setTimeout(() => setAlert(null), 3000);
  };

  return (
    <AlertContext.Provider value={{ alert, showAlert }}>
      {children}
      <AnimatePresence>
        {alert && (
          <motion.div
            className="fixed top-0 -right-0 bg-green-200 border-green-600 text-green-600 border-l-4 px-6 py-2 mt-20 z-50"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="font-bold">Success</p>
            <p>{alert}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </AlertContext.Provider>
  );
};

export const useAlert = () => useContext(AlertContext);
