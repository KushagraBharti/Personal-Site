// backend/src/controllers/weatherController.ts
import { Request, Response, RequestHandler } from "express";
import axios from "axios";

export const getWeather: RequestHandler = async (req: Request, res: Response) => {
  const { lat, lon, q } = req.query;
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "OPENWEATHER_API_KEY is missing" });
    return; // return nothing => OK
  }

  let url: string;
  if (lat && lon) {
    url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`;
  } else if (q) {
    url = `https://api.openweathermap.org/data/2.5/weather?q=${q}&units=imperial&appid=${apiKey}`;
  } else {
    res.status(400).json({ error: "No location provided" });
    return; // return nothing => OK
  }

  try {
    const weatherRes = await axios.get(url);
    res.json(weatherRes.data); 
    return; // return nothing => OK
  } catch (error) {
    console.error("Error fetching weather:", error);
    res.status(500).json({ error: "Failed to fetch weather data" });
    return; // return nothing => OK
  }
};
