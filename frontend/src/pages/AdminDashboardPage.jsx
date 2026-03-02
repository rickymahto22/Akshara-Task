import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { createApiClient } from "../api.js";

const AdminDashboardPage = () => {
  const { token } = useAuth();
  const api = createApiClient(token);

  const [summary, setSummary] = useState(null);
  const [messagesPerDay, setMessagesPerDay] = useState([]);
  const [topIntents, setTopIntents] = useState([]);

  const [tab, setTab] = useState("overview");
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [selectedMessages, setSelectedMessages] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, m, t] = await Promise.all([
          api.get("/admin/summary"),
          api.get("/admin/messages-per-day"),
          api.get("/admin/top-intents"),
        ]);
        setSummary(s.data);
        setMessagesPerDay(m.data);
        setTopIntents(t.data);
      } catch (err) {
        console.error(err);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setUsersLoading(false);
    }
  };

  const loadConversations = async () => {
    setConversationsLoading(true);
    try {
      const res = await api.get("/admin/conversations");
      setConversations(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setConversationsLoading(false);
    }
  };

  const handleTabChange = (nextTab) => {
    setTab(nextTab);
    if (nextTab === "users" && users.length === 0) {
      loadUsers();
    }
    if (nextTab === "conversations" && conversations.length === 0) {
      loadConversations();
    }
  };

  const updateUser = async (id, updates) => {
    try {
      const res = await api.patch(`/admin/users/${id}`, updates);
      setUsers((prev) =>
        prev.map((u) => (u._id === id || u.id === id ? { ...u, ...res.data } : u))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleUserRoleChange = (id, role) => {
    updateUser(id, { role });
  };

  const handleUserActiveToggle = (id, isActive) => {
    updateUser(id, { isActive });
  };

  const openConversation = async (conv) => {
    setSelectedConversation(conv);
    try {
      const res = await api.get(`/admin/conversations/${conv.id || conv._id}`);
      setSelectedMessages(res.data.messages);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="admin-page">
      <h2>Admin Dashboard</h2>

      <div style={{ marginBottom: "1rem" }}>
        <button
          className="btn-secondary"
          style={{ marginRight: "0.5rem" }}
          onClick={() => handleTabChange("overview")}
        >
          Overview
        </button>
        <button
          className="btn-secondary"
          style={{ marginRight: "0.5rem" }}
          onClick={() => handleTabChange("users")}
        >
          Users
        </button>
        <button
          className="btn-secondary"
          onClick={() => handleTabChange("conversations")}
        >
          Conversations
        </button>
      </div>

      {tab === "overview" && (
        <>
          {summary && (
            <div className="cards">
              <div className="card">
                <h3>Total Users</h3>
                <p>{summary.userCount}</p>
              </div>
              <div className="card">
                <h3>Total Conversations</h3>
                <p>{summary.conversationCount}</p>
              </div>
              <div className="card">
                <h3>Total Messages</h3>
                <p>{summary.messageCount}</p>
              </div>
            </div>
          )}

          <div className="admin-section">
            <h3>Messages per Day</h3>
            <ul>
              {messagesPerDay.map((d) => (
                <li key={d.date}>
                  {d.date}: {d.count}
                </li>
              ))}
            </ul>
          </div>

          <div className="admin-section">
            <h3>Top Intents</h3>
            <ul>
              {topIntents.map((i) => (
                <li key={i.intent}>
                  {i.intent}: {i.count}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {tab === "users" && (
        <div className="admin-section">
          <h3>User Management</h3>
          {usersLoading && <p>Loading users...</p>}
          {!usersLoading && (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>Name</th>
                  <th style={{ textAlign: "left" }}>Email</th>
                  <th style={{ textAlign: "left" }}>Role</th>
                  <th style={{ textAlign: "left" }}>Active</th>
                  <th style={{ textAlign: "left" }}>Created</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id || u.id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <select
                        value={u.role}
                        onChange={(e) =>
                          handleUserRoleChange(u._id || u.id, e.target.value)
                        }
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={u.isActive !== false}
                        onChange={(e) =>
                          handleUserActiveToggle(
                            u._id || u.id,
                            e.target.checked
                          )
                        }
                      />
                    </td>
                    <td>
                      {u.createdAt
                        ? new Date(u.createdAt).toLocaleDateString()
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "conversations" && (
        <div className="admin-section" style={{ display: "flex", gap: "1rem" }}>
          <div style={{ width: "40%" }}>
            <h3>All Conversations</h3>
            {conversationsLoading && <p>Loading conversations...</p>}
            <ul className="conversation-list">
              {conversations.map((c) => (
                <li
                  key={c.id || c._id}
                  className="conversation-item"
                  onClick={() => openConversation(c)}
                >
                  <div className="conversation-title">
                    {c.title || "Untitled"}
                  </div>
                  <div className="conversation-date">
                    {c.user?.name} ·{" "}
                    {new Date(c.createdAt).toLocaleString()} ·{" "}
                    {c.messageCount} messages
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="chat-main" style={{ minHeight: "280px" }}>
            <div className="chat-header">
              <h3>
                {selectedConversation
                  ? selectedConversation.title || "Conversation"
                  : "Select a conversation"}
              </h3>
            </div>
            <div className="chat-window">
              {selectedMessages.map((msg) => (
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
                    {msg.sender === "user" ? "User" : "Bot"}
                    {msg.intent ? ` · intent: ${msg.intent}` : ""} ·{" "}
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;

