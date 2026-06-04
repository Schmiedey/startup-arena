"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useTheme } from "@/components/theme-provider";

function useReducedMotion() {
  const [reduced, setReduced] = useState(
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);
  return reduced;
}

const SAAS_LEFT = {
  name: "CloudSync",
  tag: "AI · SaaS",
  elo: 1247,
  color: "#3b82f6",
  glow: "rgba(59,130,246,0.3)",
};

const SAAS_RIGHT = {
  name: "MailCraft",
  tag: "Creator Tools",
  elo: 1189,
  color: "#dc2626",
  glow: "rgba(220,60,30,0.3)",
};

export function BattleScene3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const prefersReducedMotion = useReducedMotion();
  const isMobileRef = useRef(false);

  useEffect(() => {
    isMobileRef.current = window.innerWidth < 768;
    const handleResize = () => { isMobileRef.current = window.innerWidth < 768; };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
      ctx.clearRect(0, 0, w, h);

      const mobile = isMobileRef.current;
      const centerX = w / 2;
      const centerY = h / 2;
      const cardW = mobile ? w * 0.38 : w * 0.32;
      const cardH = mobile ? h * 0.55 : h * 0.65;
      const gap = mobile ? w * 0.08 : w * 0.06;

      const floatLeft = prefersReducedMotion ? 0 : Math.sin(t * 0.001) * 6;
      const floatRight = prefersReducedMotion ? 0 : Math.cos(t * 0.001) * 6;
      const tiltLeft = prefersReducedMotion ? 0 : Math.sin(t * 0.0008) * 0.03;
      const tiltRight = prefersReducedMotion ? 0 : Math.cos(t * 0.0008) * -0.03;

      const leftX = centerX - gap - cardW / 2;
      const rightX = centerX + gap + cardW / 2;

      ctx.save();

      const drawCard = (
        x: number,
        y: number,
        cw: number,
        ch: number,
        tilt: number,
        floatY: number,
        saas: typeof SAAS_LEFT,
        side: "left" | "right"
      ) => {
        const cardY = y - ch / 2 + floatY;

        ctx.save();
        ctx.translate(x, cardY + ch / 2);
        ctx.rotate(tilt);
        ctx.translate(-x, -(cardY + ch / 2));

        const cardRadius = mobile ? 12 : 16;

        ctx.beginPath();
        ctx.roundRect(x - cw / 2, cardY, cw, ch, cardRadius);

        if (isDark) {
          const cardGrad = ctx.createLinearGradient(x - cw / 2, cardY, x + cw / 2, cardY + ch);
          cardGrad.addColorStop(0, "rgba(20,18,30,0.92)");
          cardGrad.addColorStop(0.5, "rgba(25,22,35,0.88)");
          cardGrad.addColorStop(1, "rgba(18,15,28,0.92)");
          ctx.fillStyle = cardGrad;
        } else {
          const cardGrad = ctx.createLinearGradient(x - cw / 2, cardY, x + cw / 2, cardY + ch);
          cardGrad.addColorStop(0, "rgba(255,255,255,0.92)");
          cardGrad.addColorStop(1, "rgba(248,245,242,0.88)");
          ctx.fillStyle = cardGrad;
        }
        ctx.fill();

        ctx.strokeStyle = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.shadowColor = saas.glow;
        ctx.shadowBlur = 30;
        ctx.beginPath();
        ctx.roundRect(x - cw / 2, cardY, cw, ch, cardRadius);
        ctx.strokeStyle = saas.color + "40";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.shadowBlur = 0;

        const fontSize = mobile ? 14 : 18;
        const smallFont = mobile ? 9 : 11;
        const tagFont = mobile ? 7 : 8;
        const eloFont = mobile ? 22 : 30;

        ctx.textAlign = "center";
        ctx.fillStyle = isDark ? "rgba(255,255,255,0.95)" : "rgba(0,0,0,0.9)";
        ctx.font = `800 ${fontSize}px system-ui, -apple-system, sans-serif`;
        ctx.fillText(saas.name, x, cardY + ch * 0.18);

        ctx.fillStyle = saas.color;
        ctx.font = `700 ${tagFont}px system-ui, -apple-system, sans-serif`;
        ctx.letterSpacing = "0.1em";
        ctx.fillText(saas.tag.toUpperCase(), x, cardY + ch * 0.28);

        ctx.fillStyle = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";
        ctx.fillRect(x - cw * 0.35, cardY + ch * 0.35, cw * 0.7, 2);

        ctx.fillStyle = isDark ? "rgba(160,140,180,0.3)" : "rgba(100,90,80,0.15)";
        ctx.fillRect(x - cw * 0.38, cardY + ch * 0.42, cw * 0.55, mobile ? 3 : 4);
        ctx.fillRect(x - cw * 0.38, cardY + ch * 0.48, cw * 0.4, mobile ? 3 : 4);
        ctx.fillRect(x - cw * 0.38, cardY + ch * 0.54, cw * 0.48, mobile ? 3 : 4);

        const barCount = mobile ? 3 : 4;
        for (let i = 0; i < barCount; i++) {
          const barY = cardY + ch * 0.62 + i * (mobile ? 8 : 10);
          const barLabelW = cw * 0.2;
          const barFullW = cw * 0.35;
          const fillPcts = [0.82, 0.65, 0.91, 0.47];
          
          ctx.fillStyle = isDark ? "rgba(160,140,180,0.2)" : "rgba(100,90,80,0.06)";
          ctx.fillRect(x - cw * 0.38, barY, barLabelW, barLabelW * 0.4);
          ctx.fillRect(x + cw * 0.02, barY, barFullW, mobile ? 3 : 4);

          ctx.fillStyle = saas.color + "60";
          ctx.fillRect(x + cw * 0.02, barY, barFullW * fillPcts[i], mobile ? 3 : 4);
        }

        ctx.fillStyle = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.04)";
        ctx.fillRect(x - cw * 0.35, cardY + ch * 0.82, cw * 0.7, 1);

        ctx.fillStyle = saas.color;
        ctx.font = `900 ${eloFont}px system-ui, -apple-system, sans-serif`;
        ctx.fillText(String(saas.elo), x, cardY + ch * 0.92);

        ctx.fillStyle = isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.3)";
        ctx.font = `600 ${smallFont}px system-ui, -apple-system, sans-serif`;
        ctx.fillText("ELO", x, cardY + ch * 0.97);

        if (!prefersReducedMotion) {
          const sparks = side === "left" ? 5 : 5;
          for (let i = 0; i < sparks; i++) {
            const angle = (side === "left" ? Math.PI : 0) + Math.sin(t * 0.003 + i * 1.2) * 0.6;
            const dist = cw * 0.55 + Math.sin(t * 0.002 + i * 2) * cw * 0.1;
            const sparkX = x + Math.cos(angle) * dist;
            const sparkY = cardY + ch * (0.2 + i * 0.12) + Math.cos(t * 0.004 + i) * 5;
            const sparkAlpha = 0.3 + 0.3 * Math.sin(t * 0.005 + i * 0.8);
            const sparkSize = mobile ? 1.5 : 2;

            ctx.beginPath();
            ctx.arc(sparkX, sparkY, sparkSize, 0, Math.PI * 2);
            ctx.fillStyle = saas.color + Math.round(sparkAlpha * 255).toString(16).padStart(2, "0");
            ctx.fill();
          }
        }

        ctx.restore();
      };

      drawCard(leftX, centerY, cardW, cardH, tiltLeft, floatLeft, SAAS_LEFT, "left");
      drawCard(rightX, centerY, cardW, cardH, tiltRight, floatRight, SAAS_RIGHT, "right");

      const vsPulse = prefersReducedMotion ? 0.9 : 0.8 + 0.2 * Math.sin(t * 0.003);

      ctx.save();
      ctx.globalAlpha = vsPulse;

      const vsSize = mobile ? 32 : 44;
      ctx.beginPath();
      ctx.arc(centerX, centerY, vsSize, 0, Math.PI * 2);
      const vsGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, vsSize);
      vsGrad.addColorStop(0, isDark ? "rgba(220,60,30,0.2)" : "rgba(220,60,30,0.12)");
      vsGrad.addColorStop(1, "rgba(220,60,30,0)");
      ctx.fillStyle = vsGrad;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(centerX, centerY, vsSize * 0.7, 0, Math.PI * 2);
      const vsGrad2 = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, vsSize * 0.7);
      vsGrad2.addColorStop(0, isDark ? "rgba(220,60,30,0.35)" : "rgba(220,60,30,0.2)");
      vsGrad2.addColorStop(1, "rgba(220,60,30,0)");
      ctx.fillStyle = vsGrad2;
      ctx.fill();

      ctx.fillStyle = isDark ? "rgba(220,60,30,0.9)" : "rgba(220,60,30,0.85)";
      ctx.font = `900 ${mobile ? 20 : 28}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("VS", centerX, centerY);
      ctx.globalAlpha = 1;
      ctx.restore();

      if (!prefersReducedMotion) {
        for (let i = 0; i < 12; i++) {
          const sparkAngle = (t * 0.001 + i * (Math.PI * 2 / 12));
          const sparkDist = vsSize * 1.2 + Math.sin(t * 0.004 + i) * (mobile ? 8 : 14);
          const sx = centerX + Math.cos(sparkAngle) * sparkDist;
          const sy = centerY + Math.sin(sparkAngle) * sparkDist;
          const sparkAlpha = 0.15 + 0.15 * Math.sin(t * 0.006 + i * 0.5);

          ctx.beginPath();
          ctx.arc(sx, sy, mobile ? 1.5 : 2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(220,60,30,${sparkAlpha})`;
          ctx.fill();
        }

        const beamCount = 6;
        for (let i = 0; i < beamCount; i++) {
          const beamY = centerY - cardH * 0.25 + (i / (beamCount - 1)) * cardH * 0.5;
          const beamOffset = Math.sin(t * 0.003 + i * 0.5) * 3;
          const beamAlpha = 0.03 + 0.02 * Math.sin(t * 0.004 + i);

          ctx.save();
          ctx.beginPath();
          ctx.moveTo(leftX + cardW / 2 + 5, beamY + beamOffset);
          ctx.lineTo(centerX - vsSize, beamY + beamOffset + (Math.random() > 0.5 ? 2 : -2));
          ctx.strokeStyle = SAAS_LEFT.color + Math.round(beamAlpha * 255).toString(16).padStart(2, "0");
          ctx.lineWidth = 0.5;
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(rightX - cardW / 2 - 5, beamY + beamOffset);
          ctx.lineTo(centerX + vsSize, beamY + beamOffset + (Math.random() > 0.5 ? 2 : -2));
          ctx.strokeStyle = SAAS_RIGHT.color + Math.round(beamAlpha * 255).toString(16).padStart(2, "0");
          ctx.lineWidth = 0.5;
          ctx.stroke();
          ctx.restore();
        }
      }

      ctx.restore();
    },
    [isDark, prefersReducedMotion]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (prefersReducedMotion) {
      const ctx = canvas.getContext("2d", { alpha: true });
      if (!ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      draw(ctx, rect.width, rect.height, 0);
      return;
    }

    const ctxRaw = canvas.getContext("2d", { alpha: true });
    if (!ctxRaw) return;
    const ctx: CanvasRenderingContext2D = ctxRaw;

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

    let animId: number;
    function loop(t: number) {
      draw(ctx, w, h, t);
      animId = requestAnimationFrame(loop);
    }
    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      frameRef.current = animId;
    };
  }, [draw, prefersReducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none h-full w-full"
      style={{ imageRendering: "auto" }}
    />
  );
}