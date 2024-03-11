"use client";

import { useState } from "react";
import BunkerForm from "./BunkerForm";
import DisplayBunkerProperties from "./DisplayBunkerProperties";
import dynamic from "next/dynamic";

// Dynamically import ReactP5Wrapper with SSR disabled
const ReactP5Wrapper = dynamic(
  () => import("@p5-wrapper/react").then((mod) => mod.ReactP5Wrapper),
  {
    ssr: false,
  }
);

function saveJSON(obj, filename) {
  const a = document.createElement("a");
  const file = new Blob([JSON.stringify(obj)], { type: "application/json" });
  a.href = URL.createObjectURL(file);
  a.download = `${filename}.json`;
  a.click();
}

function saveImage(dataURL, filename) {
  const a = document.createElement("a");
  a.href = dataURL;
  a.download = `${filename}.png`;
  a.click();
}

export default function UX({
  showCanvas,
  setShowCanvas,
  p5Instance,
  canvasDrawingBounds,
  projectedBounds,
  selectedBunker,
}) {
  // Save Canvas as PNG and form data as JSON
  const saveBunker = (newFormData) => {
    if (p5Instance) {
      // console.log(canvasDrawingBounds);
      const { minX, minY, maxX, maxY } = canvasDrawingBounds;
      const width = maxX - minX;
      const height = maxY - minY;

      // Extract the cropped area using p5's get() function
      const croppedImage = p5Instance.get(minX, minY, width, height);

      // Now, you need to create an off-screen canvas and draw the cropped image onto it
      const offScreenCanvas = document.createElement("canvas");
      offScreenCanvas.width = width;
      offScreenCanvas.height = height;
      const ctx = offScreenCanvas.getContext("2d");
      ctx.drawImage(croppedImage.canvas, 0, 0);

      // Convert the off-screen canvas to a data URL and trigger download
      const dataURL = offScreenCanvas.toDataURL("image/png");
      saveImage(dataURL, "croppedBunkerImage");

      // Save JSON data
      const dataToSave = {
        projectedBounds,
        newFormData,
      };
      saveJSON(dataToSave, "myCanvasData");

      setShowCanvas(false); // Optionally hide canvas after saving
    }
  };

  // Function to update form data state
  const handleFormData = (newFormData) => {
    saveBunker(newFormData);
  };

  return (
    <div id="controls-wrapper">
      <div id="toolbar">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowCanvas(true);
          }}
        >
          + ADD YOUR LAST RESORT LISTING TO AIRBNBUNKER
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowCanvas(false);
          }}
          style={{ color: !showCanvas ? "#bdbdbd" : "black" }}
        >
          X
        </button>
      </div>

      {showCanvas && <BunkerForm onFormDataChange={handleFormData} />}
      {!showCanvas && selectedBunker && (
        <DisplayBunkerProperties selectedBunker={selectedBunker} />
      )}
    </div>
  );
}
