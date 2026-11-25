import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LuUser, LuMail, LuLock, LuEye, LuEyeOff } from "react-icons/lu";
import AuthLayout from "../../components/Layouts/AuthLayout";
import ImageSelector from "../../components/Inputs/ImageSelector";
import { useAuth } from "../../context/AuthContext";
import axiosInstance from "../../utils/axiosInstance";
import { API } from "../../utils/apiPaths";
import toast from "react-hot-toast";

const SignUp = () => {
  const [profilePic, setProfilePic]     = useState(null);
  const [fullName, setFullName]         = useState("");
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
      let profileImageUrl = null;

      // Upload profile picture first if one was selected
      if (profilePic) {
        const formData = new FormData();
        formData.append("image", profilePic);

        // We need a token to upload, but we don't have one yet.
        // Register first, then upload in a second step — handled after login.
      }

      const { data } = await axiosInstance.post(API.AUTH.REGISTER, {
        fullName,
        email,
        password,
      });

      login(data.data.token, data.data.user);

      // Now upload profile pic if selected (we have a token now)
      if (profilePic) {
        try {
          const formData = new FormData();
          formData.append("image", profilePic);
          await axiosInstance.post(API.AUTH.UPLOAD_IMAGE, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } catch {
          // Profile pic upload failing is non-fatal
          toast("Account created but profile picture upload failed", { icon: "⚠️" });
        }
      }

      toast.success("Account created!");
      navigate("/dashboard");
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="lg:w-[70%] flex flex-col justify-center py-6">
        <h3 className="text-xl font-semibold text-black">Create an Account</h3>
        <p className="mt-[5px] mb-6 text-xs text-slate-700">
          Join us today by entering your details below
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <ImageSelector onImageSelect={setProfilePic} onError={setError} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InputField
              id="fullName"
              label="Full Name"
              icon={<LuUser size={18} />}
              placeholder="John Doe"
              value={fullName}
              onChange={setFullName}
              autoComplete="name"
            />
            <InputField
              id="email"
              label="Email Address"
              icon={<LuMail size={18} />}
              type="email"
              placeholder="johndoe@example.com"
              value={email}
              onChange={setEmail}
              autoComplete="email"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-medium text-slate-700">
              Password
            </label>
            <div className="flex items-center gap-3 rounded-lg border border-slate-300 px-4 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-100">
              <LuLock size={18} className="shrink-0 text-slate-400" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a password (min 8 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
                className="w-full min-w-0 bg-transparent py-3 text-sm text-slate-800 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="shrink-0 text-slate-400 hover:text-slate-700"
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
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-violet-600 hover:text-violet-700">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

const InputField = ({ id, label, icon, type = "text", placeholder, value, onChange, autoComplete }) => (
  <div className="flex min-w-0 flex-col gap-1">
    <label htmlFor={id} className="text-sm font-medium text-slate-700">{label}</label>
    <div className="flex min-w-0 items-center gap-3 rounded-lg border border-slate-300 px-3 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-100">
      <span className="shrink-0 text-slate-400">{icon}</span>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required
        className="w-full min-w-0 bg-transparent py-3 text-sm text-slate-800 outline-none"
      />
    </div>
  </div>
);

export default SignUp;
