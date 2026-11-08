import React, { useEffect, useRef, useState } from "react";
import { Eraser, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SignaturePad({ onChange }) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const drawingRef = useRef(false);
  const historyRef = useRef([]);
  const [hasInk, setHasInk] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
    const ctx = canvas.getContext("2d");
    ctx.scale(ratio, ratio);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0f172a";
    ctxRef.current = ctx;
  }, []);

  const point = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const start = (event) => {
    event.preventDefault();
    const ctx = ctxRef.current;
    if (!ctx) return;
    try {
      canvasRef.current.setPointerCapture?.(event.pointerId);
    } catch (captureError) {
      // Ignore browsers that reject capture for an inactive pointer id.
    }
    historyRef.current.push(canvasRef.current.toDataURL("image/png"));
    drawingRef.current = true;
    const { x, y } = point(event);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 0.2, y + 0.2);
    ctx.stroke();
    setHasInk(true);
  };

  const move = (event) => {
    if (!drawingRef.current) return;
    event.preventDefault();
    const ctx = ctxRef.current;
    if (!ctx) return;
    const { x, y } = point(event);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const finish = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    onChange(canvasRef.current.toDataURL("image/png"));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);
    historyRef.current = [];
    setHasInk(false);
    onChange(null);
  };

  const undo = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    const previous = historyRef.current.pop();
    const rect = canvas.getBoundingClientRect();
    if (!previous) {
      clear();
      return;
    }
    const image = new Image();
    image.onload = () => {
      ctx.clearRect(0, 0, rect.width, rect.height);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, rect.width, rect.height);
      ctx.drawImage(image, 0, 0, rect.width, rect.height);
      const remaining = historyRef.current.length > 0;
      setHasInk(remaining);
      onChange(remaining ? canvas.toDataURL("image/png") : null);
    };
    image.src = previous;
  };

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-xl border border-border/80 bg-white">
        <canvas
          ref={canvasRef}
          className="h-36 w-full touch-none"
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={finish}
          onPointerLeave={finish}
          onPointerCancel={finish}
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] text-muted-foreground">
          {hasInk ? "Signature captured — save it below." : "Draw your signature using a mouse, stylus or finger."}
        </p>
        <div className="flex gap-1">
          <Button type="button" variant="ghost" size="sm" className="gap-1.5" onClick={undo} disabled={!hasInk}>
            <Undo2 className="h-3.5 w-3.5" /> Undo
          </Button>
          <Button type="button" variant="ghost" size="sm" className="gap-1.5" onClick={clear} disabled={!hasInk}>
            <Eraser className="h-3.5 w-3.5" /> Clear
          </Button>
        </div>
      </div>
    </div>
  );
}