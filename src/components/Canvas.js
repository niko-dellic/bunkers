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

      let coinToss = p.random();
      p.textSize(interval);
      p.textFont('Courier New');
      p.textStyle(p.BOLD);
      
      if (coinToss < 0.33) {
        // hidden square
        
        // Base rectangle
        p.fill("#c0c0c0");
        p.stroke("#c0c0c0"); // Set stroke to gray to blend with the rectangle
        p.rect(x, y, interval, interval);

        // Simulate 3D effect
        // Top and left border - lighter
        p.stroke("#ffffff");
        p.strokeWeight(offset); // Thicker stroke
        p.line(x + offset/2, y + offset/2, x + interval + offset/2, y + offset/2); // Top border
        p.line(x + offset/2, y + offset/2, x + offset/2, y + interval + offset/2); // Left border

        // Bottom and right border - darker gray
        p.stroke("#808080"); // Darker gray stroke
        p.line(
          x + interval + offset/2,
          y + offset/2,
          x + interval + offset/2,
          y + interval + offset/2
        ); // Right border
        p.line(
          x + offset/2,
          y + interval + offset/2,
          x + interval + offset/2,
          y + interval + offset/2
        ); // Bottom border
      } else {
        // exposed empty square

        p.fill("#c0c0c0");
        p.stroke("#c0c0c0");
        p.rect(x, y, interval, interval);
        
        // Top and left border - lighter
        p.stroke("#909090");
        p.strokeWeight(offset); // Thicker stroke
        p.line(x, y, x + interval, y); // Top border
        p.line(x, y, x, y + interval); // Left border
        p.line(
          x + interval,
          y,
          x + interval,
          y + interval
        ); // Right border
        p.line(
          x,
          y + interval,
          x + interval,
          y + interval
        ); // Bottom border
        
        if (coinToss < 0.5) {
          p.fill("#1900ff");
          p.text('1', x+(interval/4), y+interval-offset);
        } else if (coinToss < 0.6) {
          p.fill("#008001");
          p.text('2', x+(interval/4), y+interval-offset);
        } else if (coinToss < 0.66) {
          p.fill("#ff0200");
          p.text('3', x+(interval/4), y+interval-offset);
        } else if (coinToss < 0.69) {
          p.fill("#080080");
          p.text('4', x+(interval/4), y+interval-offset);
        } else if (coinToss < 0.7) {
          p.fill("#810000");
          p.text('5', x+(interval/4), y+interval-offset);
        }
      }

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
