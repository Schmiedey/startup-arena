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
      const parallaxX = (mx - 0.5) * 50;
      const parallaxY = (my - 0.5) * 25;

      ctx.clearRect(0, 0, w, h);

      if (isDark) {
        const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, "rgba(4,3,18,1)");
        bgGrad.addColorStop(0.35, "rgba(8,6,24,1)");
        bgGrad.addColorStop(0.55, "rgba(14,8,22,1)");
        bgGrad.addColorStop(1, "rgba(6,4,14,1)");
        ctx.fillStyle = bgGrad;
      } else {
        const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, "rgba(252,250,248,1)");
        bgGrad.addColorStop(0.4, "rgba(249,246,243,1)");
        bgGrad.addColorStop(0.55, "rgba(247,244,239,1)");
        bgGrad.addColorStop(1, "rgba(244,240,234,1)");
        ctx.fillStyle = bgGrad;
      }
      ctx.fillRect(0, 0, w, h);

      const horizonY = h * 0.42 + parallaxY;
      const vanishX = w * 0.5 + parallaxX;
      const mobile = isMobile.current;

      // ─── Aurora / nebula (dark mode, desktop) ───
      if (isDark && !mobile) {
        for (let a = 0; a < 3; a++) {
          const auroraY = horizonY * (0.15 + a * 0.18);
          const drift = Math.sin(t * 0.00025 + a * 2.1) * 60;
          const spread = w * (0.5 + a * 0.15);
          const aGrad = ctx.createRadialGradient(
            vanishX + drift, auroraY, 0,
            vanishX + drift, auroraY, spread
          );
          const hue = a === 0 ? 270 : a === 1 ? 10 : 220;
          aGrad.addColorStop(0, `hsla(${hue},80%,50%,0.04)`);
          aGrad.addColorStop(0.4, `hsla(${hue},70%,40%,0.015)`);
          aGrad.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = aGrad;
          ctx.fillRect(0, 0, w, horizonY);
        }
      }

      // ─── Stars with twinkle (dark mode, desktop) ───
      if (isDark && !mobile) {
        const starCount = 120;
        for (let i = 0; i < starCount; i++) {
          const sx = ((i * 7919 + 13) % w);
          const sy = ((i * 7841 + 7) % (horizonY * 0.9));
          const twinkle = 0.2 + 0.8 * Math.abs(Math.sin(t * 0.0006 + i * 0.47));
          const ss = 0.3 + (i % 4) * 0.5;
          const brightness = (i % 5 === 0) ? 0.6 : 0.25;
          ctx.beginPath();
          ctx.arc(sx, sy, ss, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(200,185,230,${twinkle * brightness})`;
          ctx.fill();
          if (i % 8 === 0 && ss > 0.8) {
            ctx.beginPath();
            ctx.arc(sx, sy, ss * 3, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(180,160,220,${twinkle * 0.06})`;
            ctx.fill();
          }
        }
      }

      // ─── Multi-layer horizon glow ───
      const glowLayers = [
        { radius: w * 0.7, alpha: isDark ? 0.2 : 0.07, color: [220, 60, 30] },
        { radius: w * 0.4, alpha: isDark ? 0.12 : 0.04, color: [255, 100, 50] },
        { radius: w * 0.25, alpha: isDark ? 0.08 : 0.02, color: [255, 140, 60] },
      ];
      for (const layer of glowLayers) {
        const gGrad = ctx.createRadialGradient(
          vanishX, horizonY, 0,
          vanishX, horizonY, layer.radius
        );
        gGrad.addColorStop(0, `rgba(${layer.color[0]},${layer.color[1]},${layer.color[2]},${layer.alpha})`);
        gGrad.addColorStop(0.5, `rgba(${layer.color[0]},${Math.round(layer.color[1] * 0.7)},${layer.color[2]},${layer.alpha * 0.3})`);
        gGrad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = gGrad;
        ctx.fillRect(0, horizonY - h * 0.35, w, h * 0.7);
      }

      // ─── 3D perspective grid floor with terrain ───
      const gridColor = isDark ? [220, 60, 30] : [220, 80, 40];
      const gridLines = mobile ? 14 : 32;
      const gridSpacing = 0.11;

      for (let i = 0; i < gridLines; i++) {
        const d = 0.08 + i * gridSpacing;
        const perspY = horizonY + (h - horizonY) * (d * d);
        const perspAlpha = Math.min(1, (1 - d * 0.55)) * (isDark ? 0.3 : 0.12);
        const wave = mobile ? 0 : Math.sin(t * 0.0005 + i * 0.18) * 2.5;

        ctx.beginPath();
        ctx.moveTo(-50, perspY + wave);
        ctx.lineTo(w + 50, perspY + wave);
        const lineGrad = ctx.createLinearGradient(0, 0, w, 0);
        lineGrad.addColorStop(0, `rgba(${gridColor[0]},${gridColor[1]},${gridColor[2]},0)`);
        lineGrad.addColorStop(0.3, `rgba(${gridColor[0]},${gridColor[1]},${gridColor[2]},${perspAlpha})`);
        lineGrad.addColorStop(0.5, `rgba(${gridColor[0]},${gridColor[1]},${gridColor[2]},${perspAlpha * 1.3})`);
        lineGrad.addColorStop(0.7, `rgba(${gridColor[0]},${gridColor[1]},${gridColor[2]},${perspAlpha})`);
        lineGrad.addColorStop(1, `rgba(${gridColor[0]},${gridColor[1]},${gridColor[2]},0)`);
        ctx.strokeStyle = lineGrad;
        ctx.lineWidth = isDark ? (1.2 - d * 0.6) : (0.6 - d * 0.25);
        ctx.stroke();
      }

      // Vertical grid lines
      const vLines = mobile ? 10 : 24;
      for (let i = -vLines; i <= vLines; i++) {
        const normalX = i / vLines;
        const bottomX = vanishX + normalX * w * 0.95;
        const curve = mobile ? 0 : Math.sin(t * 0.00035 + i * 0.22) * 4;
        const edgeFade = 1 - Math.abs(normalX) * 0.6;
        const alpha = edgeFade * (isDark ? 0.2 : 0.07);

        ctx.beginPath();
        ctx.moveTo(vanishX + normalX * 15, horizonY);
        ctx.lineTo(bottomX + curve, h + 50);
        const vGrad = ctx.createLinearGradient(vanishX + normalX * 15, horizonY, bottomX + curve, h);
        vGrad.addColorStop(0, `rgba(${gridColor[0]},${gridColor[1]},${gridColor[2]},${alpha * 0.5})`);
        vGrad.addColorStop(0.3, `rgba(${gridColor[0]},${gridColor[1]},${gridColor[2]},${alpha})`);
        vGrad.addColorStop(1, `rgba(${gridColor[0]},${gridColor[1]},${gridColor[2]},0)`);
        ctx.strokeStyle = vGrad;
        ctx.lineWidth = isDark ? 0.9 : 0.5;
        ctx.stroke();
      }

      // ─── Holographic rings floating above grid ───
      if (!mobile && !prefersReducedMotion) {
        const rings = [
          { x: 0.35, y: 0.48, radius: 60, tilt: 0.35, speed: 0.0004, phase: 0 },
          { x: 0.65, y: 0.52, radius: 45, tilt: 0.28, speed: 0.00055, phase: 2.5 },
          { x: 0.5, y: 0.44, radius: 80, tilt: 0.4, speed: 0.0003, phase: 4.8 },
        ];
        for (const ring of rings) {
          const rx = ring.x * w + Math.sin(t * ring.speed + ring.phase) * 20 + parallaxX * 0.4;
          const ry = ring.y * h + Math.cos(t * ring.speed * 0.7 + ring.phase) * 12 + parallaxY * 0.25;
          const rotAngle = t * 0.0003 + ring.phase;
          const scaleY = Math.abs(Math.sin(rotAngle)) * ring.tilt + 0.15;

          ctx.save();
          ctx.translate(rx, ry);
          ctx.scale(1, scaleY);

          // Outer ring glow
          const ringAlpha = isDark ? 0.08 : 0.03;
          ctx.beginPath();
          ctx.arc(0, 0, ring.radius * 1.2, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${gridColor[0]},${gridColor[1]},${gridColor[2]},${ringAlpha})`;
          ctx.lineWidth = 4;
          ctx.stroke();

          // Main ring
          ctx.beginPath();
          ctx.arc(0, 0, ring.radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${gridColor[0]},${gridColor[1]},${gridColor[2]},${isDark ? 0.22 : 0.1})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();

          // Inner ring
          ctx.beginPath();
          ctx.arc(0, 0, ring.radius * 0.7, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${gridColor[0]},${gridColor[1]},${gridColor[2]},${isDark ? 0.1 : 0.04})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();

          ctx.restore();
        }
      }

      // ─── Floating 3D geometric shapes ───
      if (!mobile && !prefersReducedMotion) {
        const shapes = [
          { x: 0.18, y: 0.26, size: 44, type: "cube", speed: 0.0007, phase: 0, rotSpeed: 0.0005 },
          { x: 0.82, y: 0.2, size: 34, type: "pyramid", speed: 0.0009, phase: 2, rotSpeed: 0.00065 },
          { x: 0.1, y: 0.56, size: 24, type: "octahedron", speed: 0.001, phase: 4, rotSpeed: 0.0008 },
          { x: 0.9, y: 0.5, size: 28, type: "cube", speed: 0.00085, phase: 1, rotSpeed: 0.00055 },
          { x: 0.5, y: 0.14, size: 20, type: "diamond", speed: 0.0011, phase: 3, rotSpeed: 0.0007 },
          { x: 0.28, y: 0.72, size: 18, type: "pyramid", speed: 0.00095, phase: 5, rotSpeed: 0.0006 },
          { x: 0.72, y: 0.68, size: 22, type: "octahedron", speed: 0.00075, phase: 3.5, rotSpeed: 0.0005 },
        ];

        for (const shape of shapes) {
          const sx = shape.x * w + Math.sin(t * shape.speed + shape.phase) * 18 + parallaxX * 0.5;
          const sy = shape.y * h + Math.cos(t * shape.speed * 0.7 + shape.phase) * 14 + parallaxY * 0.3;
          const s = shape.size;
          const rot = t * shape.rotSpeed + shape.phase;
          const shapeAlpha = isDark ? 0.28 : 0.1;

          ctx.save();
          ctx.translate(sx, sy);

          // Shape glow
          if (isDark) {
            const glowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 2);
            glowGrad.addColorStop(0, `rgba(220,60,30,0.04)`);
            glowGrad.addColorStop(1, "rgba(220,60,30,0)");
            ctx.fillStyle = glowGrad;
            ctx.fillRect(-s * 2, -s * 2, s * 4, s * 4);
          }

          ctx.rotate(rot * 0.4);
          ctx.strokeStyle = isDark
            ? `rgba(220,60,30,${shapeAlpha})`
            : `rgba(220,80,40,${shapeAlpha})`;
          ctx.lineWidth = isDark ? 1.2 : 0.7;

          if (shape.type === "cube") {
            // Front face
            ctx.strokeRect(-s / 2, -s / 2, s, s);
            // Back face with 3D offset
            const offset = s * 0.35;
            ctx.strokeRect(-s / 2 + offset, -s / 2 - offset, s, s);
            // Connecting edges
            ctx.beginPath();
            ctx.moveTo(-s / 2, -s / 2); ctx.lineTo(-s / 2 + offset, -s / 2 - offset);
            ctx.moveTo(s / 2, -s / 2); ctx.lineTo(s / 2 + offset, -s / 2 - offset);
            ctx.moveTo(-s / 2, s / 2); ctx.lineTo(-s / 2 + offset, s / 2 - offset);
            ctx.moveTo(s / 2, s / 2); ctx.lineTo(s / 2 + offset, s / 2 - offset);
            ctx.stroke();
            // Subtle fill on front face
            if (isDark) {
              ctx.fillStyle = `rgba(220,60,30,0.02)`;
              ctx.fillRect(-s / 2, -s / 2, s, s);
            }
          } else if (shape.type === "pyramid") {
            // Front face
            ctx.beginPath();
            ctx.moveTo(0, -s);
            ctx.lineTo(-s * 0.7, s * 0.4);
            ctx.lineTo(s * 0.7, s * 0.4);
            ctx.closePath();
            ctx.stroke();
            // Base
            ctx.beginPath();
            ctx.moveTo(-s * 0.7, s * 0.4);
            ctx.lineTo(-s * 0.4, s * 0.7);
            ctx.lineTo(s * 0.4, s * 0.7);
            ctx.lineTo(s * 0.7, s * 0.4);
            ctx.closePath();
            ctx.stroke();
            // Back edges
            ctx.beginPath();
            ctx.moveTo(0, -s); ctx.lineTo(-s * 0.4, s * 0.7);
            ctx.moveTo(0, -s); ctx.lineTo(s * 0.4, s * 0.7);
            ctx.stroke();
          } else if (shape.type === "diamond") {
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
          } else if (shape.type === "octahedron") {
            // Top pyramid
            ctx.beginPath();
            ctx.moveTo(0, -s);
            ctx.lineTo(-s * 0.6, 0);
            ctx.lineTo(s * 0.6, 0);
            ctx.closePath();
            ctx.stroke();
            // Bottom pyramid
            ctx.beginPath();
            ctx.moveTo(0, s);
            ctx.lineTo(-s * 0.6, 0);
            ctx.lineTo(s * 0.6, 0);
            ctx.closePath();
            ctx.stroke();
            // Center cross
            ctx.beginPath();
            ctx.moveTo(-s * 0.6, 0); ctx.lineTo(s * 0.6, 0);
            ctx.stroke();
            // Inner horizontal
            ctx.beginPath();
            ctx.moveTo(-s * 0.3, 0); ctx.lineTo(s * 0.3, 0);
            ctx.strokeStyle = isDark ? `rgba(220,60,30,${shapeAlpha * 0.5})` : `rgba(220,80,40,${shapeAlpha * 0.5})`;
            ctx.stroke();
          }

          ctx.restore();
        }
      }

      // ─── Light beams from horizon ───
      if (isDark && !mobile) {
        const beamCount = 5;
        for (let i = 0; i < beamCount; i++) {
          const angle = (i / beamCount) * Math.PI * 0.6 - Math.PI * 0.3 + Math.PI / 2;
          const sway = Math.sin(t * 0.0002 + i * 1.8) * 0.05;
          const beamLen = h * 0.5;
          const beamWidth = 30 + Math.sin(t * 0.0004 + i) * 10;
          const endX = vanishX + Math.cos(angle + sway) * beamLen;
          const endY = horizonY + Math.sin(angle + sway) * beamLen * 0.3;

          ctx.save();
          ctx.beginPath();
          ctx.moveTo(vanishX - beamWidth * 0.1, horizonY);
          ctx.lineTo(vanishX + beamWidth * 0.1, horizonY);
          ctx.lineTo(endX + beamWidth, endY);
          ctx.lineTo(endX - beamWidth, endY);
          ctx.closePath();

          const beamGrad = ctx.createLinearGradient(vanishX, horizonY, endX, endY);
          beamGrad.addColorStop(0, `rgba(220,60,30,0.03)`);
          beamGrad.addColorStop(0.5, `rgba(220,80,40,0.01)`);
          beamGrad.addColorStop(1, "rgba(220,60,30,0)");
          ctx.fillStyle = beamGrad;
          ctx.fill();
          ctx.restore();
        }
      }

      // ─── Ember particles with trails ───
      const particleCount = mobile ? 20 : 60;
      for (let i = 0; i < particleCount; i++) {
        const seed = i * 4973 + 7;
        const px = ((seed * 13) % 1000) / 1000;
        const baseY = ((seed * 29) % 1000) / 1000;
        const speed = 0.00006 + (i % 8) * 0.000012;
        const drift = ((seed * 17) % 100) / 100 - 0.5;
        const pSize = mobile ? (0.6 + (i % 3) * 0.5) : (1.2 + (i % 5) * 0.4);
        const isHot = i % 5 === 0;

        const py = ((baseY - t * speed) % 1.3 + 1.3) % 1.3;
        const pxFinal = px * w + (mobile ? 0 : Math.sin(t * 0.0008 + i) * 35 * drift) + (mobile ? 0 : parallaxX * 0.3);
        const pyFinal = py * h + (mobile ? 0 : parallaxY * 0.15);

        if (pyFinal < horizonY + 20) continue;

        const fadeIn = Math.min(1, (pyFinal - horizonY) / 100);
        const fadeOut = pyFinal > h * 0.85 ? (1 - (pyFinal - h * 0.85) / (h * 0.15)) : 1;
        const alpha = fadeIn * fadeOut * (isDark ? 0.75 : 0.3);
        const hue = isHot ? 30 + (i % 8) : 15 + (i % 15);
        const lightness = isHot ? 70 : (isDark ? 60 : 50);

        // Particle trail
        if (!mobile && isHot) {
          const trailLen = 12;
          const trailDir = -1;
          ctx.beginPath();
          ctx.moveTo(pxFinal, pyFinal);
          ctx.lineTo(pxFinal + drift * 3, pyFinal + trailDir * trailLen);
          const trailGrad = ctx.createLinearGradient(pxFinal, pyFinal, pxFinal + drift * 3, pyFinal + trailLen);
          trailGrad.addColorStop(0, `hsla(${hue},90%,${lightness}%,${alpha * 0.5})`);
          trailGrad.addColorStop(1, `hsla(${hue},90%,${lightness}%,0)`);
          ctx.strokeStyle = trailGrad;
          ctx.lineWidth = pSize * 0.8;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(pxFinal, pyFinal, pSize, 0, Math.PI * 2);
        if (isDark) {
          ctx.fillStyle = `hsla(${hue},90%,${lightness}%,${alpha})`;
          if (!mobile) {
            ctx.shadowColor = `hsla(${hue},90%,55%,${alpha * (isHot ? 0.7 : 0.3)})`;
            ctx.shadowBlur = isHot ? 12 : 6;
          }
        } else {
          ctx.fillStyle = `hsla(${hue},85%,${lightness}%,${alpha})`;
          ctx.shadowColor = "transparent";
          ctx.shadowBlur = 0;
        }
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // ─── Scan line (dark mode, desktop) ───
      if (isDark && !mobile) {
        const scanY = ((t * 0.025) % (h + 300)) - 150;
        const scanGrad = ctx.createLinearGradient(0, scanY - 2, 0, scanY + 2);
        scanGrad.addColorStop(0, "rgba(220,60,30,0)");
        scanGrad.addColorStop(0.5, "rgba(220,60,30,0.04)");
        scanGrad.addColorStop(1, "rgba(220,60,30,0)");
        ctx.fillStyle = scanGrad;
        ctx.fillRect(0, scanY - 2, w, 4);
      }

      // ─── Depth fog gradient at floor ───
      const fogGrad = ctx.createLinearGradient(0, h * 0.65, 0, h);
      if (isDark) {
        fogGrad.addColorStop(0, "rgba(6,4,14,0)");
        fogGrad.addColorStop(0.6, "rgba(6,4,14,0.4)");
        fogGrad.addColorStop(1, "rgba(6,4,14,0.85)");
      } else {
        fogGrad.addColorStop(0, "rgba(244,240,234,0)");
        fogGrad.addColorStop(0.6, "rgba(244,240,234,0.5)");
        fogGrad.addColorStop(1, "rgba(244,240,234,0.9)");
      }
      ctx.fillStyle = fogGrad;
      ctx.fillRect(0, h * 0.65, w, h * 0.35);

      // ─── Top vignette ───
      const vigGrad = ctx.createLinearGradient(0, 0, 0, h * 0.35);
      if (isDark) {
        vigGrad.addColorStop(0, "rgba(4,3,18,0.6)");
        vigGrad.addColorStop(1, "rgba(4,3,18,0)");
      } else {
        vigGrad.addColorStop(0, "rgba(252,250,248,0.5)");
        vigGrad.addColorStop(1, "rgba(252,250,248,0)");
      }
      ctx.fillStyle = vigGrad;
      ctx.fillRect(0, 0, w, h * 0.35);

      // ─── Side vignettes for depth ───
      if (!mobile) {
        const sideVigL = ctx.createLinearGradient(0, 0, w * 0.15, 0);
        const sideVigR = ctx.createLinearGradient(w, 0, w * 0.85, 0);
        const vigAlpha = isDark ? 0.4 : 0.2;
        sideVigL.addColorStop(0, isDark ? `rgba(4,3,18,${vigAlpha})` : `rgba(252,250,248,${vigAlpha})`);
        sideVigL.addColorStop(1, "rgba(0,0,0,0)");
        sideVigR.addColorStop(0, isDark ? `rgba(4,3,18,${vigAlpha})` : `rgba(252,250,248,${vigAlpha})`);
        sideVigR.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = sideVigL;
        ctx.fillRect(0, 0, w * 0.15, h);
        ctx.fillStyle = sideVigR;
        ctx.fillRect(w * 0.85, 0, w * 0.15, h);
      }

      // ─── Subtle chromatic aberration / color split on horizon ───
      if (isDark && !mobile) {
        const caHeight = 3;
        ctx.globalCompositeOperation = "screen";
        ctx.fillStyle = "rgba(255,40,20,0.015)";
        ctx.fillRect(0, horizonY - caHeight, w, caHeight);
        ctx.fillStyle = "rgba(60,100,255,0.01)";
        ctx.fillRect(0, horizonY, w, caHeight);
        ctx.globalCompositeOperation = "source-over";
      }
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