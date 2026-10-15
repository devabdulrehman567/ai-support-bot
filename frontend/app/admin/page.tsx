
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = "https://ai-support-bot.wokku.app/api";

type Ticket = {
  id: number;
  subject?: string;
  message?: string;
  status?: string;
  priority?: string;
  created_at?: string;
  user?: { name?: string; email?: string };
};

type Order = {
  id: number;
  order_number?: string;
  customer_name?: string;
  product_name?: string;
  amount?: number | string;
  status?: string;
};

export default function AdminDashboard() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [userName, setUserName] = useState("Administrator");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  
const [updatingTicketId, setUpdatingTicketId] = useState<number | null>(null);

async function updateTicketStatus(ticketId: number, status: string) {
  const savedToken = localStorage.getItem("token");

  if (!savedToken) {
    setError("Please log in again.");
    return;
  }

  setUpdatingTicketId(ticketId);
  setError("");

  try {
    const response = await fetch(`${API_URL}/admin/tickets/${ticketId}`, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${savedToken}`,
      },
      body: JSON.stringify({ status }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to update ticket status.");
    }

    setTickets((currentTickets) =>
      currentTickets.map((ticket) =>
        ticket.id === ticketId
          ? { ...ticket, status: data.ticket?.status ?? status }
          : ticket
      )
    );
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Failed to update ticket status."
    );
  } finally {
    setUpdatingTicketId(null);
  }
}


  const [orders, setOrders] = useState<Order[]>([]);
  const [active, setActive] = useState("Overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [time, setTime] = useState("");

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (!savedToken) {
      router.replace("/login");
      return;
    }

    setToken(savedToken);

    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUserName(parsed.name || "Administrator");
      } catch {
        // Keep the default name if stored user data is invalid.
      }
    }

    setTime(
      new Date().toLocaleDateString("en-PK", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    );

    async function loadData() {
      try {
        const headers = {
          Accept: "application/json",
          Authorization: `Bearer ${savedToken}`,
        };

        const [ticketResponse, orderResponse] = await Promise.all([
          fetch(`${API_URL}/admin/tickets`, { headers }),
          fetch(`${API_URL}/admin/orders`, { headers }),
        ]);

        if (ticketResponse.status === 401 || orderResponse.status === 401) {
          setError("Your session may have expired. Please log in again.");
          return;
        }

        if (ticketResponse.ok) {
          const data = await ticketResponse.json();
          setTickets(
            Array.isArray(data) ? data : data.tickets || data.data || []
          );
        }

        if (orderResponse.ok) {
          const data = await orderResponse.json();
          setOrders(
            Array.isArray(data) ? data : data.orders || data.data || []
          );
        }

        if (!ticketResponse.ok && !orderResponse.ok) {
          setError("Could not load dashboard data. Please check your API.");
        }
      } catch {
        setError("Unable to connect to the API. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  async function logout() {
    try {
      if (token) {
        await fetch(`${API_URL}/logout`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch {
      // Clear local session even if the API is unavailable.
    }

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.replace("/login");
  }

  const openTickets = tickets.filter(
    (ticket) => (ticket.status || "").toLowerCase() === "open"
  ).length;

  const highPriority = tickets.filter(
    (ticket) => (ticket.priority || "").toLowerCase() === "high"
  ).length;

  const stats = [
    {
      label: "Total Tickets",
      value: tickets.length,
      icon: "▤",
      color: "#6759e8",
      bg: "#eeebff",
    },
    {
      label: "Open Tickets",
      value: openTickets,
      icon: "◷",
      color: "#d97706",
      bg: "#fff3dc",
    },
    {
      label: "High Priority",
      value: highPriority,
      icon: "⚑",
      color: "#dc4560",
      bg: "#ffedf0",
    },
    {
      label: "Orders Loaded",
      value: orders.length,
      icon: "▣",
      color: "#07966b",
      bg: "#e1f8ef",
    },
  ];

  const menu = [
    { label: "Overview", icon: "◫" },
    { label: "Support Tickets", icon: "▤" },
    { label: "Orders", icon: "▣" },
    { label: "AI Activity", icon: "✳" },
    { label: "Settings", icon: "⚙" },
  ];

  const recentTickets = [...tickets]
    .sort(
      (a, b) =>
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime()
    )
    .slice(0, 5);

  function statusStyle(status?: string) {
    const value = (status || "unknown").toLowerCase();
    if (value === "open" || value === "pending") {
      return { color: "#b7791f", background: "#fff4d6" };
    }
    if (value === "closed" || value === "resolved") {
      return { color: "#087f5b", background: "#dff8ed" };
    }
    return { color: "#586174", background: "#edf0f5" };
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="brand-icon">✳</div>
          <div>
            <h2>SupportPilot</h2>
            <p>AI SUPPORT PLATFORM</p>
          </div>
        </div>

        <div className="nav-heading">WORKSPACE</div>
        <nav className="admin-nav">
          {menu.map((item) => (
            <button
              key={item.label}
              className={`nav-item ${active === item.label ? "selected" : ""}`}
              onClick={() => setActive(item.label)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.label === "Support Tickets" && tickets.length > 0 && (
                <span className="nav-count">{tickets.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="admin-profile">
            <div className="avatar">A</div>
            <div className="profile-text">
              <strong>{userName}</strong>
              <span>Admin workspace</span>
            </div>
          </div>
          <button className="logout-button" onClick={logout}>
            ↪ &nbsp; Sign out
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <div className="breadcrumb">Workspace / {active}</div>
            <h1>{active}</h1>
            <p className="welcome">
              Welcome back, {userName}. Here&apos;s your support overview.
            </p>
          </div>
          <div className="topbar-right">
            <span className="date-label">◷ &nbsp; {time}</span>
            <div className="top-avatar">A</div>
          </div>
        </header>

        <div className="admin-content">
          {error && (
            <div className="error-banner">
              <span>{error}</span>
              <button onClick={() => window.location.reload()}>Retry</button>
            </div>
          )}

          {active === "Overview" && (
            <>
              <div className="section-heading">
                <div>
                  <h2>Dashboard overview</h2>
                  <p>Monitor your support operations at a glance.</p>
                </div>
                <button
                  className="refresh-button"
                  onClick={() => window.location.reload()}
                >
                  ↻ &nbsp; Refresh data
                </button>
              </div>

              <div className="stats-grid">
                {stats.map((stat) => (
                  <div className="stat-card" key={stat.label}>
                    <div className="stat-top">
                      <span>{stat.label}</span>
                      <div
                        className="stat-icon"
                        style={{ color: stat.color, background: stat.bg }}
                      >
                        {stat.icon}
                      </div>
                    </div>
                    <div className="stat-number">
                      {loading ? "..." : stat.value}
                    </div>
                    <div className="stat-caption">
                      <span className="live-dot" />
                      Data from API
                    </div>
                  </div>
                ))}
              </div>

              <div className="overview-grid">
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Recent support tickets</h3>
                      <p>Latest customer support requests</p>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => setActive("Support Tickets")}
                    >
                      View all →
                    </button>
                  </div>

                  {loading ? (
                    <div className="empty-state">Loading tickets...</div>
                  ) : recentTickets.length === 0 ? (
                    <div className="empty-state">
                      <span className="empty-icon">▤</span>
                      <strong>No tickets to display</strong>
                      <p>Customer support tickets will appear here.</p>
                    </div>
                  ) : (
                    <div className="ticket-list">
                      {recentTickets.map((ticket) => (
                        <div className="ticket-row" key={ticket.id}>
                          <div className="ticket-avatar">T</div>
                          <div className="ticket-info">
                            <strong>
                              {ticket.subject ||
                                ticket.message ||
                                `Support ticket #${ticket.id}`}
                            </strong>
                            <span>
                              {ticket.user?.name || "Customer"} · Ticket #
                              {ticket.id}
                            </span>
                          </div>
                          <span
                            className="status-pill"
                            style={statusStyle(ticket.status)}
                          >
                            {ticket.status || "Unknown"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="panel quick-panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Quick actions</h3>
                      <p>Jump into your workspace</p>
                    </div>
                  </div>
                  <button
                    className="quick-action"
                    onClick={() => setActive("Support Tickets")}
                  >
                    <span className="quick-icon purple">▤</span>
                    <span>
                      <strong>Manage tickets</strong>
                      <small>Review customer requests</small>
                    </span>
                    <span className="quick-arrow">→</span>
                  </button>
                  <button
                    className="quick-action"
                    onClick={() => setActive("Orders")}
                  >
                    <span className="quick-icon green">▣</span>
                    <span>
                      <strong>View orders</strong>
                      <small>Review order information</small>
                    </span>
                    <span className="quick-arrow">→</span>
                  </button>
                  

<button
  type="button"
  className="quick-action"
  onClick={() => {
    window.location.assign("/ai-chats");
  }}
>
  <span className="quick-icon orange">✳</span>
  <span>
    <strong>AI Chats</strong>
    <small>Open Gemini AI chat page</small>
  </span>
  <span className="quick-arrow">→</span>
</button>


                  <div className="ai-note">
                    <span>✳</span>
                    <div>
                      <strong>AI Support Assistant</strong>
                      <p>AI insights depend on connected API data.</p>
                    </div>
                  </div>
                </section>
              </div>
            </>
          )}

          {active === "Support Tickets" && (
            <section className="panel full-panel">
              <div className="panel-heading">
                <div>
                  <h3>All support tickets</h3>
                  <p>Tickets returned by the admin API</p>
                </div>
                <button
                  className="refresh-button"
                  onClick={() => window.location.reload()}
                >
                  ↻ Refresh
                </button>
              </div>
              {loading ? (
                <div className="empty-state">Loading tickets...</div>
              ) : tickets.length === 0 ? (
                <div className="empty-state">No tickets found.</div>
              ) : (
                <div className="table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Ticket</th>
                        <th>Customer</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tickets.map((ticket) => (
                        <tr key={ticket.id}>
                          <td>
                            <strong>#{ticket.id}</strong>
                            <small className="cell-subtitle">
                              {ticket.subject ||
                                ticket.message ||
                                "Support request"}
                            </small>
                          </td>
                          <td>{ticket.user?.name || "Customer"}</td>
                          <td>
                            <span
                              className={`priority ${
                                (ticket.priority || "").toLowerCase() === "high"
                                  ? "priority-high"
                                  : ""
                              }`}
                            >
                              {ticket.priority || "Normal"}
                            </span>
                          </td>
                          
<td>
  <select
    value={ticket.status || "OPEN"}
    disabled={updatingTicketId === ticket.id}
    onChange={(event) =>
      updateTicketStatus(ticket.id, event.target.value)
    }
    aria-label={`Update status for ticket ${ticket.id}`}
    style={{
      ...statusStyle(ticket.status),
      padding: "8px 10px",
      borderRadius: "8px",
      border: "1px solid #d1d5db",
      cursor: updatingTicketId === ticket.id ? "wait" : "pointer",
    }}
  >
    <option value="OPEN">OPEN</option>
    <option value="IN PROGRESS">IN PROGRESS</option>
    <option value="RESOLVED">RESOLVED</option>
  </select>

  {updatingTicketId === ticket.id && (
    <small style={{ display: "block", marginTop: "4px" }}>
      Saving...
    </small>
  )}
</td>

                          <td>
                            {ticket.created_at
                              ? new Date(ticket.created_at).toLocaleDateString()
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {active === "Orders" && (
            <section className="panel full-panel">
              <div className="panel-heading">
                <div>
                  <h3>Orders overview</h3>
                  <p>Orders returned by the current API endpoint</p>
                </div>
              </div>
              {loading ? (
                <div className="empty-state">Loading orders...</div>
              ) : orders.length === 0 ? (
                <div className="empty-state">No orders found.</div>
              ) : (
                <div className="table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Order</th>
                        <th>Customer</th>
                        <th>Product</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id}>
                          <td>
                            <strong>
                              {order.order_number || `#${order.id}`}
                            </strong>
                          </td>
                          <td>{order.customer_name || "Customer"}</td>
                          <td>{order.product_name || "—"}</td>
                          <td>
                            {order.amount != null
                              ? `Rs. ${order.amount}`
                              : "—"}
                          </td>
                          <td>
                            <span
                              className="status-pill"
                              style={statusStyle(order.status)}
                            >
                              {order.status || "Unknown"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="notice">
                Note: The customer orders endpoint may only return the
                logged-in user&apos;s orders. A dedicated admin orders endpoint
                is needed for all customers&apos; orders.
              </p>
            </section>
          )}

          {active === "AI Activity" && (
            <section className="panel full-panel">
              <div className="panel-heading">
                <div>
                  <h3>AI activity</h3>
                  <p>Current AI integration status</p>
                </div>
              </div>
              <div className="ai-status-card">
                <div className="ai-status-icon">✳</div>
                <div>
                  <strong>AI message classification</strong>
                  <p>
                    The classification endpoint is configured in the project.
                    Historical AI usage and token counts are not yet connected
                    to this dashboard.
                  </p>
                </div>
                <span className="status-pill status-configured">
                  Endpoint configured
                </span>
              </div>
              <div className="ai-status-card">
                <div className="ai-status-icon">◷</div>
                <div>
                  <strong>Token usage</strong>
                  <p>
                    Token totals will be displayed after verified provider
                    usage data is connected.
                  </p>
                </div>
                <span className="status-pill status-pending">Not connected</span>
              </div>
            </section>
          )}

          {active === "Settings" && (
            <section className="panel full-panel">
              <div className="panel-heading">
                <div>
                  <h3>Admin settings</h3>
                  <p>Current signed-in account</p>
                </div>
              </div>
              <div className="settings-row">
                <span>Account name</span>
                <strong>{userName}</strong>
              </div>
              <div className="settings-row">
                <span>Workspace</span>
                <strong>SupportPilot AI</strong>
              </div>
              <div className="settings-row">
                <span>API connection</span>
                <strong>{error ? "Needs attention" : "Configured"}</strong>
              </div>
              <button className="danger-button" onClick={logout}>
                Sign out of account
              </button>
            </section>
          )}

          <footer className="admin-footer">
            <span>© 2026 SupportPilot AI</span>
            <span>Admin workspace · Live data depends on API access</span>
          </footer>
        </div>
      </main>

      <style jsx>{`
        .admin-shell {
          --ink: #20243a;
          --muted: #81879b;
          --line: #e9ebf2;
          min-height: 100vh;
          display: flex;
          background: #f7f8fc;
          color: var(--ink);
          font-family: Arial, Helvetica, sans-serif;
        }
        .admin-sidebar {
          width: 252px;
          flex-shrink: 0;
          min-height: 100vh;
          background: #fff;
          border-right: 1px solid var(--line);
          padding: 27px 17px 18px;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
        }
        .admin-brand {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 0 7px 35px;
        }
        .brand-icon {
          width: 43px;
          height: 43px;
          border-radius: 14px;
          background: #6657e8;
          color: #fff;
          display: grid;
          place-items: center;
          font-size: 25px;
          box-shadow: 0 7px 17px #6657e833;
        }
        .admin-brand h2 {
          font-size: 18px;
          margin: 0 0 5px;
          letter-spacing: -0.5px;
        }
        .admin-brand p {
          font-size: 9px;
          color: #9599aa;
          letter-spacing: 1.2px;
          margin: 0;
        }
        .nav-heading {
          color: #a0a4b5;
          font-size: 10px;
          letter-spacing: 1.5px;
          font-weight: 700;
          padding: 0 12px 12px;
        }
        .admin-nav {
          display: grid;
          gap: 6px;
        }
        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px 12px;
          border: 0;
          border-radius: 10px;
          background: transparent;
          color: #747b91;
          font-size: 13px;
          text-align: left;
          cursor: pointer;
          transition: 0.2s;
          width: 100%;
        }
        .nav-item:hover {
          background: #f6f5ff;
          color: #5e50d8;
        }
        .nav-item.selected {
          color: #5c4cdb;
          background: #efedff;
          font-weight: 700;
        }
        .nav-icon {
          width: 21px;
          text-align: center;
          font-size: 18px;
        }
        .nav-count {
          margin-left: auto;
          border-radius: 7px;
          background: #fff;
          color: #6759e8;
          padding: 3px 7px;
          font-size: 10px;
        }
        .sidebar-bottom {
          margin-top: auto;
          padding-top: 24px;
        }
        .admin-profile {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 15px 5px;
          border-top: 1px solid var(--line);
        }
        .avatar,
        .top-avatar {
          display: grid;
          place-items: center;
          width: 37px;
          height: 37px;
          border-radius: 12px;
          background: #eae7ff;
          color: #6555df;
          font-weight: 700;
        }
        .profile-text {
          min-width: 0;
          display: grid;
          gap: 4px;
        }
        .profile-text strong {
          font-size: 12px;
          overflow-wrap: anywhere;
        }
        .profile-text span {
          color: var(--muted);
          font-size: 10px;
        }
        .logout-button {
          width: 100%;
          padding: 11px;
          background: white;
          border: 1px solid var(--line);
          border-radius: 9px;
          text-align: left;
          color: #73788b;
          cursor: pointer;
        }
        .admin-main {
          min-width: 0;
          flex: 1;
        }
        .admin-topbar {
          min-height: 123px;
          background: #fff;
          border-bottom: 1px solid var(--line);
          padding: 25px 34px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          box-sizing: border-box;
        }
        .breadcrumb {
          font-size: 11px;
          color: #969bad;
          margin-bottom: 9px;
        }
        .admin-topbar h1 {
          font-size: 25px;
          letter-spacing: -0.7px;
          margin: 0 0 7px;
        }
        .welcome {
          font-size: 12px;
          color: #888da0;
          margin: 0;
        }
        .topbar-right {
          display: flex;
          align-items: center;
          gap: 17px;
        }
        .date-label {
          color: #777e92;
          font-size: 11px;
          white-space: nowrap;
        }
        .top-avatar {
          border-radius: 50%;
          width: 40px;
          height: 40px;
        }
        .admin-content {
          padding: 29px 34px 20px;
          max-width: 1600px;
          margin: 0 auto;
        }
        .section-heading,
        .panel-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
        }
        .section-heading {
          margin-bottom: 19px;
        }
        .section-heading h2 {
          font-size: 17px;
          margin: 0 0 7px;
        }
        .section-heading p,
        .panel-heading p {
          color: #9095a7;
          font-size: 11px;
          margin: 0;
        }
        .refresh-button {
          border: 1px solid #e3e5ee;
          background: white;
          padding: 10px 13px;
          border-radius: 9px;
          font-size: 11px;
          color: #565d73;
          cursor: pointer;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 22px;
        }
        .stat-card {
          background: #fff;
          border: 1px solid #eceef4;
          border-radius: 14px;
          padding: 20px;
          min-width: 0;
          box-shadow: 0 3px 12px #20243a04;
        }
        .stat-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          color: #83899c;
          font-size: 11px;
        }
        .stat-icon {
          width: 38px;
          height: 38px;
          border-radius: 11px;
          display: grid;
          place-items: center;
          font-size: 20px;
          flex-shrink: 0;
        }
        .stat-number {
          font-size: 30px;
          letter-spacing: -1px;
          font-weight: 750;
          margin: 14px 0 12px;
        }
        .stat-caption {
          font-size: 10px;
          color: #9297a7;
          display: flex;
          align-items: center;
          gap: 7px;
        }
        .live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #17b884;
        }
        .overview-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.45fr) minmax(280px, 0.9fr);
          gap: 20px;
        }
        .panel {
          background: #fff;
          border: 1px solid #e9ebf2;
          border-radius: 14px;
          padding: 22px;
          min-width: 0;
          box-shadow: 0 3px 12px #20243a04;
        }
        .panel-heading {
          margin-bottom: 21px;
        }
        .panel-heading h3 {
          font-size: 14px;
          margin: 0 0 7px;
        }
        .text-button {
          background: none;
          border: 0;
          color: #6253df;
          font-size: 11px;
          cursor: pointer;
          white-space: nowrap;
        }
        .ticket-list {
          display: grid;
        }
        .ticket-row {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 15px 0;
          border-bottom: 1px solid #f0f1f6;
          min-width: 0;
        }
        .ticket-row:last-child {
          border-bottom: 0;
        }
        .ticket-avatar {
          width: 35px;
          height: 35px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          background: #f0edff;
          color: #6b5be4;
          font-size: 12px;
          font-weight: 700;
        }
        .ticket-info {
          display: grid;
          gap: 6px;
          flex: 1;
          min-width: 0;
        }
        .ticket-info strong {
          font-size: 11px;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
        .ticket-info span {
          font-size: 10px;
          color: #969bad;
        }
        .status-pill {
          display: inline-flex;
          align-items: center;
          padding: 5px 8px;
          border-radius: 6px;
          font-size: 10px;
          white-space: nowrap;
          font-weight: 650;
        }
        .quick-panel {
          display: flex;
          flex-direction: column;
        }
        .quick-action {
          display: flex;
          align-items: center;
          gap: 11px;
          border: 1px solid #eff0f5;
          background: white;
          border-radius: 10px;
          padding: 12px;
          margin-bottom: 10px;
          text-align: left;
          cursor: pointer;
          transition: 0.2s;
        }
        .quick-action:hover {
          border-color: #cfc9ff;
          transform: translateY(-1px);
        }
        .quick-icon {
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          font-size: 18px;
          flex-shrink: 0;
        }
        .purple {
          color: #6858df;
          background: #efedff;
        }
        .green {
          color: #07966b;
          background: #e1f8ef;
        }
        .orange {
          color: #d97706;
          background: #fff3dc;
        }
        .quick-action > span:nth-child(2) {
          display: grid;
          gap: 5px;
          flex: 1;
        }
        .quick-action strong {
          font-size: 11px;
          color: #34394f;
        }
        .quick-action small {
          font-size: 10px;
          color: #9297a7;
        }
        .quick-arrow {
          color: #8c91a3;
        }
        .ai-note {
          margin-top: auto;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          background: #f4f2ff;
          border-radius: 10px;
          padding: 14px;
          color: #6354d8;
        }
        .ai-note > span {
          font-size: 20px;
        }
        .ai-note strong {
          font-size: 11px;
        }
        .ai-note p {
          font-size: 10px;
          color: #827aa9;
          margin: 6px 0 0;
          line-height: 1.5;
        }
        .full-panel {
          margin-bottom: 20px;
        }
        .table-wrap {
          overflow-x: auto;
        }
        .admin-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          min-width: 650px;
        }
        .admin-table th {
          color: #9398aa;
          background: #fafaff;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 650;
          padding: 13px 12px;
          border-bottom: 1px solid #eceef4;
        }
        .admin-table td {
          font-size: 11px;
          color: #555b70;
          padding: 15px 12px;
          border-bottom: 1px solid #f0f1f6;
          vertical-align: middle;
        }
        .admin-table tbody tr:last-child td {
          border-bottom: 0;
        }
        .admin-table td strong {
          color: #30354a;
        }
        .cell-subtitle {
          display: block;
          color: #969bad;
          margin-top: 5px;
          max-width: 240px;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
        .priority {
          display: inline-block;
          border-radius: 5px;
          padding: 5px 8px;
          background: #edf0f5;
          color: #687086;
          font-size: 10px;
        }
        .priority-high {
          background: #ffedf0;
          color: #d43f59;
        }
        .empty-state {
          padding: 35px 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 9px;
          color: #9095a7;
          font-size: 12px;
          text-align: center;
        }
        .empty-state strong {
          color: #4a5065;
        }
        .empty-state p {
          margin: 0;
          font-size: 11px;
        }
        .empty-icon {
          font-size: 27px;
          color: #aaa3ee;
        }
        .notice {
          font-size: 11px;
          line-height: 1.6;
          color: #8b8190;
          background: #fff8e8;
          border-radius: 8px;
          padding: 12px;
          margin: 17px 0 0;
        }
        .ai-status-card {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 17px 0;
          border-bottom: 1px solid #eff0f5;
        }
        .ai-status-icon {
          display: grid;
          place-items: center;
          width: 43px;
          height: 43px;
          border-radius: 12px;
          background: #efedff;
          color: #6858df;
          font-size: 22px;
          flex-shrink: 0;
        }
        .ai-status-card > div:nth-child(2) {
          flex: 1;
        }
        .ai-status-card strong {
          font-size: 12px;
        }
        .ai-status-card p {
          color: #8b90a3;
          font-size: 11px;
          line-height: 1.6;
          margin: 6px 0 0;
        }
        .status-configured {
          color: #087f5b;
          background: #dff8ed;
        }
        .status-pending {
          color: #a66a13;
          background: #fff4d6;
        }
        .settings-row {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          padding: 17px 0;
          border-bottom: 1px solid #eff0f5;
          font-size: 12px;
        }
        .settings-row span {
          color: #888da0;
        }
        .settings-row strong {
          overflow-wrap: anywhere;
        }
        .danger-button {
          margin-top: 23px;
          border: 1px solid #ffd9df;
          color: #c53d56;
          background: #fff5f6;
          border-radius: 8px;
          padding: 11px 15px;
          cursor: pointer;
        }
        .error-banner {
          background: #fff0f1;
          color: #b4233d;
          border: 1px solid #ffd7de;
          padding: 13px 15px;
          border-radius: 9px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          gap: 15px;
          font-size: 12px;
        }
        .error-banner button {
          background: none;
          border: 0;
          color: inherit;
          text-decoration: underline;
          cursor: pointer;
        }
        .admin-footer {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 22px 0 8px;
          color: #a0a4b3;
          font-size: 10px;
        }
        @media (max-width: 1100px) {
          .admin-sidebar {
            width: 220px;
          }
          .admin-content {
            padding: 24px 22px;
          }
          .admin-topbar {
            padding: 23px 22px;
          }
          .stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .overview-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 650px) {
          .admin-shell {
            display: block;
          }
          .admin-sidebar {
            width: 100%;
            min-height: auto;
            padding: 16px;
            border-right: 0;
            border-bottom: 1px solid var(--line);
          }
          .admin-brand {
            padding-bottom: 17px;
          }
          .admin-nav {
            display: flex;
            overflow-x: auto;
            padding-bottom: 5px;
          }
          .nav-heading,
          .sidebar-bottom {
            display: none;
          }
          .nav-item {
            width: auto;
            flex-shrink: 0;
            padding: 10px 12px;
          }
          .nav-item > span:nth-child(2) {
            white-space: nowrap;
          }
          .nav-count {
            display: none;
          }
          .admin-topbar {
            min-height: auto;
            padding: 22px 17px;
            align-items: flex-start;
          }
          .admin-topbar h1 {
            font-size: 22px;
          }
          .welcome {
            max-width: 230px;
            line-height: 1.5;
          }
          .topbar-right {
            gap: 0;
          }
          .date-label {
            display: none;
          }
          .admin-content {
            padding: 21px 14px;
          }
          .stats-grid {
            gap: 10px;
          }
          .stat-card {
            padding: 14px;
          }
          .stat-number {
            font-size: 26px;
          }
          .stat-top {
            font-size: 10px;
          }
          .stat-icon {
            width: 31px;
            height: 31px;
          }
          .section-heading {
            align-items: flex-start;
          }
          .refresh-button {
            white-space: nowrap;
          }
          .panel {
            padding: 16px;
          }
          .ai-status-card {
            flex-wrap: wrap;
          }
          .ai-status-card > div:nth-child(2) {
            min-width: 65%;
          }
          .admin-footer {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
