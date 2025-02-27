import axios from "axios"

// Replace with your OpenRouteService API key from openrouteservice.org
const ORS_API_KEY = process.env.NEXT_PUBLIC_ORS_API_KEY || "your_ors_api_key_here"

interface Coordinate {
  lat: number
  lng: number
}

export async function getCoordinates(cities: string[]): Promise<Coordinate[]> {
  const coords: Coordinate[] = []

  for (const city of cities) {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`
    try {
      const response = await axios.get(url, {
        headers: { "User-Agent": "CityMSTCalculator/1.0" },
      })
      const data = response.data
      if (data.length > 0) {
        const { lat, lon } = data[0]
        coords.push({ lat: Number.parseFloat(lat), lng: Number.parseFloat(lon) })
      } else {
        console.error(`No coordinates found for ${city}`)
        return []
      }
    } catch (err) {
      console.error(`Geocoding failed for ${city}:`, err)
      return []
    }
    // Throttle for Nominatim's 1 req/sec limit
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
  return coords
}

export async function getRoadDistances(coords: Coordinate[]): Promise<number[][]> {
  try {
    const url = "https://api.openrouteservice.org/v2/matrix/driving-car"
    const body = {
      locations: coords.map((c) => [c.lng, c.lat]), // ORS uses [lon, lat]
      metrics: ["distance"],
      units: "m",
    }

    const response = await axios.post(url, body, {
      headers: {
        Authorization: ORS_API_KEY,
        "Content-Type": "application/json",
      },
    })
    const data = response.data
    if (data.distances) {
      return data.distances // 2D array of distances in meters
    } else {
      throw new Error("No distances returned")
    }
  } catch (err) {
    console.error("Distance matrix failed:", err)
    // Fallback to straight-line distance calculation
    return calculateStraightLineDistances(coords)
  }
}

function calculateStraightLineDistances(coords: Coordinate[]): number[][] {
  const distances: number[][] = []
  for (let i = 0; i < coords.length; i++) {
    distances[i] = []
    for (let j = 0; j < coords.length; j++) {
      if (i === j) {
        distances[i][j] = 0
      } else {
        distances[i][j] = haversineDistance(coords[i], coords[j])
      }
    }
  }
  return distances
}

function haversineDistance(coord1: Coordinate, coord2: Coordinate): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = (coord1.lat * Math.PI) / 180
  const φ2 = (coord2.lat * Math.PI) / 180
  const Δφ = ((coord2.lat - coord1.lat) * Math.PI) / 180
  const Δλ = ((coord2.lng - coord1.lng) * Math.PI) / 180

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}

