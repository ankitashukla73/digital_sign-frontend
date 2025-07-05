import { useState, useRef } from "react";
import API from "../utils/api";
import { useNavigate } from "react-router-dom";
import { toast, Toaster } from "react-hot-toast";
import { motion } from "framer-motion";

export default function Upload() {
  const [pdfFile, setPdfFile] = useState(null);
  const navigate = useNavigate();
  const inputRef = useRef();

  const handleFileChange = (e) => {
    setPdfFile(e.target.files[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setPdfFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleClick = () => {
    inputRef.current.click();
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setPdfFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pdfFile) {
      toast.error("Please select a PDF file first!");
      return;
    }
    const formData = new FormData();
    formData.append("pdf", pdfFile);

    try {
      const token = localStorage.getItem("token");
      await API.post("/docs/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success("Upload successful!");
      setPdfFile(null);
    } catch (err) {
      toast.error(
        (err.response && err.response.data && err.response.data.msg) ||
          "Upload failed!"
      );
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <Toaster position="top-center" />
      <form onSubmit={handleSubmit} className="w-full max-w-md">
        <motion.div
          className={`bg-white border-2 border-dashed ${
            pdfFile ? "border-teal-400" : "border-gray-200"
          } rounded-2xl flex flex-col items-center justify-center p-8 cursor-pointer shadow-lg transition hover:border-amber-400`}
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          whileHover={{ scale: 1.03, boxShadow: "0 8px 24px #5eead4aa" }}
        >
          <input
            type="file"
            accept="application/pdf"
            ref={inputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <svg
            className="w-16 h-16 text-teal-400 mb-3"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 48 48"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16 32v4a4 4 0 004 4h8a4 4 0 004-4v-4M12 20l12-12m0 0l12 12m-12-12v28"
            />
          </svg>
          <span className="text-gray-700 text-lg mb-2 font-semibold">
            {pdfFile ? (
              <span className="flex items-center gap-2">
                {pdfFile.name}
                <button
                  type="button"
                  onClick={handleRemove}
                  className="ml-2 px-2 py-0.5 bg-red-100 text-red-500 rounded hover:bg-red-200 text-xs"
                  tabIndex={-1}
                >
                  Remove
                </button>
              </span>
            ) : (
              "Click or drag PDF here to upload"
            )}
          </span>
          <span className="text-xs text-gray-400 mb-1">(PDF only, max 10MB)</span>
          <span className="text-xs text-coral-500">
            Your files are encrypted and secure.
          </span>
        </motion.div>
        <motion.button
          type="submit"
          className="w-full mt-6 bg-gradient-to-r from-teal-400 via-teal-500 to-coral-400 text-white py-2 rounded-lg font-bold text-lg shadow-lg hover:from-coral-400 hover:to-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
        >
          Upload
        </motion.button>
      </form>
    </div>
  );
}
