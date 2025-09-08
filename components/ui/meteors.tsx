"use client";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import React, { useEffect, useState } from "react";

type MeteorProps = {
  number?: number;
  className?: string;
};

export const Meteors = ({ number = 20, className }: MeteorProps) => {
  const [randoms, setRandoms] = useState<{ delay: string; duration: string }[]>(
    []
  );

  useEffect(() => {
    // Generate random values only once on client
    const values = Array.from({ length: number }, () => ({
      delay: Math.random() * 70 + "s",
      duration: Math.floor(Math.random() * (7 - 5) + 5) + "s",
    }));
    setRandoms(values);
  }, [number]);

  if (randoms.length === 0) return null; // Prevent SSR mismatch

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {randoms.map((rand, idx) => {
        const position = idx * (1500 / number) - 500;

        return (
          <span
            key={"meteor" + idx}
            className={cn(
              "animate-meteor-effect absolute h-[1.5px] w-[1.5px] rotate-[40deg] rounded-[9999px] bg-slate-500 shadow-[0_0_0_1px_#ffffff10]",
              "before:absolute before:top-1/2 before:h-[2px] before:w-[50px] before:-translate-y-[50%] before:transform before:bg-gradient-to-r before:from-[#64748b] before:to-transparent before:content-['']",
              className
            )}
            style={{
              top: "-40px",
              left: position + "px",
              animationDelay: rand.delay,
              animationDuration: rand.duration,
            }}
          />
        );
      })}
    </motion.div>
  );
};
