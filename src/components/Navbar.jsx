import React from "react";

export default function Navbar() {
  return (
    <nav className="bg-white/90 backdrop-blur-md shadow-md px-4 py-2 flex justify-between items-center h-16 sticky top-0 z-50">
      <div className="m-auto flex items-center gap-2">
        <span
          className="text-3xl md:text-4xl font-extrabold"
          style={{
            fontFamily: "'Pacifico', cursive",
            color: "#14b8a6", // Tailwind teal-500
            letterSpacing: "1px",
            textShadow: "0 2px 8px #5eead4aa",
          }}
        >
          Signet
        </span>
        <span
          className="text-3xl text-coral-500 md:text-4xl font-bold tracking-tight"
          style={{
            // Tailwind coral-500 (rose-400)
            textShadow: "0 2px 8px #fda4af55",
          }}
        >
          Cloud
        </span>
      </div>
      {/* Add right-side actions here if needed */}
    </nav>
  );
}
