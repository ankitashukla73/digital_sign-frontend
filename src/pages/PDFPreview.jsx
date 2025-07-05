import { useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { useNavigate, useParams } from "react-router-dom";
import API from "../utils/api";
import { motion } from "framer-motion";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min?url";
import { DndContext, useDraggable } from "@dnd-kit/core";
import { toast, Toaster } from "react-hot-toast";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

// Custom hook to detect mobile
function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);
  return isMobile;
}

function SignatureDraggable({
  signatureText,
  selectedFont,
  position,
  setPosition,
  isDragging,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging: dndDragging,
  } = useDraggable({
    id: "signature",
  });

  const style = {
    fontFamily: selectedFont,
    fontSize: "20px",
    color: "#000",
    position: "absolute",
    background: dndDragging ? "#fffbe6" : "transparent",
    padding: "4px 8px",
    border: dndDragging ? "2px dashed #f59e42" : "none",
    borderRadius: "6px",
    cursor: "move",
    left: `${position.x}px`,
    top: `${position.y}px`,
    zIndex: 10,
    userSelect: "none",
    touchAction: "none",
    boxShadow: dndDragging ? "0 0 0 2px #fbbf24" : "none",
    transform: transform
      ? `translate(${transform.x}px, ${transform.y}px)`
      : undefined,
    transition: dndDragging ? "none" : "all 0.2s",
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {signatureText || "Your signature"}
    </div>
  );
}

export default function PDFPreview() {
  const { id } = useParams();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [numPages, setNumPages] = useState(null);
  const [signing, setSigning] = useState(false);
  const [signatureText, setSignatureText] = useState("");
  const [selectedFont, setSelectedFont] = useState("cursive");
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [placedSignatures, setPlacedSignatures] = useState([]);
  const [finalize, setfinalize] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [renderedPageHeight, setRenderedPageHeight] = useState(0);
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDoc = async () => {
      const token = localStorage.getItem("token");
      const res = await API.get("/docs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const found = res.data.find((d) => d._id === id);
      setDoc(found);
      setLoading(false);
    };
    fetchDoc();
  }, [id]);

  const fetchPlacedSignatures = async () => {
    const token = localStorage.getItem("token");
    const res = await API.get(`/signature/file/${doc._id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setPlacedSignatures(res.data);
  };

  useEffect(() => {
    if (doc) {
      fetchPlacedSignatures();
    }
    // eslint-disable-next-line
  }, [doc]);

  const handleDrop = async ({ x, y }) => {
    const token = localStorage.getItem("token");
    try {
      await API.post(
        "/signature/place",
        {
          fileId: doc._id,
          pageNumber: currentPage,
          xCoordinate: x,
          yCoordinate: y,
          signature: signatureText,
          font: selectedFont,
          renderedPageHeight: renderedPageHeight,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Signature placed!");
      await fetchPlacedSignatures();
      setSigning(false);
      setfinalize(true);
      setSignatureText("");
    } catch (err) {
      toast.error("Failed to place signature.");
    }
  };

  const handleFinalize = async () => {
    const token = localStorage.getItem("token");
    try {
      toast.loading("Accepting signature...");
      const sigId = placedSignatures[0]?._id;
      if (!sigId) {
        toast.error("No signature to accept.");
        return;
      }
      await API.post(
        `/signature/accept/${sigId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.dismiss();
      toast.success("Signature accepted!");
      toast.loading("Generating signed PDF...");
      const res = await API.post(
        "/signature/finalize",
        { fileId: doc._id },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.dismiss();
      toast.success("Signed PDF ready!");
      window.open(`http://localhost:5000/${res.data.signedFile}`, "_blank");
      navigate("/home");
    } catch (err) {
      toast.dismiss();
      toast.error("Failed to finalize signed PDF.");
    }
  };

  const handleReject = async () => {
    const reason = rejectReason.trim();
    if (!reason) {
      return toast.error("Please provide a reason for rejection.");
    }
    const sigId = placedSignatures[0]?._id;
    const token = localStorage.getItem("token");
    try {
      await API.post(
        `/signature/reject/${sigId}`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Document rejected. Reason: " + reason);
      navigate("/home");
    } catch (err) {
      toast.error("Failed to reject the document.");
    }
  };

  const handleRemoveSignature = async (sigId) => {
    const token = localStorage.getItem("token");
    try {
      await API.delete(`/signature/remove/${sigId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchPlacedSignatures();
      toast.success("Signature removed");
      setfinalize(false);
    } catch (err) {
      toast.error("Failed to remove signature");
    }
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const isMobile = useIsMobile();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <motion.div
          className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
        <span className="text-amber-500 font-semibold text-lg">
          Loading PDF...
        </span>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <span className="text-4xl mb-2">❌</span>
        <span className="text-gray-600 text-lg">Document not found.</span>
      </div>
    );
  }

  const fileUrl = `http://localhost:5000/${doc.filepath}`;

  // --- MOBILE UI ---
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-coral-50 flex flex-col items-center py-4 px-1">
        <Toaster position="top-center" />
        <h2 className="text-base font-bold text-teal-600 mb-2 text-center break-all w-full px-1">
          {doc.originalname}
        </h2>
        <div className="mt-1 text-coral-500 text-xs text-center w-full">
          <p>
            Place it slightly below where you want the actual signature for better placement.
          </p>
        </div>
        <div className="w-full flex flex-col gap-2">
          <motion.div
            className="bg-white/90 rounded-xl shadow p-1 flex flex-col items-center relative min-w-0"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="flex items-center gap-1 mb-2 justify-center w-full">
              <button
                className="px-2 py-1 rounded bg-teal-100 hover:bg-teal-200 text-xs"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>
              <span className="text-xs">
                Page {currentPage} of {numPages}
              </span>
              <button
                className="px-2 py-1 rounded bg-teal-100 hover:bg-teal-200 text-xs"
                disabled={currentPage >= numPages}
                onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
              >
                Next
              </button>
            </div>
            <div className="w-full max-w-full overflow-x-auto max-h-[60vh] rounded-lg border border-teal-100 bg-gray-50 p-1 relative">
              <DndContext
                onDragStart={(event) => {
                  if (event.active.id === "signature") setIsDragging(true);
                }}
                onDragEnd={(event) => {
                  if (event.active.id === "signature") {
                    setIsDragging(false);
                    const { delta } = event;
                    const newX = position.x + delta.x;
                    const newY = position.y + delta.y;
                    setPosition({ x: newX, y: newY });
                  }
                }}
              >
                <Document
                  file={fileUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  loading={<div className="text-center py-8">Loading PDF...</div>}
                  error={
                    <div className="text-center py-8 text-coral-500">
                      Failed to load PDF.
                    </div>
                  }
                >
                  <div className="relative w-full overflow-x-auto">
                    <Page
                      pageNumber={currentPage}
                      width={window.innerWidth - 24}
                      className="mx-auto my-2 shadow"
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      onLoadSuccess={({ height }) => setRenderedPageHeight(height)}
                    />
                    {signing && (
                      <SignatureDraggable
                        signatureText={signatureText}
                        selectedFont={selectedFont}
                        position={position}
                        setPosition={setPosition}
                        isDragging={isDragging}
                      />
                    )}
                    {placedSignatures
                      .filter((sig) => sig.pageNumber === currentPage)
                      .map((sig, i) => (
                        <div
                          key={i}
                          style={{
                            position: "absolute",
                            left: `${sig.xCoordinate}px`,
                            top: `${sig.yCoordinate}px`,
                            fontFamily: sig.font,
                            fontSize: "16px",
                            background: "#fff",
                            color: "#000",
                            pointerEvents: "auto",
                            userSelect: "none",
                            borderRadius: "6px",
                            boxShadow: "0 1px 4px #0001",
                            border: "1px solid #14b8a6",
                            padding: "2px 6px",
                            minWidth: "48px",
                            maxWidth: "90vw",
                            overflowWrap: "break-word",
                          }}
                        >
                          <button
                            onClick={() => handleRemoveSignature(sig._id)}
                            style={{
                              position: "absolute",
                              top: "-10px",
                              right: "-10px",
                              background: "#fff",
                              border: "1px solid #14b8a6",
                              borderRadius: "50%",
                              width: "18px",
                              height: "18px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              fontSize: "12px",
                              color: "#14b8a6",
                              zIndex: 2,
                            }}
                            title="Remove signature"
                          >
                            ✖
                          </button>
                          {sig.signature}
                        </div>
                      ))}
                  </div>
                </Document>
              </DndContext>
            </div>
          </motion.div>
          {/* Controls */}
          <div className="flex flex-col w-full gap-2 mt-2">
            <button
              onClick={() => {
                setSigning(true);
                const user = JSON.parse(localStorage.getItem("user"));
                setSignatureText(user.name);
              }}
              className="bg-teal-500 text-white px-3 py-2 rounded hover:bg-coral-500 transition w-full text-sm"
            >
              ✍️ Sign Document
            </button>
            {signing && (
              <div className="mb-2 w-full flex flex-col justify-between">
                <input
                  type="text"
                  value={signatureText}
                  onChange={(e) => setSignatureText(e.target.value)}
                  placeholder="Type your signature"
                  className="border px-2 py-1 rounded w-full mb-2 text-sm"
                  style={{ flex: 1 }}
                />
                <select
                  value={selectedFont}
                  onChange={(e) => setSelectedFont(e.target.value)}
                  className="border px-2 py-1 rounded w-full text-sm"
                >
                  <option value="'Great Vibes', cursive">Great Vibes</option>
                  <option value="'Dancing Script', cursive">Dancing Script</option>
                  <option value="'Pacifico', cursive">Pacifico</option>
                  <option value="'Satisfy', cursive">Satisfy</option>
                  <option value="'Shadows Into Light', cursive">Shadows Into Light</option>
                  <option value="'Caveat', cursive">Caveat</option>
                  <option value="'Homemade Apple', cursive">Homemade Apple</option>
                  <option value="'Indie Flower', cursive">Indie Flower</option>
                </select>
                <button
                  onClick={() => handleDrop(position)}
                  className="w-full px-4 py-2 rounded-lg hover:bg-green-600 transition bg-green-400 mt-2 text-sm"
                >
                  Save
                </button>
              </div>
            )}
            {placedSignatures.length > 0 && (
              <div className="flex flex-col gap-2 w-full">
                <button
                  onClick={handleFinalize}
                  className="font-medium text-white px-4 py-2 rounded-lg hover:bg-green-600 transition bg-green-500"
                >
                  Accept
                </button>
                <button
                  onClick={() => setShowRejectReason(true)}
                  className="font-medium text-white px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 transition"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        </div>
        {/* Modal for rejection reason */}
        {showRejectReason && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-xl p-6 flex flex-col items-center gap-4 max-w-xs w-full">
              <h3 className="font-bold text-lg text-coral-500">Reject Document</h3>
              <p className="py-2 text-gray-700 text-center">Please provide a reason for rejection:</p>
              <textarea
                className="border rounded w-full p-2 mb-2"
                placeholder="Reason for rejection"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                style={{ minWidth: 180 }}
              />
              <div className="flex gap-2 w-full">
                <button
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 font-semibold"
                  onClick={() => setShowRejectReason(false)}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 px-4 py-2 rounded-lg bg-coral-500 hover:bg-coral-600 text-white font-semibold"
                  onClick={async () => {
                    await handleReject(rejectReason);
                    setRejectReason("");
                    setShowRejectReason(false);
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- DESKTOP UI ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-coral-50 flex flex-col items-center py-10 px-2">
      <Toaster position="top-center" />
      <h2 className="text-2xl md:text-3xl font-bold text-teal-600 mb-4 text-center break-all">
        {doc.originalname}
      </h2>
      <div className="mt-2 text-coral-500">
        <p>
          Place it slightly below where you want the actual signature for better placement.
        </p>
      </div>
      <div className="flex flex-col md:flex-row w-full max-w-5xl gap-8 mt-6">
        {/* PDF Preview */}
        <motion.div
          className="bg-white/90 rounded-2xl shadow-xl p-6 flex-1 flex flex-col items-center relative"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          {/* Navigation buttons for pages */}
          <div className="flex items-center gap-2 mb-4">
            <button
              className="px-3 py-1 rounded bg-teal-100 hover:bg-teal-200"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <span>
              Page {currentPage} of {numPages}
            </span>
            <button
              className="px-3 py-1 rounded bg-teal-100 hover:bg-teal-200"
              disabled={currentPage >= numPages}
              onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
            >
              Next
            </button>
          </div>
          <div
            className="w-full max-h-[70vh] overflow-auto rounded-lg border border-teal-100 bg-gray-50 p-2 custom-scrollbar relative"
            style={{
              scrollbarColor: "#14b8a6 #ccfbf1",
              scrollbarWidth: "thin",
            }}
          >
            <DndContext
              onDragStart={(event) => {
                if (event.active.id === "signature") setIsDragging(true);
              }}
              onDragEnd={(event) => {
                if (event.active.id === "signature") {
                  setIsDragging(false);
                  const { delta } = event;
                  const newX = position.x + delta.x;
                  const newY = position.y + delta.y;
                  setPosition({ x: newX, y: newY });
                }
              }}
            >
              <Document
                file={fileUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={<div className="text-center py-8">Loading PDF...</div>}
                error={
                  <div className="text-center py-8 text-coral-500">
                    Failed to load PDF.
                  </div>
                }
              >
                {Array.from({ length: numPages }, (_, index) => (
                  <div key={`page_${index + 1}`} className="relative">
                    <Page
                      pageNumber={index + 1}
                      width={580}
                      className="mx-auto my-4 shadow"
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      onLoadSuccess={({ height }) => {
                        if (index === 0) {
                          setRenderedPageHeight(height);
                        }
                      }}
                    />
                    {signing && index + 1 === currentPage && (
                      <SignatureDraggable
                        signatureText={signatureText}
                        selectedFont={selectedFont}
                        position={position}
                        setPosition={setPosition}
                        isDragging={isDragging}
                      />
                    )}
                    {placedSignatures
                      .filter((sig) => sig.pageNumber === index + 1)
                      .map((sig, i) => {
                        // Calculate the position in browser coordinates
                        const scale = renderedPageHeight / sig.pdfHeight; // Assuming you store pdfHeight when saving
                        const browserX = sig.xCoordinate;
                        const browserY = sig.yCoordinate;

                        return (
                          <div
                            key={i}
                            style={{
                              position: "absolute",
                              left: `${browserX}px`,
                              top: `${browserY}px`,
                              fontFamily: sig.font,
                              fontSize: "20px",
                              background: "#fff",
                              color: "#000",
                              pointerEvents: "auto",
                              userSelect: "none",
                              borderRadius: "6px",
                              boxShadow: "0 1px 4px #0001",
                              border: "1px solid #14b8a6",
                              padding: "4px 8px",
                              minWidth: "60px",
                            }}
                          >
                            <button
                              onClick={() => handleRemoveSignature(sig._id)}
                              style={{
                                position: "absolute",
                                top: "-10px",
                                right: "-10px",
                                background: "#fff",
                                border: "1px solid #14b8a6",
                                borderRadius: "50%",
                                width: "22px",
                                height: "22px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                fontSize: "14px",
                                color: "#14b8a6",
                                zIndex: 2,
                              }}
                              title="Remove signature"
                            >
                              ✖
                            </button>
                            {sig.signature}
                          </div>
                        );
                      })}
                  </div>
                ))}
              </Document>
            </DndContext>
          </div>
        </motion.div>
        {/* Controls Sidebar */}
        <div className="flex flex-col items-end min-w-[240px]">
          <button
            onClick={() => {
              setSigning(true);
              const user = JSON.parse(localStorage.getItem("user"));
              setSignatureText(user.name);
            }}
            className="mb-4 bg-teal-500 text-white px-4 py-2 rounded hover:bg-coral-500 transition w-full"
          >
            ✍️ Sign Document
          </button>
          {signing && (
            <div className="mb-4 w-full flex flex-col justify-between">
              <input
                type="text"
                value={signatureText}
                onChange={(e) => setSignatureText(e.target.value)}
                placeholder="Type your signature"
                className="border px-3 py-1 rounded mb-2 w-full"
              />
              <select
                value={selectedFont}
                onChange={(e) => setSelectedFont(e.target.value)}
                className="border px-3 py-1 rounded w-full"
              >
                <option value="'Great Vibes', cursive">Great Vibes</option>
                <option value="'Dancing Script', cursive">Dancing Script</option>
                <option value="'Pacifico', cursive">Pacifico</option>
                <option value="'Satisfy', cursive">Satisfy</option>
                <option value="'Shadows Into Light', cursive">Shadows Into Light</option>
                <option value="'Caveat', cursive">Caveat</option>
                <option value="'Homemade Apple', cursive">Homemade Apple</option>
                <option value="'Indie Flower', cursive">Indie Flower</option>
              </select>
              <button
                onClick={() => handleDrop(position)}
                className="w-full px-4 py-2 rounded-lg hover:bg-green-600 transition bg-green-400 mt-2"
              >
                Save
              </button>
            </div>
          )}
          {placedSignatures.length > 0 && (
            <div className="flex flex-col gap-2 w-full">
              <button
                onClick={handleFinalize}
                className="font-medium text-white px-4 py-2 rounded-lg hover:bg-green-600 transition bg-green-500"
              >
                Accept
              </button>
              <button
                onClick={() => setShowRejectReason(true)}
                className="font-medium text-white px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 transition"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Modal for rejection reason */}
      {showRejectReason && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 flex flex-col items-center gap-4 max-w-xs w-full">
            <h3 className="font-bold text-lg text-coral-500">Reject Document</h3>
            <p className="py-2 text-gray-700 text-center">Please provide a reason for rejection:</p>
            <textarea
              className="border rounded w-full p-2 mb-2"
              placeholder="Reason for rejection"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              style={{ minWidth: 180 }}
            />
            <div className="flex gap-2 w-full">
              <button
                className="flex-1 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 font-semibold"
                onClick={() => setShowRejectReason(false)}
              >
                Cancel
              </button>
              <button
                className="flex-1 px-4 py-2 rounded-lg bg-coral-500 hover:bg-coral-600 text-white font-semibold"
                onClick={async () => {
                  await handleReject(rejectReason);
                  setRejectReason("");
                  setShowRejectReason(false);
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
