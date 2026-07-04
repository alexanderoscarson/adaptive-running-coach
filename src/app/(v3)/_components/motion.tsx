"use client";

import {
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type Variants,
} from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";

/* Shared motion primitives for the v3 surface. Everything respects
   prefers-reduced-motion via framer's useReducedMotion. */

export const EASE = [0.16, 1, 0.3, 1] as const;

const revealVariants: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0 },
};

export function Reveal({
  children,
  delay = 0,
  className,
  as = "div",
  y = 26,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "span" | "header";
  y?: number;
}) {
  const MotionTag = motion[as];
  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-70px" }}
      variants={{ hidden: { opacity: 0, y }, show: { opacity: 1, y: 0 } }}
      transition={{ duration: 0.7, ease: EASE, delay }}
    >
      {children}
    </MotionTag>
  );
}

/** Staggered children: wrap items in <StaggerItem>. */
export function Stagger({
  children,
  className,
  stagger = 0.07,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      transition={{ staggerChildren: stagger, delayChildren: delay }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={revealVariants}
      transition={{ duration: 0.6, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** Animated number — counts up when scrolled into view. */
export function CountUp({
  to,
  className,
  duration = 1.4,
  suffix = "",
}: {
  to: number;
  className?: string;
  duration?: number;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduced = useReducedMotion();
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { duration: duration * 1000, bounce: 0 });
  const rounded = useTransform(spring, (v) => Math.round(v).toLocaleString("sv-SE"));

  useEffect(() => {
    if (inView) mv.set(to);
  }, [inView, to, mv]);

  if (reduced) {
    return (
      <span ref={ref} className={className}>
        {to.toLocaleString("sv-SE")}
        {suffix}
      </span>
    );
  }
  return (
    <span ref={ref} className={className}>
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  );
}

/** Word-by-word rise for display headlines. */
export function SplitWords({
  text,
  className,
  wordClassName,
  delay = 0,
  stagger = 0.055,
}: {
  text: string;
  className?: string;
  wordClassName?: string;
  delay?: number;
  stagger?: number;
}) {
  const words = text.split(" ");
  return (
    <span className={className} aria-label={text} role="text">
      {words.map((w, i) => (
        <span
          key={i}
          className={`inline-block overflow-hidden pb-[0.08em] -mb-[0.08em] pt-[0.14em] -mt-[0.14em] align-bottom ${
            i < words.length - 1 ? "mr-[0.22em]" : ""
          }`}
        >
          <motion.span
            className={`inline-block ${wordClassName ?? ""}`}
            initial={{ y: "110%", rotate: 3 }}
            animate={{ y: "0%", rotate: 0 }}
            transition={{ duration: 0.9, ease: EASE, delay: delay + i * stagger }}
            aria-hidden
          >
            {w}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
