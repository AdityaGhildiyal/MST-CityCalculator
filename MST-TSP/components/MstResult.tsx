"use client";

import { useState, useEffect, useRef } from "react";
import { Network } from "vis-network/standalone";
import { motion } from "framer-motion";

interface MstResultProps {
  result: {
    paths: { from: string; to: string; distance: number }[];
    totalDistance: number;
    graphData: {
      nodes: { id: number; label: string }[];
      edges: { from: number; to: number; label: string; color: string }[];
    };
  };
}

const MstResult: React.FC<MstResultProps> = ({ result }) => {
  const { paths, totalDistance, graphData } = result;
  const [showGraph, setShowGraph] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showNonMstEdges, setShowNonMstEdges] = useState(false); // Toggle for non-MST edges
  const graphRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);

  useEffect(() => {
    if (showGraph && graphRef.current && !networkRef.current) {
      const filteredEdges = showNonMstEdges
        ? graphData.edges
        : graphData.edges.filter(edge => edge.color === "#00FF00"); // Only MST edges if toggled off

      const options = {
        nodes: {
          shape: "dot",
          size: 12, // Smaller nodes to reduce clutter
          font: { size: 14, color: "#ffffff", face: "Arial", bold: true }, // Bolder, white labels
          color: { background: "#4a90e2", border: "#ffffff", highlight: { background: "#6ab0ff" } },
        },
        edges: {
          width: 2, // Slightly thinner for less overlap
          font: {
            size: 14, // Slightly smaller for density, still readable
            color: "#ffffff",
            align: "middle",
            background: "rgba(0, 0, 0, 0.8)", // Darker background for contrast
            strokeWidth: 2, // Sharper outline
            vadjust: -10, // Move labels slightly above edges for clarity
          },
          arrows: { to: { enabled: false } },
          smooth: { type: "discrete" },
          color: { inherit: true }, // Use edge-specific colors
        },
        physics: {
          enabled: true,
          stabilization: { iterations: 3000 }, // More iterations for better layout
          barnesHut: {
            gravitationalConstant: -6000, // Stronger repulsion for wider spacing
            springLength: 250, // Longer springs for better distribution
            springConstant: 0.03, // Softer springs for natural layout
          },
          minVelocity: 0.05, // Prevent jitter, smoother movement
        },
        layout: {
          randomSeed: 42,
          improvedLayout: true,
        },
        interaction: {
          hover: true,
          tooltipDelay: 100,
          navigationButtons: true, // Enable zoom/pan controls
          zoomView: true,
          dragView: true,
        },
      };

      networkRef.current = new Network(graphRef.current, { ...graphData, edges: filteredEdges }, options);

      // Fit graph on load for better visibility
      networkRef.current.fit({ animation: { duration: 1000, easingFunction: "easeInOutQuad" } });

      if (isFullScreen) {
        networkRef.current.setOptions({ physics: { enabled: false } });
      }

      // Cleanup on unmount
      return () => {
        if (networkRef.current) {
          networkRef.current.destroy();
          networkRef.current = null;
        }
      };
    }
  }, [showGraph, graphData, isFullScreen, showNonMstEdges]);

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
    if (networkRef.current) {
      networkRef.current.setOptions({ physics: { enabled: !isFullScreen } }); // Toggle physics on/off
      networkRef.current.fit({ animation: { duration: 1000, easingFunction: "easeInOutQuad" } });
    }
  };

  const toggleNonMstEdges = () => {
    setShowNonMstEdges(!showNonMstEdges);
  };

  return (
    <div className="mt-6">
      <h2 className="text-2xl font-semibold mb-4">Minimum Spanning Tree</h2>
      <table className="w-full border-collapse mb-4 bg-gray-800 rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-gray-700">
            <th className="p-2 border-b border-gray-600">From</th>
            <th className="p-2 border-b border-gray-600">To</th>
            <th className="p-2 border-b border-gray-600">Distance (km)</th>
          </tr>
        </thead>
        <tbody>
          {paths.map((path, index) => (
            <tr key={index} className="hover:bg-gray-700">
              <td className="p-2 border-b border-gray-600">{path.from}</td>
              <td className="p-2 border-b border-gray-600">{path.to}</td>
              <td className="p-2 border-b border-gray-600">{(path.distance / 1000).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-lg font-semibold text-center">
        Total Distance: {(totalDistance / 1000).toFixed(2)} km
      </p>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowGraph(!showGraph)}
        className="mt-4 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
      >
        {showGraph ? "Hide Graph" : "Expand Graph"}
      </motion.button>
      {showGraph && graphData && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.5 }}
          className="mt-4 relative"
        >
          <h3 className="text-lg font-semibold mb-2">MST Graph</h3>
          <div className="flex justify-end mb-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleFullScreen}
              className="px-3 py-1 rounded-lg bg-transparent border border-blue-600 text-blue-400 font-semibold hover:bg-blue-600 hover:text-white transition-colors z-10"
            >
              {isFullScreen ? "Exit Full Screen" : "Full Screen"}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleNonMstEdges}
              className="ml-2 px-3 py-1 rounded-lg bg-transparent border border-purple-600 text-purple-400 font-semibold hover:bg-purple-600 hover:text-white transition-colors z-10"
            >
              {showNonMstEdges ? "Hide Non-MST Edges" : "Show Non-MST Edges"}
            </motion.button>
          </div>
          <div
            ref={graphRef}
            className={`graph-container bg-[#1a1a1a] ${isFullScreen ? "fixed top-0 left-0 w-screen h-screen z-50" : "w-full"}`}
          />
        </motion.div>
      )}
    </div>
  );
};

export default MstResult;