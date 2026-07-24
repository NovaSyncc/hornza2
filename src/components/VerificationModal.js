'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

const VerificationModal = ({ request, onClose, onVerify, onReject }) => {
  const [instagramUrl, setInstagramUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!instagramUrl.trim()) {
      alert('Please enter Instagram URL');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      onVerify(request.id, instagramUrl);
      setIsProcessing(false);
      onClose();
    }, 1500);
  };

  const handleReject = () => {
    onReject(request.id);
    onClose();
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-xl shadow-xl border border-gray-200 p-6 max-w-lg w-full"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Verify Property</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl">×</button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">{request.property}</h3>
            <div className="text-sm text-gray-500 space-y-1">
              <p><strong className="text-gray-700">Manager:</strong> {request.manager}</p>
              <p><strong className="text-gray-700">Payment:</strong> KES {request.amount}</p>
              <p><strong className="text-gray-700">Status:</strong> <span className="text-amber-700">Pending Verification</span></p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-sm">
          <h4 className="font-semibold mb-2 text-blue-700">Verification Process:</h4>
          <ol className="space-y-1 text-gray-700">
            <li>1. Payment screenshot received via WhatsApp</li>
            <li>2. Property video reviewed for quality</li>
            <li>3. Video uploaded to Instagram with caption</li>
            <li>4. Copy Instagram URL and paste below</li>
          </ol>
        </div>

        <form onSubmit={handleVerify} className="space-y-6">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Instagram Video URL</label>
            <input
              type="url"
              required
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="https://www.instagram.com/p/..."
              disabled={isProcessing}
            />
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={handleReject}
              disabled={isProcessing}
              className="px-6 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors disabled:opacity-50 font-semibold"
            >
              Reject
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-all disabled:opacity-50"
            >
              {isProcessing ? 'Verifying...' : 'Verify Property'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default VerificationModal;
