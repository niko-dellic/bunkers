// import { P5Wrapper } from "@p5-wrapper/react";
import { useState, useRef, useEffect } from "react";

import { ReactP5Wrapper } from "@p5-wrapper/react";

function sketch(updateBounds) {
  return (p) => {
    let isDrawing = false;
    const interval = 12;
    const offset = 1.5;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    p.setup = () => {
      p.createCanvas(window.innerWidth, window.innerHeight);
      p.background(255, 255, 255, 0); // Transparent background
    };

    p.draw = () => {
      if (!isDrawing) return;

      const x = Math.floor(p.mouseX / interval) * interval;
      const y = Math.floor(p.mouseY / interval) * interval;

      // Base rectangle
      p.fill("#bdbdbd");
      p.stroke("#bdbdbd"); // Set stroke to gray to blend with the rectangle
      p.rect(x, y, interval, interval);

      // Simulate 3D effect
      // Top and left border - lighter
      p.stroke("#fefefe");
      p.strokeWeight(offset); // Thicker stroke
      p.line(x, y, x + interval - offset, y); // Top border
      p.line(x, y, x, y + interval - offset); // Left border

      // Bottom and right border - darker gray
      p.stroke("#7f7f7f"); // Darker gray stroke
      p.line(
        x + interval - offset,
        y,
        x + interval - offset,
        y + interval - offset
      ); // Right border
      p.line(
        x,
        y + interval - offset,
        x + interval - offset,
        y + interval - offset
      ); // Bottom border

      // Update bounds
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    };

    p.mousePressed = () => {
      isDrawing = true;
    };

    p.mouseReleased = (e) => {
      isDrawing = false;
      // Adjust maxX and maxY to include the drawn rectangle's dimensions
      const bounds = {
        minX,
        maxX: maxX + interval,
        minY,
        maxY: maxY + interval,
      };
      console.log("Bounds of drawn area:", bounds);
      updateBounds(bounds);
      // console.log("Bounds of drawn area:", bounds);
      // Optionally, use bounds for further processing
    };
  };
}
export default function Canvas({ canvas, showCanvas, setShowCanvas }) {
  const [canvasDrawingBounds, setCanvasDrawingBounds] = useState({
    minX: 0,
    maxX: 0,
    minY: 0,
    maxY: 0,
  });
  const updateBounds = useRef((newBounds) =>
    setCanvasDrawingBounds(newBounds)
  ).current;

  // Sketch Ref to prevent re-creation of the sketch on every render
  const sketchRef = useRef(null);

  useEffect(() => {
    if (!sketchRef.current) {
      // Only create the sketch if it doesn't already exist
      sketchRef.current = sketch(updateBounds);
    }
  }, [updateBounds]);

  return showCanvas && <ReactP5Wrapper sketch={sketchRef.current} />;
}
