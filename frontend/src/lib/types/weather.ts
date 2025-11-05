export interface WeatherConditions {
  id: number;
  main: string;
  description: string;
  icon: string;
}

export interface WeatherMain {
  temp: number;
  feels_like: number;
  temp_min: number;
  temp_max: number;
  pressure: number;
  humidity: number;
}

export interface WeatherWind {
  speed: number;
  deg: number;
}

export interface WeatherResponse {
  name: string;
  weather: WeatherConditions[];
  main: WeatherMain;
  wind: WeatherWind;
  dt: number;
  timezone: number;
}
