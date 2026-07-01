/** 业务说明：公开看板动态信号背景，用 Canvas 绘制轻量网格、扫描线和节点连接。 */
import { useEffect, useRef } from "react";

interface SignalNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  phase: number;
}

/** 业务说明：渲染不参与交互的背景画布，为公开监测页提供高端但克制的信号氛围。 */
export function SignalCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: true });
    if (!canvas || !context) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0;
    let height = 0;
    let dpr = 1;
    let frame = 0;
    let rafId = 0;
    let nodes: SignalNode[] = [];

    const seedNodes = () => {
      const count = Math.max(34, Math.min(86, Math.floor((width * height) / 27000)));
      nodes = Array.from({ length: count }, (_, index) => {
        const column = (index % 12) / 12;
        const row = Math.floor(index / 12) / Math.ceil(count / 12);
        return {
          x: width * (0.08 + column * 0.88) + (Math.random() - 0.5) * 52,
          y: height * (0.1 + row * 0.8) + (Math.random() - 0.5) * 42,
          vx: (Math.random() - 0.5) * 0.16,
          vy: (Math.random() - 0.5) * 0.12,
          size: Math.random() > 0.76 ? 2 : 1.2,
          phase: Math.random() * Math.PI * 2,
        };
      });
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      seedNodes();
    };

    const drawGrid = () => {
      context.save();
      context.lineWidth = 1;
      context.strokeStyle = "rgba(125, 211, 199, 0.055)";
      for (let x = 0; x <= width; x += 64) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, height);
        context.stroke();
      }
      for (let y = 0; y <= height; y += 64) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(width, y);
        context.stroke();
      }

      context.strokeStyle = "rgba(245, 158, 11, 0.055)";
      for (let x = -height; x < width; x += 220) {
        context.beginPath();
        context.moveTo(x, height);
        context.lineTo(x + height * 0.72, 0);
        context.stroke();
      }
      context.restore();
    };

    const drawWaveLanes = (time: number) => {
      const lanes = [0.22, 0.38, 0.56, 0.72];
      lanes.forEach((lane, laneIndex) => {
        const yBase = height * lane;
        const color = laneIndex % 2 === 0 ? "94, 234, 212" : "251, 191, 36";
        context.beginPath();
        for (let x = -20; x <= width + 20; x += 16) {
          const amplitude = 14 + laneIndex * 4;
          const y =
            yBase +
            Math.sin(x * 0.012 + time * (0.0015 + laneIndex * 0.0003)) * amplitude +
            Math.sin(x * 0.028 - time * 0.001) * 5;
          if (x === -20) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        context.strokeStyle = `rgba(${color}, ${laneIndex === 0 ? 0.18 : 0.1})`;
        context.lineWidth = laneIndex === 0 ? 1.4 : 1;
        context.stroke();
      });
    };

    const drawNodes = (time: number) => {
      nodes.forEach((node) => {
        if (!reducedMotion.matches) {
          node.x += node.vx;
          node.y += node.vy;
          if (node.x < -20) node.x = width + 20;
          if (node.x > width + 20) node.x = -20;
          if (node.y < -20) node.y = height + 20;
          if (node.y > height + 20) node.y = -20;
        }
      });

      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const left = nodes[i];
          const right = nodes[j];
          const distance = Math.hypot(left.x - right.x, left.y - right.y);
          if (distance > 148) continue;
          const alpha = (1 - distance / 148) * 0.1;
          context.strokeStyle = `rgba(94, 234, 212, ${alpha})`;
          context.lineWidth = 1;
          context.beginPath();
          context.moveTo(left.x, left.y);
          context.lineTo(right.x, right.y);
          context.stroke();
        }
      }

      nodes.forEach((node) => {
        const pulse = 0.42 + Math.sin(time * 0.002 + node.phase) * 0.25;
        context.fillStyle = `rgba(204, 251, 241, ${0.3 + pulse * 0.25})`;
        context.fillRect(node.x - node.size / 2, node.y - node.size / 2, node.size, node.size);
      });
    };

    const drawSweep = (time: number) => {
      const x = ((time * 0.035) % (width + 280)) - 140;
      const gradient = context.createLinearGradient(x - 80, 0, x + 80, 0);
      gradient.addColorStop(0, "rgba(94, 234, 212, 0)");
      gradient.addColorStop(0.5, "rgba(94, 234, 212, 0.13)");
      gradient.addColorStop(1, "rgba(94, 234, 212, 0)");
      context.fillStyle = gradient;
      context.fillRect(x - 80, 0, 160, height);

      context.strokeStyle = "rgba(251, 191, 36, 0.12)";
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(x + 38, height * 0.08);
      context.lineTo(x - 110, height * 0.92);
      context.stroke();
    };

    const draw = (time = 0) => {
      frame += 1;
      context.clearRect(0, 0, width, height);
      context.fillStyle = "#020403";
      context.fillRect(0, 0, width, height);

      const wash = context.createLinearGradient(0, 0, width, height);
      wash.addColorStop(0, "rgba(20, 184, 166, 0.11)");
      wash.addColorStop(0.32, "rgba(2, 4, 3, 0)");
      wash.addColorStop(0.68, "rgba(251, 191, 36, 0.06)");
      wash.addColorStop(1, "rgba(244, 63, 94, 0.055)");
      context.fillStyle = wash;
      context.fillRect(0, 0, width, height);

      drawGrid();
      drawWaveLanes(time);
      drawNodes(time);
      if (!reducedMotion.matches) drawSweep(time);

      context.fillStyle = "rgba(0, 0, 0, 0.34)";
      context.fillRect(0, 0, width, height);
      if (!reducedMotion.matches && frame % 2 === 0) {
        context.fillStyle = "rgba(255, 255, 255, 0.012)";
        for (let y = 0; y < height; y += 4) context.fillRect(0, y, width, 1);
      }
    };

    const loop = (time: number) => {
      draw(time);
      rafId = window.requestAnimationFrame(loop);
    };

    resize();
    draw();
    if (!reducedMotion.matches) rafId = window.requestAnimationFrame(loop);
    window.addEventListener("resize", resize);

    const handleMotionChange = () => {
      window.cancelAnimationFrame(rafId);
      draw();
      if (!reducedMotion.matches) rafId = window.requestAnimationFrame(loop);
    };
    reducedMotion.addEventListener("change", handleMotionChange);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      reducedMotion.removeEventListener("change", handleMotionChange);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 h-full w-full" />;
}
