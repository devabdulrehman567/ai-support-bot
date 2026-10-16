
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Customer = {
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

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (!token || !savedUser) {
      router.replace("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(savedUser);

      if (!parsedUser.name || !parsedUser.email) {
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

  useEffect(() => {
    if (active !== "Orders" || authChecking) {
      return;
    }

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

        const data = await response.json();

        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.replace("/login");
          return;
        }

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to load your orders.");
        }

        setOrders(data.orders || []);
      } catch (error) {
        setOrdersError(
          error instanceof Error
            ? error.message
            : "Unable to connect to the server."
        );
      } finally {
        setOrdersLoading(false);
      }
    };

    loadOrders();
  }, [active, authChecking, router]);

  const handleLogout = async () => {
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
      // The local session will still be cleared.
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.replace("/login");
    }
  };

  const initials = user?.name
    ? user.name
        .trim()
        .split(/\s+/)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "CU";

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
  onClick={() => {
    if (item === "AI Chats") {
      router.push("/ai-chats");
      return;
    }

    setActive(item);
  }}
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
              {active === item && <span style={styles.activeDot}>●</span>}
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

          <button onClick={handleLogout} style={styles.logoutButton}>
            ↪ Log out
          </button>
        </div>
      </aside>

      <main style={styles.main}>
        <header style={styles.topbar}>
          <div>
            <div style={styles.breadcrumb}>Workspace / {active}</div>
            <div style={styles.topbarTitle}>{active}</div>
          </div>

          <div style={styles.topbarRight}>
            <div style={styles.topbarEmail}>{user.email}</div>
            <div style={styles.avatar}>{initials}</div>
          </div>
        </header>

        <section style={styles.content}>
          {active === "Overview" && (
            <>
              <div style={styles.welcomeCard}>
                <div>
                  <div style={styles.eyebrow}>CUSTOMER DASHBOARD</div>
                  <h1 style={styles.heading}>Welcome, {user.name}!</h1>
                  <p style={styles.muted}>
                    Manage your orders and keep track of your support requests.
                  </p>
                  <button
                    style={styles.primaryButton}
                    onClick={() => setActive("Orders")}
                  >
                    View My Orders →
                  </button>
                </div>
                <div style={styles.welcomeIcon}>✦</div>
              </div>

              <h2 style={styles.sectionHeading}>Your Workspace</h2>

              <div style={styles.statsGrid}>
                <button
                  style={styles.statCard}
                  onClick={() => setActive("Orders")}
                >
                  <div style={styles.statIcon}>▣</div>
                  <div style={styles.statLabel}>My Orders</div>
                  <div style={styles.statDescription}>
                    View your order history
                  </div>
                  <div style={styles.cardLink}>Open orders →</div>
                </button>

                <button
                  style={styles.statCard}
                  onClick={() => setActive("AI Chats")}
                >
                  <div style={styles.statIcon}>◉</div>
                  <div style={styles.statLabel}>AI Chats</div>
                  <div style={styles.statDescription}>
                    Chat with AI support
                  </div>
                  <div style={styles.cardLink}>Open chats →</div>
                </button>

                <button
                  style={styles.statCard}
                  onClick={() => setActive("Support Tickets")}
                >
                  <div style={styles.statIcon}>▤</div>
                  <div style={styles.statLabel}>Support Tickets</div>
                  <div style={styles.statDescription}>
                    View support requests
                  </div>
                  <div style={styles.cardLink}>View tickets →</div>
                </button>
              </div>

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

          {active === "Orders" && (
            <>
              <div style={styles.pageIntro}>
                <h1 style={styles.heading}>My Orders</h1>
                <p style={styles.muted}>
                  Only orders linked to your account will appear here.
                </p>
              </div>

              {ordersLoading && (
                <div style={styles.messageCard}>Loading your orders...</div>
              )}

              {!ordersLoading && ordersError && (
                <div style={styles.errorCard}>
                  <strong>Could not load orders</strong>
                  <p>{ordersError}</p>
                  <p style={styles.helpText}>
                    Check that the customer orders API route has been added to
                    your Laravel backend.
                  </p>
                  <button
                    style={styles.primaryButton}
                    onClick={() => setActive("Overview")}
                  >
                    Back to Overview
                  </button>
                  <button
                    style={styles.secondaryButton}
                    onClick={() => setActive("Orders")}
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
                  <div style={styles.ordersCount}>
                    {orders.length} order{orders.length === 1 ? "" : "s"} found
                  </div>

                  {orders.map((order) => (
                    <article key={order.id} style={styles.orderCard}>
                      <div style={styles.orderTop}>
                        <div>
                          <div style={styles.orderNumber}>
                            {order.order_number}
                          </div>
                          <div style={styles.orderDate}>
                            {order.created_at
                              ? new Date(order.created_at).toLocaleDateString()
                              : "Date unavailable"}
                          </div>
                        </div>
                        <span style={styles.statusBadge}>
                          {order.status}
                        </span>
                      </div>

                      <div style={styles.orderProduct}>{order.product_name}</div>

                      <div style={styles.orderDetails}>
                        <div>
                          <span style={styles.infoLabel}>Customer</span>
                          <strong>{order.customer_name}</strong>
                        </div>
                        <div>
                          <span style={styles.infoLabel}>Amount</span>
                          <strong>
                            Rs. {Number(order.amount).toLocaleString()}
                          </strong>
                        </div>
                        <div>
                          <span style={styles.infoLabel}>Tracking number</span>
                          <strong>{order.tracking_number || "Not available"}</strong>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}

          {active !== "Overview" && active !== "Orders" && (
            <div style={styles.comingSoonCard}>
              <div style={styles.emptyIcon}>✳</div>
              <h1 style={styles.heading}>{active}</h1>
              <p style={styles.muted}>
                This section is not connected yet. We can build it in the next
                step.
              </p>
              <button
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
  },
  brandName: { fontSize: 17, display: "block" },
  brandSubtitle: { color: "#8490a5", fontSize: 11, marginTop: 4 },
  menuLabel: {
    color: "#9aa4b5",
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: 700,
    padding: "0 12px 12px",
  },
  navigation: { display: "flex", flexDirection: "column", gap: 5 },
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
  menuIcon: { width: 18, textAlign: "center", fontSize: 17 },
  activeDot: { marginLeft: "auto", fontSize: 8 },
  sidebarBottom: { marginTop: "auto", paddingTop: 25 },
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
  profileRole: { fontSize: 11, color: "#8b95a7" },
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
  main: { flex: 1, minWidth: 0 },
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
  breadcrumb: { color: "#97a1b1", fontSize: 11, marginBottom: 6 },
  topbarTitle: { fontWeight: 700, fontSize: 17 },
  topbarRight: { display: "flex", alignItems: "center", gap: 13 },
  topbarEmail: {
    fontSize: 12,
    color: "#68758b",
    overflowWrap: "anywhere",
    textAlign: "right",
  },
  content: { padding: "30px 32px", maxWidth: 1400, margin: "0 auto" },
  welcomeCard: {
    background: "linear-gradient(120deg, #ffffff, #eeedff)",
    border: "1px solid #e4e4ff",
    borderRadius: 18,
    padding: "30px",
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
  muted: { color: "#7b879b", fontSize: 13, lineHeight: 1.7 },
  welcomeIcon: {
    fontSize: 58,
    color: "#7c72ef",
    padding: "0 15px",
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
  sectionHeading: { fontSize: 17, margin: "0 0 17px" },
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
  statLabel: { fontWeight: 700, fontSize: 14, marginBottom: 7 },
  statDescription: { color: "#8792a5", fontSize: 12 },
  cardLink: { color: "#5145e5", fontSize: 12, marginTop: 20, fontWeight: 700 },
  infoCard: {
    background: "#ffffff",
    border: "1px solid #e8edf4",
    borderRadius: 14,
    padding: 24,
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 18,
    flexWrap: "wrap",
    padding: "15px 0",
    borderTop: "1px solid #edf0f5",
    fontSize: 12,
  },
  infoLabel: { color: "#8792a5", fontSize: 12, display: "block", marginBottom: 7 },
  pageIntro: { marginBottom: 25 },
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
  helpText: { color: "#8b6262", fontSize: 12, lineHeight: 1.7 },
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
  ordersList: { display: "flex", flexDirection: "column", gap: 15 },
  ordersCount: { color: "#8792a5", fontSize: 12 },
  orderCard: {
    background: "#ffffff",
    border: "1px solid #e8edf4",
    borderRadius: 14,
    padding: 22,
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
  orderNumber: { fontWeight: 800, fontSize: 14 },
  orderDate: { color: "#8792a5", fontSize: 11, marginTop: 7 },
  statusBadge: {
    borderRadius: 20,
    background: "#e8f8ef",
    color: "#21834e",
    padding: "7px 12px",
    fontSize: 11,
    fontWeight: 700,
  },
  orderProduct: { fontSize: 16, fontWeight: 700, margin: "20px 0" },
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
