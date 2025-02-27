"use client";

import { useState, useEffect } from "react";
import CityInput from "@/components/CityInput";
import MstResult from "@/components/MstResult";
import { getCoordinates, getRoadDistances } from "@/lib/apiUtils";
import { kruskal } from "@/lib/kruskal";
import { checkCityExists } from "@/lib/api";
import { motion } from "framer-motion";

export default function Home() {
  const [cities, setCities] = useState<string[]>([]);
  const [mstResult, setMstResult] = useState<{
    paths: { from: string; to: string; distance: number }[];
    totalDistance: number;
    graphData: { nodes: { id: number; label: string }[]; edges: { from: number; to: number; label: string; color: string }[] };
  } | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [invalidCities, setInvalidCities] = useState<string[]>([]);

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

  const handleCalculate = async () => {
    if (cities.length < 3 || cities.length > 10) {
      setError("Please enter between 3 and 10 cities.");
      return;
    }

    setError("");
    setMstResult(null);
    setLoading(true);

    try {
      const coords: { lat: number; lng: number }[] = await getCoordinates(cities);
      if (coords.length !== cities.length) {
        setError("Some cities could not be found. Please check your input and try again.");
        setLoading(false);
        return;
      }

      const distances: number[][] = await getRoadDistances(coords);
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
      }));
      const totalDistance: number = mst.reduce((sum, edge) => sum + edge.w, 0);

      // Graph data for vis-network
      const nodes = cities.map((city, i) => ({
        id: i,
        label: city,
      }));
      const graphEdges: { from: number; to: number; label: string; color: string }[] = [];
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
          });
        }
      }

      setMstResult({ paths: mstPaths, totalDistance, graphData: { nodes, edges: graphEdges } });
    } catch (err) {
      setError("An error occurred while calculating the MST. Please try again later.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCities([]);
    setMstResult(null);
    setError("");
    setLoading(false);
    setInvalidCities([]);
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-3xl"
      >
        <h1 className="text-4xl font-bold text-center mb-8">City MST Calculator</h1>
        <CityInput cities={cities} setCities={setCities} invalidCities={invalidCities} />
        <div className="flex justify-between mt-6">
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
            {loading ? "Calculating..." : "Calculate MST"}
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
        {mstResult && <MstResult result={mstResult} />}
      </motion.div>
    </div>
  );
}