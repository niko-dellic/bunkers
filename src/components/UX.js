"use client";

import { useState } from "react";
import BunkerForm from "./BunkerForm";
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
  backupImages,
  setBackupImages,
  imgError,
  setImgError,
}) {
  const [userData, setUserData] = useState(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [imageResult, setImageResult] = useState(null);

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
        // Generate a 4-character alphanumeric ID
        const generateShortId = () => {
          const chars =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
          let result = "";
          for (let i = 0; i < 5; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          return result.toUpperCase();
        };
        // Proceed with the rest of your code for saving the bunker as before

        const croppedImage = p5Instance.createImage(w, h);
        croppedImage.copy(p5Instance, minX, minY, w, h, 0, 0, w, h);

        const offScreenCanvas = document.createElement("canvas");
        offScreenCanvas.style.border = "1px solid red";
        offScreenCanvas.width = w;
        offScreenCanvas.height = h;
        const ctx = offScreenCanvas.getContext("2d");
        ctx.drawImage(croppedImage.canvas, 0, 0);

        // data.id = `bunker-${uuidv4()}`;
        data.id = `${generateShortId()}`; // Use the new short ID here

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
        setUserData(null);
        setImageResult(null);
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
      style={
        !showCanvas & !userData && !selectedBunker?.Data
          ? { display: "grid", gridTemplateRows: "auto 1fr" }
          : showCanvas && (userData || selectedBunker?.Data)
          ? {
              display: "grid",
              gridTemplateRows: "auto auto 1fr",
            }
          : showCanvas
          ? { display: "grid", gridTemplateRows: "auto 1fr auto" }
          : {}
      }
    >
      <div id="toolbar" className={isMobile ? `mobile` : ""}>
        <button
          className={showCanvas ? "" : "flash"}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowCanvas(true);
            setSelectedBunker(null);
            setUserData(null);
          }}
        >
          {!showCanvas ? `+ ADD YOUR AIRBNBUNKER` : "BUNKER BUILDER"}
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

      <DisplayBunkerResults
        selectedBunker={selectedBunker}
        userData={userData}
        imageResult={imageResult}
        imgError={imgError}
        setImgError={setImgError}
        backupImages={backupImages}
        setBackupImages={setBackupImages}
      />

      {showCanvas && (
        <BunkerForm
          onFormDataChange={handleFormData}
          userData={userData}
          setUserData={setUserData}
          setImageResult={setImageResult}
        />
      )}
    </div>
  );
}
