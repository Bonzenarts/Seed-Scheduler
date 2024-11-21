import React from 'react';
import {
  Sun,
  Moon,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudFog,
  CloudLightning,
  CloudDrizzle
} from 'lucide-react';

interface WeatherIconProps {
  code: number;
  className?: string;
  timestamp?: number;
}

export default function WeatherIcon({ code, className, timestamp = Date.now() }: WeatherIconProps) {
  const isDaytime = () => {
    const hour = new Date(timestamp).getHours();
    return hour >= 6 && hour < 20;
  };

  switch (true) {
    // Clear sky
    case code === 800:
      return isDaytime() ? (
        <Sun className={className} />
      ) : (
        <Moon className={className} />
      );
    
    // Cloudy conditions
    case code > 800 && code < 900:
      return <Cloud className={className} />;
    
    // Thunderstorm
    case code >= 200 && code < 300:
      return <CloudLightning className={className} />;
    
    // Drizzle
    case code >= 300 && code < 400:
      return <CloudDrizzle className={className} />;
    
    // Rain
    case code >= 500 && code < 600:
      return <CloudRain className={className} />;
    
    // Snow
    case code >= 600 && code < 700:
      return <CloudSnow className={className} />;
    
    // Atmosphere (fog, mist, etc.)
    case code >= 700 && code < 800:
      return <CloudFog className={className} />;
    
    // Default case
    default:
      return isDaytime() ? (
        <Sun className={className} />
      ) : (
        <Moon className={className} />
      );
  }
}