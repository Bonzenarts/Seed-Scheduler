import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/settings';
import { InventoryProvider } from './context/InventoryContext';
import { PlanningProvider } from './context/PlanningContext';
import AppContent from './components/AppContent';

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <InventoryProvider>
          <PlanningProvider>
            <Router>
              <Routes>
                <Route path="/" element={<AppContent />} />
              </Routes>
            </Router>
          </PlanningProvider>
        </InventoryProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}