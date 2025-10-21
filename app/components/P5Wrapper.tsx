"use client";

import React, { useRef, useEffect } from "react";
import type p5Type from "p5";

interface P5Instance {
  remove: () => void;
  updateWithProps?: (props: Record<string, unknown>) => void;
}

interface P5WrapperProps {
  sketch: (p: p5Type, props: Record<string, unknown>) => void;
  [key: string]: unknown;
}

export const P5Wrapper: React.FC<P5WrapperProps> = ({ sketch, ...props }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const p5InstanceRef = useRef<P5Instance | null>(null);
  const sketchRef = useRef(sketch);
  const propsRef = useRef(props);

  useEffect(() => {
    sketchRef.current = sketch;
  }, [sketch]);

  useEffect(() => {
    propsRef.current = props;
  }, [props]);

  useEffect(() => {
    let mounted = true;

    import("p5").then((p5Module) => {
      if (!mounted || !canvasRef.current || p5InstanceRef.current) return;

      const p5 = p5Module.default;
      const sketchFunction = (p: p5Type) => {
        sketchRef.current(p, propsRef.current);
      };

      p5InstanceRef.current = new p5(
        sketchFunction,
        canvasRef.current
      ) as P5Instance;
    });

    return () => {
      mounted = false;
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
        p5InstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (p5InstanceRef.current && p5InstanceRef.current.updateWithProps) {
      p5InstanceRef.current.updateWithProps(propsRef.current);
    }
  }, [props]);

  const canvasSize = (props as { canvasSize?: { width: number; height: number } }).canvasSize;

  return (
    <div
      ref={canvasRef}
      className="cursor-grab active:cursor-grabbing"
      style={canvasSize ? { width: canvasSize.width, height: canvasSize.height } : {}}
    />
  );
};
