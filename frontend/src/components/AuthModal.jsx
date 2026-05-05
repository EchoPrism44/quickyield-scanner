import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth";

export default function AuthModal({ open, mode = "login", onClose, onSwitch }) {
  const { login, register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fn = mode === "login" ? login(email, password) : register(email, password, name);
    const res = await fn;
    setLoading(false);
    if (!res.ok) setError(res.error);
    else onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          data-testid="auth-modal"
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: "spring", damping: 24, stiffness: 280 }}
            className="relative w-full max-w-md rounded-2xl border border-line bg-bg-surface p-8 noise"
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-ink-mute hover:text-ink"
              data-testid="auth-close-btn"
            >
              <X size={20} />
            </button>
            <div className="mb-6">
              <h2 className="font-display text-2xl tracking-tight text-ink">
                {mode === "login" ? "Welcome back" : "Create your account"}
              </h2>
              <p className="mt-1 text-sm text-ink-dim">
                {mode === "login"
                  ? "Sign in to access your watchlist and alerts."
                  : "Start scanning DeFi yields in 30 seconds."}
              </p>
            </div>
            <form onSubmit={submit} className="space-y-3">
              {mode === "register" && (
                <input
                  type="text"
                  placeholder="Name (optional)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-line bg-bg-elevated px-4 py-3 text-sm text-ink placeholder:text-ink-mute focus:border-signal/40 focus:outline-none focus:ring-1 focus:ring-signal/30"
                  data-testid="auth-name-input"
                />
              )}
              <input
                type="email"
                placeholder="Email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-line bg-bg-elevated px-4 py-3 text-sm text-ink placeholder:text-ink-mute focus:border-signal/40 focus:outline-none focus:ring-1 focus:ring-signal/30"
                data-testid="auth-email-input"
              />
              <input
                type="password"
                placeholder="Password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-line bg-bg-elevated px-4 py-3 text-sm text-ink placeholder:text-ink-mute focus:border-signal/40 focus:outline-none focus:ring-1 focus:ring-signal/30"
                data-testid="auth-password-input"
              />
              {error && (
                <div className="rounded-lg border border-risk/30 bg-risk/10 px-3 py-2 text-xs text-risk" data-testid="auth-error">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-full bg-signal px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-signal-hover disabled:opacity-50"
                data-testid="auth-submit-btn"
              >
                {loading ? "Working..." : mode === "login" ? "Sign in" : "Create account"}
              </button>
            </form>
            <div className="mt-5 text-center text-sm text-ink-dim">
              {mode === "login" ? (
                <>
                  No account?{" "}
                  <button
                    onClick={() => onSwitch("register")}
                    className="text-ink underline-offset-4 hover:underline"
                    data-testid="auth-switch-register"
                  >
                    Create one
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    onClick={() => onSwitch("login")}
                    className="text-ink underline-offset-4 hover:underline"
                    data-testid="auth-switch-login"
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
