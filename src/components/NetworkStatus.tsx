import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { auth } from '../config/firebase';
import { syncWithCloud } from '../services/syncService';

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowStatus(true);
      if (auth.currentUser && !auth.currentUser.isAnonymous) {
        syncWithCloud().catch(console.error);
      }
      setTimeout(() => setShowStatus(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowStatus(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showStatus && isOnline) return null;

  return (
    <div
      className={`fixed bottom-4 left-4 z-50 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
        isOnline
          ? 'bg-green-100 text-green-800'
          : 'bg-yellow-100 text-yellow-800'
      }`}
    >
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4" />
          Online
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          Offline Mode
        </>
      )}
    </div>
  );
}