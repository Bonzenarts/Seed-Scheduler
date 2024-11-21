import React, { useState, useEffect } from 'react';
import { Users, Search, Crown, Shield, Settings, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getAllUsers, updateUserTier } from '../../services/userService';
import type { UserProfile, UserTier } from '../../types';

export default function AdminPanel() {
  const { userProfile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const allUsers = await getAllUsers();
      setUsers(allUsers);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTierChange = async (userId: string, newTier: UserTier) => {
    try {
      setLoading(true);
      await updateUserTier(userId, newTier);
      await loadUsers(); // Reload the user list
      setUpdateSuccess('User tier updated successfully');
      setTimeout(() => setUpdateSuccess(''), 3000);
    } catch (error: any) {
      setError(error.message);
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(search.toLowerCase()) ||
    (user.displayName && user.displayName.toLowerCase().includes(search.toLowerCase()))
  );

  if (!userProfile?.adminAccess) {
    return (
      <div className="p-6 bg-red-50 text-red-700 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Access Denied</h2>
        </div>
        <p>You don't have permission to access the admin panel.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            <h2 className="text-2xl font-semibold text-gray-900">User Management</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              onClick={loadUsers}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
              disabled={loading}
            >
              <Settings className="h-5 w-5" />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            {error}
          </div>
        )}

        {updateSuccess && (
          <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-lg flex items-center gap-2">
            <Crown className="h-5 w-5" />
            {updateSuccess}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Tier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subscription
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.uid}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.displayName || 'No name'}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.tier === 'premium' ? 'bg-purple-100 text-purple-800' :
                        user.tier === 'beta' ? 'bg-blue-100 text-blue-800' :
                        user.tier === 'admin' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.tier.charAt(0).toUpperCase() + user.tier.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {user.subscriptionStatus ? (
                          <>
                            <span className={`capitalize ${
                              user.subscriptionStatus === 'active' ? 'text-green-600' :
                              user.subscriptionStatus === 'canceled' ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {user.subscriptionStatus}
                            </span>
                            {user.subscriptionEndDate && (
                              <span className="text-gray-500 ml-2">
                                (Ends: {new Date(user.subscriptionEndDate).toLocaleDateString()})
                              </span>
                            )}
                          </>
                        ) : (
                          'No subscription'
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <select
                        value={user.tier}
                        onChange={(e) => handleTierChange(user.uid, e.target.value as UserTier)}
                        className="border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        disabled={loading}
                      >
                        <option value="free">Free</option>
                        <option value="premium">Premium</option>
                        <option value="beta">Beta Tester</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No users found matching your search
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}