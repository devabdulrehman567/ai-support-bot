"use client";

import { useEffect, useState } from "react";

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
      const response = await fetch(
        "https://ai-support-bot.wokku.app/api/tickets"
      );

      const data = await response.json();

      if (data.success) {
        setTickets(data.tickets);
      }
    } catch {
  setError("Backend se connection nahi ho raha.");
  }
  };
  

  const updateTicketStatus = async (
  ticketId: number,
  status: string
) => {
  try {
    const response = await fetch(
      `https://ai-support-bot.wokku.app/api/tickets/${ticketId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: status,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      setError("Ticket status update nahi ho saka.");
      return;
    }

    // Dashboard ko fresh data do
    loadTickets();

  } catch {
  setError("Backend se connection nahi ho raha.");
}
};


const loadChatHistory = async () => {
  try {
    const response = await fetch(
      "https://ai-support-bot.wokku.app/api/chat-history"
    );

    const data = await response.json();

    if (data.success) {
      setChatHistory(data.messages);
    }
  } catch {
  setError("Backend se connection nahi ho raha.");
}
};
  /*
  |--------------------------------------------------------------------------
  | Load tickets when page opens
  |--------------------------------------------------------------------------
  */
useEffect(() => {
  const loadInitialData = async () => {
    await Promise.all([
      loadTickets(),
      loadChatHistory(),
    ]);
  };

  loadInitialData();
}, []);

  /*
  |--------------------------------------------------------------------------
  | Send Customer Message
  |--------------------------------------------------------------------------
  */

  const sendMessage = async () => {
    if (!input.trim()) return;

    setLoading(true);
    setError("");

    setClassification(null);
    setTicket(null);
    setOrder(null);
    setFaqAnswer("");

    try {
      const response = await fetch(
         "https://ai-support-bot.wokku.app/api/classify",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            message: input,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError("AI se response nahi mila.");
        return;
      }

      setClassification(data.classification);

      setTicket(data.ticket);

      /*
      |--------------------------------------------------------------------------
      | Order
      |--------------------------------------------------------------------------
      */

      if (
        data.classification?.action === "CHECK_ORDER" &&
        data.order
      ) {
        setOrder(data.order);
      }

      /*
      |--------------------------------------------------------------------------
      | FAQ
      |--------------------------------------------------------------------------
      */

      if (
        data.classification?.action === "ANSWER_FAQ"
      ) {
        setFaqAnswer(
          data.classification?.answer || ""
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Refresh Tickets
      |--------------------------------------------------------------------------
      */

      loadChatHistory();

if (data.ticket) {
  loadTickets();
}

    } catch {
  setError("Backend se connection nahi ho raha.");
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
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6">

      <div className="mx-auto max-w-7xl">

        {/* ============================================================= */}
        {/* Header */}
        {/* ============================================================= */}

        <div className="mb-8 text-center">

          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
  AI Support Bot 🤖
</h1>

          <p className="mt-1 text-sm text-gray-500">
  AI Customer Support Automation
</p>

        </div>


        {/* ============================================================= */}
        {/* Customer Message */}
        {/* ============================================================= */}

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <h2 className="mb-3 text-xl font-semibold">
            Customer Message
          </h2>

          <textarea
            value={input}
            onChange={(e) =>
              setInput(e.target.value)
            }
            placeholder="Example: Mera order ORD-123 kahan hai?"
            className="mt-3 w-full rounded-2xl border border-gray-200 bg-white px-4 py-4 text-sm text-gray-800 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
          />

          <button
            onClick={sendMessage}
            disabled={loading}
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Analyzing... 🤖" : "Analyze Message 🤖"}
          </button>


          {/* Error */}

          {error && (
            <div className="mt-4 rounded-lg bg-red-100 p-4 text-red-700">
              {error}
            </div>
          )}


          {/* ========================================================= */}
          {/* AI Analysis */}
          {/* ========================================================= */}

          {classification && (

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

              <h2 className="mb-4 text-xl font-bold">
                AI Analysis 🧠
              </h2>

              <div className="grid gap-3 sm:grid-cols-3">

                <div className="rounded-lg bg-white p-4 shadow-sm">

                  <p className="text-sm font-medium text-gray-500">
                    Category
                  </p>

                  <span
  className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-bold ${getCategoryClass(
    classification.category
  )}`}
>
  {classification.category}
</span>

                </div>


                <div className="rounded-lg bg-white p-4 shadow-sm">

                  <p className="text-sm font-medium text-gray-500">
                    Priority
                  </p>

                  <span
  className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-bold ${getPriorityClass(
    classification.priority
  )}`}
>
  {classification.priority}
</span>

                </div>


                <div className="rounded-lg bg-white p-4 shadow-sm">

                  <p className="text-sm font-medium text-gray-500">
                    Action
                  </p>

                  <span
  className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-bold ${getActionClass(
    classification.action
  )}`}
>
  {classification.action}
</span>

                </div>

              </div>


              <div className="mt-4 rounded-lg bg-white p-4">

                <p className="text-sm text-gray-500">
                  AI Reason
                </p>

                <p className="mt-1">
                  {classification.reason}
                </p>

              </div>

            </div>
          )}


          {/* ========================================================= */}
          {/* FAQ Answer */}
          {/* ========================================================= */}

          {faqAnswer &&
            classification?.action === "ANSWER_FAQ" && (

              <div className="mt-6 rounded-xl border bg-blue-50 p-5">

                <h2 className="text-xl font-bold text-blue-800">
                  🤖 AI Answer
                </h2>

                <p className="mt-3 text-gray-700">
                  {faqAnswer}
                </p>

              </div>
            )}


          {/* ========================================================= */}
          {/* Order Details */}
          {/* ========================================================= */}

          {order &&
            classification?.action === "CHECK_ORDER" && (

              <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-5">

                <h2 className="text-xl font-bold text-blue-800">
                  📦 Order Details
                </h2>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">

                  <div className="rounded-lg bg-white p-4">

                    <p className="text-sm text-gray-500">
                      Order Number
                    </p>

                    <p className="mt-1 font-bold">
                      {order.order_number}
                    </p>

                  </div>


                  <div className="rounded-lg bg-white p-4">

                    <p className="text-sm text-gray-500">
                      Customer
                    </p>

                    <p className="mt-1 font-bold">
                      {order.customer_name}
                    </p>

                  </div>


                  <div className="rounded-lg bg-white p-4">

                    <p className="text-sm text-gray-500">
                      Product
                    </p>

                    <p className="mt-1 font-bold">
                      {order.product_name}
                    </p>

                  </div>


                  <div className="rounded-lg bg-white p-4">

                    <p className="text-sm text-gray-500">
                      Amount
                    </p>

                    <p className="mt-1 font-bold">
                      Rs. {order.amount}
                    </p>

                  </div>


                  <div className="rounded-lg bg-white p-4">

                    <p className="text-sm text-gray-500">
                      Status
                    </p>

                    <p className="mt-1 font-bold">
                      {order.status}
                    </p>

                  </div>


                  <div className="rounded-lg bg-white p-4">

                    <p className="text-sm text-gray-500">
                      Tracking Number
                    </p>

                    <p className="mt-1 font-bold">
                      {order.tracking_number || "Not available"}
                    </p>

                  </div>

                </div>

              </div>
            )}


          {/* ========================================================= */}
          {/* Order Not Found */}
          {/* ========================================================= */}

          {classification?.action === "CHECK_ORDER" &&
            !order && (

              <div className="mt-6 rounded-xl border border-yellow-200 bg-yellow-50 p-5">

                <h2 className="text-xl font-bold text-yellow-800">
                  🔎 Order Not Found
                </h2>

                <p className="mt-2 text-gray-700">
                  Is order number ka record database mein nahi mila.
                </p>

              </div>
            )}


          {/* ========================================================= */}
          {/* Support Ticket Created */}
          {/* ========================================================= */}

          {ticket && (

            <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-5">

              <h2 className="text-xl font-bold text-green-800">
                🎫 Support Ticket Created
              </h2>

              <div className="mt-4 space-y-2">

                <p>
                  <strong>Ticket ID:</strong> #{ticket.id}
                </p>

                <p>
                  <strong>Category:</strong>{" "}
                  {ticket.category}
                </p>

                <p>
                  <strong>Priority:</strong>{" "}
                  {ticket.priority}
                </p>

                <p>
                  <strong>Action:</strong>{" "}
                  {ticket.action}
                </p>

                <p>
                  <strong>Status:</strong>{" "}
                  {ticket.status}
                </p>

              </div>

            </div>
          )}

        </div>


        {/* ============================================================= */}
        {/* Ticket Dashboard */}
        {/* ============================================================= */}

        <div className="mt-8 rounded-2xl bg-white p-6 shadow-lg">

          <div className="mb-5 flex items-center justify-between">

            <div>

              <h2 className="text-2xl font-bold">
                🎫 Support Ticket Dashboard
              </h2>


              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

  <div className="rounded-2xl bg-gray-50 p-5 shadow-sm">
    <p className="text-sm font-medium text-gray-500">
      Total Tickets
    </p>

    <p className="mt-2 text-3xl font-bold text-gray-900">
      {totalTickets}
    </p>
  </div>

  <div className="rounded-2xl bg-red-50 p-5 shadow-sm">
    <p className="text-sm font-medium text-red-600">
      Open
    </p>

    <p className="mt-2 text-3xl font-bold text-red-700">
      {openTickets}
    </p>
  </div>

  <div className="rounded-2xl bg-yellow-50 p-5 shadow-sm">
    <p className="text-sm font-medium text-yellow-600">
      In Progress
    </p>

    <p className="mt-2 text-3xl font-bold text-yellow-700">
      {inProgressTickets}
    </p>
  </div>

  <div className="rounded-2xl bg-green-50 p-5 shadow-sm">
    <p className="text-sm font-medium text-green-600">
      Resolved
    </p>

    <p className="mt-2 text-3xl font-bold text-green-700">
      {resolvedTickets}
    </p>
  </div>

</div>

              <p className="mt-1 text-sm text-gray-500">
                AI generated customer support tickets
              </p>

            </div>

            <div className="rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold">
              Total: {tickets.length}
            </div>

          </div>


          {/* No tickets */}

          {tickets.length === 0 && (

            <div className="rounded-lg bg-gray-50 p-8 text-center text-gray-500">
              Abhi koi support ticket nahi hai.
            </div>

          )}


          {/* Tickets */}

          {tickets.length > 0 && (

            <div className="space-y-4">

              {tickets.map((item) => (

                <div
                  key={item.id}
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                >

                  {/* Top Row */}

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                    <div>

                      <p className="font-bold">
                       <div className="flex items-center gap-2">
  <span className="rounded-lg bg-gray-900 px-3 py-1 text-sm font-bold text-white">
    Ticket #{item.id}
  </span>

  <span className="text-xs text-gray-500">
    {item.created_at
      ? new Date(item.created_at).toLocaleString()
      : ""}
  </span>
</div>
                      </p>

                      <p className="text-sm text-gray-500">
                        {item.created_at
                          ? new Date(item.created_at).toLocaleString()
                          : ""}
                      </p>

                    </div>


                    <div className="flex flex-wrap gap-2">

                      <span
  className={`rounded-full px-3 py-1 text-xs font-semibold ${getCategoryClass(
    item.category
  )}`}
>
  {item.category}
</span>

<span
  className={`rounded-full px-3 py-1 text-xs font-semibold ${getPriorityClass(
    item.priority
  )}`}
>
  {item.priority}
</span>

                    <select
  value={item.status}
  onChange={(e) =>
    updateTicketStatus(item.id, e.target.value)
  }
  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold outline-none cursor-pointer ${
    item.status === "OPEN"
      ? "border-red-200 bg-red-50 text-red-700"
      : item.status === "IN PROGRESS"
      ? "border-yellow-200 bg-yellow-50 text-yellow-700"
      : "border-green-200 bg-green-50 text-green-700"
  }`}
>
  <option value="OPEN">🔴 OPEN</option>
  <option value="IN PROGRESS">🟡 IN PROGRESS</option>
  <option value="RESOLVED">🟢 RESOLVED</option>
</select>
                    </div>

                  </div>


                  {/* Customer Message */}

                  <div className="mt-4 rounded-lg bg-gray-50 p-4">

                    <p className="text-xs font-semibold uppercase text-gray-500">
                      Customer Message
                    </p>

                <p className="mt-4 rounded-xl bg-gray-50 p-4 text-sm leading-6 text-gray-700">
                {item.customer_message}
              </p>

                  </div>


                  {/* AI Info */}

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">

                    <div>

                      <p className="text-xs text-gray-500">
                        Action
                      </p>

                     <span
                  className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${getActionClass(
                    item.action
                  )}`}
                >
                  {item.action}
                </span>

                    </div>


                    <div>

                      <p className="text-xs text-gray-500">
                        AI Reason
                      </p>

                      <p className="text-sm text-gray-700">
                        {item.ai_reason}
                      </p>

                    </div>

                  </div>

                </div>

              ))}

            </div>
          )}

        </div>

      </div>

      {/* ============================================================= */}
{/* AI Activity Stats */}
{/* ============================================================= */}

<div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">

  <div className="rounded-2xl bg-blue-50 p-5 shadow-lg">
    <p className="text-sm font-medium text-blue-600">
      💬 Total Chats
    </p>

    <p className="mt-2 text-3xl font-bold text-blue-700">
      {totalChats}
    </p>
  </div>


  <div className="rounded-2xl bg-purple-50 p-5 shadow-lg">
    <p className="text-sm font-medium text-purple-600">
      ❓ FAQ Questions
    </p>

    <p className="mt-2 text-3xl font-bold text-purple-700">
      {faqChats}
    </p>
  </div>


  <div className="rounded-2xl bg-orange-50 p-5 shadow-lg">
    <p className="text-sm font-medium text-orange-600">
      🛒 Order Queries
    </p>

    <p className="mt-2 text-3xl font-bold text-orange-700">
      {orderChats}
    </p>
  </div>

</div>
     
{/* ============================================================= */}
{/* Chat History */}
{/* ============================================================= */}

<div className="mt-8 rounded-2xl bg-white p-6 shadow-lg">

  <div className="mb-5 flex items-center justify-between">

    <div>

      <h2 className="text-2xl font-bold">
        💬 Chat History
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        Previous customer conversations with AI
      </p>

    </div>

    

  </div>


  {/* No Chat History */}

  {chatHistory.length === 0 && (

    <div className="rounded-lg bg-gray-50 p-8 text-center text-gray-500">
      Abhi koi chat history nahi hai.
    </div>

  )}


  {/* Chat History List */}

  {chatHistory.length > 0 && (

    <div className="space-y-4">

      {chatHistory.map((chat) => (

        <div
          key={chat.id}
          className="rounded-xl border p-5 transition hover:shadow-md"
        >

          {/* Customer Message */}

          <div className="rounded-lg bg-gray-50 p-4">

            <p className="text-xs font-semibold uppercase text-gray-500">
              Customer Message
            </p>

            <p className="mt-1 text-gray-700">
              {chat.customer_message}
            </p>

          </div>


          {/* AI Response */}

          <div className="mt-4 rounded-lg bg-blue-50 p-4">

            <p className="text-xs font-semibold uppercase text-blue-600">
              AI Response
            </p>

            <p className="mt-1 text-gray-700">
              {chat.ai_response || "No AI response available."}
            </p>

          </div>


          {/* AI Information */}

          <div className="mt-4 flex flex-wrap gap-2">

            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold">
              {chat.category}
            </span>

            <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
              {chat.priority}
            </span>

            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
              {chat.action}
            </span>

          </div>


          {/* Date */}

          {chat.created_at && (

            <p className="mt-3 text-xs text-gray-400">
              {new Date(chat.created_at).toLocaleString()}
            </p>

          )}

        </div>

      ))}

    </div>

  )}

</div>

    </main>
  );
}