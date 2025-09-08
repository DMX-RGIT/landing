"use client";

import { motion } from "motion/react";
import { ReactNode } from "react";

type FadeInProps = {
  children: ReactNode;
  delay?: number;
};

export default function FadeIn({ children, delay = 0 }: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.2, delay }}
      viewport={{ once: true }}
    >
      {children}
    </motion.div>
  );
}
