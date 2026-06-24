import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import React from "react";
import { useAuth } from "../context/AuthContext";
import { SkeletonDashboard } from "./ui/Skeleton";

const ProtectedRoute = ({ children }) => {
  const user = useSelector((state) => state.user);
  const auth = useAuth();
  const loading = auth?.loading;
  const initialized = auth?.initialized;

  if (loading && !initialized) {
    return <SkeletonDashboard />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
