import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LuMail, LuLock, LuEye, LuEyeOff } from "react-icons/lu";
import AuthLayout from "../../components/Layouts/AuthLayout";
import { useAuth } from "../../context/AuthContext";
import axiosInstance from "../../utils/axiosInstance";
import { API } from "../../utils/apiPaths";
import toast from "react-hot-toast";

const Login = () => {
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);

  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data } = await axiosInstance.post(API.AUTH.LOGIN, { email, password });
      login(data.data.token, data.data.user);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="lg:w-[70%] h-3/4 md:h-full flex flex-col justify-center">
        <h3 className="font-semibold text-black text-xl">Welcome Back</h3>
        <p className="text-xs text-slate-700 mt-[5px] mb-6">
          Please enter your details to log in
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Email */}
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

          {/* Password */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium text-slate-700">
                Password
              </label>
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-xs text-violet-600 hover:text-violet-700 font-medium"
              >
                Forgot password?
              </button>
            </div>
            <div className="flex items-center gap-3 border border-slate-300 rounded-lg px-4 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-100">
              <LuLock size={18} className="text-slate-400 shrink-0" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
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

          {error && <p className="text-sm text-red-500" role="alert">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-violet-600 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="text-sm text-slate-600 text-center mt-6">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/signUp")}
            className="font-medium text-violet-600 hover:text-violet-700"
          >
            Sign up
          </button>
        </p>
      </div>
    </AuthLayout>
  );
};

export default Login;
