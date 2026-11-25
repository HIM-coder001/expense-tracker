import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { LuLock, LuEye, LuEyeOff, LuArrowLeft } from "react-icons/lu";
import AuthLayout from "../../components/Layouts/AuthLayout";
import axiosInstance from "../../utils/axiosInstance";
import { API } from "../../utils/apiPaths";
import toast from "react-hot-toast";

const ResetPassword = () => {
  const { token }  = useParams();
  const navigate   = useNavigate();

  const [password, setPassword]           = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword]   = useState(false);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.post(API.AUTH.RESET_PASSWORD(token), { password });
      toast.success("Password updated — please log in");
      navigate("/login");
    } catch (err) {
      const msg = err.response?.data?.message || "Reset failed. The link may have expired.";
      setError(msg);
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

        <h3 className="font-semibold text-black text-xl">Set a new password</h3>
        <p className="text-xs text-slate-700 mt-[5px] mb-6">
          Your new password must be at least 8 characters.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* New password */}
          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-medium text-slate-700">
              New Password
            </label>
            <div className="flex items-center gap-3 border border-slate-300 rounded-lg px-4 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-100">
              <LuLock size={18} className="text-slate-400 shrink-0" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
                className="w-full py-3 text-sm text-slate-800 bg-transparent outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="text-slate-400 hover:text-slate-700 transition-colors shrink-0"
              >
                {showPassword ? <LuEyeOff size={18} /> : <LuEye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div className="flex flex-col gap-1">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
              Confirm Password
            </label>
            <div className="flex items-center gap-3 border border-slate-300 rounded-lg px-4 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-100">
              <LuLock size={18} className="text-slate-400 shrink-0" />
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Repeat your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
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
            {loading ? "Updating…" : "Update Password"}
          </button>
        </form>
      </div>
    </AuthLayout>
  );
};

export default ResetPassword;
