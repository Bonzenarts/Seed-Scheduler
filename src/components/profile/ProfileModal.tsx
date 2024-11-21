import React, { useState } from 'react';
import { X, User, Lock, Loader, Save, AlertTriangle, Eye, EyeOff, Crown } from 'lucide-react';
import { auth } from '../../config/firebase';
import { 
  updateProfile, 
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  AuthError
} from 'firebase/auth';
import { setUserProfile } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';

interface ProfileModalProps {
  onClose: () => void;
}

export default function ProfileModal({ onClose }: ProfileModalProps) {
  const { userProfile } = useAuth();
  const [displayName, setDisplayName] = useState(auth.currentUser?.displayName || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'premium':
        return 'bg-purple-100 text-purple-800';
      case 'beta':
        return 'bg-blue-100 text-blue-800';
      case 'admin':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Update display name
      if (displayName !== auth.currentUser.displayName) {
        await updateProfile(auth.currentUser, { displayName });
        await setUserProfile({
          uid: auth.currentUser.uid,
          email: auth.currentUser.email!,
          displayName,
          tier: userProfile?.tier || 'free',
          lastLogin: new Date().toISOString()
        });
        setSuccess('Profile updated successfully');
      }

      // Update password if provided
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          throw new Error('New passwords do not match');
        }

        if (newPassword.length < 6) {
          throw new Error('Password should be at least 6 characters long');
        }

        // Reauthenticate before password change
        if (auth.currentUser.email) {
          const credential = EmailAuthProvider.credential(
            auth.currentUser.email,
            currentPassword
          );
          await reauthenticateWithCredential(auth.currentUser, credential);
        }

        await updatePassword(auth.currentUser, newPassword);
        setSuccess('Profile and password updated successfully');
        
        // Clear password fields
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error: any) {
      const authError = error as AuthError;
      switch (authError.code) {
        case 'auth/weak-password':
          setError('Password should be at least 6 characters long');
          break;
        case 'auth/requires-recent-login':
          setError('Please sign in again before changing your password');
          break;
        case 'auth/wrong-password':
          setError('Current password is incorrect');
          break;
        default:
          setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Profile Settings</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2">
            <Crown className={`h-5 w-5 ${
              userProfile?.tier === 'premium' ? 'text-purple-600' :
              userProfile?.tier === 'beta' ? 'text-blue-600' :
              userProfile?.tier === 'admin' ? 'text-red-600' :
              'text-gray-600'
            }`} />
            <span className={`px-2 py-1 rounded-full text-sm ${getTierBadgeColor(userProfile?.tier || 'free')}`}>
              {userProfile?.tier?.charAt(0).toUpperCase() + userProfile?.tier?.slice(1) || 'Free'} Account
            </span>
          </div>
          {userProfile?.subscriptionEndDate && userProfile.tier === 'premium' && (
            <p className="text-sm text-gray-600 mt-1">
              Subscription ends: {new Date(userProfile.subscriptionEndDate).toLocaleDateString()}
            </p>
          )}
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                className="pl-10 w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-medium mb-4">Change Password</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    className="pl-10 pr-10 w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    className="pl-10 pr-10 w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className="pl-10 pr-10 w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 text-green-700 rounded-md text-sm flex items-center gap-2">
              <Save className="h-4 w-4" />
              {success}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}