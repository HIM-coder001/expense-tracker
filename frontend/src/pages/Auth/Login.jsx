import React, { useState } from "react";
import AuthLayout from "../../components/Layouts/AuthLayout";
import { useNavigate } from "react-router-dom";
import {
  LuMail,
  LuLock,
  LuEye,
  LuEyeOff,
} from "react-icons/lu";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Authentication logic will go here.
    console.log({ email, password });
  };

  return (
    <AuthLayout>
      <div className="lg:w-[70%] h-3/4 md:h-full flex flex-col justify-center">
        <h3 className="font-semibold text-black text-xl">
          Welcome Back
        </h3>

        <p className="text-xs text-slate-700 mt-[5px] mb-6">
          Please enter your details to login
        </p>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
        >
          {/* Email Address */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="email"
              className="text-sm font-medium text-slate-700"
            >
              Email Address
            </label>

            <div className="flex items-center gap-3 border border-slate-300 rounded-lg px-4 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-100">
              <LuMail
                size={18}
                className="text-slate-400 shrink-0"
              />

              <input
                id="email"
                type="email"
                name="email"
                placeholder="johndoe@ample.com"
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
            <label
              htmlFor="password"
              className="text-sm font-medium text-slate-700"
            >
              Password
            </label>

            <div className="flex items-center gap-3 border border-slate-300 rounded-lg px-4 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-100">
              <LuLock
                size={18}
                className="text-slate-400 shrink-0"
              />

              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="w-full py-3 text-sm text-slate-800 bg-transparent outline-none"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword((prev) => !prev)
                }
                aria-label={
                  showPassword ? "Hide password" : "Show password"
                }
                aria-pressed={showPassword}
                className="text-slate-400 hover:text-slate-700 transition-colors shrink-0"
              >
                {showPassword ? (
                  <LuEyeOff size={18} />
                ) : (
                  <LuEye size={18} />
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <p
              className="text-sm text-red-500"
              role="alert"
            >
              {error}
            </p>
          )}

          {/* Forgot Password */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="text-sm font-medium text-violet-600 hover:text-violet-700"
            >
              Forgot Password?
            </button>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            className="w-full rounded-lg bg-violet-600 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
          >
            Sign In
          </button>
        </form>

        {/* Sign Up Link */}
        <p className="text-sm text-slate-600 text-center mt-6">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/signup")}
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
