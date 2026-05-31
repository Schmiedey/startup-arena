"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useTheme } from "@/components/theme-provider";

function useReducedMotion() {
  const [reduced, setReduced] = useState(
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => {
      setReduced(e.matches);
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);
  return reduced;
}

export function LikelyrBackground({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const frameRef = useRef<number>(0);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const prefersReducedMotion = useReducedMotion();

  const isMobile = useRef(false);

  useEffect(() => {
    isMobile.current = window.innerWidth < 768;
    const handleResize = () => {
      isMobile.current = window.innerWidth < 768;
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const parallaxX = (mx - 0.5) * 40;
      const parallaxY = (my - 0.5) * 20;

      ctx.clearRect(0, 0, w, h);

      if (isDark) {
        const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, "rgba(5,5,15,1)");
        bgGrad.addColorStop(0.5, "rgba(10,8,20,1)");
        bgGrad.addColorStop(1, "rgba(8,5,12,1)");
        ctx.fillStyle = bgGrad;
      } else {
        const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, "rgba(250,248,246,1)");
        bgGrad.addColorStop(0.5, "rgba(248,245,242,1)");
        bgGrad.addColorStop(1, "rgba(245,240,235,1)");
        ctx.fillStyle = bgGrad;
      }
      ctx.fillRect(0, 0, w, h);

      const horizonY = h * 0.42 + parallaxY;
      const vanishX = w * 0.5 + parallaxX;

      const mobile = isMobile.current;

      // Stars / dust (dark mode only, skip on mobile)
      if (isDark && !mobile) {
        const starCount = 50;
        for (let i = 0; i < starCount; i++) {
          const sx = ((i * 7919 + 13) % w);
          const sy = ((i * 7841 + 7) % (horizonY * 0.85));
          const twinkle = 0.3 + 0.7 * Math.abs(Math.sin(t * 0.0008 + i * 0.5));
          const ss = 0.5 + (i % 3) * 0.5;
          ctx.beginPath();
          ctx.arc(sx, sy, ss, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(200,180,220,${twinkle * 0.4})`;
          ctx.fill();
        }
      }

      // Horizon glow
      const glowHeight = h * 0.35;
      const glowGrad = ctx.createRadialGradient(
        vanishX, horizonY, 0,
        vanishX, horizonY, w * 0.6
      );
      if (isDark) {
        glowGrad.addColorStop(0, "rgba(220,60,30,0.18)");
        glowGrad.addColorStop(0.3, "rgba(180,40,20,0.08)");
        glowGrad.addColorStop(1, "rgba(0,0,0,0)");
      } else {
        glowGrad.addColorStop(0, "rgba(220,80,40,0.08)");
        glowGrad.addColorStop(0.3, "rgba(220,80,40,0.03)");
        glowGrad.addColorStop(1, "rgba(0,0,0,0)");
      }
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, horizonY - glowHeight, w, glowHeight * 2);

      // 3D perspective grid floor (fewer lines on mobile)
      const gridColor = isDark ? [220, 60, 30] : [220, 80, 40];
      const gridLines = mobile ? 12 : 28;
      const gridSpacing = 0.12;

      for (let i = 0; i < gridLines; i++) {
        const d = 0.1 + i * gridSpacing;
        const perspY = horizonY + (h - horizonY) * (d * d);
        const perspAlpha = Math.min(1, (1 - d * 0.6)) * (isDark ? 0.25 : 0.12);
        const wave = mobile ? 0 : Math.sin(t * 0.0006 + i * 0.15) * 3;

        ctx.beginPath();
        ctx.moveTo(-50, perspY + wave);
        ctx.lineTo(w + 50, perspY + wave);
        ctx.strokeStyle = `rgba(${gridColor[0]},${gridColor[1]},${gridColor[2]},${perspAlpha})`;
        ctx.lineWidth = isDark ? (1 - d * 0.5) : (0.5 - d * 0.2);
        ctx.stroke();
      }

      // Vertical grid lines (fewer on mobile)
      const vLines = mobile ? 8 : 20;
      for (let i = -vLines; i <= vLines; i++) {
        const normalX = i / vLines;
        const bottomX = vanishX + normalX * w * 0.9;
        const curve = mobile ? 0 : Math.sin(t * 0.0004 + i * 0.2) * 5;
        const alpha = (1 - Math.abs(normalX) * 0.5) * (isDark ? 0.18 : 0.08);

        ctx.beginPath();
        ctx.moveTo(vanishX + normalX * 20, horizonY);
        ctx.lineTo(bottomX + curve, h + 50);
        ctx.strokeStyle = `rgba(${gridColor[0]},${gridColor[1]},${gridColor[2]},${alpha})`;
        ctx.lineWidth = isDark ? 0.8 : 0.5;
        ctx.stroke();
      }

      // Floating geometric shapes (skip on mobile)
      if (!mobile && !prefersReducedMotion) {
        const shapes = [
          { x: 0.18, y: 0.28, size: 40, type: "cube", speed: 0.0007, phase: 0 },
          { x: 0.82, y: 0.22, size: 30, type: "pyramid", speed: 0.0009, phase: 2 },
          { x: 0.12, y: 0.55, size: 22, type: "cube", speed: 0.001, phase: 4 },
          { x: 0.88, y: 0.48, size: 26, type: "pyramid", speed: 0.0008, phase: 1 },
          { x: 0.5, y: 0.15, size: 18, type: "diamond", speed: 0.0011, phase: 3 },
        ];

        for (const shape of shapes) {
          const sx = shape.x * w + Math.sin(t * shape.speed + shape.phase) * 15 + parallaxX * 0.5;
          const sy = shape.y * h + Math.cos(t * shape.speed * 0.7 + shape.phase) * 10 + parallaxY * 0.3;
          const s = shape.size;
          const rot = t * 0.0005 + shape.phase;
          const shapeAlpha = isDark ? 0.25 : 0.12;
          const shapeColor = isDark
            ? `rgba(220,60,30,${shapeAlpha})`
            : `rgba(220,80,40,${shapeAlpha})`;

          ctx.save();
          ctx.translate(sx, sy);
          ctx.rotate(rot * 0.3);
          ctx.strokeStyle = shapeColor;
          ctx.lineWidth = isDark ? 1 : 0.7;

          if (shape.type === "cube") {
            ctx.strokeRect(-s / 2, -s / 2, s, s);
            const offset = s * 0.3;
            ctx.strokeRect(-s / 2 + offset, -s / 2 - offset, s, s);
            ctx.beginPath();
            ctx.moveTo(-s / 2, -s / 2);
            ctx.lineTo(-s / 2 + offset, -s / 2 - offset);
            ctx.moveTo(s / 2, -s / 2);
            ctx.lineTo(s / 2 + offset, -s / 2 - offset);
            ctx.moveTo(-s / 2, s / 2);
            ctx.lineTo(-s / 2 + offset, s / 2 - offset);
            ctx.moveTo(s / 2, s / 2);
            ctx.lineTo(s / 2 + offset, s / 2 - offset);
            ctx.stroke();
          } else if (shape.type === "pyramid") {
            ctx.beginPath();
            ctx.moveTo(0, -s);
            ctx.lineTo(-s * 0.7, s * 0.4);
            ctx.lineTo(s * 0.7, s * 0.4);
            ctx.closePath();
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(-s * 0.7, s * 0.4);
            ctx.lineTo(-s * 0.4, s * 0.7);
            ctx.lineTo(s * 0.4, s * 0.7);
            ctx.lineTo(s * 0.7, s * 0.4);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, -s);
            ctx.lineTo(-s * 0.4, s * 0.7);
            ctx.moveTo(0, -s);
            ctx.lineTo(s * 0.4, s * 0.7);
            ctx.stroke();
          } else {
            ctx.beginPath();
            ctx.moveTo(0, -s);
            ctx.lineTo(s * 0.6, 0);
            ctx.lineTo(0, s * 0.6);
            ctx.lineTo(-s * 0.6, 0);
            ctx.closePath();
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, -s * 0.4);
            ctx.lineTo(s * 0.24, 0);
            ctx.lineTo(0, s * 0.24);
            ctx.lineTo(-s * 0.24, 0);
            ctx.closePath();
            ctx.stroke();
          }

          ctx.restore();
        }
      }

      // Ember particles (fewer on mobile)
      const particleCount = mobile ? 15 : 50;
      for (let i = 0; i < particleCount; i++) {
        const seed = i * 4973 + 7;
        const px = ((seed * 13) % 1000) / 1000;
        const baseY = ((seed * 29) % 1000) / 1000;
        const speed = 0.00008 + (i % 7) * 0.000015;
        const drift = ((seed * 17) % 100) / 100 - 0.5;
        const pSize = mobile ? (0.8 + (i % 3) * 0.4) : (1 + (i % 4) * 0.5);

        const py = ((baseY - t * speed) % 1.2 + 1.2) % 1.2;
        const pxFinal = px * w + (mobile ? 0 : Math.sin(t * 0.001 + i) * 30 * drift) + (mobile ? 0 : parallaxX * 0.3);
        const pyFinal = py * h + (mobile ? 0 : parallaxY * 0.15);

        if (pyFinal < horizonY + 20) continue;

        const fadeIn = Math.min(1, (pyFinal - horizonY) / 80);
        const fadeOut = pyFinal > h * 0.85 ? (1 - (pyFinal - h * 0.85) / (h * 0.15)) : 1;
        const alpha = fadeIn * fadeOut * (isDark ? 0.7 : 0.35);
        const hue = 15 + (i % 12);

        ctx.beginPath();
        ctx.arc(pxFinal, pyFinal, pSize, 0, Math.PI * 2);
        if (isDark) {
          ctx.fillStyle = `hsla(${hue},90%,60%,${alpha})`;
          ctx.shadowColor = `hsla(${hue},90%,55%,${alpha * 0.5})`;
          ctx.shadowBlur = mobile ? 0 : 8;
        } else {
          ctx.fillStyle = `hsla(${hue},85%,50%,${alpha})`;
          ctx.shadowColor = "transparent";
          ctx.shadowBlur = 0;
        }
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Scan line (skip on mobile)
      if (isDark && !mobile) {
        const scanY = ((t * 0.02) % (h + 200)) - 100;
        const scanGrad = ctx.createLinearGradient(0, scanY - 1, 0, scanY + 1);
        scanGrad.addColorStop(0, "rgba(220,60,30,0)");
        scanGrad.addColorStop(0.5, "rgba(220,60,30,0.04)");
        scanGrad.addColorStop(1, "rgba(220,60,30,0)");
        ctx.fillStyle = scanGrad;
        ctx.fillRect(0, scanY - 1, w, 2);
      }

      // Atmospheric fog at bottom
      const fogGrad = ctx.createLinearGradient(0, h * 0.75, 0, h);
      if (isDark) {
        fogGrad.addColorStop(0, "rgba(7,7,17,0)");
        fogGrad.addColorStop(1, "rgba(7,7,17,0.6)");
      } else {
        fogGrad.addColorStop(0, "rgba(248,245,242,0)");
        fogGrad.addColorStop(1, "rgba(248,245,242,0.8)");
      }
      ctx.fillStyle = fogGrad;
      ctx.fillRect(0, h * 0.75, w, h * 0.25);

      // Top vignette
      const vigGrad = ctx.createLinearGradient(0, 0, 0, h * 0.3);
      if (isDark) {
        vigGrad.addColorStop(0, "rgba(5,5,15,0.5)");
        vigGrad.addColorStop(1, "rgba(5,5,15,0)");
      } else {
        vigGrad.addColorStop(0, "rgba(250,248,246,0.4)");
        vigGrad.addColorStop(1, "rgba(250,248,246,0)");
      }
      ctx.fillStyle = vigGrad;
      ctx.fillRect(0, 0, w, h * 0.3);
    },
    [isDark, prefersReducedMotion]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (prefersReducedMotion) {
      const ctx = canvas.getContext("2d", { alpha: false })!;
      if (!ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
      draw(ctx, w, h, 0);
      return;
    }

    const ctx = canvas.getContext("2d", { alpha: false })!;
    if (!ctx) return;

    let w = 0;
    let h = 0;

    function resize() {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
    }

    resize();
    window.addEventListener("resize", resize);

    function onMouseMove(e: MouseEvent) {
      mouseRef.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      };
    }
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    let animId: number;
    function loop(t: number) {
      draw(ctx, w, h, t);
      animId = requestAnimationFrame(loop);
    }
    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      frameRef.current = animId;
    };
  }, [draw, prefersReducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none fixed inset-0 h-full w-full ${className ?? ""}`}
      style={{ zIndex: 0 }}
    />
  );
}