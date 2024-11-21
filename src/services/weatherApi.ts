import { auth } from '../config/firebase';

const OPENWEATHER_API_KEY = '4d22ad4cc4971d5dafde3ce5855cb312';

export async function getWeatherData(lat: number, lon: number) {
  try {
    // Fetch current weather and forecast in parallel
    const [currentResponse, forecastResponse] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`),
      fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`)
    ]);

    if (!currentResponse.ok || !forecastResponse.ok) {
      throw new Error('Failed to fetch weather data');
    }

    const [currentData, forecastData] = await Promise.all([
      currentResponse.json(),
      forecastResponse.json()
    ]);

    // Transform the data to match our expected format
    const transformedData = {
      lat,
      lon,
      timezone: currentData.timezone,
      timezone_offset: currentData.timezone,
      current: {
        dt: currentData.dt,
        temp: currentData.main.temp,
        feels_like: currentData.main.feels_like,
        pressure: currentData.main.pressure,
        humidity: currentData.main.humidity,
        clouds: currentData.clouds.all,
        visibility: currentData.visibility,
        wind_speed: currentData.wind.speed,
        wind_deg: currentData.wind.deg,
        weather: currentData.weather
      },
      hourly: forecastData.list.slice(0, 24).map((item: any) => ({
        dt: item.dt,
        temp: item.main.temp,
        feels_like: item.main.feels_like,
        pressure: item.main.pressure,
        humidity: item.main.humidity,
        clouds: item.clouds.all,
        visibility: item.visibility || 10000,
        wind_speed: item.wind.speed,
        wind_deg: item.wind.deg,
        weather: item.weather,
        pop: item.pop || 0
      })),
      daily: forecastData.list
        .filter((_: any, index: number) => index % 8 === 0)
        .slice(0, 8)
        .map((item: any) => ({
          dt: item.dt,
          temp: {
            day: item.main.temp,
            min: item.main.temp_min,
            max: item.main.temp_max,
            night: item.main.temp,
            eve: item.main.temp,
            morn: item.main.temp
          },
          feels_like: {
            day: item.main.feels_like,
            night: item.main.feels_like,
            eve: item.main.feels_like,
            morn: item.main.feels_like
          },
          pressure: item.main.pressure,
          humidity: item.main.humidity,
          weather: item.weather,
          clouds: item.clouds.all,
          pop: item.pop || 0,
          wind_speed: item.wind.speed,
          wind_deg: item.wind.deg
        }))
    };

    return transformedData;
  } catch (error: any) {
    console.error('Weather API error:', error);
    throw new Error(error.message || 'Failed to fetch weather data');
  }
}