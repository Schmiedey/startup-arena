"use client";

import { useEffect, useRef, useState, ReactNode } from "react";

type AnimationType = "reveal-up" | "reveal-left" | "reveal-right" | "reveal-scale" | "slide-up";

interface ScrollRevealProps {
  children: ReactNode;
  animation?: AnimationType;
  delay?: number;
  className?: string;
  threshold?: number;
}

export function ScrollReveal({
  children,
  animation = "reveal-up",
  delay = 0,
  className = "",
  threshold = 0.15,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  const animClass = visible ? `animate-${animation}` : "opacity-0";

  return (
    <div
      ref={ref}
      className={`${animClass} ${className}`}
      style={visible ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}