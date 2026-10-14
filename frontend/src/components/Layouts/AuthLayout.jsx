import React from "react";
import CARD_2 from "../../assets/images/CARD_2.png";
import { LuTrendingUpDown } from "react-icons/lu";

const AuthLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen">
      {/* Left Section */}
      <div className="w-full md:w-[60vw] px-6 md:px-12 pt-8 pb-12">
        <h2 className="text-lg font-medium text-black">
          Expense Tracker
        </h2>

        {children}
      </div>

      {/* Right Section */}
      <div className="hidden md:block relative h-screen w-[40vw] overflow-hidden bg-violet-50 bg-auth-bg-img bg-cover bg-center bg-no-repeat p-8">
        {/* Decorative Shapes */}
        <div className="absolute -left-5 -top-2 h-48 w-48 rounded-[40px] bg-purple-600" />

        <div className="absolute -right-5 top-[30%] h-56 w-48 rounded-[40px] border-[20px] border-fuchsia-600" />

        <div className="absolute -bottom-7 -left-3 h-48 w-48 rounded-[40px] bg-violet-500" />

        {/* Statistics Card */}
        <div className="absolute left-8 right-8 top-10 z-20">
          <StatsInfoCard
            icon={<LuTrendingUpDown />}
            label="Track Your Income & Expenses"
            value="430,000"
            color="bg-primary"
          />
        </div>

        {/* Illustration */}
        <img
          src={CARD_2}
          alt="Expense tracking dashboard illustration"
          className="absolute bottom-10 left-1/2 z-10 w-64 -translate-x-1/2 rounded-xl shadow-lg shadow-blue-400/15 lg:w-[90%]"
        />
      </div>
    </div>
  );
};

const StatsInfoCard = ({ icon, label, value, color }) => {
  return (
    <div className="rounded-2xl border border-white/50 bg-white/90 p-5 shadow-lg shadow-purple-900/10 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-[26px] text-white ${color}`}
        >
          {icon}
        </div>

        <h3 className="text-sm font-medium text-gray-600">
          {label}
        </h3>
      </div>

      <p className="mt-5 text-3xl font-bold text-gray-900">
        {value}
      </p>
    </div>
  );
};

export default AuthLayout;