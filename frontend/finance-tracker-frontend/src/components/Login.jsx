/*const Login = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
   
  
        <div className="flex items-center gap-3 px-6 py-5 border-b">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
            $
          </div>
          <h1 className="text-xl font-semibold text-gray-800">
            Finance Tracker
          </h1>
        </div>

        <div className="px-6 py-6">
          <div className="flex items-center gap-2 mb-6 text-gray-700">
            <Lock size={18} />
            <h2 className="text-lg font-medium">Sign in to your account</h2>
          </div>

     
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Email
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                placeholder="Enter your password"
                className="w-full px-3 py-2 border rounded-md pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Eye
                size={18}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
              />
            </div>
          </div>

          <button className="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 transition">
            Sign In
          </button>

          <div className="mt-4">
            <Link
              to="/forgot-password"
              className="text-sm text-blue-600 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <div className="px-6 py-4 border-t text-center text-sm text-gray-600">
          <p className="mb-2">Your financial data is safe and secure.</p>
          <p>
            New here?{" "}
            <Link
              to="/signup"
              className="text-blue-600 font-medium hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;


import React from "react";

import { Link } from "react-router-dom";
import { Lock, Eye } from "lucide-react";
import { useRef, useState } from "react";

const Login = () => {
  const [isSignedInForm, SetIsSignedInForm] = useState(true);

  const [errMessage, setErrMessage] = useState(null);
  const email = useRef(null);
  const password = useRef(null);
  
  const handleButtonClick = () => {
    const emailValue = email.current.value;
    const passwordValue = password.current.value;

    if (!emailValue || !passwordValue) {
      setErrMessage("Email and password are required");
      return;
    }

    setErrMessage(null);

    // Later this will be replaced with backend API call
    console.log("Login data:", {
      email: emailValue,
      password: passwordValue,
    });
  };

  const toggleSiginIn = () => {
    SetIsSignedInForm(!isSignedInForm);
  };

  return (
    <div>
      <form
        onSubmit={(e) => e.preventDefault()}
        className=" w-full md:w-3/12 absolute p-12 bg-slate-900 my-36 mx-auto right-0 left-0 text-white bg-opacity-80 "
      >
        <h1 className="font-bold text-2xl py-2">
          {isSignedInForm ? "Sign In" : "Sign Up"}
        </h1>
        {!isSignedInForm && (
          <input
            type="text"
            placeholder="Enter Your Full Name"
            className="p-4 my-4 w-full bg-gray-700 rounded"
          />
        )}
        <input
          ref={email}
          type="text"
          placeholder="Email Address"
          className="p-4 my-4 w-full bg-gray-700 rounded"
        />
        <input
          ref={password}
          type="password"
          placeholder="password"
          className="p-4 my-4 w-full bg-gray-700 rounded"
        />
        <p className="text-red-500 font-bold text-g py-2">{errMessage}</p>
        <div className="flex justify-end mt-1">
          <button
            onClick={handleButtonClick}
            className="p-4 my-6 bg-blue-600 hover:bg-red-700 font-semibold w-full rounded-lg"
          >
            {isSignedInForm ? "Sign In" : "Sign Up"}
          </button>
        </div>
        <p className="py-4 cursor-pointer" onClick={toggleSiginIn}>
          {isSignedInForm
            ? "New User? Sign Up Now"
            : "Already Registered?Sign In Now"}
        </p>
      </form>
    </div>
  );
};
export default Login;



import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Eye } from "lucide-react";
import { useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { addUser } from "../store/userSlice";
import axios from "axios";

const Login = () => {
  const [isSignedInForm, SetIsSignedInForm] = useState(true);
  const [errMessage, setErrMessage] = useState(null);

  const navigate = useNavigate("");
  const dispatch = useDispatch();
  const fullName = useRef(null);

  const email = useRef(null);

  const password = useRef(null);

  const handleButtonClick = async (e) => {
    e.preventDefault();

    const emailValue = email.current.value;
    const passwordValue = password.current.value;

    if (!emailValue || !passwordValue) {
      setErrMessage("Email and password are required");
      return;
    }

    try {
      if (isSignedInForm) {
        // 🔹 LOGIN API
        const res = await axios.post(
          "/api/login",
          {
            email: emailValue,
            password: passwordValue,
          },
          { withCredentials: true }
        );
        dispatch(addUser(res.data));

        console.log("Login success:", res.data);
        navigate("/dashboard");
      } else {
        // 🔹 SIGNUP API
        const nameValue = fullName.current.value;

        if (!nameValue) {
          setErrMessage("Full name is required");
          return;
        }

        const res = await axios.post(
          "/api/signup",
          {
            userName: nameValue,
            email: emailValue,
            password: passwordValue,
          },
          { withCredentials: true }
        );

        console.log("Signup success:", res.data);

        // After signup switch to login
        SetIsSignedInForm(true);
      }
    } catch (err) {
      setErrMessage(err.response?.data?.message || "Something went wrong");
    }
  };

  const toggleSiginIn = () => {
    SetIsSignedInForm(!isSignedInForm);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-black">
      <form
        onSubmit={(e) => e.preventDefault()}
        className="w-full max-w-md p-10 rounded-2xl shadow-2xl bg-slate-900/90 border border-slate-700 text-white"
      >
        <h1 className="font-semibold text-3xl text-center mb-2">
          {isSignedInForm ? "Welcome Back" : "Create Account"}
        </h1>
        <p className="text-center text-slate-400 mb-8 text-sm">
          {isSignedInForm
            ? "Track your expenses effortlessly"
            : "Start managing your personal finances"}
        </p>

        {!isSignedInForm && (
          <input
            ref={fullName}
            type="text"
            placeholder="Full Name"
            className="p-3 mb-4 w-full bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}

        <input
          ref={email}
          type="text"
          placeholder="Email Address"
          className="p-3 mb-4 w-full bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <input
          ref={password}
          type="password"
          placeholder="Password"
          className="p-3 mb-2 w-full bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {errMessage && (
          <p className="text-red-400 text-sm font-medium mt-2">{errMessage}</p>
        )}

        <button
          onClick={handleButtonClick}
          className="mt-6 w-full py-3 bg-blue-600 hover:bg-blue-700 transition rounded-lg font-semibold tracking-wide"
        >
          {isSignedInForm ? "Sign In" : "Sign Up"}
        </button>

        <p
          className="mt-6 text-center text-sm text-slate-400 cursor-pointer hover:text-white transition"
          onClick={toggleSiginIn}
        >
          {isSignedInForm
            ? "New user? Create an account"
            : "Already registered? Sign in"}
        </p>
      </form>
    </div>
  );
};

export default Login;*/

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
import axios from "axios";

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
        // Sign In
        const res = await axios({
          method: "post",
          url: "/api/login",
          data: {
            email: emailValue,
            password: passwordValue,
          },
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        });

        // Dispatch user to redux store
        dispatch(addUser(res.data.existingUser));

        // Navigate to dashboard after a short delay
        setTimeout(() => {
          navigate("/dashboard");
        }, 300);
      } else {
        // Sign Up
        const nameValue = fullName.current.value.trim();

        if (!nameValue) {
          setErrMessage("Full name is required.");
          setLoading(false);
          return;
        }

        const res = await axios.post(
          "/api/signup",
          {
            userName: nameValue,
            email: emailValue,
            password: passwordValue,
          },
          {
            withCredentials: true,
          }
        );

        // Automatically switch to Sign In form after successful signup
        setIsSignedInForm(true);
        setErrMessage("Account created successfully. Please sign in.");
      }
    } catch (err) {
      setErrMessage(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 font-sans">
      {/* Left branding */}
      <div className="relative hidden md:flex md:w-1/2 items-center justify-center p-12 overflow-hidden">
        <div className="pointer-events-none absolute -left-16 -top-16 h-80 w-80 rounded-full bg-gradient-to-br from-blue-600/10 via-indigo-600/10 to-purple-600/10 blur-2xl" />

        <div className="relative z-10 max-w-md text-center space-y-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg ring-4 ring-blue-500/10">
            <span className="text-2xl font-extrabold text-white">$</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">
              Finance Tracker
            </h1>
            <p className="mx-auto max-w-sm text-base text-slate-600 leading-relaxed">
              Manage expenses, stay on top of loans, and unlock clear cashflow
              insights.
            </p>
          </div>

          <ul className="space-y-3 text-left">
            <li className="flex items-center gap-3 text-sm text-slate-700 transition-all duration-300 hover:translate-x-1">
              <CheckCircle2 size={18} className="text-blue-600" />
              Smart expense tracking
            </li>
            <li className="flex items-center gap-3 text-sm text-slate-700 transition-all duration-300 hover:translate-x-1">
              <ShieldCheck size={18} className="text-blue-600" />
              Loan & interest insights
            </li>
            <li className="flex items-center gap-3 text-sm text-slate-700 transition-all duration-300 hover:translate-x-1">
              <Wallet size={18} className="text-blue-600" />
              Clean financial overview
            </li>
          </ul>
        </div>
      </div>

      {/* Right login card */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:p-6">
        <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/20 bg-white/80 p-5 shadow-xl backdrop-blur-md md:p-10 md:shadow-2xl">
          <div className="pointer-events-none absolute -inset-x-24 -inset-y-24 bg-gradient-to-br from-blue-500/15 via-indigo-500/10 to-purple-500/10 blur-2xl" />

          <div className="relative z-10">
            <h1 className="text-xl md:text-3xl font-bold tracking-tight text-center mb-2 text-slate-900 leading-tight">
            {isSignedInForm ? "Welcome Back" : "Create Account"}
            </h1>

            <p className="text-center text-gray-500 mb-7 text-sm">
            {isSignedInForm
              ? "Sign in to continue managing your finances"
              : "Start tracking your personal finances today"}
            </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isSignedInForm && (
              <input
                ref={fullName}
                type="text"
                placeholder="Full Name"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 md:py-3.5 text-sm text-slate-800 shadow-sm outline-none placeholder:text-gray-400 transition-all duration-200 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
              />
            )}

            {isSignedInForm && (
              <div className="flex justify-end">
                {/* intentionally empty: forgot-password link removed */}
              </div>
            )}

            <input
              ref={email}
              type="email"
              placeholder="Email Address"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 md:py-3.5 text-sm text-slate-800 shadow-sm outline-none placeholder:text-gray-400 transition-all duration-200 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
            />

            <div className="relative">
              <input
                ref={password}
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 md:py-3.5 text-sm text-slate-800 shadow-sm outline-none placeholder:text-gray-400 transition-all duration-200 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-transform duration-200 hover:text-slate-900 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 rounded-lg p-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {errMessage && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2 rounded-lg">
                {errMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 md:py-3.5 rounded-xl font-semibold tracking-wide transition-all duration-200 flex items-center justify-center gap-2 shadow-md bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] hover:scale-[1.01]
                ${loading ? "opacity-80 cursor-not-allowed" : ""}`}
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              {isSignedInForm ? "Sign In" : "Sign Up"}
            </button>
          </form>

          {/* OR divider */}
          <div className="relative mt-4 md:mt-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-white/70 text-xs text-gray-400 font-semibold">
                OR
              </span>
            </div>
          </div>

          {/* Optional secondary button (same toggle functionality) */}
          <button
            type="button"
            onClick={() => setIsSignedInForm(!isSignedInForm)}
            className="mt-4 w-full py-2.5 md:py-3.5 rounded-xl font-semibold border border-gray-200 bg-gray-50 hover:bg-gray-100 active:scale-[0.99] transition-all duration-200 hover:scale-[1.01]"
          >
            {isSignedInForm ? "Create Account" : "Sign In"}
          </button>

          <p
            onClick={() => setIsSignedInForm(!isSignedInForm)}
            className="mt-6 text-center text-sm text-gray-500 hover:text-slate-900 cursor-pointer transition-colors"
          >
            {isSignedInForm
              ? "New user? Create an account"
              : "Already registered? Sign in"}
          </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
