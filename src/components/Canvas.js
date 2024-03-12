"use client";

import { useState, useRef, useEffect } from "react";
// import { ReactP5Wrapper } from "@p5-wrapper/react";
import dynamic from "next/dynamic";

// Dynamically import ReactP5Wrapper with SSR disabled
const ReactP5Wrapper = dynamic(
  () => import("@p5-wrapper/react").then((mod) => mod.ReactP5Wrapper),
  {
    ssr: false,
  }
);

function sketch(updateBounds, width, height) {
  return (p) => {
    let isDrawing = false;
    const interval = 12;
    const offset = 1.5;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    p.setup = () => {
      p.createCanvas(width, height);
      p.background(255, 0, 0, 0); // Transparent background
    };

    p.draw = () => {
      if (!isDrawing) return;

      let x = Math.floor(p.mouseX / interval) * interval;
      let y = Math.floor(p.mouseY / interval) * interval;

      if (x < 0 || x > width || y < 0 || y > height) return; // Prevent drawing outside the canvas

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
      if (
        p.mouseX < 0 ||
        p.mouseX > width ||
        p.mouseY < 0 ||
        p.mouseY > height
      ) {
        return;
      } else {
        isDrawing = true;
      }
    };

    p.mouseReleased = (e) => {
      // check to see if the mouse was released outside of the canvas

      if (
        p.mouseX < 0 ||
        p.mouseX > width ||
        p.mouseY < 0 ||
        p.mouseY > height
      ) {
        isDrawing = false;
        return;
      }

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
    };
  };
}
export default function Canvas({
  showCanvas,
  setCanvasDrawingBounds,
  setP5Instance,
}) {
  const [isClient, setIsClient] = useState(false);

  const updateBounds = useRef((newBounds) =>
    setCanvasDrawingBounds(newBounds)
  ).current;

  useEffect(() => {
    setIsClient(true); // Component has mounted, set the flag to true

    // const width = window.innerWidth;
    // const height = window.innerHeight;

    // get the element width of the parent container
    const width = document.getElementById("canvas-wrapper").offsetWidth;
    const height = document.getElementById("canvas-wrapper").offsetHeight;

    if (!sketchRef.current) {
      // Only create the sketch if it doesn't already exist and ensure p5 instance is accessible
      const wrappedSketch = (p) => {
        const customSketch = sketch(updateBounds, width, height);
        customSketch(p);
        setP5Instance(p); // Save the p5 instance for later use
      };
      sketchRef.current = wrappedSketch;
    }
  }, [updateBounds]);

  // Sketch Ref to prevent re-creation of the sketch on every render
  const sketchRef = useRef(null);

  return showCanvas && <ReactP5Wrapper sketch={sketchRef.current} />;
}
