import React, { useState, useEffect } from 'react';
import { User, LogOut, Settings as SettingsIcon, AlertTriangle, X } from 'lucide-react';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';
import AuthModal from './auth/AuthModal';
import ProfileModal from './profile/ProfileModal';
import Settings from './Settings';
import AdminPanel from './admin/AdminPanel';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function UserMenu() {
  const { userProfile } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user && !user.isAnonymous);
      if (!user || user.isAnonymous) {
        setShowAuthModal(true);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setIsAuthenticated(false);
      setShowMenu(false);
      navigate('/');
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  const isAdmin = userProfile?.tier === 'admin';

  return (
    <>
      <div className="relative user-menu">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100"
        >
          <User className="h-5 w-5" />
          <span>{isAuthenticated ? auth.currentUser?.displayName || 'User' : 'Sign In'}</span>
        </button>

        {showMenu && isAuthenticated && (
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg py-1 z-50">
            <div className="px-4 py-2 text-sm text-gray-700 border-b">
              {auth.currentUser?.email}
              {userProfile?.tier && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  userProfile.tier === 'premium' ? 'bg-purple-100 text-purple-800' :
                  userProfile.tier === 'beta' ? 'bg-blue-100 text-blue-800' :
                  userProfile.tier === 'admin' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {userProfile.tier.charAt(0).toUpperCase() + userProfile.tier.slice(1)}
                </span>
              )}
              {auth.currentUser && !auth.currentUser.emailVerified && (
                <div className="mt-2 text-xs text-yellow-600 bg-yellow-50 p-2 rounded flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Email not verified
                  {verificationSent ? (
                    <span className="text-green-600">Verification email sent!</span>
                  ) : (
                    <button
                      onClick={() => setVerificationSent(true)}
                      className="text-blue-600 hover:text-blue-700 ml-1"
                    >
                      Resend
                    </button>
                  )}
                </div>
              )}
            </div>
            
            <button
              onClick={() => {
                setShowProfileModal(true);
                setShowMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              Profile Settings
            </button>
            
            <button
              onClick={() => {
                setShowSettingsModal(true);
                setShowMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <SettingsIcon className="h-4 w-4" />
              Garden Settings
            </button>

            {isAdmin && (
              <button
                onClick={() => {
                  setShowAdminPanel(true);
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <SettingsIcon className="h-4 w-4" />
                Admin Panel
              </button>
            )}
            
            <button
              onClick={handleSignOut}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        )}
      </div>

      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false);
            setIsAuthenticated(true);
          }}
        />
      )}

      {showProfileModal && (
        <ProfileModal onClose={() => setShowProfileModal(false)} />
      )}

      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white z-10">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-green-800">Garden Settings</h2>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <Settings />
            </div>
          </div>
        </div>
      )}

      {showAdminPanel && isAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white z-10">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-gray-900">Admin Panel</h2>
                <button
                  onClick={() => setShowAdminPanel(false)}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <AdminPanel />
            </div>
          </div>
        </div>
      )}
    </>
  );
}