// backend/src/routes/weatherRoutes.ts
import express from "express";
import axios from "axios";

const router = express.Router();

router.get("/", async (req, res) => {
  const { lat, lon, q } = req.query;
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "OPENWEATHER_API_KEY is missing" });
    return;
  }

  let url = "";
  if (lat && lon) {
    // Use latitude and longitude if provided
    url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`;
  } else if (q) {
    // Use city name if provided
    url = `https://api.openweathermap.org/data/2.5/weather?q=${q}&units=imperial&appid=${apiKey}`;
  } else {
    res.status(400).json({ error: "No location provided" });
    return;
  }

  try {
    const weatherRes = await axios.get(url);
    res.json(weatherRes.data); // Just call res.json without returning it
  } catch (error) {
    console.error("Error fetching weather:", error);
    res.status(500).json({ error: "Failed to fetch weather data" });
  }
});

export default router;
