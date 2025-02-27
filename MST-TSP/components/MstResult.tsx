"use client"

import type React from "react"

import { motion } from "framer-motion"

interface MstResultProps {
  result: {
    paths: Array<{ from: string; to: string; distance: number }>
    totalDistance: number
  }
}

const MstResult: React.FC<MstResultProps> = ({ result }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-8 bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg p-6 rounded-lg"
    >
      <h2 className="text-2xl font-semibold mb-4">Minimum Spanning Tree</h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-black bg-opacity-30">
              <th className="p-3 text-left">From</th>
              <th className="p-3 text-left">To</th>
              <th className="p-3 text-left">Distance (km)</th>
            </tr>
          </thead>
          <tbody>
            {result.paths.map((path, index) => (
              <motion.tr
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="hover:bg-white hover:bg-opacity-10"
              >
                <td className="p-3 border-t border-gray-700">{path.from}</td>
                <td className="p-3 border-t border-gray-700">{path.to}</td>
                <td className="p-3 border-t border-gray-700">{(path.distance / 1000).toFixed(2)}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-6 text-xl font-semibold text-center text-white"
      >
        Total Distance: {(result.totalDistance / 1000).toFixed(2)} km
      </motion.p>
    </motion.div>
  )
}

export default MstResult

