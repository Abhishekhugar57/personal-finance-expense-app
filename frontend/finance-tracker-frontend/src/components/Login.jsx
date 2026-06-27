import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { useDispatch } from "react-redux";
import { addUser } from "../store/userSlice";
import api from "../api/client";
import { Button, Input } from "./ui";

const Login = () => {
  const [isSignedInForm, setIsSignedInForm] = useState(true);
  const [errMessage, setErrMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const fullName = useRef(null);
  const email = useRef(null);
  const password = useRef(null);

  const validateEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const getApiErrorMessage = (err, fallback = "Something went wrong.") => {
    const data = err?.response?.data;
    if (typeof data === "string" && data.trim()) return data;
    if (data?.message) return data.message;
    if (data?.error) return data.error;
    return fallback;
  };

  const toggleForm = () => {
    setIsSignedInForm((prev) => !prev);
    setErrMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrMessage("");
    setLoading(true);

    const emailValue = email.current.value.trim();
    const passwordValue = password.current.value.trim();

    if (!emailValue || !passwordValue) {
      setErrMessage("All fields are required.");
      setLoading(false);
      return;
    }

    if (!validateEmail(emailValue)) {
      setErrMessage("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    if (passwordValue.length < 6) {
      setErrMessage("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    try {
      if (isSignedInForm) {
        const res = await api.post("/login", {
          email: emailValue,
          password: passwordValue,
        });
        dispatch(addUser(res.data.existingUser));
        setTimeout(() => navigate("/dashboard"), 300);
      } else {
        const nameValue = fullName.current.value.trim();
        if (!nameValue) {
          setErrMessage("Full name is required.");
          setLoading(false);
          return;
        }
        await api.post("/signup", {
          userName: nameValue,
          email: emailValue,
          password: passwordValue,
        });
        setIsSignedInForm(true);
        setErrMessage("Account created successfully. Please sign in.");
      }
    } catch (err) {
      setErrMessage(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: CheckCircle2, text: "Smart expense tracking" },
    { icon: ShieldCheck, text: "Loan & interest insights" },
    { icon: Wallet, text: "Clean financial overview" },
  ];

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col md:flex-row bg-[var(--app-bg)] font-sans">
      {/* Desktop branding panel */}
      <div className="relative hidden md:flex md:w-1/2 items-center justify-center p-12 overflow-hidden bg-gradient-to-br from-[var(--app-primary)] to-[var(--app-secondary)]">
        <div className="pointer-events-none absolute -left-16 -top-16 h-80 w-80 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -right-10 bottom-0 h-64 w-64 rounded-full bg-white/5 blur-2xl" />

        <div className="relative z-10 max-w-md text-center space-y-8 text-white">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg ring-1 ring-white/30">
            <span className="text-2xl font-extrabold">₹</span>
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-bold tracking-tight">FinTrack</h1>
            <p className="mx-auto max-w-sm text-base text-white/80 leading-relaxed">
              Manage expenses, stay on top of loans, and unlock clear cashflow insights.
            </p>
          </div>
          <ul className="space-y-3 text-left">
            {features.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-white/90">
                <Icon size={18} className="text-white shrink-0" />
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Form panel — mobile-first */}
      <div className="flex-1 flex flex-col md:items-center md:justify-center px-4 pt-6 pb-8 sm:px-6 md:p-8 safe-bottom">
        {/* Mobile brand header */}
        <div className="md:hidden flex items-center gap-3 mb-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--app-primary)] to-[var(--app-secondary)] shadow-md">
            <span className="text-lg font-extrabold text-white">₹</span>
          </div>
          <div>
            <p className="text-base font-bold text-[var(--app-text)] leading-tight">FinTrack</p>
            <p className="text-xs text-[var(--app-text-muted)]">Personal finance, simplified</p>
          </div>
        </div>

        <div className="w-full max-w-md md:mx-auto">
          <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 sm:p-6 md:p-8 shadow-[var(--shadow-card)]">
            <div className="mb-5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--app-text)]">
                {isSignedInForm ? "Welcome back" : "Create account"}
              </h1>
              <p className="mt-1 text-sm text-[var(--app-text-muted)]">
                {isSignedInForm
                  ? "Sign in to manage your finances"
                  : "Start tracking income, expenses & loans"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {!isSignedInForm && (
                <Input
                  ref={fullName}
                  label="Full name"
                  type="text"
                  placeholder="Your full name"
                  autoComplete="name"
                />
              )}

              <Input
                ref={email}
                label="Email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
              />

              <div className="relative">
                <Input
                  ref={password}
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 6 characters"
                  autoComplete={isSignedInForm ? "current-password" : "new-password"}
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-[34px] text-[var(--app-text-muted)] hover:text-[var(--app-text)] transition-colors p-1 rounded-lg"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {errMessage && (
                <div
                  role="alert"
                  className={`text-sm px-3.5 py-2.5 rounded-xl border ${
                    errMessage.includes("successfully")
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
                      : "bg-red-50 border-red-200 text-red-600 dark:bg-red-950/40 dark:border-red-800 dark:text-red-400"
                  }`}
                >
                  {errMessage}
                </div>
              )}

              <Button type="submit" className="w-full !min-h-[48px]" loading={loading} disabled={loading}>
                {!loading && isSignedInForm ? "Sign in" : !loading ? "Create account" : null}
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-[var(--app-text-muted)]">
              {isSignedInForm ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={toggleForm}
                className="font-semibold text-[var(--app-primary)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-primary)]/40 rounded"
              >
                {isSignedInForm ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>

          {/* Mobile feature pills */}
          <div className="md:hidden mt-5 flex flex-wrap gap-2 justify-center">
            {features.map(({ icon: Icon, text }) => (
              <span
                key={text}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--app-surface)] border border-[var(--app-border)] text-[var(--app-text-muted)]"
              >
                <Icon size={13} className="text-[var(--app-primary)]" />
                {text}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
