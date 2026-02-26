import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState } from "react";
import Sidebar from "./components/Sidebar";
import VoicePage from "./pages/VoicePage";
import ControlPage from "./pages/ControlPage";
import "./App.css";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Router>
      <div className="layout">

        {/* Mobile Top Bar */}
        <div className="mobile-header">
          <button
            className="menu-btn"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>
          <h2>Misty</h2>
        </div>

        <Sidebar
          isOpen={sidebarOpen}
          closeSidebar={() => setSidebarOpen(false)}
        />

        <div className="main-content">
          <Routes>
            <Route path="/" element={<VoicePage />} />
            <Route path="/control" element={<ControlPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;