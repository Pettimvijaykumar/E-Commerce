import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import "./AdminNotification.css";

const AdminNotification= () => {
  const [notifications, setNotifications] = useState([]);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const token = localStorage.getItem("token");

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await axios.get("https://e-commerce-h9gr.onrender.com/api/admin/notifications");

      setNotifications(res.data);
    } catch (err) {
      console.error("❌ Error fetching notifications:", err);
    }
  }, [token]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Send notification
  const handleSend = async (e) => {
  e.preventDefault();
  if (!message.trim() || isSending) return;

  setIsSending(true);

  try {
    const res = await axios.post("https://e-commerce-h9gr.onrender.com/api/admin/notifications", { message });


    // ✅ res.data is the created notification
    setNotifications((prev) => [res.data, ...prev]);
    setMessage("");
    alert("✅ Notification sent successfully!");
    
  } catch (err) {
    console.error("❌ Failed to send notification:", err);

    // ✅ Backend sends { error: "text" }
    alert(err.response?.data?.error || "❌ Failed to send notification");
  } finally {
    setIsSending(false);
  }
};

  return (
    <div className="notifications-page">
      <h2>📢 Send Notification</h2>

      <form onSubmit={handleSend} className="send-container">
        <textarea
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          required
        />
        <button type="submit" disabled={!message.trim() || isSending}>
          {isSending ? "Sending..." : "Send Notification"}
        </button>
      </form>

      <div className="notifications-list">
        <h3>Recent Announcements</h3>
        {notifications.length > 0 ? (
          <ul>
            {notifications.map((n) => (
  <li key={n._id}>
    <p>{n.message}</p>
    <small>
      {n.createdAt
        ? new Date(n.createdAt).toLocaleString()
        : "Date not available"}
    </small>
  </li>
))}

          </ul>
        ) : (
          <p>No notifications sent yet.</p>
        )}
      </div>
    </div>
  );
};

export default AdminNotification;