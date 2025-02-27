"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"

interface CityInputProps {
  cities: string[]
  setCities: (cities: string[]) => void
}

const CityInput: React.FC<CityInputProps> = ({ cities, setCities }) => {
  const [input, setInput] = useState("")

  const handleAddCity = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && cities.length < 10 && !cities.includes(input.trim())) {
      setCities([...cities, input.trim()])
      setInput("")
    }
  }

  const handleRemoveCity = (cityToRemove: string) => {
    setCities(cities.filter((city) => city !== cityToRemove))
  }

  return (
    <div className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-lg p-6">
      <form onSubmit={handleAddCity} className="flex gap-2 mb-6">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter a city (e.g., Tokyo)"
          className="flex-1 p-3 bg-black bg-opacity-50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-white placeholder-gray-400"
          disabled={cities.length >= 10}
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="submit"
          disabled={cities.length >= 10}
          className={`px-4 py-3 rounded-lg font-semibold ${
            cities.length >= 10
              ? "bg-gray-700 text-gray-400 cursor-not-allowed"
              : "bg-white text-black hover:bg-gray-200"
          } transition-colors`}
        >
          Add
        </motion.button>
      </form>
      <motion.ul layout className="space-y-2">
        {cities.map((city, index) => (
          <motion.li
            key={city}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex justify-between items-center p-3 bg-black bg-opacity-30 rounded-lg"
          >
            <span>{city}</span>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleRemoveCity(city)}
              className="text-red-400 hover:text-red-300 font-semibold"
            >
              Remove
            </motion.button>
          </motion.li>
        ))}
      </motion.ul>
      {cities.length === 0 && <p className="text-gray-400 text-center mt-4">Add some cities to start!</p>}
      {cities.length >= 10 && (
        <p className="text-yellow-400 text-center mt-4 bg-yellow-900 bg-opacity-50 p-2 rounded-lg">
          Maximum 10 cities reached.
        </p>
      )}
    </div>
  )
}

export default CityInput

