import axios from "axios";

export async function checkCityExists(city) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`;
  try {
    const response = await axios.get(url, {
      headers: { "User-Agent": "CityMSTCalculator/1.0" },
    });
    const data = response.data;
    return data.length > 0; // True if city exists, false otherwise
  } catch (err) {
    console.error(`Error checking city ${city}:`, err);
    return false;
  }
}