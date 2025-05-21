"use client";

import type React from "react";
import { useState } from "react";
import { motion } from "framer-motion";

interface CityInputTSPProps {
  cities: string[];
  setCities: (cities: string[]) => void;
  invalidCities: string[];
  startCity: string;
  setStartCity: (city: string) => void;
  useStartCity: boolean;
  setUseStartCity: (value: boolean) => void;
}

const CityInputTSP: React.FC<CityInputTSPProps> = ({
  cities,
  setCities,
  invalidCities,
  startCity,
  setStartCity,
  useStartCity,
  setUseStartCity,
}) => {
  const [input, setInput] = useState("");
  const [startCityInput, setStartCityInput] = useState<string>(""); // Temporary input for start city
  const [startCityError, setStartCityError] = useState<string>("");

  const handleAddCity = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && cities.length < 10 && !cities.includes(input.trim())) {
      setCities([...cities, input.trim()]);
      setInput("");
    }
  };

  const handleAddStartCity = (e: React.FormEvent) => {
    e.preventDefault();
    if (startCityInput.trim()) {
      if (cities.includes(startCityInput.trim())) {
        setStartCity(startCityInput.trim());
        setStartCityError("");
      } else if (cities.length < 10) {
        setCities([...cities, startCityInput.trim()]);
        setStartCity(startCityInput.trim());
        setStartCityError("");
      } else {
        setStartCityError("Cannot add start city: Maximum 10 cities reached. Please remove a city first.");
      }
      setStartCityInput("");
    }
  };

  const handleRemoveCity = (cityToRemove: string) => {
    setCities(cities.filter((city) => city !== cityToRemove));
    if (cityToRemove === startCity) {
      setStartCity("");
      setStartCityInput("");
    }
  };

  const handleSelectStartCity = (city: string) => {
    setStartCity(city);
    setStartCityInput(city);
    setStartCityError("");
  };

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
      <div className="mb-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={useStartCity}
            onChange={(e) => {
              setUseStartCity(e.target.checked);
              if (!e.target.checked) {
                setStartCity("");
                setStartCityInput("");
                setStartCityError("");
              }
            }}
            className="w-4 h-4 text-white bg-gray-700 border-gray-600 rounded focus:ring-0 focus:ring-offset-0"
          />
          <span className="text-white">Use Start City</span>
        </label>
        {useStartCity && (
          <>
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={startCityInput}
                onChange={(e) => setStartCityInput(e.target.value)}
                placeholder="Enter start city (e.g., Delhi)"
                className="flex-1 p-3 bg-black bg-opacity-50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-white placeholder-gray-400"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAddStartCity}
                className="px-4 py-3 rounded-lg font-semibold bg-white text-black hover:bg-gray-200 transition-colors"
              >
                Add
              </motion.button>
            </div>
            {cities.length > 0 && (
              <div className="mt-2">
                <label className="text-white">Or select from list:</label>
                <select
                  value={startCity}
                  onChange={(e) => handleSelectStartCity(e.target.value)}
                  className="ml-2 p-2 bg-black bg-opacity-50 border border-gray-700 rounded-lg text-white focus:outline-none"
                >
                  <option value="">Select a start city</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {startCityError && (
              <p className="text-red-400 text-center mt-2 bg-red-900 bg-opacity-50 p-2 rounded-lg">
                {startCityError}
              </p>
            )}
            {useStartCity && startCity && (
              <p className="mt-2 text-green-400">Start City: {startCity}</p>
            )}
          </>
        )}
      </div>
      <motion.ul layout className="space-y-2">
        {cities.map((city, index) => (
          <motion.li
            key={city}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={`flex justify-between items-center p-3 rounded-lg ${
              invalidCities.includes(city) ? "bg-red-900 bg-opacity-70" : "bg-black bg-opacity-30"
            }`}
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
  );
};

export default CityInputTSP;