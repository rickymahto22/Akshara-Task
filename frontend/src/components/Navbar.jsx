import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <span className="logo">SmartChat AI</span>
      </div>
      <div className="navbar-right">
        {user ? (
          <>
            <Link to="/chat">Chat</Link>
            <Link to="/history">History</Link>
            {user.role === "admin" && <Link to="/admin">Admin</Link>}
            <span className="navbar-user">Hi, {user.name}</span>
            <button className="btn-secondary" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

