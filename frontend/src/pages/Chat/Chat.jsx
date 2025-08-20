import { useEffect, useMemo, useRef, useState } from "react";
import {
  Paperclip,
  Send,
  ChevronLeft,
  ChevronDown,
  Search,
} from "lucide-react";
import { socket } from "@/services/socket";
import avatarDefault from "../../assets/avatar.png";

export default function ChatApp() {
  // --- Demo users ---
  const [users, setUsers] = useState([]);

  const [activeUserId, setActiveUserId] = useState(null);

  const [messages, setMessages] = useState({});
  const [input, setInput] = useState("");
  const [showFileOptions, setShowFileOptions] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedChat, setSelectedChat] = useState(null);

  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatBottomRef = useRef(null);
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/users/current-user`,
          { credentials: "include" }
        );
        if (!res.ok) throw new Error("Failed to fetch user");
        const data = await res.json();
       // console.log("Current user:", data);
        setActiveUserId(data.data._id); // save your own id
      } catch (err) {
        console.error("Failed to fetch current user:", err);
      }
    };
    fetchMe();
  }, []);

  const handleSelectUser = async (userId) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/chats`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        }
      );
      if (!res.ok) {
        const errorData = await res.json();
        console.error(errorData);
        return;
      }
      const data = await res.json();
      console.log(data.data);

      const chat = data.data;

      const members = chat?.members || [];
      // pick the other user (not the current one)
      const otherUser = members.find((m) => m._id !== activeUserId);

      const mapped = {
        id: chat._id,
        name: otherUser?.fullName || "Unknown",
        lastMessage: chat.lastMessage?.content || "No messages yet",
        avatar: otherUser?.avatar || avatarDefault,
        lastSeen: otherUser?.lastSeen || "",
        time: chat.updatedAt
          ? new Date(chat.updatedAt).toLocaleTimeString()
          : "",
        isOnline: otherUser?.isOnline || false,
      };

      socket.emit("join-chat", chat._id);
      const msgRes = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/messages/${chat._id}`,
        { credentials: "include" }
      );
      if (msgRes.ok) {
        const msgData = await msgRes.json();
        setMessages((prev) => ({
          ...prev,
          [chat._id]: msgData.data || [],
        }));
        console.log("Messages for chat:", messages[chat._id]);
      }
      setSelectedChat(mapped);
    } catch (err) {
      console.error("Error selecting user:", err);
    }
  };

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/users`,
          {
            method: "GET",
            credentials: "include", // ✅ sends cookies with JWT
          }
        );
        if (!res.ok) throw new Error("Failed to fetch users");
        const data = await res.json();

        // data should be array of users [{ _id, name, email, avatar, ... }]
        setUsers(data.data.users || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchChats();
  }, []);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => u.fullName.toLowerCase().includes(q));
  }, [users, search]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeUserId]);


  const pushMessage = (userId, msg) => {
    setMessages((prev) => ({
      ...prev,
      [userId]: [...(prev[userId] || []), msg],
    }));
  };

  const handleSendMessage = () => {
    if (!selectedChat) return;
    const text = input.trim();
    if (!text) return;
    if (editingId) {
      // Edit existing message
      fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/messages/edit/${editingId}`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: text }),
        }
      )
        .then((res) => res.json())
        .then((data) => {
          setMessages((prev) => ({
            ...prev,
            [selectedChat.id]: (prev[selectedChat.id] || []).map((m) =>
              m.id === editingId ? { ...m, text: data.data.content } : m
            ),
          }));
        })
        .catch((err) => console.error("Edit failed:", err));

      setEditingId(null);
    } else {
      // New message (send to backend)
      fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/messages`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: selectedChat.id,
          content: text,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          const msg = {
            id: data.data._id,
            type: "text",
            content: data.data.content,
            sender: {id:data.data.sender._id,avatar:data.data.sender.avatar},
            createdAt: data.data.createdAt || new Date().toISOString(),
          };
          pushMessage(selectedChat.id, msg);
          socket.emit("send-message", { chatId: selectedChat.id, message: msg })
        })
        .catch((err) => console.error("Send failed:", err));
    }
    setInput("");
  };

  // File handlers
  const handleImagePicked = async (e) => {
    if (!selectedChat) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("chatId", selectedChat.id);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/messages`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );
      const data = await res.json();

      const msg = {
        id: data.data._id,
        type: "image",
        url: data.data.file.url,
        name: file.name,
        size: file.size,
        sender: "me",
        time: new Date(data.data.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      pushMessage(selectedChat.id, msg);
    } catch (err) {
      console.error("Image send failed:", err);
    }

    e.target.value = "";
    setShowFileOptions(false);
  };

  const handleVideoPicked = async (e) => {
        if (!selectedChat) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("chatId", selectedChat.id);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/messages`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );
      const data = await res.json();

      const msg = {
        id: data.data._id,
        type: "video",
        url: data.data.file.url,
        name: file.name,
        size: file.size,
        sender: "me",
        time: new Date(data.data.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      pushMessage(selectedChat.id, msg);
    } catch (err) {
      console.error("Video send failed:", err);
    }

    e.target.value = "";
    setShowFileOptions(false);
  };

  const handleFilePicked = async (e) => {
        if (!selectedChat) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("chatId", selectedChat.id);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/messages`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );
      const data = await res.json();

      const msg = {
        id: data.data._id,
        type: "file",
        url: data.data.file.url,
        name: file.name,
        size: file.size,
        sender: "me",
        time: new Date(data.data.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      pushMessage(selectedChat.id, msg);
    } catch (err) {
      console.error("File send failed:", err);
    }

    e.target.value = "";
    setShowFileOptions(false);
  };

  // Message actions
  const [menuOpenId, setMenuOpenId] = useState(null);
  const toggleMenu = (id) => setMenuOpenId((prev) => (prev === id ? null : id));

  const copyMessage = async (m) => {
    try {
      if (m.type === "text") {
        await navigator.clipboard.writeText(m.text || "");
      } else {
        await navigator.clipboard.writeText(m.name || m.url || "");
      }
      setMenuOpenId(null);
    } catch (e) {
      console.error("Copy failed", e);
    }
  };

  const deleteMessage = async (m) => {
    if (!selectedChat) return;
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/messages/${m.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      if (res.ok) {
        setMessages((prev) => ({
          ...prev,
          [selectedChat.id]: (prev[selectedChat.id] || []).filter(
            (x) => x.id !== m.id
          ),
        }));
      }
    } catch (err) {
      console.error("Delete failed", err);
    }
    setMenuOpenId(null);
  };

  function formatLastSeen(lastSeen) {
  if (!lastSeen) return "Last seen unavailable";

  const date = new Date(lastSeen);
  const now = new Date();

  const isToday = date.toDateString() === now.toDateString();

  const time = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isToday) {
    return `Last seen today at ${time}`;
  } else {
    const dayMonth = date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
    });
    return `Last seen at ${dayMonth}, ${time}`;
  }
}

  const [editingId, setEditingId] = useState(null);

  const startEdit = (m) => {
    if (m.type !== "text") return;
    setEditingId(m.id);
    setInput(m.text || "");
    setMenuOpenId(null);
  };

  // UI pieces
  const UserRow = ({ u }) => (
    <div
      onClick={() => handleSelectUser(u._id)}
      className="flex items-center gap-3 p-3 hover:bg-[#1E1E1E] cursor-pointer"
    >
      <div className="relative">
        <img
          src={u.avatar || avatarDefault}
          alt={u.fullName}
          className="w-10 h-10 rounded-full"
        />
        {u.isOnline && (
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full ring-2 ring-[#121212]" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate">{u.fullName}</p>
        <p className="text-gray-400 text-sm truncate">{u.lastMessage}</p>
      </div>
      <span className="text-xs text-gray-500 whitespace-nowrap">{u.time}</span>
    </div>
  );

  const MessageBubble = ({ m }) => {
    const mine = m.sender._id === activeUserId || m.sender.id === activeUserId;;
    const bubbleBase = mine
      ? "bg-[#00B8D4] text-black ml-auto"
      : "bg-[#2C2C2C] text-white";

    return (
      <div
        className={`relative md:max-w-[50%] max-w-[80%] break-words ${
          mine ? "self-end" : "self-start"
        } group`}
      >
        <div className={`relative rounded-lg ${bubbleBase}`}>
          {m.type === "text" && (
            <div className="whitespace-pre-wrap text-white px-3 py-2">
              {m.content}
            </div>
          )}
          {m.type === "image" && (
            <div className="space-y-1">
              <img
                src={m.url}
                alt={m.name}
                className="rounded-md max-h-60 object-contain"
              />
            </div>
          )}
          {m.type === "video" && (
            <div className="space-y-1">
              <video src={m.url} controls className="rounded-md max-h-60" />
            </div>
          )}
          {m.type === "file" && (
            <div className="p-3">
              <div className="font-semibold text-white">
                {m.name || "Unnamed file"}
              </div>
              <div className="text-xs text-gray-300">
                {m.size ? `${(m.size / 1024).toFixed(1)} KB` : "Unknown size"}
              </div>
            </div>
          )}

          {/* Actions menu button - only on hover */}
          <button
            className={`absolute top-0 right-1 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition`}
            onClick={() => toggleMenu(m.id)}
            title="Message actions"
          >
            <ChevronDown size={18} />
            {menuOpenId === m.id && (
              <div
                className={`absolute z-10 ${
                  mine ? "right-0 top-full" : "left-0 top-full"
                } mt-1 bg-[#1E1E1E] rounded-md shadow-lg text-white min-w-[140px]`}
              >
                {m.type !== "text" ? (
                  <>
                    <a
                      href={m.url}
                      download={m.name}
                      className="block text-left px-3 py-2 rounded-md hover:bg-[#2C2C2C]"
                    >
                      Download
                    </a>
                    <button
                      onClick={() => deleteMessage(m)}
                      className="block w-full text-left px-3 py-2 rounded-md hover:bg-[#2C2C2C]"
                    >
                      Delete
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => copyMessage(m)}
                      className="block w-full text-left px-3 py-2 rounded-md hover:bg-[#2C2C2C]"
                    >
                      Copy
                    </button>
                    {mine &&(<button
                      onClick={() => startEdit(m)}
                      className="block w-full text-left px-3 py-2 rounded-md hover:bg-[#2C2C2C]"
                    >
                      Edit
                    </button>)}
                    <button
                      onClick={() => deleteMessage(m)}
                      className="block w-full text-left px-3 py-2 rounded-md hover:bg-[#2C2C2C]"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            )}
          </button>
        </div>
        <div
          className={`text-xs text-gray-400 mt-1 ${
            mine ? "text-right" : "text-left"
          }`}
        >
          {m.time}
        </div>
      </div>
    );
  };

  return (
    <div className="flex fixed bottom-0 w-full h-[calc(100vh-60px)] bg-[#121212] text-white">
      {" "}
      {/* reduced height */}
      {/* User List */}
      <div
        className={`w-full md:w-1/3 lg:w-1/4 bg-[#1E1E1E]  overflow-y-auto ${
          selectedChat ? "hidden md:block" : "block"
        }`}
      >
        <div className="p-3 sticky top-0 bg-[#1E1E1E] z-10 flex items-center">
          <div className="bg-[#121212] flex w-full rounded-4xl">
            <Search size={18} className="text-gray-400 ml-3 mt-3" />
            <input
              type="text"
              placeholder="Search users..."
              className="w-full bg-[#121212] px-3 py-2 rounded-4xl outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        {filteredUsers.map((u) => (
          <UserRow key={u._id} u={u} />
        ))}
      </div>
      {/* Chat Window */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center bg-[#1E1E1E]  gap-3 p-3">
              <button
                className="md:hidden mr-1"
                onClick={() => setSelectedChat(null)}
              >
                <ChevronLeft />
              </button>
              <img
                src={selectedChat.avatar}
                alt={selectedChat.name}
                className="w-8 h-8 rounded-full"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{selectedChat.name}</p>
                <p
                  className={`text-sm ${
                    selectedChat.isOnline ? "text-green-500" : "text-gray-400"
                  }`}
                >
                  {selectedChat.isOnline ? "Online" : selectedChat.lastSeen
                    ? formatLastSeen(selectedChat.lastSeen)
                    : "Offline"}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
  {(messages[selectedChat.id]).map((msg) => {
    // Normalize backend message
    const normalized = {
      id: msg._id,
      sender: msg.sender,
      content: msg.content,
      time: new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      ...(msg.file
        ? {
            type: msg.file.type.startsWith("image")
              ? "image"
              : msg.file.type.startsWith("video")
              ? "video"
              : "file",
            url: msg.file.url,
            name: msg.file.public_id, // or extract filename
            size: msg.file.size || null,
          }
        : { type: "text" }),
    };

    return <MessageBubble key={normalized.id} m={normalized} />;
  })}
  <div ref={chatBottomRef} />
</div>


            {/* File options above paperclip */}
            {showFileOptions && (
              <div className="absolute bottom-14 left-4 md:left-auto bg-[#1E1E1E] rounded-lg shadow-lg p-2 space-y-1 z-20">
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="flex items-center gap-2 w-full text-left hover:bg-[#2C2C2C] px-3 py-2"
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
                    class="lucide lucide-image-icon lucide-image"
                  >
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                  </svg>{" "}
                  Image
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2  w-full text-left hover:bg-[#2C2C2C] px-3 py-2"
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
                    class="lucide lucide-file-icon lucide-file"
                  >
                    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                  </svg>{" "}
                  Document
                </button>
                <button
                  onClick={() => videoInputRef.current?.click()}
                  className="flex items-center gap-2 w-full text-left hover:bg-[#2C2C2C] px-3 py-2"
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
                    class="lucide lucide-video-icon lucide-video"
                  >
                    <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
                    <rect x="2" y="6" width="14" height="12" rx="2" />
                  </svg>{" "}
                  Video
                </button>
              </div>
            )}

            {/* Hidden file inputs */}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImagePicked}
            />
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleVideoPicked}
            />
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFilePicked}
            />

            {/* Input row */}
            <div className="p-3 flex items-center gap-2 relative bg-[#1E1E1E] ">
              <button
                onClick={() => setShowFileOptions((v) => !v)}
                className="p-2 rounded hover:bg-[#1E1E1E]"
              >
                <Paperclip />
              </button>
              <input
                type="text"
                placeholder="Type a message..."
                className="flex-1 bg-[#121212] px-3 py-2 rounded-2xl outline-none"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              />
              <button
                onClick={handleSendMessage}
                className="bg-[#00B8D4] px-3 py-2 rounded-full hover:bg-[#00A5BF]"
              >
                <Send size={18} />
              </button>
            </div>
          </>
        ) : (
          <div className="h-full w-full hidden md:flex items-center justify-center text-gray-400">
            <div className="text-center px-6">
              <h2 className="text-xl font-semibold mb-2">
                Select a conversation
              </h2>
              <p>
                Choose a user from the list to start chatting. You can send
                messages, images, videos and documents.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
