import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Calendar from './Calendar';
import PlanForm from './PlanForm';
import SavedPlans from './SavedPlans';
import FrostWarnings from './FrostWarnings';
import SeedInventory from './SeedInventory';
import ProgressTracking from './ProgressTracking';
import NetworkStatus from './NetworkStatus';
import ErrorDisplay from './ErrorDisplay';
import UserMenu from './UserMenu';
import AuthModal from './auth/AuthModal';
import PlantSearch from './PlantSearch';
import WeatherWidget from './WeatherWidget';
import { Search, Sprout, CalendarDays, LineChart, Leaf } from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation';

export default function AppContent() {
  const { isAuthenticated, isLoading, hasFeatureAccess } = useAuth();
  const [activeTab, setActiveTab] = useState('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarViewType, setCalendarViewType] = useState('month');

  // Initialize geolocation as soon as the component mounts
  const { coordinates } = useGeolocation();

  const showPlantSearch = hasFeatureAccess('plantDetails');
  const showWeather = hasFeatureAccess('weatherData');

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sprout className="h-8 w-8 text-green-600" />
              <h1 className="text-3xl font-bold text-green-900">Seed Scheduler</h1>
            </div>
            {isAuthenticated && (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setActiveTab('calendar')}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                    activeTab === 'calendar'
                      ? 'bg-green-100 text-green-800'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <CalendarDays className="h-5 w-5" />
                  Garden Calendar
                </button>
                <button
                  onClick={() => setActiveTab('progress')}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                    activeTab === 'progress'
                      ? 'bg-green-100 text-green-800'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <LineChart className="h-5 w-5" />
                  Progress
                </button>
                <button
                  onClick={() => setActiveTab('inventory')}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                    activeTab === 'inventory'
                      ? 'bg-green-100 text-green-800'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <Leaf className="h-5 w-5" />
                  Seed Inventory
                </button>
                {showPlantSearch && (
                  <button
                    onClick={() => setActiveTab('plants')}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                      activeTab === 'plants'
                        ? 'bg-green-100 text-green-800'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <Search className="h-5 w-5" />
                    Plant Database
                  </button>
                )}
                <UserMenu />
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isAuthenticated ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome to Seed Scheduler
            </h2>
            <p className="text-gray-600 mb-8">
              Please sign in to start planning your garden
            </p>
            <AuthModal
              onClose={() => {}}
              onSuccess={() => {}}
            />
          </div>
        ) : (
          <>
            {activeTab === 'calendar' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <Calendar 
                    onDateChange={setCurrentDate}
                    onViewTypeChange={setCalendarViewType}
                  />
                  {showWeather && coordinates && (
                    <WeatherWidget />
                  )}
                </div>
                <div className="space-y-8">
                  <PlanForm currentDate={currentDate} />
                  <FrostWarnings currentDate={currentDate} />
                  <SavedPlans 
                    currentDate={currentDate}
                    viewType={calendarViewType}
                  />
                </div>
              </div>
            )}
            
            {activeTab === 'progress' && <ProgressTracking />}
            {activeTab === 'inventory' && <SeedInventory />}
            {activeTab === 'plants' && showPlantSearch && <PlantSearch />}
          </>
        )}
      </main>

      <NetworkStatus />
      <ErrorDisplay />
    </div>
  );
}