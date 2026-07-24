'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

const PropertyListing = ({ building, onRequestVerification }) => {
  const [showUnits, setShowUnits] = useState(false);

  const mockUnits = [
    { id: 1, unitNumber: '2B', bedrooms: 2, rent: 45000, deposit: 45000, status: 'verified', tenant: 'Available' },
    { id: 2, unitNumber: '1A', bedrooms: 1, rent: 35000, deposit: 35000, status: 'pending', tenant: 'Available' },
    { id: 3, unitNumber: '3C', bedrooms: 3, rent: 65000, deposit: 65000, status: 'unverified', tenant: 'John Doe' }
  ];

  const getStatusStyle = (status) => {
    switch(status) {
      case 'verified': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'unverified': return 'bg-gray-100 text-gray-500 border-gray-200';
      default: return 'bg-gray-100 text-gray-500 border-gray-200';
    }
  };

  const generateWhatsAppLink = (unit) => {
    const message = `Hi Hornza! I want to verify my property listing:
Property ID: #ELH${unit.id.toString().padStart(3, '0')}
Address: ${building.title}, Unit ${unit.unitNumber}
Rent: KES ${unit.rent}
Deposit: KES ${unit.deposit}
Manager: Property Manager (0712345678)
Please send verification instructions.`;

    return `https://wa.me/254700000000?text=${encodeURIComponent(message)}`;
  };

  return (
    <motion.div
      className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{building.title}</h3>
            <p className="text-gray-500 text-sm">Building ID: #BLD{building.id.toString().padStart(3, '0')}</p>
          </div>
          <button
            onClick={() => setShowUnits(!showUnits)}
            className="text-emerald-600 hover:text-emerald-700 transition-colors font-medium text-sm"
          >
            {showUnits ? '▼' : '▶'} {mockUnits.length} Units
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center bg-gray-50 rounded-lg py-2">
            <div className="text-lg font-bold text-gray-900">{mockUnits.length}</div>
            <div className="text-sm text-gray-500">Total Units</div>
          </div>
          <div className="text-center bg-emerald-50 rounded-lg py-2">
            <div className="text-lg font-bold text-emerald-700">{mockUnits.filter(u => u.status === 'verified').length}</div>
            <div className="text-sm text-gray-500">Verified</div>
          </div>
          <div className="text-center bg-amber-50 rounded-lg py-2">
            <div className="text-lg font-bold text-amber-700">{mockUnits.filter(u => u.status === 'pending').length}</div>
            <div className="text-sm text-gray-500">Pending</div>
          </div>
        </div>

        <AnimatePresence>
          {showUnits && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t border-gray-200 pt-4 mt-4"
            >
              <h4 className="font-semibold mb-3 text-gray-700">Unit Details:</h4>
              <div className="space-y-3">
                {mockUnits.map((unit, index) => (
                  <motion.div
                    key={unit.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gray-50 border border-gray-200 p-4 rounded-lg"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h5 className="font-semibold text-gray-900">Unit {unit.unitNumber}</h5>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize border ${getStatusStyle(unit.status)}`}>
                            {unit.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          <p>{unit.bedrooms} BR • KES {unit.rent.toLocaleString()}/month</p>
                          <p>Tenant: {unit.tenant}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {unit.status === 'unverified' && (
                          <a
                            href={generateWhatsAppLink(unit)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded text-xs font-semibold transition-colors"
                          >
                            Request Verification
                          </a>
                        )}
                        <button className="bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded text-xs hover:bg-gray-50 transition-colors">
                          Edit
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default PropertyListing;
