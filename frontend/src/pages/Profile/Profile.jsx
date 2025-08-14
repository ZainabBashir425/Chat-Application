import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Pencil } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "react-toastify";
import avatarDefault from "../../assets/avatar.png"


export default function EditProfile() {
  const [fullName, setFullName] = useState("John Doe")
  const [email,setEmail] = useState("john.doe@example.com")
  const [isEditing, setIsEditing] = useState(false)
  const [tempName, setTempName] = useState(fullName)
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [avatar, setAvatar] = useState(avatarDefault);
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/users/current-user`,
          { credentials: "include" }
        );
        if (!res.ok) throw new Error("Failed to fetch user");
        const data = await res.json();

        setFullName(data.data.fullName || "");
        setTempName(data.data.fullName || "");
        setEmail(data.data.email || "");
        setAvatar(data.data.avatar || avatarDefault);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load user profile");
      }
    };
    fetchCurrentUser();
  }, []);

  const handleEditClick = () => {
    setTempName(fullName)
    setIsEditing(true)
  }

  const handleCancel = () => {
    setFullName(tempName)
    setIsEditing(false)
  }

  const handleSave = async () => {
    if (!tempName.trim()) {
      toast.error("Full name is required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/users/update-account`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ fullName: tempName,email:email }),
        }
      );

      const data = await res.json();
      if (res.ok) {
        setFullName(data.data.fullName);
        toast.success("Profile updated successfully");
        setIsEditing(false);
      } else {
        toast.error(data.message || "Failed to update profile");
      }
    } catch (err) {
      toast.error("Something went wrong");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (file) => {
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setAvatar(imageUrl);
      setAvatarFile(file);
    }
  };

  const handleAvatarSave = async () => {
    if (!avatarFile) {
      toast.error("Please select an image first");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", avatarFile);

      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/users/avatar`,
        {
          method: "PATCH",
          credentials: "include",
          body: formData,
        }
      );

      const data = await res.json();
      if (res.ok) {
        setAvatar(data.data.avatar);
        toast.success("Avatar updated successfully");
        setAvatarModalOpen(false);
      } else {
        toast.error(data.message || "Failed to update avatar");
      }
    } catch (err) {
      toast.error("Something went wrong");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full items-center justify-center min-h-screen text-white">
      {/* Profile Image */}
      <div className="relative mb-6">
        <img
          src={avatar}
          alt="Profile"
          className="w-30 h-30 rounded-full border-1 border-gray-500 object-cover"
        />
        <span className="absolute bottom-1 right-1 bg-blue-500 p-1 rounded-full cursor-pointer" onClick={() => setAvatarModalOpen(true)}>
          <Pencil className="w-4 h-4 text-white" />
        </span>
      </div>

      {/* Form Card */}
      <div className="bg-[#1F1F1F] p-6 rounded-lg sm:w-full w-auto max-w-sm">
        {/* Full Name */}
        <div className="mb-4 relative">
          <label className="block text-sm text-gray-400 mb-1">Full Name</label>
          <Input
            type="text"
            value={tempName}
            disabled={!isEditing}
            onChange={(e) => setTempName(e.target.value)}
            className="bg-[#2C2C2C] border-0 text-white"
          />
          <button
            onClick={handleEditClick}
            className="absolute right-2 top-8 text-gray-400 hover:text-white"
          >
            <Pencil size={16} />
          </button>
        </div>

        {/* Email Address */}
        <div className="mb-6">
          <label className="block text-sm text-gray-400 mb-1">Email Address</label>
          <Input
            type="email"
            value={email}
            disabled
            className="bg-[#2C2C2C] border-0 text-white"
          />
        </div>

        {/* Buttons */}
        {isEditing && (
          <div className="flex flex-col gap-2">
            <Button onClick={handleSave}
              disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? "Saving..." : "Save Changes"}
            </Button>
            <Button variant="ghost" onClick={handleCancel} className="text-gray-400">
              Cancel
            </Button>
          </div>
        )}
      </div>

      <Dialog open={avatarModalOpen} onOpenChange={setAvatarModalOpen}>
        <DialogContent className="bg-[#1E1E1E] text-white border border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-lg">Update Avatar</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4">
            {/* Current Avatar */}
            <img
              src={avatar}
              alt="Current Avatar"
              className="w-24 h-24 rounded-full object-cover"
            />

            {/* Drag & Drop / Upload Box */}
            <label
              htmlFor="avatar-upload"
              className="w-full border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center py-8 cursor-pointer hover:border-gray-400 transition"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-gray-400 mb-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4-4m0 0l-4 4m4-4v12"
                />
              </svg>
              <p className="text-gray-400">Drag and drop your image here</p>
              <span className="text-gray-500 text-sm mt-1">or</span>
              <Button
                type="button"
                className="mt-2 bg-gray-700 hover:bg-gray-600"
              >
                Choose File
              </Button>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleAvatarChange(e.target.files[0])}
              />
            </label>
          </div>

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
              onClick={() => setAvatarModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#00B8D4] hover:bg-[#00A5BF]"
              onClick={handleAvatarSave}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
