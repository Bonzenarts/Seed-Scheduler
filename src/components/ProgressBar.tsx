import React from 'react';

interface ProgressBarProps {
  progress: number;
  isHarvested?: boolean;
  status?: 'active' | 'damaged' | 'failed';
}

export default function ProgressBar({ progress, isHarvested = false, status = 'active' }: ProgressBarProps) {
  const getColor = (progress: number, isHarvested: boolean, status: string) => {
    if (status === 'failed') return 'bg-red-500';
    if (status === 'damaged') return 'bg-yellow-500';
    if (isHarvested) return 'bg-purple-500';
    if (progress === 100) return 'bg-yellow-500';
    if (progress <= 20) return 'bg-green-500';
    return 'bg-blue-500';
  };

  const getLabel = (progress: number, isHarvested: boolean, status: string) => {
    if (status === 'failed') return 'Failed';
    if (status === 'damaged') return 'Damaged';
    if (isHarvested) return 'Harvested';
    if (progress === 100) return 'Ready to Harvest';
    if (progress <= 20) return 'Sowing Phase';
    return 'Growing Phase';
  };

  // If failed, show 0% progress
  const displayProgress = status === 'failed' ? 0 : progress;

  return (
    <div className="space-y-1">
      <div className="relative w-full h-4 bg-gray-200 rounded overflow-hidden">
        <div
          className={`absolute h-full transition-all duration-500 ${getColor(progress, isHarvested, status)}`}
          style={{ width: `${displayProgress}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>{getLabel(progress, isHarvested, status)}</span>
        <span>{Math.round(displayProgress)}%</span>
      </div>
    </div>
  );
}