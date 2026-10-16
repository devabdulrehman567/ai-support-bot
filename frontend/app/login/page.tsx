
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      
const response = await fetch(
  "/backend-api/login",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ email, password }),
  }
);

    const data = await response.json();

      if (!response.ok || !data.success || !data.token) {
        setError(data.message || "Login failed. Check your email and password.");
        return;
      }
localStorage.setItem("token", data.token);
localStorage.setItem("user", JSON.stringify(data.user));

const role = String(data.user?.role ?? "").toLowerCase();

if (role === "admin") {
  router.push("/admin");
} else {
  router.push("/dashboard");
}

    } catch {
      setError("Cannot connect to the Laravel backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg"
      >
        <h1 className="text-3xl font-bold text-gray-900">
          AI Support Bot
        </h1>
        <p className="mb-6 mt-2 text-sm text-gray-500">
          Sign in to your account
        </p>

        <label className="mb-2 block text-sm font-medium">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded-lg border p-3"
          placeholder="you@example.com"
        />

        <label className="mb-2 block text-sm font-medium">Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 w-full rounded-lg border p-3"
          placeholder="Your password"
        />

        {error && (
          <p role="alert" className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-gray-900 p-3 font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Login"}
        </button>
      </form>
    </main>
  );
}
