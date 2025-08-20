import React, { useState, useEffect, createContext } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "@/services/socket";

const AuthContext = createContext();

const AuthWrapper = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null); 
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
          const userRes = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/users/current-user`,
          { credentials: "include" }
        );
        if (!userRes.ok) throw new Error("Failed to fetch user");
        const data = await userRes.json();

        setUser(data.data);
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
        const userRes = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/users/current-user`,
          { credentials: "include" }
        );
        if (!userRes.ok) throw new Error("Failed to fetch user");
        const data = await userRes.json();

        setUser(data.data);
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

  useEffect(() => {
    if (isAuthenticated && user?._id) {
      socket.emit("setup", user._id);

      socket.on("online-users", (users) => {
        console.log("✅ Online users:", users);
      });
    }

    return () => {
      socket.off("online-users");
    };
  }, [isAuthenticated, user]);

  if (loading) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center bg-backgroundPrimary">
        Loading...
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
export default AuthWrapper;
