"use client";

import { useState } from "react";
import BunkerForm from "./BunkerForm";
import DisplayBunkerProperties from "./DisplayBunkerProperties";
import { v4 as uuidv4 } from "uuid";
import InfoPanel from "./InfoPanel";
import DisplayBunkerResults from "./DisplayBunkerResults";

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
  imageViewState,
  setMinesweeperBunkers,
  minesweeperBunkers,
  setTriggerFetch,
  triggerFetch,
}) {
  const [result, setResult] = useState(null);
  const [imageResult, setImageResult] = useState(null);
  // Save Canvas as PNG and form data as JSON
  async function saveBunker(data) {
    if (p5Instance) {
      const { minX, minY, maxX, maxY } = canvasDrawingBounds;
      const w = maxX - minX;
      const h = maxY - minY;

      // Extract the cropped area using p5's get() function
      const croppedImage = p5Instance.createImage(w, h);
      croppedImage.copy(p5Instance, minX, minY, w, h, 0, 0, w, h);

      // Now, create an off-screen canvas and draw the cropped image onto it
      const offScreenCanvas = document.createElement("canvas");
      offScreenCanvas.style.border = "1px solid red";
      offScreenCanvas.width = w;
      offScreenCanvas.height = h;
      const ctx = offScreenCanvas.getContext("2d");
      ctx?.drawImage(croppedImage.canvas, 0, 0);

      data.id = `bunker-${uuidv4()}`;

      // Convert the off-screen canvas to a data URL and trigger download
      const dataURL = offScreenCanvas.toDataURL("image/png");
      // saveImage(dataURL, data.id);

      const view = imageViewState;

      // Save JSON data
      const dataToSave = {
        bounds,
        view,
        data,
        dataURL,
        //for image, do the same thing with the dataURL GPTIMAGE
        //add chat gpt data
      };
      // saveJSON(dataToSave, "bunkers-metadata");
      // console.log(dataToSave);
      // console.log(minesweeperBunkers);

      // Connect to backend to save in table/blob storage

      await fetch("https://99f-bunker-api.azurewebsites.net/api/SaveToBlob", {
        method: "POST", // or 'PUT'
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
  }

  // Function to update form data state
  async function handleFormData(data) {
    await saveBunker(data);
  }

  return (
    <>
      <div id="controls-wrapper">
        <InfoPanel minesweeperBunkers={minesweeperBunkers} />

        <div id="toolbar">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowCanvas(true);

              console.log("X clicked");
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

        {showCanvas && !result && (
          <BunkerForm
            onFormDataChange={handleFormData}
            result={result}
            setResult={setResult}
            imageResult={imageResult}
            setImageResult={setImageResult}
          />
        )}

        {!showCanvas && !result && selectedBunker && (
          <DisplayBunkerProperties selectedBunker={selectedBunker} />
        )}

        {result && (
          <DisplayBunkerResults result={result} imageResult={imageResult} />
        )}

        {/* else{
        <DisplayBunkerProperties selectedBunker={selectedBunker} />
      } */}
      </div>
    </>
  );
}




import OpenAI from "openai";
import { useEffect } from "react";

const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export default function GenBunker({ userString, result, setResult }) {
  //   const [generatedText, setGeneratedText] = useState('');

  useEffect(() => {
    console.log("use effect called", userString);
    if (!userString) return;

    async function genContent(prompt) {
      const completion = await openai.chat.completions.create({
        messages: [{ role: "system", content: prompt }],
        model: "gpt-3.5-turbo",
      });
      setResult(completion.choices[0].message.content);
    }

    async function genImage(prompt) {
      const image = await openai.images.generate({
        prompt: prompt,
        size: "256x256",
        quality: "standard",
        n: 1,
      });
      const imgUrl = image.data[0].url;
      console.log(image.data[0].url);
    }

    const text = genContent(userString);
    genImage("happy cats and dogs");
  }, [userString]);
}

