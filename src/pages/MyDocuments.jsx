import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";
import Navbar from "../components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { Download, Eye, Trash2 } from "lucide-react";

export default function MyDocuments() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAlert, setShowAlert] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await API.get("/docs", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDocs(res.data);
      } catch (err) {
        console.error("Error fetching documents", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDocs();
  }, []);

  const handleDelete = (id) => {
    setDeleteId(id);
    setShowAlert(true);
  };

  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem("token");
      await API.delete(`/docs/${deleteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Document deleted!");
      setDocs(docs.filter((doc) => doc._id !== deleteId));
    } catch (err) {
      console.error("Error deleting document", err);
      toast.error("Failed to delete document");
    } finally {
      setShowAlert(false);
      setDeleteId(null);
    }
  };

  const cancelDelete = () => {
    setShowAlert(false);
    setDeleteId(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-teal-50 via-white to-coral-50">
      <Navbar />
      <div className="flex-1 flex flex-col px-4 md:px-10 py-8">
        <motion.h2
          className="text-3xl md:text-4xl font-extrabold mb-2 text-teal-600 drop-shadow text-center"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <span className="mr-2">📑</span> Your Documents
        </motion.h2>
        <p className="text-gray-600 mb-8 text-center max-w-2xl mx-auto">
          Manage, preview, and download your uploaded PDFs. Click{" "}
          <span className="font-semibold text-coral-500">Preview</span> to view or
          sign your document.
        </p>
        {loading ? (
          <div className="text-center text-gray-500 py-12 text-lg">
            Loading...
          </div>
        ) : docs.length === 0 ? (
          <motion.div
            className="flex flex-col items-center justify-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7 }}
          >
            <span className="text-6xl mb-4">📂</span>
            <p className="text-gray-600 text-lg">
              No documents found. Try uploading one!
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {docs.map((doc, idx) => (
              <motion.div
                key={doc._id}
                className="bg-white/90 border border-teal-100 rounded-2xl shadow-lg p-6 flex flex-col gap-4 hover:shadow-teal-200 transition"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.07 }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-4xl text-teal-400">📄</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 text-base truncate">
                      {doc.originalname}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Uploaded:{" "}
                      <span className="font-medium">
                        {new Date(doc.uploadedAt).toLocaleString()}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <motion.button
                    onClick={() => navigate(`/preview/${doc._id}`)}
                    className="flex-1 bg-gradient-to-r from-teal-400 via-teal-500 to-coral-400 hover:from-coral-400 hover:to-teal-500 text-white text-sm px-3 py-2 rounded-lg font-semibold shadow transition-all flex items-center justify-center"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    title="Preview"
                  >
                    <Eye className="w-5 h-5 mr-1" /> Preview
                  </motion.button>
                  <a
                    href={`https://digital-sign-backend.onrender.com/uploads/${doc.filename}`}
                    download={doc.originalname}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm px-3 py-2 rounded-lg font-semibold shadow transition-all flex items-center justify-center"
                    title="Download"
                  >
                    <Download className="w-5 h-5 mr-1" /> Download
                  </a>
                  <button
                    onClick={() => handleDelete(doc._id)}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-2 rounded-lg font-semibold shadow transition-all flex items-center justify-center"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5 mr-1" /> Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showAlert && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center gap-6 max-w-xs w-full"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="stroke-coral-500 h-10 w-10 mb-2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                <span className="text-lg text-center font-semibold text-gray-700">
                  Are you sure you want to delete this document?
                </span>
                <div className="flex gap-4 mt-2">
                  <button
                    className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 font-semibold"
                    onClick={cancelDelete}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold"
                    onClick={confirmDelete}
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

