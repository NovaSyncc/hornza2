'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

const UserManagement = () => {
  const [users, setUsers] = useState([
    { id: 1, name: "John Doe", email: "john@example.com", type: "property_manager", status: "active", buildings: 2, joinDate: "2024-01-15" },
    { id: 2, name: "Jane Smith", email: "jane@example.com", type: "property_manager", status: "pending", buildings: 0, joinDate: "2024-02-20" },
    { id: 3, name: "Mike Johnson", email: "mike@example.com", type: "tenant", status: "active", buildings: 0, joinDate: "2024-01-28" },
    { id: 4, name: "Sarah Ahmed", email: "sarah@example.com", type: "tenant", status: "active", buildings: 0, joinDate: "2024-02-10" }
  ]);

  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter(user => {
    const matchesFilter = filter === 'all' || user.type === filter;
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleApproveUser = (userId) => {
    setUsers(prev => prev.map(user =>
      user.id === userId ? { ...user, status: 'active' } : user
    ));
  };

  const handleSuspendUser = (userId) => {
    setUsers(prev => prev.map(user =>
      user.id === userId ? { ...user, status: 'suspended' } : user
    ));
  };

  const getStatusStyle = (status) => {
    switch(status) {
      case 'active': return 'bg-emerald-50 text-emerald-700';
      case 'pending': return 'bg-amber-50 text-amber-700';
      case 'suspended': return 'bg-red-50 text-red-700';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  const getUserTypeStyle = (type) => {
    switch(type) {
      case 'property_manager': return 'bg-blue-50 text-blue-700';
      case 'tenant': return 'bg-purple-50 text-purple-700';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        <div className="text-sm text-gray-500">
          Total Users: {users.length}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:border-emerald-500 focus:outline-none"
        >
          <option value="all">All Users</option>
          <option value="property_manager">Property Managers</option>
          <option value="tenant">Tenants</option>
        </select>
      </div>

      <div className="space-y-3">
        {filteredUsers.map((user, index) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-50 border border-gray-200 p-5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${getStatusStyle(user.status)}`}>
                    {user.status}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getUserTypeStyle(user.type)}`}>
                    {user.type.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-sm text-gray-500 space-y-1">
                  <p>Email: {user.email}</p>
                  <p>Joined: {new Date(user.joinDate).toLocaleDateString()}</p>
                  {user.type === 'property_manager' && (
                    <p>Buildings: {user.buildings}/5</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {user.status === 'pending' && (
                  <button
                    onClick={() => handleApproveUser(user.id)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded text-sm transition-colors"
                  >
                    Approve
                  </button>
                )}
                {user.status === 'active' && (
                  <button
                    onClick={() => handleSuspendUser(user.id)}
                    className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1 rounded text-sm transition-colors"
                  >
                    Suspend
                  </button>
                )}
                <button className="bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-50 transition-colors">
                  View Details
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No users found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
