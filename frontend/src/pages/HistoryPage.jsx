import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { createApiClient } from "../api.js";

const HistoryPage = () => {
  const { token } = useAuth();
  const api = createApiClient(token);
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/chat/conversations");
        setConversations(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openConversation = async (conv) => {
    setSelected(conv);
    try {
      const res = await api.get(`/chat/conversations/${conv._id}`);
      setMessages(res.data.messages);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="history-page">
      <aside className="sidebar">
        <h3>Past Conversations</h3>
        <ul className="conversation-list">
          {conversations.map((conv) => (
            <li
              key={conv._id}
              className={
                selected && selected._id === conv._id
                  ? "conversation-item active"
                  : "conversation-item"
              }
              onClick={() => openConversation(conv)}
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
          <h2>{selected?.title || "Select a conversation"}</h2>
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
      </main>
    </div>
  );
};

export default HistoryPage;

