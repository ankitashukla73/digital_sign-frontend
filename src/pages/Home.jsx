import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Upload from "../components/Upload";
import { TypeAnimation } from "react-type-animation";
import API from "../utils/api";

export default function Home() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [docs, setDocs] = useState([]);
  const [Pendocs, setPendocs] = useState([]);
  const [Signeddocs, setSigneddocs] = useState([]);
  const [showLogin, setShowLogin] = useState(false);
  const [rejected, setrejected] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));
    if (!token) {
      navigate("/");
    } else {
      setUsername(user.name);
    }
  }, [navigate]);

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
      }
    };

    const fetchPending = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await API.get("/docs/pending", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPendocs(res.data);
      } catch (err) {
        console.error("Error fetching documents", err);
      }
    };

    const fetchSignedDoc = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await API.get("/docs/signed", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSigneddocs(res.data);
      } catch (err) {
        console.error("Error fetching documents", err);
      }
    };

    const fetchRejecDoc = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await API.get("/docs/rejected", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setrejected(res.data);
      } catch (error) {
        console.error("Error in fetching Docs", error);
      }
    };

    fetchDocs();
    fetchPending();
    fetchSignedDoc();
    fetchRejecDoc();
  }, []);

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setShowLogin(true);
    navigate("/");
  };

  const isLoggedIn = !!localStorage.getItem("token");

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-teal-50 via-white to-coral-50">
      <Navbar />
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-64 bg-white/90 shadow-lg rounded-tr-3xl rounded-br-3xl p-6 justify-between">
          <div>
            <div className="mb-8">
              <div className="text-2xl font-extrabold text-teal-600 mb-1">
                👋 Hi, {username}
              </div>
              <div className="text-gray-500 text-sm">
                Welcome to SignetCloud
              </div>
            </div>
            <nav className="flex flex-col gap-4">
              <button
                onClick={() => navigate("/my-documents")}
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-teal-100 transition text-teal-700 font-semibold"
              >
                📄 My Documents
              </button>
              <button
                onClick={() => navigate("/pending-doc")}
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-amber-100 transition text-amber-700 font-semibold"
              >
                ✍️ Pending
              </button>
              <button
                onClick={() => navigate("/signed-doc")}
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-green-100 transition text-green-700 font-semibold"
              >
                ✅ Completed
              </button>
              <button
                onClick={() => navigate("/rejected-doc")}
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-red-100 transition text-red-700 font-semibold"
              >
                ❌ Rejected
              </button>
            </nav>
          </div>
          {isLoggedIn && (
            <button
              onClick={handleLogout}
              className="bg-coral-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-coral-600 transition mt-8"
            >
              Logout
            </button>
          )}
        </aside>
        {/* Main Content */}
        <main className="flex-1 flex flex-col px-4 md:px-12 py-8">
          {/* Greeting and stats */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-teal-700 mb-1">
                Dashboard
              </h1>
              <div className="text-lg text-gray-600 font-medium">
                <TypeAnimation
                  sequence={[
                    "Upload, sign, and manage your documents.",
                    2000,
                    "All your paperwork, organized.",
                    2000,
                    "Ready to sign? Start below!",
                    2000,
                  ]}
                  wrapper="span"
                  cursor={true}
                  repeat={Infinity}
                  style={{ display: "inline-block" }}
                />
              </div>
            </div>
            {/* Quick stats */}
            <div className="flex gap-4">
              <div className="bg-teal-100 px-4 py-2 rounded-lg text-teal-700 font-semibold shadow">
                {docs.length} Uploaded
              </div>
              <div className="bg-amber-100 px-4 py-2 rounded-lg text-amber-700 font-semibold shadow">
                {Pendocs.length} Pending
              </div>
              <div className="bg-green-100 px-4 py-2 rounded-lg text-green-700 font-semibold shadow">
                {Signeddocs.length} Signed
              </div>
              <div className="bg-red-100 px-4 py-2 rounded-lg text-red-700 font-semibold shadow">
                {rejected.length} Rejected
              </div>
            </div>
          </div>
          {/* Upload section */}
          <div className="mb-10">
            <div className="bg-white/90 rounded-2xl shadow-lg p-8 flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-teal-600 mb-2">
                  Upload a new document
                </h2>
                <p className="text-gray-500 mb-4">
                  Drag & drop or select a file to get started. Your documents are
                  safe and secure.
                </p>
                <Upload />
              </div>
              <div className="hidden md:block flex-1 text-center">
                <img
                  src="https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/document.svg"
                  alt="Upload"
                  className="w-40 mx-auto opacity-80"
                />
              </div>
            </div>
          </div>
          {/* Action cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div
              onClick={() => navigate("/my-documents")}
              className="bg-teal-50 border-l-4 border-teal-400 rounded-xl p-6 shadow flex items-center gap-6 cursor-pointer transition hover:scale-105"
            >
              <span className="text-5xl">📄</span>
              <div>
                <div className="font-bold text-xl text-teal-700">
                  My Documents
                </div>
                <div className="text-gray-500">{docs.length} uploaded</div>
              </div>
            </div>
            <div
              onClick={() => navigate("/pending-doc")}
              className="bg-amber-50 border-l-4 border-amber-400 rounded-xl p-6 shadow flex items-center gap-6 cursor-pointer transition hover:scale-105"
            >
              <span className="text-5xl">✍️</span>
              <div>
                <div className="font-bold text-xl text-amber-700">
                  Pending Signatures
                </div>
                <div className="text-gray-500">{Pendocs.length} pending</div>
              </div>
            </div>
            <div
              onClick={() => navigate("/signed-doc")}
              className="bg-green-50 border-l-4 border-green-400 rounded-xl p-6 shadow flex items-center gap-6 cursor-pointer transition hover:scale-105"
            >
              <span className="text-5xl">✅</span>
              <div>
                <div className="font-bold text-xl text-green-700">Completed</div>
                <div className="text-gray-500">{Signeddocs.length} signed</div>
              </div>
            </div>
            <div
              onClick={() => navigate("/rejected-doc")}
              className="bg-red-50 border-l-4 border-red-400 rounded-xl p-6 shadow flex items-center gap-6 cursor-pointer transition hover:scale-105"
            >
              <span className="text-5xl">❌</span>
              <div>
                <div className="font-bold text-xl text-red-700">
                  Rejected Signatures
                </div>
                <div className="text-gray-500">{rejected.length} rejected</div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
