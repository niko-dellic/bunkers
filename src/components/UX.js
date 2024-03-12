"use client";

import { useState } from "react";
import BunkerForm from "./BunkerForm";
import DisplayBunkerProperties from "./DisplayBunkerProperties";

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
  bounds,
  selectedBunker,
}) {
  // Save Canvas as PNG and form data as JSON
  const saveBunker = (data) => {
    if (p5Instance) {
      const { minX, minY, maxX, maxY } = canvasDrawingBounds;
      const w = maxX - minX;
      const h = maxY - minY;

      // Extract the cropped area using p5's get() function
      const croppedImage = p5Instance.createImage(w, h);
      croppedImage.copy(p5Instance, minX, minY, w, h, 0, 0, w, h);
      // p5Instance.get(minX, minY, width, height);

      // Now, you need to create an off-screen canvas and draw the cropped image onto it
      const offScreenCanvas = document.createElement("canvas");
      offScreenCanvas.style.border = "1px solid red";
      offScreenCanvas.width = w;
      offScreenCanvas.height = h;
      const ctx = offScreenCanvas.getContext("2d");
      ctx.drawImage(croppedImage.canvas, 0, 0);

      // add the canvas to the DOM for debugging
      // document.body.appendChild(offScreenCanvas);

      // Convert the off-screen canvas to a data URL and trigger download
      const dataURL = offScreenCanvas.toDataURL("image/png");
      saveImage(dataURL, "croppedBunkerImage");

      // Save JSON data
      const dataToSave = {
        bounds,
        data,
      };
      saveJSON(dataToSave, "myCanvasData");

      // setShowCanvas(false); // Optionally hide canvas after saving
    }
  };

  // Function to update form data state
  const handleFormData = (data) => {
    saveBunker(data);
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
