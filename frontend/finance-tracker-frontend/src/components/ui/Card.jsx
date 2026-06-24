import React from "react";
import { motion } from "framer-motion";

export const Card = ({
  children,
  className = "",
  hover = false,
  padding = "p-4 md:p-5",
  ...props
}) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25 }}
    className={[
      "rounded-xl border bg-[var(--app-surface)] border-[var(--app-border)]",
      "shadow-[var(--shadow-card)]",
      hover ? "transition-shadow duration-200 hover:shadow-[var(--shadow-card-hover)]" : "",
      padding,
      className,
    ].join(" ")}
    {...props}
  >
    {children}
  </motion.div>
);

export default Card;
