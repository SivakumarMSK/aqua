import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const token =
    localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

  // If no token → redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Otherwise → allow access
  return children;
};

export default ProtectedRoute;
