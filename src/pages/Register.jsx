import { useState } from "react";
import API from "../utils/api";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast, Toaster } from "react-hot-toast";

export default function Register({ onRegistered, onShowLogin }) {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/auth/register", form);
      toast.success("Registered! Please login.");
      setTimeout(() => {
        if (onRegistered) onRegistered();
      }, 1500);
    } catch (err) {
      toast.error(
        (err.response && err.response.data && err.response.data.msg) ||
          "Error registering"
      );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <Toaster position="top-center" />
      <motion.form
        onSubmit={handleSubmit}
        className="bg-white/90 backdrop-blur-md p-8 md:p-10 rounded-2xl shadow-2xl w-full max-w-md flex flex-col gap-6 border border-gray-200"
        initial={{ opacity: 0, y: 60, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <h2 className="text-3xl font-extrabold text-teal-600 mb-2 text-center drop-shadow">
          Create Your Account
        </h2>
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
          className="px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-400 transition bg-gray-50 text-charcoal-700"
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-400 transition bg-gray-50 text-charcoal-700"
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-400 transition bg-gray-50 text-charcoal-700"
          required
        />
        <motion.button
          type="submit"
          className="bg-coral-500 text-white w-full mt-2 py-2 rounded-lg font-bold text-lg shadow hover:bg-teal-600 transition"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
        >
          Register
        </motion.button>
        <motion.div className="text-center text-charcoal-700">
          Already have an account?{" "}
          <span
            className="text-teal-600 cursor-pointer font-semibold hover:underline"
            onClick={onShowLogin}
          >
            Login here
          </span>
        </motion.div>
      </motion.form>
    </div>
  );
}
