import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";
import Navbar from "../components/Navbar";
import { motion } from "framer-motion";
import { toast, Toaster } from "react-hot-toast";
import { Download, Eye, Trash2 } from "lucide-react";
import { FiInfo } from "react-icons/fi";

import { CgMail } from "react-icons/cg";

const SignedDoc = () => {
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState([]);
  const [showAlert, setShowAlert] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [infoDoc, setInfoDoc] = useState(null); // <-- NEW STATE
  const [auditTrail, setAuditTrail] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareDocId, setShareDocId] = useState(null);
  const [recipient, setRecipient] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await API.get("/docs/signed", {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log(res);
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
      await API.delete(`/docs/signed/${deleteId}`, {
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

  // Info icon handler
  const handleInfo = async (doc) => {
    setInfoDoc(doc);
    setAuditTrail([]);
    setAuditLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await API.get(`/signature/audit/${doc._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAuditTrail(res.data);
    } catch (err) {
      setAuditTrail([]);
    } finally {
      setAuditLoading(false);
      document.getElementById("my_modal_1").showModal();
    }
  };

  //Share function
  const handleShare = (doc) => {
    setShareDocId(doc._id);
    setRecipient("");
    setShowShareModal(true);
  };

  const sendShare = async () => {
    if (!recipient) {
      toast.error("Please enter recipient email");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await API.post(
        "share",
        { fileId: shareDocId, recipient },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.status == 200) {
        toast.success(res.data.msg); // Show backend message
      } else {
        toast.success("Document shared!");
      }
      setShowShareModal(false);
    } catch (err) {
      toast.error("Failed to share document");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-amber-100">
      <Navbar />
      <div className="flex-1 flex flex-col items-center">
        <div className="flex flex-col items-center mt-8">
          <motion.h2
            className="text-3xl md:text-4xl font-extrabold mb-2 text-amber-600 drop-shadow"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            📄 Signed PDFs
          </motion.h2>
          <p className="text-gray-600 mb-6 text-center max-w-xl">
            All your signed documents are listed below. Click{" "}
            <span className="font-semibold text-amber-600">Preview</span> to view
            your PDF.
          </p>
        </div>
        <div className="max-w-2xl mx-auto px-2 pb-12">
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
              <p className="text-gray-600 text-lg">No signed documents found.</p>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {docs.map((doc, idx) => (
                <motion.div
                  key={doc._id}
                  className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between bg-white/90 border border-amber-100 rounded-2xl shadow-lg hover:shadow-amber-200 transition overflow-x-auto"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.07 }}
                >
                  <div className="min-w-0">
                    <p className="font-bold text-gray-800 text-base sm:text-lg flex items-center gap-2 break-all">
                      <span className="text-amber-500">📄</span>
                      {doc.originalname}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      Uploaded on{" "}
                      <span className="font-medium">
                        {new Date(doc.uploadedAt).toLocaleString()}
                      </span>
                    </p>
                    {!doc.signedFile && (
                      <span className="text-red-500 text-xs">
                        No signed PDF available
                      </span>
                    )}
                  </div>
                  <div className="ml-0 md:ml-10 flex flex-row gap-2 sm:gap-4 mt-4 md:mt-0 flex-wrap">
                    {/* Preview */}
                    {doc.signedFile ? (
                      <motion.button
                        onClick={() =>
                          window.open(
                            `http://localhost:5000/${doc.signedFile}`,
                            "_blank"
                          )
                        }
                        className="ml-12 w-10 h-10 flex items-center justify-center rounded-lg bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 shadow transition-all"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.97 }}
                        title="Preview"
                      >
                        <Eye className="w-5 h-5 text-white" />
                      </motion.button>
                    ) : (
                      <span className="text-red-500 text-xs">
                        No signed PDF available
                      </span>
                    )}

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(doc._id)}
                      className="w-10 h-10 flex items-center justify-center rounded-lg bg-red-500 hover:bg-red-600 shadow transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5 text-white" />
                    </button>

                    {/* Info */}
                    <motion.button
                      className="w-10 h-10 flex items-center justify-center rounded-lg bg-indigo-500 hover:bg-indigo-600 shadow transition-all"
                      type="button"
                      whileHover={{ scale: 1.15, rotate: 20 }}
                      whileTap={{ scale: 0.95, rotate: -10 }}
                      animate={{
                        rotate: [0, 10, -10, 0],
                        transition: { repeat: Infinity, duration: 2 },
                      }}
                      title="Info"
                      onClick={() => handleInfo(doc)}
                    >
                      <FiInfo className="w-5 h-5 text-white" />
                    </motion.button>

                    {/* Share */}
                    <motion.button
                      onClick={() => handleShare(doc)}
                      className="w-10 h-10 flex items-center justify-center rounded-lg bg-white border border-gray-300 shadow transition-all"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.97 }}
                      title="Share"
                    >
                      <CgMail className="w-5 h-5 text-gray-800" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
        {showAlert && (
          <div
            role="alert"
            className="alert alert-vertical sm:alert-horizontal fixed top-10 left-1/2 transform -translate-x-1/2 z-50 bg-white shadow-lg border rounded-lg p-4 flex items-center gap-4"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="stroke-info h-6 w-6 shrink-0"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <span className="text-lg">
              Are you sure you want to delete this signed document?
            </span>
            <div className="flex gap-2">
              <button className="btn btn-sm" onClick={cancelDelete}>
                No
              </button>
              <button
                className="btn bg-red-500 btn-sm btn-primary"
                onClick={confirmDelete}
              >
                Yes
              </button>
            </div>
          </div>
        )}

        {/* Modal for audit Info */}
        <dialog id="my_modal_1" className="modal">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Document Info</h3>
            {infoDoc && (
              <div className="py-4 space-y-2">
                <div>
                  <span className="font-semibold">File Name:</span> {infoDoc.originalname}
                </div>
                <div>
                  <span className="font-semibold">Uploaded:</span> {new Date(infoDoc.uploadedAt).toLocaleString()}
                </div>
                <div className="mt-4">
                  <span className="font-semibold">Audit Info:</span>
                  {auditLoading ? (
                    <div className="text-gray-500 text-sm">Loading audit info...</div>
                  ) : auditTrail && auditTrail.length > 0 ? (
                    <div className="max-h-40 overflow-y-auto mt-2">
                      <table className="table-auto w-full text-xs">
                        <thead>
                          <tr>
                            <th className="px-2 py-1 text-left">Name</th>
                            <th className="px-2 py-1 text-left">Email</th>
                            <th className="px-2 py-1 text-left">IP Address</th>
                            <th className="px-2 py-1 text-left">Signed At</th>
                          </tr>
                        </thead>
                        <tbody>
                          {auditTrail.map((entry, idx) => (
                            <tr key={idx}>
                              <td className="px-2 py-1">{entry.signer?.name || "-"}</td>
                              <td className="px-2 py-1">{entry.signer?.email || "-"}</td>
                              <td className="px-2 py-1">{entry.ipAddress || "-"}</td>
                              <td className="px-2 py-1">
                                {entry.signedAt
                                  ? new Date(entry.signedAt).toLocaleString()
                                  : "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm">No audit info found.</div>
                  )}
                </div>
              </div>
            )}
            <div className="modal-action">
              <button
                className="btn"
                onClick={() => document.getElementById("my_modal_1").close()}
              >
                Close
              </button>
            </div>
          </div>
        </dialog>

        {/* Share Modal */}
        {showShareModal && (
          <dialog open className="modal" onClose={() => setShowShareModal(false)}>
            <div className="modal-box">
              <h3 className="font-bold text-lg mb-2">Share Document</h3>
              <input
                type="email"
                className="input input-bordered w-full mb-4"
                placeholder="Recipient's email"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
              <div className="modal-action flex gap-2">
                <button className="btn" onClick={() => setShowShareModal(false)}>
                  Cancel
                </button>
                <button className="btn bg-amber-600 text-white" onClick={sendShare}>
                  Share
                </button>
              </div>
            </div>
          </dialog>
        )}
      </div>
      <Toaster position="top-center" />
    </div>
  );
};

export default SignedDoc;
