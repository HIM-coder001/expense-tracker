/**
 * Seed system-default categories (userId: null).
 * Safe to run multiple times — uses upsert so existing records are not duplicated.
 *
 * Usage: node scripts/seedCategories.js
 */
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import Category from "../models/Category.js";

const DEFAULT_CATEGORIES = [
  // Income
  { name: "Salary",        icon: "LuBriefcase",        type: "income" },
  { name: "Freelance",     icon: "LuLaptop",           type: "income" },
  { name: "Investment",    icon: "LuTrendingUp",       type: "income" },
  { name: "Gift",          icon: "LuGift",             type: "income" },
  { name: "Other Income",  icon: "LuCircleDollarSign", type: "income" },
  // Expense
  { name: "Food & Dining",  icon: "LuUtensils",        type: "expense" },
  { name: "Transport",      icon: "LuCar",             type: "expense" },
  { name: "Housing",        icon: "LuHouse",           type: "expense" },
  { name: "Utilities",      icon: "LuZap",             type: "expense" },
  { name: "Healthcare",     icon: "LuHeartPulse",      type: "expense" },
  { name: "Entertainment",  icon: "LuFilm",            type: "expense" },
  { name: "Shopping",       icon: "LuShoppingBag",     type: "expense" },
  { name: "Education",      icon: "LuGraduationCap",   type: "expense" },
  { name: "Travel",         icon: "LuPlane",           type: "expense" },
  { name: "Subscriptions",  icon: "LuSmartphone",      type: "expense" },
  { name: "Other Expense",  icon: "LuPackage",         type: "expense" },
];

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to database");

  for (const cat of DEFAULT_CATEGORIES) {
    await Category.findOneAndUpdate(
      { userId: null, name: cat.name },
      { $setOnInsert: { ...cat, userId: null } },
      { upsert: true, setDefaultsOnInsert: true }
    );
  }

  console.log(`Seeded ${DEFAULT_CATEGORIES.length} default categories`);
  await mongoose.disconnect();
};

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
