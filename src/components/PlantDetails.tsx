import React from 'react';
import { usePlantDetails } from '../hooks/usePlantSearch';
import { useAuth } from '../context/AuthContext';
import { Sprout, Thermometer, Droplets, Sun, Wind, Ruler, Calendar, Crown, AlertTriangle, Loader, X } from 'lucide-react';
import type { TreflePlant } from '../types/trefle';

interface PlantDetailsProps {
  plantId: number;
  onClose: () => void;
}

export default function PlantDetails({ plantId, onClose }: PlantDetailsProps) {
  const { plant, error, isLoading } = usePlantDetails(plantId);
  const { hasFeatureAccess } = useAuth();

  const hasPremiumAccess = hasFeatureAccess('plantDetails');

  if (!hasPremiumAccess) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Crown className="h-6 w-6 text-purple-600" />
              Premium Feature
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-gray-600 mb-4">
            Detailed plant information is available to Premium, Beta, and Admin users.
            Upgrade your account to access comprehensive plant data, growing guides, and more.
          </p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Learn More About Premium
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 sticky top-0 bg-white z-10 pb-4 border-b">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Sprout className="h-6 w-6 text-green-600" />
            Plant Details
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-md flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Failed to load plant details. Please try again.</span>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader className="h-8 w-8 animate-spin text-green-600" />
          </div>
        )}

        {plant && (
          <div className="space-y-6">
            <div className="flex gap-6">
              {plant.image_url ? (
                <img
                  src={plant.image_url}
                  alt={plant.common_name}
                  className="w-48 h-48 object-cover rounded-lg"
                />
              ) : (
                <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Sprout className="h-16 w-16 text-gray-400" />
                </div>
              )}
              
              <div className="flex-1">
                <h3 className="text-2xl font-semibold text-gray-900">
                  {plant.common_name || 'Unknown'}
                </h3>
                <p className="text-lg text-gray-600 italic mb-2">
                  {plant.scientific_name}
                </p>
                <div className="space-y-1">
                  {plant.family_common_name && (
                    <p className="text-gray-600">
                      Family: {plant.family_common_name} ({plant.family})
                    </p>
                  )}
                  <p className="text-gray-600">
                    Genus: {plant.genus}
                  </p>
                  {plant.vegetable && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      Vegetable
                    </span>
                  )}
                </div>
              </div>
            </div>

            {plant.growth && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900">Growing Conditions</h4>
                  
                  {plant.growth.ph_minimum && plant.growth.ph_maximum && (
                    <div className="flex items-center gap-2">
                      <Ruler className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">pH Range</p>
                        <p className="text-sm text-gray-600">
                          {plant.growth.ph_minimum} - {plant.growth.ph_maximum}
                        </p>
                      </div>
                    </div>
                  )}

                  {plant.growth.minimum_temperature && plant.growth.maximum_temperature && (
                    <div className="flex items-center gap-2">
                      <Thermometer className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Temperature Range</p>
                        <p className="text-sm text-gray-600">
                          {plant.growth.minimum_temperature.deg_c}°C - {plant.growth.maximum_temperature.deg_c}°C
                        </p>
                      </div>
                    </div>
                  )}

                  {plant.growth.minimum_precipitation && plant.growth.maximum_precipitation && (
                    <div className="flex items-center gap-2">
                      <Droplets className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Precipitation Needs</p>
                        <p className="text-sm text-gray-600">
                          {plant.growth.minimum_precipitation.mm}mm - {plant.growth.maximum_precipitation.mm}mm
                        </p>
                      </div>
                    </div>
                  )}

                  {plant.growth.light !== undefined && (
                    <div className="flex items-center gap-2">
                      <Sun className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Light Requirements</p>
                        <p className="text-sm text-gray-600">
                          {plant.growth.light === 0 ? 'Shade' :
                           plant.growth.light === 5 ? 'Partial Sun' :
                           plant.growth.light === 10 ? 'Full Sun' :
                           `Level ${plant.growth.light}`}
                        </p>
                      </div>
                    </div>
                  )}

                  {plant.growth.atmospheric_humidity !== undefined && (
                    <div className="flex items-center gap-2">
                      <Wind className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Humidity Needs</p>
                        <p className="text-sm text-gray-600">
                          {plant.growth.atmospheric_humidity === 0 ? 'Low' :
                           plant.growth.atmospheric_humidity === 5 ? 'Moderate' :
                           plant.growth.atmospheric_humidity === 10 ? 'High' :
                           `Level ${plant.growth.atmospheric_humidity}`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900">Growth Calendar</h4>
                  
                  {plant.growth.growth_months && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Growing Season</p>
                        <p className="text-sm text-gray-600">
                          {plant.growth.growth_months.join(', ')}
                        </p>
                      </div>
                    </div>
                  )}

                  {plant.growth.bloom_months && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Blooming Season</p>
                        <p className="text-sm text-gray-600">
                          {plant.growth.bloom_months.join(', ')}
                        </p>
                      </div>
                    </div>
                  )}

                  {plant.growth.fruit_months && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Fruiting Season</p>
                        <p className="text-sm text-gray-600">
                          {plant.growth.fruit_months.join(', ')}
                        </p>
                      </div>
                    </div>
                  )}

                  {plant.growth.days_to_harvest && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Days to Harvest</p>
                        <p className="text-sm text-gray-600">
                          {plant.growth.days_to_harvest} days
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {plant.growth?.description && (
              <div className="space-y-2">
                <h4 className="text-lg font-medium text-gray-900">Growing Information</h4>
                <p className="text-gray-600 whitespace-pre-line">
                  {plant.growth.description}
                </p>
              </div>
            )}

            {plant.growth?.sowing && (
              <div className="space-y-2">
                <h4 className="text-lg font-medium text-gray-900">Sowing Instructions</h4>
                <p className="text-gray-600 whitespace-pre-line">
                  {plant.growth.sowing}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}