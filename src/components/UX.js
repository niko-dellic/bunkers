import { useState, useEffect } from "react";
import BunkerForm from "./BunkerForm";

export default function UX({
  showCanvas,
  setShowCanvas,
  p5Instance,
  setP5Instance,
}) {
  // Save Canvas as PNG
  const saveCanvas = () => {
    if (p5Instance) {
      p5Instance.saveCanvas("myCanvas", "png"); // 'myCanvas' is the filename, 'png' is the format
    }
  };

  return (
    <div className="newBunkerContainer">
      {!showCanvas ? (
        <button
          className="newBunker"
          onClick={(e) => {
            e.preventDefault();
            setShowCanvas(true);
          }}
        >
          + ADD YOUR LAST RESORT LISTING TO AIRBNBUNKER
        </button>
      ) : (
        <button
          onClick={(e) => {
            setShowCanvas(false);
          }}
        >
          X
        </button>
      )}
      {showCanvas && (
        <>
          <button
            onClick={(e) => {
              saveCanvas();
              setShowCanvas(false);
            }}
          >
            SAVE DRAWING
          </button>
          <BunkerForm />
        </>
      )}
    </div>
  );
}
