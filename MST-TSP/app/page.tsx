"use client";

import { useState, useEffect } from "react";
import CityInput from "@/components/CityInput";
import MstResult from "@/components/MstResult";
import CityInputTSP from "@/components/CityInputTSP";
import MstResultTSP from "@/components/TspResult";
import { getCoordinates, getRoadDistances } from "@/lib/apiUtils";
import { kruskal } from "@/lib/kruskal";
import { checkCityExists } from "@/lib/api";
import { motion } from "framer-motion";

interface Result {
  paths: { from: string; to: string; distance: number; isTsp?: boolean }[];
  totalDistance: number;
  graphData: {
    nodes: { id: number; label: string }[];
    edges: { from: number; to: number; label: string; color: string; isMst?: boolean; isTsp?: boolean }[];
  };
}

export default function Home() {
  const [cities, setCities] = useState<string[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [invalidCities, setInvalidCities] = useState<string[]>([]);
  const [mode, setMode] = useState<"mst" | "tsp">("mst");
  const [startCity, setStartCity] = useState<string>("");
  const [useStartCity, setUseStartCity] = useState<boolean>(false);

  useEffect(() => {
    const validateCities = async () => {
      const invalid: string[] = [];
      for (const city of cities) {
        const exists: boolean = await checkCityExists(city);
        if (!exists) {
          invalid.push(city);
        }
      }
      setInvalidCities(invalid);
      if (invalid.length > 0) {
        setError(`Removing invalid cities: ${invalid.join(", ")}`);
        setCities(cities.filter(city => !invalid.includes(city)));
      } else {
        setError("");
        setInvalidCities([]);
      }
    };

    if (cities.length > 0) {
      validateCities();
    }
  }, [cities]);

  const calculateMST = (coords: { lat: number; lng: number }[], distances: number[][], cities: string[]) => {
    const edges: { u: number; v: number; w: number }[] = [];
    for (let i = 0; i < coords.length; i++) {
      for (let j = i + 1; j < coords.length; j++) {
        edges.push({ u: i, v: j, w: distances[i][j] });
      }
    }

    const mst: { u: number; v: number; w: number }[] = kruskal(coords.length, edges);
    const mstPaths = mst.map((edge) => ({
      from: cities[edge.u],
      to: cities[edge.v],
      distance: edge.w,
      isTsp: false,
    }));
    const totalDistance: number = mst.reduce((sum, edge) => sum + edge.w, 0);

    const nodes = cities.map((city, i) => ({
      id: i,
      label: city,
    }));
    const graphEdges: { from: number; to: number; label: string; color: string; isMst?: boolean; isTsp?: boolean }[] = [];
    for (let i = 0; i < coords.length; i++) {
      for (let j = i + 1; j < coords.length; j++) {
        const isMstEdge = mst.some(edge => 
          (edge.u === i && edge.v === j) || (edge.u === j && edge.v === i)
        );
        graphEdges.push({
          from: i,
          to: j,
          label: `${(distances[i][j] / 1000).toFixed(2)} km`,
          color: isMstEdge ? "#00FF00" : "#808080",
          isMst: isMstEdge,
          isTsp: false,
        });
      }
    }

    return { paths: mstPaths, totalDistance, graphData: { nodes, edges: graphEdges } };
  };

  const calculateTSP = (coords: { lat: number; lng: number }[], distances: number[][], cities: string[]) => {
    const n = coords.length;
    if (n === 0) {
      throw new Error("No cities available for TSP calculation.");
    }

    let startIndex = 0;
    if (useStartCity && startCity && cities.includes(startCity)) {
      startIndex = cities.indexOf(startCity);
    } else if (useStartCity && startCity && !cities.includes(startCity)) {
      setError("Start city not in the list, using first city instead.");
      startIndex = 0;
    }

    // Nearest Neighbor to get initial path
    const visited = new Set<number>();
    const path: number[] = [startIndex];
    visited.add(startIndex);

    while (path.length < n) {
      const last = path[path.length - 1];
      let minDist = Infinity;
      let nextCity = -1;

      for (let i = 0; i < n; i++) {
        if (!visited.has(i)) {
          const dist = distances[last][i] === Infinity ? Infinity : distances[last][i];
          if (dist < minDist) {
            minDist = dist;
            nextCity = i;
          }
        }
      }

      if (nextCity === -1) {
        for (let i = 0; i < n; i++) {
          if (!visited.has(i)) {
            nextCity = i;
            break;
          }
        }
        if (nextCity === -1) {
          break;
        }
      }

      path.push(nextCity);
      visited.add(nextCity);
    }

    // Log the initial path for debugging
    console.log("Initial TSP path:", path.map(i => cities[i]).join(" → "));

    // 2-opt optimization to improve the path
    let bestPath = [...path];
    let bestDistance = calculatePathDistance(bestPath, distances);
    let improved = true;
    let iteration = 0;
    const maxIterations = 100; // Limit iterations to avoid performance issues

    while (improved && iteration < maxIterations) {
      improved = false;
      for (let i = 1; i < n - 1; i++) {
        for (let k = i + 1; k < n; k++) {
          const newPath = twoOptSwap(bestPath, i, k);
          const newDistance = calculatePathDistance(newPath, distances);
          if (newDistance < bestDistance) {
            bestPath = newPath;
            bestDistance = newDistance;
            improved = true;
          }
        }
      }
      iteration++;
    }

    // Log the optimized path and distance
    console.log("Optimized TSP path:", bestPath.map(i => cities[i]).join(" → "));
    console.log("Total distance after optimization:", bestDistance);

    // Build TSP paths including the return leg
    const tspPaths: { from: string; to: string; distance: number; isTsp?: boolean }[] = [];
    let totalDistance = 0;

    for (let i = 0; i < bestPath.length - 1; i++) {
      const from = bestPath[i];
      const to = bestPath[i + 1];
      const distance = distances[from][to];
      if (distance === Infinity) {
        throw new Error(`No valid route between ${cities[from]} and ${cities[to]}`);
      }
      tspPaths.push({
        from: cities[from],
        to: cities[to],
        distance,
        isTsp: true,
      });
      totalDistance += distance;
    }

    // Add the return leg (from last city back to start city)
    const lastCity = bestPath[bestPath.length - 1];
    const firstCity = bestPath[0];
    const returnDistance = distances[lastCity][firstCity];
    if (returnDistance === Infinity) {
      throw new Error(`No valid route between ${cities[lastCity]} and ${cities[firstCity]}`);
    }
    tspPaths.push({
      from: cities[lastCity],
      to: cities[firstCity],
      distance: returnDistance,
      isTsp: true,
    });
    totalDistance += returnDistance;

    const unvisitedCities = cities.filter((_, index) => !visited.has(index));
    if (unvisitedCities.length > 0) {
      setError(`Could not include all cities in TSP route: ${unvisitedCities.join(", ")}`);
    }

    // Build graph edges including the return leg
    const nodes = cities.map((city, i) => ({
      id: i,
      label: city,
    }));
    const graphEdges: { from: number; to: number; label: string; color: string; isTsp?: boolean }[] = [];
    for (let i = 0; i < bestPath.length - 1; i++) {
      const from = bestPath[i];
      const to = bestPath[i + 1];
      graphEdges.push({
        from,
        to,
        label: `${(distances[from][to] / 1000).toFixed(2)} km`,
        color: "#FF0000",
        isTsp: true,
      });
    }
    // Add return edge
    graphEdges.push({
      from: lastCity,
      to: firstCity,
      label: `${(distances[lastCity][firstCity] / 1000).toFixed(2)} km`,
      color: "#FF0000",
      isTsp: true,
    });

    return { paths: tspPaths, totalDistance, graphData: { nodes, edges: graphEdges } };
  };

  // Helper function to calculate total distance of a path (including return)
  const calculatePathDistance = (path: number[], distances: number[][]): number => {
    let total = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const dist = distances[path[i]][path[i + 1]];
      if (dist === Infinity) return Infinity;
      total += dist;
    }
    const returnDist = distances[path[path.length - 1]][path[0]];
    if (returnDist === Infinity) return Infinity;
    total += returnDist; // Return leg
    return total;
  };

  // Helper function for 2-opt swap
  const twoOptSwap = (path: number[], i: number, k: number): number[] => {
    const newPath = [...path];
    while (i < k) {
      [newPath[i], newPath[k]] = [newPath[k], newPath[i]];
      i++;
      k--;
    }
    return newPath;
  };

  const handleCalculate = async () => {
    if (cities.length < 3 || cities.length > 10) {
      setError("Please enter between 3 and 10 cities.");
      return;
    }

    setError("");
    setResult(null);
    setLoading(true);

    try {
      const coords: { lat: number; lng: number }[] = await getCoordinates(cities);
      if (coords.length !== cities.length) {
        setError("Some cities could not be found. Please check your input and try again.");
        setLoading(false);
        return;
      }

      const distances: number[][] = await getRoadDistances(coords);
      // Validate distances
      for (let i = 0; i < distances.length; i++) {
        for (let j = 0; j < distances[i].length; j++) {
          if (distances[i][j] === Infinity && i !== j) {
            setError(`Cannot compute route: No valid distance between ${cities[i]} and ${cities[j]}`);
            setLoading(false);
            return;
          }
        }
      }

      const result = mode === "mst"
        ? calculateMST(coords, distances, cities)
        : calculateTSP(coords, distances, cities);

      setResult(result);
    } catch (err) {
      setError("An error occurred while calculating. Please try again later.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCities([]);
    setResult(null);
    setError("");
    setLoading(false);
    setInvalidCities([]);
    setStartCity("");
    setUseStartCity(false);
  };

  const handleToggleMode = () => {
    setMode(mode === "mst" ? "tsp" : "mst");
    if (result) handleCalculate();
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-3xl"
      >
        <h1 className="text-4xl font-bold text-center mb-8">City Route Calculator</h1>
        {mode === "mst" ? (
          <CityInput cities={cities} setCities={setCities} invalidCities={invalidCities} />
        ) : (
          <CityInputTSP 
            cities={cities} 
            setCities={setCities} 
            invalidCities={invalidCities} 
            startCity={startCity}
            setStartCity={setStartCity}
            useStartCity={useStartCity}
            setUseStartCity={setUseStartCity}
          />
        )}
        <div className="flex justify-between mt-6 gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCalculate}
            disabled={loading || cities.length < 3}
            className={`px-6 py-3 rounded-lg font-semibold ${
              loading || cities.length < 3
                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                : "bg-white text-black hover:bg-gray-200"
            } transition-colors`}
          >
            {loading ? "Calculating..." : `Calculate ${mode.toUpperCase()}`}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleToggleMode}
            className="px-6 py-3 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors"
          >
            Switch to {mode === "mst" ? "TSP" : "MST"}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleReset}
            className="px-6 py-3 rounded-lg bg-white text-black font-semibold hover:bg-gray-200 transition-colors"
          >
            Reset
          </motion.button>
        </div>
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-400 text-center mt-4 bg-red-900 bg-opacity-50 p-3 rounded-lg"
          >
            {error}
          </motion.p>
        )}
        {result && (mode === "mst" ? (
          <MstResult result={result} mode={mode} />
        ) : (
          <MstResultTSP result={result} mode={mode} />
        ))}
      </motion.div>
    </div>
  );
}