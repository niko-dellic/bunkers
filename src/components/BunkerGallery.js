import Image from "next/image";
import React, { useState } from "react";

export default function BunkerGallery({
  minesweeperBunkers,
  setSelectedBunker,
  setInitialEntry,
  triggerFetch,
  setTriggerFetch,
  isMobile,
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
      {minesweeperBunkers.map((bunker, index) => (
        <div
          key={index}
          className="bunker-gallery-item"
          onClick={() => {
            window.scrollTo(0, 0);
            setInitialEntry(true);
            setSelectedBunker(bunker);
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
            src={bunker.ImageURL}
            alt={bunker.Data["name"] || `Bunker ${index + 1}`}
            sizes="500px"
            fill
            style={{
              objectFit: "contain",
            }}
          />
        </div>
      ))}
    </div>
  );
}
