import React from 'react';
import { XCircle } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

export default function ErrorDisplay() {
  const { errors, clearErrors } = useInventory();

  if (errors.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      {errors.map((error, index) => (
        <div
          key={index}
          className="bg-red-50 text-red-700 p-4 rounded-lg shadow-lg mb-2 flex items-start gap-2"
        >
          <XCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm">{error}</p>
          </div>
          <button
            onClick={clearErrors}
            className="text-red-500 hover:text-red-700"
          >
            Dismiss
          </button>
        </div>
      ))}
    </div>
  );
}