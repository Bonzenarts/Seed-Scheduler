import React, { useState, useEffect } from 'react';
import { auth, db } from '../config/firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';

export default function FirebaseTest() {
  const [status, setStatus] = useState<{
    auth: string;
    db: string;
    error?: string;
  }>({
    auth: 'Checking...',
    db: 'Checking...'
  });

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      // Check Auth
      if (auth.currentUser) {
        setStatus(prev => ({ ...prev, auth: 'Authenticated ✅' }));
      } else {
        setStatus(prev => ({ ...prev, auth: 'Not authenticated ❌' }));
      }

      // Test Database Connection
      const testCollection = collection(db, `users/${auth.currentUser?.uid || 'test'}/connection_test`);
      
      // Try to write
      const docRef = await addDoc(testCollection, {
        timestamp: new Date(),
        test: true
      });

      // Try to read
      const querySnapshot = await getDocs(testCollection);
      
      setStatus(prev => ({ ...prev, db: 'Connected ✅' }));

    } catch (error: any) {
      setStatus(prev => ({
        ...prev,
        db: 'Failed ❌',
        error: error.message
      }));
    }
  };

  return (
    <div className="fixed top-4 right-4 bg-white p-4 rounded-lg shadow-lg z-50">
      <h3 className="font-bold mb-2">Firebase Connection Test</h3>
      <div className="space-y-2 text-sm">
        <p>Auth Status: {status.auth}</p>
        <p>Database Status: {status.db}</p>
        {status.error && (
          <p className="text-red-600 text-xs">
            Error: {status.error}
          </p>
        )}
        <button
          onClick={checkConnection}
          className="px-3 py-1 bg-blue-500 text-white rounded text-xs"
        >
          Test Again
        </button>
      </div>
    </div>
  );
}