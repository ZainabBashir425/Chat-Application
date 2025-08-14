import { useState } from "react";
import { Settings, LogOut } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import logo from "../../assets/logo.png";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Header() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [updatePasswordOpen, setUpdatePasswordOpen] = useState(false);
  const [hideNewPassword, setHideNewPassword] = useState(true);
  const [hideOldPassword, setHideOldPassword] = useState(true);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleEdit = () => {
    navigate("/edit-profile");
  };

  const handleLogout = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/users/logout`, {
      method: "POST",
      credentials: "include", // important for cookies
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await res.json(); // parse JSON

    if (res.ok) {
      toast.success(data.message || "Logged out successfully");
      setLogoutOpen(false);
      setTimeout(() => {
        navigate("/login");
      }, 3500);
    } else {
      toast.error(data.message || "Failed to log out");
    }
  } catch (error) {
    toast.error("Something went wrong. Please try again.");
    console.error(error);
  }
  };

   const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      toast.error("Please fill in both fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/users/change-password`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || "Password changed successfully");
        setUpdatePasswordOpen(false);
        setOldPassword("");
        setNewPassword("");
      } else {
        toast.error(data.message || "Failed to update password");
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="flex justify-between z-100 w-full fixed top-0 items-center px-6 py-3 bg-[#121212] shadow">
      {/* Logo and Title */}
      <div className="flex items-center space-x-2">
        <img
          src={logo}
          alt="Logo"
          className="w-30 h-10"
          onClick={() => navigate("/dashboard")}
        />
      </div>

      {/* Right Icons */}
      <div className="flex items-center space-x-6 relative">
        {/* Settings Icon */}
        <button
          className="text-gray-400 hover:text-white"
          onClick={() => setSettingsOpen(!settingsOpen)}
        >
          <Settings size={20} />
        </button>

        {/* Settings Dropdown */}
        {settingsOpen && (
          <div className="absolute top-5 right-8 bg-[#2C2C2C] text-gray-300 rounded-lg shadow-lg w-45 py-2 z-100">
            <button
              onClick={handleEdit}
              className="flex items-center px-4 py-2 hover:bg-[#3A3A3A] w-full text-left"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M12 12c2.28 0 4.118-1.838 4.118-4.118S14.28 3.765 12 3.765 7.882 5.603 7.882 7.882 9.72 12 12 12z"></path>
                <path d="M12 12c-4.8 0-8.824 3.235-9.882 7.647-.25 1.014.721 1.936 1.765 1.353 1.41-.804 3.143-1.353 5.118-1.353s3.708.549 5.118 1.353c1.044.583 2.015-.339 1.765-1.353C20.824 15.235 16.8 12 12 12z"></path>
              </svg>
              Edit Profile
            </button>
            <button
              className="flex items-center gap-2 px-4 whitespace-nowrap py-2 hover:bg-[#3A3A3A] w-full text-left"
              onClick={() => {
                setUpdatePasswordOpen(true);
                setSettingsOpen(!settingsOpen);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                className="lucide lucide-key-icon lucide-key"
              >
                <path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4" />
                <path d="m21 2-9.6 9.6" />
                <circle cx="7.5" cy="15.5" r="5.5" />
              </svg>
              <span>Update Password</span>
            </button>
          </div>
        )}

        {/* Logout Icon */}
        <button
          className="text-gray-400 hover:text-white"
          onClick={() => setLogoutOpen(true)}
        >
          <LogOut size={20} />
        </button>
      </div>

      {/* Logout Confirmation Modal */}
      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DialogContent className="bg-[#1E1E1E] text-white border border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-lg">Confirm Logout</DialogTitle>
          </DialogHeader>
          <p className="text-gray-400 text-sm">
            Are you sure you want to log out?
          </p>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
              onClick={() => setLogoutOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#00B8D4] hover:bg-[#00A5BF]"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={updatePasswordOpen} onOpenChange={setUpdatePasswordOpen}>
        <DialogContent className="bg-[#1E1E1E] text-white border border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-xl">Update Password</DialogTitle>
          </DialogHeader>
          <form className="space-y-3" onSubmit={handleUpdatePassword}>
            <div>
              <label htmlFor="current">Current Password</label>
              <div className="relative">
                <input
                  type={hideOldPassword ? "password" : "text"}
                  id="current"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-3 py-2 mt-2 bg-[#2C2C2C] text-white rounded"
                />
                <button
                  type="button"
                  onClick={() => setHideOldPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-3 top-2 flex items-center text-gray-400 focus:outline-none"
                >
                  {hideOldPassword ? (
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
            </div>
            <div>
              <label htmlFor="new">New Password</label>
              <div className="relative">
                <input
                  type={hideNewPassword ? "password" : "text"}
                  id="new"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 mt-2 bg-[#2C2C2C] text-white rounded"
                />
                <button
                  type="button"
                  onClick={() => setHideNewPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-3 top-2 flex items-center text-gray-400 focus:outline-none"
                >
                  {hideNewPassword ? (
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
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
                onClick={() => setUpdatePasswordOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="bg-[#00B8D4] hover:bg-[#00A5BF]">
                {loading ? "Updating..." : "Update"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </header>
  );
}
