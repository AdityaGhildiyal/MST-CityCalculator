import axios from "axios";

const ORS_API_KEY = "5b3ce3597851110001cf624815f002a325d240ef8e43b203b2c584e9"; 

export async function getCoordinates(cities: string[]): Promise<{ lat: number; lng: number }[]> {
  const coords: { lat: number; lng: number }[] = [];

  for (const city of cities) {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`;
    try {
      const response = await axios.get(url, {
        headers: { "User-Agent": "CityMSTCalculator/1.0" },
      });
      const data = response.data;
      if (data.length > 0) {
        const { lat, lon } = data[0];
        coords.push({ lat: parseFloat(lat), lng: parseFloat(lon) });
      } else {
        return [];
      }
    } catch (err) {
      console.error(`Geocoding failed for ${city}:`, err);
      return [];
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  return coords;
}

export async function getRoadDistances(coords: { lat: number; lng: number }[]): Promise<number[][]> {
  const url = "https://api.openrouteservice.org/v2/matrix/driving-car";
  const body = {
    locations: coords.map(c => [c.lng, c.lat]),
    metrics: ["distance"],
    units: "m",
  };

  try {
    const response = await axios.post(url, body, {
      headers: {
        Authorization: ORS_API_KEY,
        "Content-Type": "application/json",
      },
    });
    const data = response.data;
    if (data.distances) {
      return data.distances.map((row: number[]) => row.map((d: number | null) => d === null ? Infinity : d));
    } else {
      throw new Error("No distances returned");
    }
  } catch (err) {
    console.error("Distance matrix failed:", err);
    throw err;
  }
}