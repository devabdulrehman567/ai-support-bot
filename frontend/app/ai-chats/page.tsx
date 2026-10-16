"use client";

import "../globals.css";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Classification = {
  category: string;
  priority: string;
  action: string;
  reason: string;
  answer: string;
};

type Ticket = {
  id: number;
  customer_message: string;
  category: string;
  priority: string;
  action: string;
  ai_reason: string;
  status: string;
  created_at?: string;
};

type Order = {
  id: number;
  order_number: string;
  customer_name: string;
  product_name: string;
  amount: string;
  status: string;
  tracking_number: string | null;
  created_at: string;
  updated_at: string;
};

export default function Home() {
  const [input, setInput] = useState("");

  const router = useRouter();
const [authChecking, setAuthChecking] = useState(true);

useEffect(() => {
  const token = localStorage.getItem("token");

  if (!token) {
    router.replace("/login");
  } else {
    setAuthChecking(false);
  }
}, [router]);

  const [classification, setClassification] =
    useState<Classification | null>(null);

  const [ticket, setTicket] = useState<Ticket | null>(null);

  const [order, setOrder] = useState<Order | null>(null);

  const [tickets, setTickets] = useState<Ticket[]>([]);

  type ChatMessage = {
  id: number;
  customer_message: string;
  ai_response: string | null;
  category: string;
  priority: string;
  action: string;
  created_at: string;
};

const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  const totalTickets = tickets.length;

const openTickets = tickets.filter(
  (ticket) => ticket.status === "OPEN"
).length;

const inProgressTickets = tickets.filter(
  (ticket) => ticket.status === "IN PROGRESS"
).length;

const resolvedTickets = tickets.filter(
  (ticket) => ticket.status === "RESOLVED"
).length;

const totalChats = chatHistory.length;

const faqChats = chatHistory.filter(
  (chat) => chat.category === "FAQ"
).length;

const orderChats = chatHistory.filter(
  (chat) => chat.category === "ORDER"
).length;

  const [faqAnswer, setFaqAnswer] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Load Tickets
  |--------------------------------------------------------------------------
  */

 
const loadTickets = async () => {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/login");
      return;
    }

    const response = await fetch(
      "/backend-api/tickets",
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      setError(data.message || "Could not load support tickets.");
      return;
    }

    if (data.success) {
      setTickets(data.tickets);
    }
  } catch {
    setError("Could not connect to the backend.");
  }
};

const updateTicketStatus = async (
  ticketId: number,
  status: string
) => {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/login");
      return;
    }

    const response = await fetch(
      `/backend-api/tickets/${ticketId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      setError(data.message || "Could not update ticket status.");
      return;
    }

    setError("");
    await loadTickets();
  } catch {
    setError("Could not connect to the backend.");
  }
};

const loadChatHistory = async () => {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/login");
      return;
    }

    const response = await fetch(
      "/backend-api/chat-history",
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      setError(data.message || "Could not load chat history.");
      return;
    }

    if (data.success) {
      setChatHistory(data.messages);
    }
  } catch {
    setError("Could not connect to the backend.");
  }
};

/*
|--------------------------------------------------------------------------
| Load tickets and chat history when the page opens
|--------------------------------------------------------------------------
*/

useEffect(() => {
  if (authChecking) return;

  const loadInitialData = async () => {
    await Promise.all([
      loadTickets(),
      loadChatHistory(),
    ]);
  };

  loadInitialData();
}, [authChecking]);

/*
|--------------------------------------------------------------------------
| Send Customer Message
|--------------------------------------------------------------------------
*/

const sendMessage = async () => {
  if (!input.trim() || loading) return;

  const token = localStorage.getItem("token");

  if (!token) {
    router.replace("/login");
    return;
  }

  setLoading(true);
  setError("");
  setClassification(null);
  setTicket(null);
  setOrder(null);
  setFaqAnswer("");

  try {
    const response = await fetch(
      "/backend-api/classify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: input.trim(),
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      setError(data.message || "AI could not analyze the message.");
      return;
    }

    setClassification(data.classification);
    setTicket(data.ticket || null);
    setOrder(data.order || null);

    if (data.classification?.action === "ANSWER_FAQ") {
      setFaqAnswer(data.classification.answer || "");
    }

    await Promise.all([
      loadChatHistory(),
      data.ticket ? loadTickets() : Promise.resolve(),
    ]);

    setInput("");
  } catch {
    setError("Could not connect to the backend.");
  } finally {
    setLoading(false);
  }
};

/*
|--------------------------------------------------------------------------
| Priority Badge
|--------------------------------------------------------------------------
*/

const getPriorityClass = (priority: string) => {
  if (priority === "HIGH") {
    return "bg-red-100 text-red-700";
  }

  if (priority === "MEDIUM") {
    return "bg-yellow-100 text-yellow-700";
  }

  return "bg-green-100 text-green-700";
};

const getCategoryClass = (category: string) => {
  if (category === "COMPLAINT") {
    return "bg-red-100 text-red-700";
  }

  if (category === "ORDER") {
    return "bg-blue-100 text-blue-700";
  }

  return "bg-purple-100 text-purple-700";
};

const getActionClass = (action: string) => {
  if (action === "CREATE_TICKET") {
    return "bg-red-100 text-red-700";
  }

  if (action === "CHECK_ORDER") {
    return "bg-blue-100 text-blue-700";
  }

  return "bg-green-100 text-green-700";
};

if (authChecking) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
      Checking your workspace...
    </div>
  );
}

const badge = (value: string, color: string) => (
  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${color}`}>
    {value}
  </span>
);

return (
  <main className="ai-chats-test min-h-screen bg-[#f5f7fb] text-slate-800">
    <div className="flex min-h-screen">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">
            AI
          </div>
          <div>
            <h2>SupportPilot</h2>
          <span>Customer workspace</span>
          </div>
        </div>

        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">
          Workspace
        </p>

        <nav className="sidebar-nav">
         <a href="/dashboard" className="nav-item">
 
  Dashboard
</a>
          <div className="nav-item active">
  
  AI Customer Chats
</div>
      
        </nav>

        <div className="mt-auto rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-sm font-semibold">AI Assistant</p>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            Analyze customer messages and identify the next support action.
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Workspace ready
          </div>
        </div>
      </aside>

      <section className="dashboard-main min-w-0">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-5 sm:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
              Customer operations
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
              AI Support Center
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Analyze messages, review orders and manage support activity.
            </p>
          </div>
          <a href="/dashboard" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold shadow-sm transition hover:bg-slate-50">
            Back to Dashboard
          </a>
        </header>

        <div className="mx-auto max-w-7xl space-y-7 p-4 sm:p-8">
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {[
              { label: "Total Tickets", value: totalTickets, note: "Recorded support cases" },
              { label: "Open Tickets", value: openTickets, note: "Awaiting resolution" },
              { label: "In Progress", value: inProgressTickets, note: "Being handled" },
              { label: "AI Conversations", value: totalChats, note: "Saved conversations" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950">{stat.value}</p>
                <p className="mt-2 text-xs text-slate-400">{stat.note}</p>
              </div>
            ))}
          </div>

          <div className="grid items-start gap-7 xl:grid-cols-[1.15fr_0.85fr]">
            <section id="recent-tickets" className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-gradient-to-r from-blue-700 to-indigo-700 p-6 text-white sm:p-8">
                <div className="mb-4 inline-flex rounded-lg bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                  AI message analyzer
                </div>
                <h2 className="text-2xl font-bold">How can we help your customer?</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100">
                  Enter a customer message. The AI will classify the request and identify the appropriate action.
                </p>
              </div>

              <div className="p-5 sm:p-8">
                <label htmlFor="customer-message" className="mb-3 block text-sm font-bold text-slate-800">
                  Customer message
                </label>
                <textarea
                  id="customer-message"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      void sendMessage();
                    }
                  }}
                  placeholder="Example: Where is my order ORD-123?"
                  className="min-h-44 w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-slate-400">Tip: Press Ctrl + Enter to analyze</p>
                  <span className="text-xs text-slate-400">{input.length} characters</span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    "Where is my order ORD-123?",
                    "What is your refund policy?",
                    "My product arrived damaged.",
                  ].map((example) => (
                    <button
                      key={example}
                      type="button"
                      onClick={() => setInput(example)}
                      className="rounded-full border border-slate-200 px-3 py-2 text-left text-xs font-medium text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                    >
                      {example}
                    </button>
                  ))}
                </div>

                {error && (
                  <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => void sendMessage()}
                  disabled={loading || !input.trim()}
                  className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl bg-blue-600 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Analyzing customer message..." : "Analyze Message"}
                  {!loading && <span aria-hidden="true">→</span>}
                </button>
              </div>
            </section>

            <div className="space-y-6">
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-blue-600">AI result</p>
                    <h2 className="mt-1 text-xl font-bold text-slate-950">Message analysis</h2>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 font-black text-indigo-700">AI</div>
                </div>

                {!classification && !loading && (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white font-bold text-blue-600 shadow-sm">AI</div>
                    <p className="mt-4 font-semibold text-slate-700">No analysis yet</p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Submit a customer message to see its category, priority and recommended action here.
                    </p>
                  </div>
                )}

                {loading && (
                  <div className="rounded-2xl bg-blue-50 p-6 text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
                    <p className="mt-4 text-sm font-semibold text-blue-800">Analyzing message</p>
                    <p className="mt-1 text-xs text-blue-600">Please wait for the result.</p>
                  </div>
                )}

                {classification && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold text-slate-500">Category</p>
                        <div className="mt-2">{badge(classification.category, getCategoryClass(classification.category))}</div>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold text-slate-500">Priority</p>
                        <div className="mt-2">{badge(classification.priority, getPriorityClass(classification.priority))}</div>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold text-slate-500">Action</p>
                        <div className="mt-2 break-words">{badge(classification.action, getActionClass(classification.action))}</div>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">AI reasoning</p>
                      <p className="mt-2 text-sm leading-7 text-slate-700">{classification.reason}</p>
                    </div>
                  </div>
                )}
              </section>

              {faqAnswer && classification?.action === "ANSWER_FAQ" && (
                <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">AI response</p>
                  <h2 className="mt-2 text-xl font-bold text-emerald-950">Suggested answer</h2>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-emerald-900">{faqAnswer}</p>
                </section>
              )}

              {order && classification?.action === "CHECK_ORDER" && (
                <section className="rounded-3xl border border-blue-200 bg-white p-6 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Order lookup</p>
                  <h2 className="mt-2 text-xl font-bold text-slate-950">{order.order_number}</h2>
                  <div className="mt-5 grid grid-cols-2 gap-4">
                    <div><p className="text-xs text-slate-500">Customer</p><p className="mt-1 font-semibold">{order.customer_name}</p></div>
                    <div><p className="text-xs text-slate-500">Product</p><p className="mt-1 font-semibold">{order.product_name}</p></div>
                    <div><p className="text-xs text-slate-500">Amount</p><p className="mt-1 font-semibold">Rs. {order.amount}</p></div>
                    <div><p className="text-xs text-slate-500">Status</p><div className="mt-1">{badge(order.status, "bg-blue-100 text-blue-700")}</div></div>
                  </div>
                  {order.tracking_number && (
                    <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm">
                      <span className="text-slate-500">Tracking number: </span>
                      <span className="font-semibold">{order.tracking_number}</span>
                    </div>
                  )}
                </section>
              )}

              {ticket && (
                <section className="rounded-3xl border border-amber-200 bg-white p-6 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-widest text-amber-600">Support case</p>
                  <h2 className="mt-2 text-xl font-bold text-slate-950">Ticket #{ticket.id}</h2>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {badge(ticket.status, "bg-amber-100 text-amber-800")}
                    {badge(ticket.priority, getPriorityClass(ticket.priority))}
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-600">{ticket.customer_message}</p>
                  <div className="mt-4 rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">AI reasoning</p>
                    <p className="mt-2 text-sm leading-6">{ticket.ai_reason}</p>
                  </div>
                </section>
              )}
            </div>
          </div>

          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5 sm:p-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Support operations</p>
                <h2 className="mt-1 text-xl font-bold text-slate-950">Recent support tickets</h2>
                <p className="mt-1 text-sm text-slate-500">Tickets retrieved from your backend.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">{tickets.length} total</span>
            </div>

            {tickets.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">No support tickets to display.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {tickets.map((item) => (
                  <article key={item.id} className="p-5 transition hover:bg-slate-50 sm:px-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900">Ticket #{item.id}</span>
                        {badge(item.category, getCategoryClass(item.category))}
                        {badge(item.priority, getPriorityClass(item.priority))}
                      </div>
                      {badge(item.status, "bg-slate-100 text-slate-700")}
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-700">{item.customer_message}</p>
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                      <span>Action: <strong className="text-slate-700">{item.action}</strong></span>
                      {item.created_at && <span>{new Date(item.created_at).toLocaleString()}</span>}
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-500">{item.ai_reason}</p>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5 sm:p-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Conversation records</p>
                <h2 className="mt-1 text-xl font-bold text-slate-950">Chat history</h2>
                <p className="mt-1 text-sm text-slate-500">Previously recorded customer messages and AI responses.</p>
              </div>
              <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">{totalChats} conversations</span>
            </div>

            {chatHistory.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">No saved conversations yet.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {chatHistory.map((chat) => (
                  <article key={chat.id} className="p-5 sm:px-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="text-xs font-semibold text-slate-400">
                        {chat.created_at ? new Date(chat.created_at).toLocaleString() : "Previous conversation"}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {badge(chat.category, getCategoryClass(chat.category))}
                        {badge(chat.priority, getPriorityClass(chat.priority))}
                      </div>
                    </div>
                    <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Customer message</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-800">{chat.customer_message}</p>
                    </div>
                    <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-blue-700">AI response</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{chat.ai_response || "No AI response available."}</p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <footer className="pb-4 text-center text-xs text-slate-400">
            SupportPilot AI · Customer Support Workspace
          </footer>
        </div>
      </section>
    </div>
  </main>
);
}
