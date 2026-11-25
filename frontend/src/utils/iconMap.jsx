import React from "react";
import {
  LuBriefcase,
  LuLaptop,
  LuTrendingUp,
  LuGift,
  LuCircleDollarSign,
  LuUtensils,
  LuCar,
  LuHouse,
  LuZap,
  LuHeartPulse,
  LuFilm,
  LuShoppingBag,
  LuGraduationCap,
  LuPlane,
  LuSmartphone,
  LuPackage,
  LuReceipt,
} from "react-icons/lu";

/**
 * Map from icon name string (stored in DB) to a rendered Lucide element.
 * Size 18 is the standard row size; callers may override via the `size` prop
 * on the icon component if they build it themselves.
 */
export const ICON_MAP = {
  LuBriefcase:        <LuBriefcase size={18} />,
  LuLaptop:           <LuLaptop size={18} />,
  LuTrendingUp:       <LuTrendingUp size={18} />,
  LuGift:             <LuGift size={18} />,
  LuCircleDollarSign: <LuCircleDollarSign size={18} />,
  LuUtensils:         <LuUtensils size={18} />,
  LuCar:              <LuCar size={18} />,
  LuHouse:            <LuHouse size={18} />,
  LuZap:              <LuZap size={18} />,
  LuHeartPulse:       <LuHeartPulse size={18} />,
  LuFilm:             <LuFilm size={18} />,
  LuShoppingBag:      <LuShoppingBag size={18} />,
  LuGraduationCap:    <LuGraduationCap size={18} />,
  LuPlane:            <LuPlane size={18} />,
  LuSmartphone:       <LuSmartphone size={18} />,
  LuPackage:          <LuPackage size={18} />,
  LuReceipt:          <LuReceipt size={18} />,
};

/**
 * Returns the icon element for the given name, or `fallback` if not found.
 * @param {string} name  – icon name string from DB (e.g. "LuBriefcase")
 * @param {React.ReactNode} fallback – element to render when name is unknown
 */
export const getIcon = (name, fallback = null) => ICON_MAP[name] ?? fallback;
