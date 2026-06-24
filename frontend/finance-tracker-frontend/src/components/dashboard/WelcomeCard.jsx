import React from "react";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { formatINR } from "../../utils/format";

const WelcomeCard = ({ balance, userName }) => {
  const user = useSelector((state) => state.user);
  const name = userName || user?.userName || "there";
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--app-primary)] via-indigo-600 to-[var(--app-secondary)] text-white p-5 md:p-6 shadow-xl"
    >
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
      <div className="absolute -right-4 bottom-0 h-20 w-20 rounded-full bg-white/5" />
      <div className="relative">
        <div className="flex items-center gap-2 text-white/80 text-sm">
          <Sparkles size={16} />
          <span>{greeting}</span>
        </div>
        <h2 className="mt-1 text-xl md:text-2xl font-bold tracking-tight">
          Welcome back, {name.split(" ")[0]}!
        </h2>
        <p className="mt-3 text-sm text-white/80">Current balance</p>
        <p className="text-3xl md:text-4xl font-extrabold tracking-tight mt-0.5">
          {formatINR(balance)}
        </p>
      </div>
    </motion.div>
  );
};

export default WelcomeCard;
