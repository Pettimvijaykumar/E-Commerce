import React, { useState, useEffect } from "react";
import axios from "axios";
import "./NewsLetter.css";

const NewsLetter = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch subscribers when component mounts
  useEffect(() => {
    const fetchSubscribers = async () => {
      try {
        const res = await axios.get("https://e-commerce-h9gr.onrender.com/newsletter/subscribers");
        if (res.data.success) setSubscribers(res.data.subscribers);
      } catch (err) {
        console.error("Error fetching subscribers:", err);
      }
    };
    fetchSubscribers();
  }, []);

  // Handle newsletter send
  const handleSend = async (e) => {
    e.preventDefault(); // Prevent page reload

    if (!subject || !content) {
      setMessage("⚠️ Please add subject & content");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await axios.post("https://e-commerce-h9gr.onrender.com/newsletter/send", { subject, content });
      setMessage(res.data.message || "✅ Newsletter sent successfully!");
      setSubject("");
      setContent("");
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to send newsletter");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="newsletter-admin">
      <h1>Newsletter Admin Panel</h1>
      <p className="subscriber-count">Total Subscribers: {subscribers.length}</p>

      <form onSubmit={handleSend}>
        <div className="form-group">
          <input
            type="text"
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        <div className="form-group">
          <textarea
            placeholder="Content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          ></textarea>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send Newsletter"}
        </button>
      </form>

      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default NewsLetter;
