
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Customer = {
  id?: number;
  name: string;
  email: string;
};

type Order = {
  id: number;
  order_number: string;
  customer_name: string;
  product_name: string;
  amount: string | number;
  status: string;
  tracking_number: string | null;
  created_at: string;
};

type SupportTicket = {
  id: number;
  ticket_number?: string | null;
  subject?: string | null;
  title?: string | null;
  message?: string | null;
  description?: string | null;
  priority?: string | null;
  status?: string | null;
  created_at?: string | null;
  category?: string | null;
};

const API_URL = "/backend-api";

const menuItems = [
  "Overview",
  "AI Chats",
  "Support Tickets",
  "Orders",
  "AI Automation",
  "Reports",
  "Activity Logs",
  "Settings",
];

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<Customer | null>(null);
  const [active, setActive] = useState("Overview");
  const [authChecking, setAuthChecking] = useState(true);

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketsError, setTicketsError] = useState("");
  const [ticketsLoaded, setTicketsLoaded] = useState(false);

  const [chatCount, setChatCount] = useState<number | null>(null);
  const [chatError, setChatError] = useState("");

  const [refreshKey, setRefreshKey] = useState(0);
  const [loggingOut, setLoggingOut] = useState(false);

  // Verify the saved login session.
  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (!token || !savedUser) {
      router.replace("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(savedUser);

      if (
        typeof parsedUser.name !== "string" ||
        typeof parsedUser.email !== "string" ||
        !parsedUser.name ||
        !parsedUser.email
      ) {
        throw new Error("Invalid user");
      }

      setUser(parsedUser);
      setAuthChecking(false);
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.replace("/login");
    }
  }, [router]);

  // Load the customer's own orders.
  useEffect(() => {
    if (
      authChecking ||
      (active !== "Overview" && active !== "Orders")
    ) {
      return;
    }

    let cancelled = false;

    const loadOrders = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        router.replace("/login");
        return;
      }

      setOrdersLoading(true);
      setOrdersError("");

      try {
        const response = await fetch(`${API_URL}/customer/orders`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.replace("/login");
          return;
        }

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to load your orders.");
        }

        if (!cancelled) {
          setOrders(Array.isArray(data.orders) ? data.orders : []);
        }
      } catch (error) {
        if (!cancelled) {
          setOrdersError(
            error instanceof Error
              ? error.message
              : "Unable to connect to the server."
          );
        }
      } finally {
        if (!cancelled) {
          setOrdersLoading(false);
        }
      }
    };

    loadOrders();

    return () => {
      cancelled = true;
    };
  }, [active, authChecking, refreshKey, router]);

  // Load customer tickets and chat history.
  useEffect(() => {
    if (
      authChecking ||
      (active !== "Overview" && active !== "Support Tickets")
    ) {
      return;
    }

    let cancelled = false;

    const loadSupportData = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        router.replace("/login");
        return;
      }

      setTicketsLoading(true);
      setTicketsError("");
      setChatError("");

      try {
        const response = await fetch(`${API_URL}/tickets`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.replace("/login");
          return;
        }

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Unable to load support tickets."
          );
        }

        if (!cancelled) {
          setTickets(
            Array.isArray(data.tickets) ? data.tickets : []
          );
          setTicketsLoaded(true);
        }
      } catch (error) {
        if (!cancelled) {
          setTicketsError(
            error instanceof Error
              ? error.message
              : "Unable to load support tickets."
          );
        }
      } finally {
        if (!cancelled) {
          setTicketsLoading(false);
        }
      }

      try {
        const response = await fetch(`${API_URL}/chat-history`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.replace("/login");
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load chat history.");
        }

        if (!cancelled) {
          setChatCount(
            Array.isArray(data.messages) ? data.messages.length : 0
          );
        }
      } catch (error) {
        if (!cancelled) {
          setChatError(
            error instanceof Error
              ? error.message
              : "Unable to load chat history."
          );
        }
      }
    };

    loadSupportData();

    return () => {
      cancelled = true;
    };
  }, [active, authChecking, refreshKey, router]);

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);
    const token = localStorage.getItem("token");

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
      // Clear the local session even if the API is unavailable.
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.replace("/login");
    }
  };

  const refreshDashboard = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  const initials = user?.name
    ? user.name
        .trim()
        .split(/\s+/)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "CU";

  const openSection = (item: string) => {
    if (item === "AI Chats") {
      router.push("/ai-chats");
      return;
    }

    setActive(item);
  };

  if (authChecking || !user) {
    return (
      <main style={styles.loadingPage}>
        <div style={styles.loadingCard}>Checking your account...</div>
      </main>
    );
  }

  return (
    <div style={styles.layout}>
      <aside style={styles.sidebar}>
        <div style={styles.brand}>
          <div style={styles.brandIcon}>S</div>
          <div>
            <strong style={styles.brandName}>SupportPilot</strong>
            <div style={styles.brandSubtitle}>AI Support Platform</div>
          </div>
        </div>

        <div style={styles.menuLabel}>WORKSPACE</div>

        <nav style={styles.navigation}>
          {menuItems.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => openSection(item)}
              style={{
                ...styles.menuButton,
                ...(active === item ? styles.activeMenuButton : {}),
              }}
            >
              <span style={styles.menuIcon}>
                {item === "Overview"
                  ? "⌂"
                  : item === "AI Chats"
                    ? "◉"
                    : item === "Support Tickets"
                      ? "▤"
                      : item === "Orders"
                        ? "▣"
                        : item === "AI Automation"
                          ? "✳"
                          : item === "Reports"
                            ? "▥"
                            : item === "Activity Logs"
                              ? "◷"
                              : "⚙"}
              </span>

              {item}

              {active === item && (
                <span style={styles.activeDot}>●</span>
              )}
            </button>
          ))}
        </nav>

        <div style={styles.sidebarBottom}>
          <div style={styles.profile}>
            <div style={styles.avatar}>{initials}</div>
            <div style={styles.profileDetails}>
              <strong style={styles.profileName}>{user.name}</strong>
              <span style={styles.profileRole}>Customer</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            style={{
              ...styles.logoutButton,
              opacity: loggingOut ? 0.6 : 1,
            }}
          >
            {loggingOut ? "Logging out..." : "↪ Log out"}
          </button>
        </div>
      </aside>

      <main style={styles.main}>
        <header style={styles.topbar}>
          <div>
            <div style={styles.breadcrumb}>
              Workspace / {active}
            </div>
            <div style={styles.topbarTitle}>{active}</div>
          </div>

          <div style={styles.topbarRight}>
            <div style={styles.topbarEmail}>{user.email}</div>
            <div style={styles.avatar}>{initials}</div>
          </div>
        </header>

        <section style={styles.content}>
          {/* OVERVIEW */}
          {active === "Overview" && (
            <>
              <div style={styles.welcomeCard}>
                <div>
                  <div style={styles.eyebrow}>CUSTOMER DASHBOARD</div>
                  <h1 style={styles.heading}>Welcome, {user.name}!</h1>
                  <p style={styles.muted}>
                    Manage your orders and keep track of your support
                    requests from one place.
                  </p>

                  <button
                    type="button"
                    style={styles.primaryButton}
                    onClick={() => setActive("Orders")}
                  >
                    View My Orders →
                  </button>
                </div>

                <div style={styles.welcomeIcon}>✦</div>
              </div>

              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionHeading}>Your Workspace</h2>
                <button
                  type="button"
                  style={styles.refreshButton}
                  onClick={refreshDashboard}
                >
                  ↻ Refresh data
                </button>
              </div>

              <div style={styles.statsGrid}>
                <button
                  type="button"
                  style={styles.statCard}
                  onClick={() => setActive("Orders")}
                >
                  <div style={styles.statIcon}>▣</div>
                  <div style={styles.statLabel}>My Orders</div>
                  <div style={styles.statNumber}>
                    {ordersLoading ? "..." : ordersError ? "!" : orders.length}
                  </div>
                  <div style={styles.statDescription}>
                    {ordersError
                      ? "Unable to load orders"
                      : "Your order history"}
                  </div>
                  <div style={styles.cardLink}>Open orders →</div>
                </button>

                <button
                  type="button"
                  style={styles.statCard}
                  onClick={() => router.push("/ai-chats")}
                >
                  <div style={styles.statIcon}>◉</div>
                  <div style={styles.statLabel}>AI Chats</div>
                  <div style={styles.statNumber}>
                    {chatCount === null ? "..." : chatCount}
                  </div>
                  <div style={styles.statDescription}>
                    {chatError ? "Chat history unavailable" : "Chat history messages"}
                  </div>
                  <div style={styles.cardLink}>Open chats →</div>
                </button>

                <button
                  type="button"
                  style={styles.statCard}
                  onClick={() => setActive("Support Tickets")}
                >
                  <div style={styles.statIcon}>▤</div>
                  <div style={styles.statLabel}>Support Tickets</div>
                  <div style={styles.statNumber}>
                    {ticketsLoading
                      ? "..."
                      : ticketsError
                        ? "!"
                        : tickets.length}
                  </div>
                  <div style={styles.statDescription}>
                    {ticketsError
                      ? "Unable to load tickets"
                      : "Your support requests"}
                  </div>
                  <div style={styles.cardLink}>View tickets →</div>
                </button>
              </div>

              {(ordersError || ticketsError || chatError) && (
                <div style={styles.warningCard}>
                  <strong>Some dashboard data could not be loaded.</strong>
                  <p style={styles.muted}>
                    Check your connection and API authentication, then try
                    refreshing the dashboard.
                  </p>
                  <button
                    type="button"
                    style={styles.secondaryButton}
                    onClick={refreshDashboard}
                  >
                    Try Again
                  </button>
                </div>
              )}

              <div style={styles.infoCard}>
                <h2 style={styles.sectionHeading}>Account Information</h2>

                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Customer name</span>
                  <strong>{user.name}</strong>
                </div>

                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Email address</span>
                  <strong>{user.email}</strong>
                </div>

                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Account type</span>
                  <strong>Customer</strong>
                </div>
              </div>
            </>
          )}

          {/* ORDERS */}
          {active === "Orders" && (
            <>
              <div style={styles.pageIntro}>
                <h1 style={styles.heading}>My Orders</h1>
                <p style={styles.muted}>
                  Only orders linked to your account will appear here.
                </p>
              </div>

              <div style={styles.actionRow}>
                <span style={styles.ordersCount}>
                  {orders.length} order{orders.length === 1 ? "" : "s"}
                </span>
                <button
                  type="button"
                  style={styles.refreshButton}
                  onClick={refreshDashboard}
                >
                  ↻ Refresh orders
                </button>
              </div>

              {ordersLoading && (
                <div style={styles.messageCard}>Loading your orders...</div>
              )}

              {!ordersLoading && ordersError && (
                <div style={styles.errorCard}>
                  <strong>Could not load orders</strong>
                  <p>{ordersError}</p>
                  <p style={styles.helpText}>
                    Confirm that the customer orders route exists on the
                    backend and that your login token is valid.
                  </p>
                  <button
                    type="button"
                    style={styles.primaryButton}
                    onClick={refreshDashboard}
                  >
                    Try Again
                  </button>
                </div>
              )}

              {!ordersLoading && !ordersError && orders.length === 0 && (
                <div style={styles.emptyCard}>
                  <div style={styles.emptyIcon}>▣</div>
                  <h2 style={styles.sectionHeading}>No orders yet</h2>
                  <p style={styles.muted}>
                    There are currently no orders linked to your account.
                  </p>
                </div>
              )}

              {!ordersLoading && !ordersError && orders.length > 0 && (
                <div style={styles.ordersList}>
                  {orders.map((order) => (
                    <article key={order.id} style={styles.orderCard}>
                      <div style={styles.orderTop}>
                        <div>
                          <div style={styles.orderNumber}>
                            {order.order_number || `Order #${order.id}`}
                          </div>
                          <div style={styles.orderDate}>
                            {order.created_at
                              ? new Date(order.created_at).toLocaleDateString()
                              : "Date unavailable"}
                          </div>
                        </div>

                        <span
                          style={{
                            ...styles.statusBadge,
                            ...getStatusStyle(order.status),
                          }}
                        >
                          {order.status || "UNKNOWN"}
                        </span>
                      </div>

                      <div style={styles.orderProduct}>
                        {order.product_name || "Product unavailable"}
                      </div>

                      <div style={styles.orderDetails}>
                        <div>
                          <span style={styles.infoLabel}>Customer</span>
                          <strong>{order.customer_name || user.name}</strong>
                        </div>

                        <div>
                          <span style={styles.infoLabel}>Amount</span>
                          <strong>
                            Rs. {Number(order.amount || 0).toLocaleString()}
                          </strong>
                        </div>

                        <div>
                          <span style={styles.infoLabel}>Tracking number</span>
                          <strong>
                            {order.tracking_number || "Not available"}
                          </strong>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}

          {/* SUPPORT TICKETS */}
          {active === "Support Tickets" && (
            <>
              <div style={styles.pageIntro}>
                <h1 style={styles.heading}>Support Tickets</h1>
                <p style={styles.muted}>
                  Track the status and priority of your support requests.
                </p>
              </div>

              <div style={styles.actionRow}>
                <span style={styles.ordersCount}>
                  {tickets.length} ticket{tickets.length === 1 ? "" : "s"}
                </span>

                <button
                  type="button"
                  style={styles.refreshButton}
                  onClick={refreshDashboard}
                >
                  ↻ Refresh tickets
                </button>
              </div>

              {ticketsLoading && (
                <div style={styles.messageCard}>
                  Loading your support tickets...
                </div>
              )}

              {!ticketsLoading && ticketsError && (
                <div style={styles.errorCard}>
                  <strong>Could not load support tickets</strong>
                  <p>{ticketsError}</p>
                  <button
                    type="button"
                    style={styles.primaryButton}
                    onClick={refreshDashboard}
                  >
                    Try Again
                  </button>
                </div>
              )}

              {!ticketsLoading &&
                !ticketsError &&
                ticketsLoaded &&
                tickets.length === 0 && (
                  <div style={styles.emptyCard}>
                    <div style={styles.emptyIcon}>▤</div>
                    <h2 style={styles.sectionHeading}>
                      No support tickets yet
                    </h2>
                    <p style={styles.muted}>
                      Your support requests will appear here when available.
                    </p>
                    <button
                      type="button"
                      style={styles.primaryButton}
                      onClick={() => router.push("/ai-chats")}
                    >
                      Open AI Support →
                    </button>
                  </div>
                )}

              {!ticketsLoading && !ticketsError && tickets.length > 0 && (
                <div style={styles.ordersList}>
                  {tickets.map((ticket) => (
                    <article key={ticket.id} style={styles.orderCard}>
                      <div style={styles.orderTop}>
                        <div>
                          <div style={styles.orderNumber}>
                            {ticket.ticket_number || `Ticket #${ticket.id}`}
                          </div>
                          <div style={styles.orderDate}>
                            {ticket.created_at
                              ? new Date(ticket.created_at).toLocaleDateString()
                              : "Date unavailable"}
                          </div>
                        </div>

                        <span
                          style={{
                            ...styles.statusBadge,
                            ...getStatusStyle(ticket.status || "OPEN"),
                          }}
                        >
                          {ticket.status || "OPEN"}
                        </span>
                      </div>

                      <div style={styles.orderProduct}>
                        {ticket.subject ||
                          ticket.title ||
                          ticket.message ||
                          ticket.description ||
                          "Support request"}
                      </div>

                      <div style={styles.orderDetails}>
                        <div>
                          <span style={styles.infoLabel}>Priority</span>
                          <strong>{ticket.priority || "Not specified"}</strong>
                        </div>

                        <div>
                          <span style={styles.infoLabel}>Category</span>
                          <strong>{ticket.category || "General"}</strong>
                        </div>

                        <div>
                          <span style={styles.infoLabel}>Ticket ID</span>
                          <strong>#{ticket.id}</strong>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}

          {/* SETTINGS */}
          {active === "Settings" && (
            <>
              <div style={styles.pageIntro}>
                <h1 style={styles.heading}>Settings</h1>
                <p style={styles.muted}>
                  Review your account information and manage your session.
                </p>
              </div>

              <div style={styles.infoCard}>
                <h2 style={styles.sectionHeading}>Profile Information</h2>

                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Full name</span>
                  <strong>{user.name}</strong>
                </div>

                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Email address</span>
                  <strong>{user.email}</strong>
                </div>

                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Account role</span>
                  <strong>Customer</strong>
                </div>

                <p style={styles.helpText}>
                  Profile editing and password changes are not available
                  here yet.
                </p>

                <button
                  type="button"
                  style={styles.primaryButton}
                  onClick={handleLogout}
                  disabled={loggingOut}
                >
                  {loggingOut ? "Logging out..." : "Log out"}
                </button>
              </div>
            </>
          )}

          {/* AI AUTOMATION */}
          {active === "AI Automation" && (
            <div style={styles.comingSoonCard}>
              <div style={styles.emptyIcon}>✳</div>
              <h1 style={styles.heading}>AI Automation</h1>
              <p style={styles.muted}>
                This section needs verified automation workflows and
                backend endpoints before it can display live information.
              </p>
              <button
                type="button"
                style={styles.primaryButton}
                onClick={() => router.push("/ai-chats")}
              >
                Open AI Support →
              </button>
            </div>
          )}

          {/* REPORTS */}
          {active === "Reports" && (
            <div style={styles.comingSoonCard}>
              <div style={styles.emptyIcon}>▥</div>
              <h1 style={styles.heading}>Reports</h1>
              <p style={styles.muted}>
                Reports will be available after the required reporting
                API and metrics have been verified.
              </p>
              <button
                type="button"
                style={styles.primaryButton}
                onClick={() => setActive("Overview")}
              >
                ← Back to Overview
              </button>
            </div>
          )}

          {/* ACTIVITY LOGS */}
          {active === "Activity Logs" && (
            <div style={styles.comingSoonCard}>
              <div style={styles.emptyIcon}>◷</div>
              <h1 style={styles.heading}>Activity Logs</h1>
              <p style={styles.muted}>
                Activity logs will be connected when a customer-authorized
                activity history API is available.
              </p>
              <button
                type="button"
                style={styles.primaryButton}
                onClick={() => setActive("Overview")}
              >
                ← Back to Overview
              </button>
            </div>
          )}

          <footer style={styles.footer}>
            SupportPilot AI · Customer Portal
          </footer>
        </section>
      </main>
    </div>
  );
}

function getStatusStyle(status?: string): React.CSSProperties {
  const normalized = (status || "").toUpperCase();

  if (
    normalized.includes("RESOLVED") ||
    normalized.includes("DELIVERED") ||
    normalized.includes("COMPLETED")
  ) {
    return {
      background: "#e8f8ef",
      color: "#21834e",
    };
  }

  if (
    normalized.includes("CANCELLED") ||
    normalized.includes("FAILED")
  ) {
    return {
      background: "#fff0f0",
      color: "#c24141",
    };
  }

  if (
    normalized.includes("HIGH") ||
    normalized.includes("URGENT") ||
    normalized.includes("OPEN")
  ) {
    return {
      background: "#fff4e5",
      color: "#a15c07",
    };
  }

  return {
    background: "#eeedff",
    color: "#5145e5",
  };
}

const styles: Record<string, React.CSSProperties> = {
  loadingPage: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f5f7fb",
    padding: 24,
    fontFamily: "Arial, sans-serif",
  },
  loadingCard: {
    background: "#ffffff",
    padding: "24px 32px",
    borderRadius: 14,
    color: "#475569",
  },
  layout: {
    minHeight: "100vh",
    display: "flex",
    background: "#f5f7fb",
    color: "#172033",
    fontFamily: "Arial, Helvetica, sans-serif",
  },
  sidebar: {
    width: 250,
    minWidth: 230,
    minHeight: "100vh",
    background: "#ffffff",
    borderRight: "1px solid #e8edf4",
    display: "flex",
    flexDirection: "column",
    padding: "25px 16px",
    boxSizing: "border-box",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 11,
    padding: "0 8px 32px",
  },
  brandIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    background: "#4f46e5",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 23,
    fontWeight: 800,
    flexShrink: 0,
  },
  brandName: {
    fontSize: 17,
    display: "block",
  },
  brandSubtitle: {
    color: "#8490a5",
    fontSize: 11,
    marginTop: 4,
  },
  menuLabel: {
    color: "#9aa4b5",
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: 700,
    padding: "0 12px 12px",
  },
  navigation: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
  },
  menuButton: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    width: "100%",
    border: "none",
    borderRadius: 9,
    padding: "12px 13px",
    textAlign: "left",
    background: "transparent",
    color: "#68758b",
    cursor: "pointer",
    fontSize: 13,
  },
  activeMenuButton: {
    background: "#eeedff",
    color: "#4f46e5",
    fontWeight: 700,
  },
  menuIcon: {
    width: 18,
    textAlign: "center",
    fontSize: 17,
    flexShrink: 0,
  },
  activeDot: {
    marginLeft: "auto",
    fontSize: 8,
  },
  sidebarBottom: {
    marginTop: "auto",
    paddingTop: 25,
  },
  profile: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "15px 6px",
    borderTop: "1px solid #edf0f5",
  },
  avatar: {
    width: 38,
    height: 38,
    minWidth: 38,
    borderRadius: 12,
    background: "#e7e8ff",
    color: "#4f46e5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: 13,
    flexShrink: 0,
  },
  profileDetails: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 5,
  },
  profileName: {
    fontSize: 12,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  profileRole: {
    fontSize: 11,
    color: "#8b95a7",
  },
  logoutButton: {
    width: "100%",
    padding: 11,
    border: "1px solid #e8edf4",
    borderRadius: 9,
    background: "#ffffff",
    color: "#c24141",
    cursor: "pointer",
    textAlign: "left",
    fontSize: 13,
  },
  main: {
    flex: 1,
    minWidth: 0,
  },
  topbar: {
    minHeight: 76,
    padding: "16px 32px",
    background: "#ffffff",
    borderBottom: "1px solid #e8edf4",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    boxSizing: "border-box",
  },
  breadcrumb: {
    color: "#97a1b1",
    fontSize: 11,
    marginBottom: 6,
  },
  topbarTitle: {
    fontWeight: 700,
    fontSize: 17,
  },
  topbarRight: {
    display: "flex",
    alignItems: "center",
    gap: 13,
  },
  topbarEmail: {
    fontSize: 12,
    color: "#68758b",
    overflowWrap: "anywhere",
    textAlign: "right",
  },
  content: {
    padding: "30px 32px",
    maxWidth: 1400,
    margin: "0 auto",
    boxSizing: "border-box",
    width: "100%",
  },
  welcomeCard: {
    background: "linear-gradient(120deg, #ffffff, #eeedff)",
    border: "1px solid #e4e4ff",
    borderRadius: 18,
    padding: 30,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 20,
  },
  eyebrow: {
    color: "#6257df",
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: 800,
    marginBottom: 12,
  },
  heading: {
    fontSize: 27,
    lineHeight: 1.3,
    margin: "0 0 10px",
    color: "#172033",
    overflowWrap: "anywhere",
  },
  muted: {
    color: "#7b879b",
    fontSize: 13,
    lineHeight: 1.7,
  },
  welcomeIcon: {
    fontSize: 58,
    color: "#7c72ef",
    padding: "0 15px",
    flexShrink: 0,
  },
  primaryButton: {
    marginTop: 15,
    border: "none",
    borderRadius: 9,
    padding: "12px 17px",
    background: "#5145e5",
    color: "#ffffff",
    fontWeight: 700,
    fontSize: 12,
    cursor: "pointer",
  },
  secondaryButton: {
    marginTop: 15,
    marginLeft: 10,
    border: "1px solid #dce2ec",
    borderRadius: 9,
    padding: "12px 17px",
    background: "#ffffff",
    color: "#334155",
    cursor: "pointer",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    marginTop: 30,
    marginBottom: 17,
  },
  sectionHeading: {
    fontSize: 17,
    margin: "0 0 17px",
  },
  refreshButton: {
    border: "1px solid #e0e5ef",
    borderRadius: 8,
    padding: "9px 12px",
    background: "#ffffff",
    color: "#5145e5",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 700,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 17,
    marginBottom: 27,
  },
  statCard: {
    textAlign: "left",
    background: "#ffffff",
    border: "1px solid #e8edf4",
    borderRadius: 14,
    padding: 21,
    cursor: "pointer",
    color: "#172033",
    minWidth: 0,
  },
  statIcon: {
    width: 39,
    height: 39,
    borderRadius: 11,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#eeedff",
    color: "#5145e5",
    fontSize: 21,
    marginBottom: 17,
  },
  statLabel: {
    fontWeight: 700,
    fontSize: 14,
    marginBottom: 7,
  },
  statNumber: {
    fontSize: 27,
    fontWeight: 800,
    marginBottom: 7,
    color: "#172033",
  },
  statDescription: {
    color: "#8792a5",
    fontSize: 12,
    overflowWrap: "anywhere",
  },
  cardLink: {
    color: "#5145e5",
    fontSize: 12,
    marginTop: 20,
    fontWeight: 700,
  },
  infoCard: {
    background: "#ffffff",
    border: "1px solid #e8edf4",
    borderRadius: 14,
    padding: 24,
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 18,
    flexWrap: "wrap",
    padding: "15px 0",
    borderTop: "1px solid #edf0f5",
    fontSize: 12,
  },
  infoLabel: {
    color: "#8792a5",
    fontSize: 12,
    display: "block",
    marginBottom: 7,
  },
  pageIntro: {
    marginBottom: 25,
  },
  actionRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 18,
  },
  messageCard: {
    background: "#ffffff",
    border: "1px solid #e8edf4",
    borderRadius: 14,
    padding: 30,
    color: "#68758b",
  },
  errorCard: {
    background: "#fffafa",
    border: "1px solid #f3d5d5",
    borderRadius: 14,
    padding: 25,
    color: "#9f3434",
    overflowWrap: "anywhere",
  },
  warningCard: {
    background: "#fffbeb",
    border: "1px solid #f5e4b3",
    borderRadius: 14,
    padding: 20,
    marginBottom: 25,
    color: "#854d0e",
  },
  helpText: {
    color: "#8b6262",
    fontSize: 12,
    lineHeight: 1.7,
  },
  emptyCard: {
    background: "#ffffff",
    border: "1px solid #e8edf4",
    borderRadius: 14,
    padding: "45px 20px",
    textAlign: "center",
  },
  emptyIcon: {
    fontSize: 35,
    color: "#7165e8",
    marginBottom: 15,
  },
  ordersList: {
    display: "flex",
    flexDirection: "column",
    gap: 15,
  },
  ordersCount: {
    color: "#8792a5",
    fontSize: 12,
  },
  orderCard: {
    background: "#ffffff",
    border: "1px solid #e8edf4",
    borderRadius: 14,
    padding: 22,
    minWidth: 0,
  },
  orderTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 15,
    flexWrap: "wrap",
    paddingBottom: 18,
    borderBottom: "1px solid #edf0f5",
  },
  orderNumber: {
    fontWeight: 800,
    fontSize: 14,
    overflowWrap: "anywhere",
  },
  orderDate: {
    color: "#8792a5",
    fontSize: 11,
    marginTop: 7,
  },
  statusBadge: {
    display: "inline-block",
    borderRadius: 20,
    background: "#e8f8ef",
    color: "#21834e",
    padding: "7px 12px",
    fontSize: 11,
    fontWeight: 700,
    overflowWrap: "anywhere",
  },
  orderProduct: {
    fontSize: 16,
    fontWeight: 700,
    margin: "20px 0",
    overflowWrap: "anywhere",
  },
  orderDetails: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 20,
    fontSize: 12,
    overflowWrap: "anywhere",
  },
  comingSoonCard: {
    background: "#ffffff",
    border: "1px solid #e8edf4",
    borderRadius: 16,
    padding: "45px 30px",
    textAlign: "center",
  },
  footer: {
    color: "#9aa4b5",
    fontSize: 11,
    textAlign: "center",
    padding: "35px 0 5px",
  },
};

