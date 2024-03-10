import DrawBunker from "./DrawBunker";
import { useState, useEffect } from "react";

export default function NewBunker({
  drawSequence,
  setDrawSequence,
  setNewDrawingPts,
  newDrawingPts,
  newDrawingScreenPts,
  showDrawingCanvas,
  setShowDrawingCanvas,
  setNewDrawingScreenPts,
  canvasDimensions,
}) {
  return (
    <div className="newBunkerContainer">
      <button
        className="newBunker"
        onClick={(e) => {
          e.preventDefault();
          if (drawSequence) {
            setNewDrawingPts([]);
            setShowDrawingCanvas(false);
          }
          setDrawSequence(!drawSequence);
        }}
      >
        {!drawSequence && !showDrawingCanvas
          ? "+ ADD YOUR LAST RESORT LISTING TO AIRBNBUNKER"
          : "- CANCEL"}
      </button>
      {drawSequence && !showDrawingCanvas && (
        <button
          onClick={(e) => {
            setNewDrawingPts([...newDrawingPts, newDrawingPts[0]]);
            setNewDrawingScreenPts([
              ...newDrawingScreenPts,
              newDrawingScreenPts[0],
            ]);
            setShowDrawingCanvas(true);
            // setDrawSequence(false);
            // setNewDrawingPts([
            //   ...newDrawingScreenPts,
            //   newDrawingScreenPts[0],
            // ]);
            // setNewDrawingScreenPts([
            //   ...newDrawingScreenPts,
            //   newDrawingScreenPts[0],
            // ]);
          }}
        >
          NEXT
        </button>
      )}
      {showDrawingCanvas && (
        <button
          onClick={(e) => {
            setDrawSequence(false);
            setShowDrawingCanvas(false);
            setNewDrawingPts([]);
          }}
        >
          DONE
        </button>
      )}
    </div>
  );
}
