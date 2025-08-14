import React, { useState, useEffect, createContext } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

const AuthWrapper = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const checkAuth = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/users/token-status`,
        { credentials: "include" }
      );

      if (res.status === 401) {
        // Access token invalid, try refresh
        const refreshRes = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/users/refresh-token`,
          {
            method: "POST",
            credentials: "include",
          }
        );

        if (refreshRes.ok) {
          setIsAuthenticated(true);
          return;
        } else {
          // Both tokens expired
          setIsAuthenticated(false);
          navigate("/login");
          return;
        }
      }

      if (res.ok) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        navigate("/login");
      }
    } catch {
      setIsAuthenticated(false);
      navigate("/login");
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      await checkAuth();
      setLoading(false);
    };
    initAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center bg-backgroundPrimary">
        Loading...
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
export default AuthWrapper;
