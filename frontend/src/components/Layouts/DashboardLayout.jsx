import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LuLayoutDashboard,
  LuTrendingUp,
  LuTrendingDown,
  LuLogOut,
  LuMenu,
  LuCamera,
} from "react-icons/lu";
import { useAuth } from "../../context/AuthContext";
import ProfileModal from "../ui/ProfileModal";
import useProfileImage from "../../hooks/useProfileImage";
import toast from "react-hot-toast";

const NAV = [
  { label: "Dashboard", path: "/dashboard", Icon: LuLayoutDashboard },
  { label: "Income",    path: "/income",    Icon: LuTrendingUp       },
  { label: "Expenses",  path: "/expense",   Icon: LuTrendingDown     },
];

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen]     = useState(false);
  const [showProfile, setShowProfile]     = useState(false);

  // Fetch the profile image blob via the authenticated endpoint.
  // Re-fetches automatically when user.profileImageUrl changes after upload.
  const avatarBlobUrl = useProfileImage(user?.profileImageUrl);

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out");
    navigate("/login");
  };

  const Avatar = ({ size = "md" }) => {
    const dim = size === "lg" ? "h-12 w-12 text-base" : "h-9 w-9 text-sm";
    return (
      <button
        type="button"
        onClick={() => setShowProfile(true)}
        className={`relative group ${dim} rounded-full shrink-0 overflow-hidden bg-violet-100 flex items-center justify-center text-violet-700 font-semibold focus:outline-none focus:ring-2 focus:ring-violet-400`}
        aria-label="Edit profile picture"
        title="Change profile picture"
      >
        {avatarBlobUrl ? (
          <img
            src={avatarBlobUrl}
            alt={user?.fullName}
            className="h-full w-full object-cover"
          />
        ) : (
          <span>{user?.fullName?.[0]?.toUpperCase() ?? "U"}</span>
        )}

        {/* Camera icon on hover */}
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
          <LuCamera size={size === "lg" ? 18 : 14} className="text-white" />
        </span>
      </button>
    );
  };

  const Sidebar = () => (
    <aside className="flex h-full w-64 flex-col bg-white shadow-sm border-r border-slate-100">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-slate-100">
        <span className="text-violet-600 font-bold text-lg">ExpenseTracker</span>
      </div>

      {/* User info — avatar is clickable to open upload modal */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
        <Avatar />
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">{user?.fullName}</p>
          <button
            type="button"
            onClick={() => setShowProfile(true)}
            className="text-xs text-violet-500 hover:text-violet-700 transition-colors"
          >
            Change photo
          </button>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ label, path, Icon }) => (
          <NavLink
            key={path}
            to={path}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-violet-50 text-violet-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-100 p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LuLogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-64 z-50">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white md:hidden">
          <span className="font-bold text-violet-600">ExpenseTracker</span>
          <div className="flex items-center gap-3">
            <Avatar />
            <button onClick={() => setSidebarOpen(true)} className="text-slate-600">
              <LuMenu size={22} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>

      {/* Profile picture modal */}
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
    </div>
  );
};

export default DashboardLayout;
