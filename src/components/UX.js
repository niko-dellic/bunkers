"use client";

import { useState } from "react";
import BunkerForm from "./BunkerForm";
import DisplayBunkerProperties from "./DisplayBunkerProperties";
import { v4 as uuidv4 } from "uuid";
import InfoPanel from "./InfoPanel";
import DisplayBunkerResults from "./DisplayBunkerResults";
import Tutorials from "./tutorials";

export default function UX({
  isMobile,
  showCanvas,
  setShowCanvas,
  p5Instance,
  canvasDrawingBounds,
  bounds,
  selectedBunker,
  imageViewState,
  minesweeperBunkers,
  setTriggerFetch,
  triggerFetch,
  setSelectedBunker,
}) {
  const [result, setResult] = useState(null);
  const [showTutorial, setShowTutorial] = useState(isMobile ? false : true);

  // Save Canvas as PNG and form data as JSON
  async function saveBunker(data) {
    try {
      // Check if the drawing dimensions are valid
      const { minX, minY, maxX, maxY } = canvasDrawingBounds;
      const w = maxX - minX;
      const h = maxY - minY;

      if (w <= 0 || h <= 0) {
        throw new Error(
          "Please ensure there is a bunker drawing before saving."
        );
      }

      if (p5Instance) {
        // Proceed with the rest of your code for saving the bunker as before

        const croppedImage = p5Instance.createImage(w, h);
        croppedImage.copy(p5Instance, minX, minY, w, h, 0, 0, w, h);

        const offScreenCanvas = document.createElement("canvas");
        offScreenCanvas.style.border = "1px solid red";
        offScreenCanvas.width = w;
        offScreenCanvas.height = h;
        const ctx = offScreenCanvas.getContext("2d");
        ctx.drawImage(croppedImage.canvas, 0, 0);

        data.id = `bunker-${uuidv4()}`;

        const dataURL = offScreenCanvas.toDataURL("image/png");
        const view = imageViewState;
        const dataToSave = {
          bounds,
          view,
          data,
          dataURL,
        };

        await fetch("https://99f-bunker-api.azurewebsites.net/api/SaveToBlob", {
          method: "POST",
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "DELETE, POST, GET, OPTIONS",
            "Access-Control-Allow-Headers":
              "Content-Type, Authorization, X-Requested-With",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(dataToSave),
        });

        setTriggerFetch(!triggerFetch);
        setShowCanvas(false); // Optionally hide canvas after saving
      }
    } catch (error) {
      // Handle errors gracefully
      alert(
        `ERROR! 404: BUNKER NOT FOUND
      DRAW A BUNKER IF YOU HOPE TO SURVIVE
        `
      ); // Display a warning to the user
    }
  }

  // Function to update form data state
  async function handleFormData(data) {
    await saveBunker(data);
  }

  return (
    <div
      id={`controls-wrapper`}
      className={isMobile ? `mobile` : ""}
      style={!showTutorial ? { gridTemplateRows: "auto 1fr" } : {}}
    >
      <div id="toolbar" className={isMobile ? `mobile` : ""}>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowCanvas(true);
            setResult(null);
            setSelectedBunker(null);
          }}
        >
          + ADD YOUR AIRBNBUNKER
        </button>
        {showCanvas && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowCanvas(false);
            }}
            style={{ color: !showCanvas ? "#bdbdbd" : "black" }}
          >
            X
          </button>
        )}
        <Tutorials
          isMobile={isMobile}
          showCanvas={showCanvas}
          showTutorial={showTutorial}
          setShowTutorial={setShowTutorial}
        />
      </div>
      {!showCanvas && !isMobile && (
        <InfoPanel minesweeperBunkers={minesweeperBunkers} />
      )}
      {showCanvas && !result && (
        <BunkerForm onFormDataChange={handleFormData} setResult={setResult} />
      )}
      {!showCanvas && !result && selectedBunker && (
        <DisplayBunkerProperties selectedBunker={selectedBunker} />
      )}
      {(result || selectedBunker) && (
        <DisplayBunkerResults result={result} selectedBunker={selectedBunker} />
      )}
      {/* else{
        <DisplayBunkerProperties selectedBunker={selectedBunker} />
      } */}
    </div>
  );
}
