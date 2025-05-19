import React from "react";
import { motion } from "framer-motion";

const Modal = ({ isOpen, onClose, message, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-brightness-80 flex justify-center items-center z-50">
      <motion.div
        className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full"
        initial={{ opacity: 1, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-lg font-semibold text-center mb-4">{title}</h2>
        <p className="text-center text-gray-600 mb-4">{message}</p>
        <div className="flex justify-center">
          <button
            onClick={onClose}
            className="bg-blue-500 text-white text-sm py-2 px-4 rounded-lg"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Modal;
