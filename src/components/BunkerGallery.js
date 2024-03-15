import Image from "next/image";
import React, { useState } from "react";
import { FlyToInterpolator } from "@deck.gl/core";

export default function BunkerGallery({
  minesweeperBunkers,
  setSelectedBunker,
  setInitialEntry,
  triggerFetch,
  setTriggerFetch,
  isMobile,
  viewState,
  setViewState,
}) {
  const [awaitingConfirmationBunkerId, setAwaitingConfirmationBunkerId] =
    useState(null);

  const requestBunkerDeletion = async (bunkerId) => {
    await fetch("https://99f-bunker-api.azurewebsites.net/api/DeleteBunker", {
      method: "POST",
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "DELETE, POST, GET, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, Authorization, X-Requested-With",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        bunkerId,
      }),
    });
    setTriggerFetch(!triggerFetch);
    setAwaitingConfirmationBunkerId(null); // Reset the awaiting confirmation state
  };

  return (
    <div id="bunker-gallery" className={isMobile ? "mobile" : ""}>
      {minesweeperBunkers.map((bunker, index) => {
        const parsed = JSON.parse(bunker.Data);

        return (
          <div
            key={index}
            className="bunker-gallery-item"
            // onMouseEnter={() => {
            //   console.log(JSON.parse(bunker.Items));
            //   // console.log(parsed);
            // }}
            onClick={() => {
              window.scrollTo(0, 0);
              setInitialEntry(true);
              setSelectedBunker(bunker);
              // copy parsed.ROwKey to clipboard
              if (isMobile) {
                navigator.clipboard.writeText(bunker.RowKey);
              }

              const view = JSON.parse(bunker.View);

              setViewState({
                ...viewState,
                pitch: 0,
                zoom: view.zoom,
                latitude: view.latitude,
                longitude: view.longitude,
                transitionDuration: 1500,
                transitionInterpolator: new FlyToInterpolator(),
              });
            }}
          >
            {/* Conditional rendering for deletion confirmation */}
            {awaitingConfirmationBunkerId === bunker.RowKey ? (
              <div
                style={{
                  position: "absolute",
                  top: "0",
                  right: "0",
                  zIndex: "2",
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setAwaitingConfirmationBunkerId(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    requestBunkerDeletion(bunker.RowKey);
                  }}
                >
                  Confirm
                </button>
              </div>
            ) : (
              <button
                style={{
                  position: "absolute",
                  top: "0",
                  right: "0",
                  zIndex: "2",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setAwaitingConfirmationBunkerId(bunker.RowKey); // Set this bunker to show confirmation buttons
                }}
              >
                X
              </button>
            )}
            <Image
              src={parsed.genImageURL}
              alt={bunker.Data["name"] || `Bunker ${index + 1}`}
              sizes="500px"
              fill
              style={{
                objectFit: "contain",
                filter: "grayscale(100%)",
                opacity: "0.5",
              }}
            />
            {/* json stringify  */}
            <div className="screen">CODE: {bunker.RowKey}</div>
          </div>
        );
      })}
    </div>
  );
}
