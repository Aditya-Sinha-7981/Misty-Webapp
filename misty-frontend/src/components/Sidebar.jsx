import { NavLink } from "react-router-dom";
import "./Sidebar.css";
import mistyLogo from "../assets/misty.png";

export default function Sidebar({ isOpen, closeSidebar }) {
  return (
    <>
      {isOpen && <div className="overlay" onClick={closeSidebar}></div>}

      <div className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="logo-section">
          <img src={mistyLogo} alt="Misty" className="logo" />
          <h2>Misty</h2>
        </div>

        <nav>
          <NavLink 
            to="/" 
            onClick={closeSidebar}
            className={({ isActive }) => isActive ? "active" : ""}
          >
            🎤 Voice Console
          </NavLink>

          <NavLink 
            to="/control" 
            onClick={closeSidebar}
            className={({ isActive }) => isActive ? "active" : ""}
          >
            🕹 Command Center
          </NavLink>
        </nav>
      </div>
    </>
  );
}