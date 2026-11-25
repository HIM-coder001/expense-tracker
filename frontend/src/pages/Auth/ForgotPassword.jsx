import React, { useState } from "react";
import { Link } from "react-router-dom";
import { LuMail, LuArrowLeft, LuMailCheck } from "react-icons/lu";
import AuthLayout from "../../components/Layouts/AuthLayout";
import axiosInstance from "../../utils/axiosInstance";
import { API } from "../../utils/apiPaths";

const ForgotPassword = () => {
  const [email, setEmail]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError]       = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await axiosInstance.post(API.AUTH.FORGOT_PASSWORD, { email });
      setSubmitted(true);
    } catch (err) {
      // The server always returns 200 for this endpoint (prevents enumeration),
      // so a real error here means a network/server problem.
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="lg:w-[70%] h-3/4 md:h-full flex flex-col justify-center">
        <Link
          to="/login"
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors w-fit"
        >
          <LuArrowLeft size={16} />
          Back to login
        </Link>

        {submitted ? (
          <div className="rounded-2xl bg-violet-50 border border-violet-100 p-6 text-center">
            <div className="flex justify-center mb-3">
              <LuMailCheck size={40} className="text-violet-500" />
            </div>
            <h3 className="font-semibold text-slate-800 text-lg mb-2">Check your inbox</h3>
            <p className="text-sm text-slate-600">
              If <span className="font-medium">{email}</span> is registered, a password
              reset link has been sent. It expires in 1 hour.
            </p>
            <p className="text-xs text-slate-400 mt-3">
              Didn't get it? Check your spam folder.
            </p>
          </div>
        ) : (
          <>
            <h3 className="font-semibold text-black text-xl">Forgot your password?</h3>
            <p className="text-xs text-slate-700 mt-[5px] mb-6">
              Enter your email and we'll send you a reset link.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="email" className="text-sm font-medium text-slate-700">
                  Email Address
                </label>
                <div className="flex items-center gap-3 border border-slate-300 rounded-lg px-4 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-100">
                  <LuMail size={18} className="text-slate-400 shrink-0" />
                  <input
                    id="email"
                    type="email"
                    placeholder="johndoe@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    className="w-full py-3 text-sm text-slate-800 bg-transparent outline-none"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-red-500" role="alert">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-violet-600 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
              >
                {loading ? "Sending…" : "Send Reset Link"}
              </button>
            </form>
          </>
        )}
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;
