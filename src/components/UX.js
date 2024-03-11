import { useState, useEffect } from "react";

export default function UX({ showCanvas, setShowCanvas }) {
  const handleSaveDrawing = () => {
    // Note: Saving functionality needs to be adapted to work with @p5-wrapper/react.
    // This library may not directly expose p5 methods like saveCanvas(),
    // so you might need to implement a custom saving function.
    // One approach could be to access the canvas DOM element and save it as an image.
    console.log(
      "Implement the save functionality based on your project requirements."
    );
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
          CANCEL
        </button>
      )}
      {showCanvas && (
        <button
          onClick={(e) => {
            handleSaveDrawing();
            setShowCanvas(false);
          }}
        >
          SAVE DRAWING
        </button>
      )}
    </div>
  );
}
