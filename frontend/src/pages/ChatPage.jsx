import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { createApiClient } from "../api.js";

const ChatPage = () => {
  const { token } = useAuth();
  const api = createApiClient(token);

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchConversations = async () => {
    try {
      const res = await api.get("/chat/conversations");
      setConversations(res.data);
      if (!activeConversation && res.data.length > 0) {
        selectConversation(res.data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectConversation = async (conv) => {
    setActiveConversation(conv);
    try {
      const res = await api.get(`/chat/conversations/${conv._id}`);
      setMessages(res.data.messages);
    } catch (err) {
      console.error(err);
    }
  };

  const createConversation = async () => {
    try {
      const res = await api.post("/chat/conversations", {
        title: "New conversation",
      });
      await fetchConversations();
      setActiveConversation(res.data);
      setMessages([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || !activeConversation) return;
    const text = input.trim();
    setInput("");
    setLoading(true);

    // optimistic UI
    const tempUserMsg = {
      _id: `temp-${Date.now()}`,
      sender: "user",
      text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await api.post(
        `/chat/conversations/${activeConversation._id}/message`,
        { text }
      );
      setMessages((prev) => [
        ...prev.filter((m) => !m._id.startsWith("temp-")),
        res.data.userMessage,
        res.data.botMessage,
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="chat-page">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h3>Conversations</h3>
          <button className="btn-secondary" onClick={createConversation}>
            + New
          </button>
        </div>
        <ul className="conversation-list">
          {conversations.map((conv) => (
            <li
              key={conv._id}
              className={
                activeConversation && activeConversation._id === conv._id
                  ? "conversation-item active"
                  : "conversation-item"
              }
              onClick={() => selectConversation(conv)}
            >
              <div className="conversation-title">
                {conv.title || "Untitled"}
              </div>
              <div className="conversation-date">
                {new Date(conv.updatedAt || conv.createdAt).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      </aside>
      <main className="chat-main">
        <div className="chat-header">
          <h2>
            {activeConversation?.title || "Select or create a conversation"}
          </h2>
        </div>
        <div className="chat-window">
          {messages.map((msg) => (
            <div
              key={msg._id}
              className={
                msg.sender === "user"
                  ? "message-bubble user"
                  : "message-bubble bot"
              }
            >
              <div className="message-text">{msg.text}</div>
              <div className="message-meta">
                {msg.sender === "user" ? "You" : "SmartChat AI"} ·{" "}
                {new Date(msg.createdAt).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
        {activeConversation && (
          <form className="chat-input" onSubmit={handleSend}>
            <input
              type="text"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !input.trim()}
            >
              {loading ? "Sending..." : "Send"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
};

export default ChatPage;

