// src/pages/LandingPage.jsx

import { motion } from "framer-motion";
import Register from "./Register";
import Login from "./Login";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";

export default function LandingPage() {
  const [showLogin, setShowLogin] = useState(false);
  const navigate = useNavigate();

  // Handler to show login after successful registration
  const handleRegistered = () => setShowLogin(true);

  // Handler to show login when user clicks "Login here"
  const handleShowLogin = () => setShowLogin(true);

  // Handler to show register when user clicks "Create new account"
  const handleShowRegister = () => setShowLogin(false);

  return (
    <div className="min-h-screen flex flex-col bg-white overflow-y-hidden">
      <Navbar />
      <div className="flex flex-col md:flex-row w-full justify-center gap-2 flex-1">
        <div className="left w-full md:w-[60%] flex flex-col items-center justify-center px-4 py-8 bg-gradient-to-br from-teal-100 via-white to-gray-100">
          <motion.h1
            className="flex flex-wrap md:flex-nowrap gap-2 justify-center text-4xl md:text-6xl font-extrabold text-center mb-4 md:whitespace-nowrap"
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <span className="text-teal-600">Signet</span>
            <span className="text-coral-500">Cloud</span>
          </motion.h1>
          <motion.h2
            className="text-xl md:text-2xl text-charcoal-700 mb-8 text-center font-semibold"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            Secure. Simple. Seamless.{" "}
            <span className="text-coral-500">
              Sign your documents with confidence.
            </span>
          </motion.h2>
        </div>
        <div className="right w-full md:w-[40%] flex mb-4 items-center justify-center px-4 py-8 bg-gray-50 rounded-lg shadow-lg">
          {!showLogin ? (
            <Register
              onRegistered={handleRegistered}
              onShowLogin={handleShowLogin}
            />
          ) : (
            <Login onShowRegister={handleShowRegister} />
          )}
        </div>
      </div>
    </div>
  );
}
