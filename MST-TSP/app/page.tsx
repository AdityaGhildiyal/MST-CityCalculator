"use client"

import { useState } from "react"
import CityInput from "@/components/CityInput"
import MstResult from "@/components/MstResult"
import { getCoordinates, getRoadDistances } from "@/lib/apiUtils"
import { kruskal } from "@/lib/kruskal"
import { motion } from "framer-motion"

export default function Home() {
  const [cities, setCities] = useState<string[]>([])
  const [mstResult, setMstResult] = useState<{ paths: any[]; totalDistance: number } | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleCalculate = async () => {
    if (cities.length < 3 || cities.length > 10) {
      setError("Please enter between 3 and 10 cities.")
      return
    }

    setError("")
    setMstResult(null)
    setLoading(true)

    try {
      const coords = await getCoordinates(cities)
      if (coords.length !== cities.length) {
        setError("Some cities could not be found. Please check your input and try again.")
        setLoading(false)
        return
      }

      const distances = await getRoadDistances(coords)
      const edges = []
      for (let i = 0; i < coords.length; i++) {
        for (let j = i + 1; j < coords.length; j++) {
          edges.push({ u: i, v: j, w: distances[i][j] })
        }
      }

      const mst = kruskal(coords.length, edges)
      const mstPaths = mst.map((edge) => ({
        from: cities[edge.u],
        to: cities[edge.v],
        distance: edge.w,
      }))
      const totalDistance = mst.reduce((sum, edge) => sum + edge.w, 0)

      setMstResult({ paths: mstPaths, totalDistance })
    } catch (err) {
      setError("An error occurred while calculating the MST. Please try again later.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setCities([])
    setMstResult(null)
    setError("")
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-3xl"
      >
        <h1 className="text-4xl font-bold text-center mb-8">City MST Calculator</h1>
        <CityInput cities={cities} setCities={setCities} />
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
  )
}

