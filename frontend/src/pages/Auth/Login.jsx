import { Link, useNavigate,Navigate } from "react-router-dom";
import { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "@/hooks/Auth";

export default function Login() {
  const [hidePassword, setHidePassword] = useState(true);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/users/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
          credentials: "include", // so cookies from backend are stored
        }
      );

      const data = await res.json();

      if (res.ok) {
        toast.success(data?.message || "Login successful!");
        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      } else {
        toast.error(data?.message || "Login failed");
      }
    } catch (err) {
      toast.error(`Something went wrong. Please try again.`);
      console.error(err)
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="sm:w-full w-80 max-w-md shadow-lg rounded-lg p-8 bg-backgroundSecondary">
      <h1 className="sm:text-4xl text-2xl font-bold text-center mb-1 text-[#00B8D4]">
        ChatterBox
      </h1>
      <h2 className="sm:text-xl text-sm text-[#9CA3Af] font-medium text-center mb-6">
        Welcome Back
      </h2>
      <form onSubmit={handleLogin} className="space-y-4">
        <div className="relative w-full rounded-lg bg-backgroundPrimary">
          <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="lucide lucide-mail-icon lucide-mail"
            >
              <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" />
              <rect x="2" y="4" width="20" height="16" rx="2" />
            </svg>
          </span>
          <input
            type="email"
            placeholder="Email Address"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg p-3 pl-10 text-[#9CA3Af] focus:outline-none focus:ring-1"
          />
        </div>

        <div className="relative w-full bg-backgroundPrimary  rounded-lg">
          <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="lucide lucide-lock-icon lucide-lock"
            >
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </span>
          <input
            type={hidePassword ? "password" : "text"}
            placeholder="Password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg p-3 pl-10 text-[#9CA3Af] focus:outline-none focus:ring-1"
          />
          <button
            type="button"
            onClick={() => setHidePassword((prev) => !prev)}
            className="absolute inset-y-0 right-3 flex items-center text-gray-400 focus:outline-none"
          >
            {hidePassword ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="lucide lucide-eye-off-icon lucide-eye-off"
              >
                <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
                <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
                <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
                <path d="m2 2 20 20" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="lucide lucide-eye-icon lucide-eye"
              >
                <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg text-white font-medium bg-[#00B8D4]"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <p className="text-center text-[#9CA3Af] text-sm mt-4">
        Don’t have an account?{" "}
        <Link to="/register" className="font-medium text-[#00B8D4]">
          Register
        </Link>
      </p>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}
