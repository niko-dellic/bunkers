import { useEffect, useRef, useState } from "react";
import { distance, bearing } from "@turf/turf";
import { FlyToInterpolator } from "@deck.gl/core";

export default function CanvasAnimation({
  bunkerCentroids,
  initialEntry,
  setViewState,
}) {
  if (
    !bunkerCentroids ||
    bunkerCentroids.length === 0 ||
    bunkerCentroids.features.length === 0
  )
    return;

  let currentIndex = 0;
  let animationPaused = false; // New variable to control the pause state

  const animateFlyThrough = () => {
    if (
      initialEntry ||
      animationPaused ||
      currentIndex >= bunkerCentroids.features.length
    ) {
      currentIndex = 0; // Optionally reset to start from the first point again when resuming
      return; // Stop the animation if `initialEntry` is true or animation is paused
    }

    const currentFeature = bunkerCentroids.features[currentIndex];
    const nextIndex = (currentIndex + 1) % bunkerCentroids.features.length;
    const nextFeature = bunkerCentroids.features[nextIndex];

    const currentCoordinates = currentFeature.geometry.coordinates;
    const nextCoordinates = nextFeature.geometry.coordinates;

    const dist = distance(currentCoordinates, nextCoordinates, {
      units: "kilometers",
    });
    const bear = bearing(currentCoordinates, nextCoordinates);

    setViewState((prevState) => ({
      ...prevState,
      longitude: currentCoordinates[0],
      latitude: currentCoordinates[1],
      bearing: bear,
      transitionDuration: dist * 3000,
      transitionInterpolator: new FlyToInterpolator(),
    }));

    currentIndex++;
    // 5 minute time out
    const timeoutDuration = dist * 1000 + 5000; // 5 seconds after the transition ends
    setTimeout(() => {
      if (!initialEntry) {
        // Check again before proceeding
        animateFlyThrough();
      }
    }, timeoutDuration);
  };

  // Start the animation
  animateFlyThrough();

  // 5 minute timeout to restart the animation
  const restartTimeout = setTimeout(() => {
    animationPaused = true; // Pause the animation
    setTimeout(() => {
      // Wait for 5 minutes before restarting
      animationPaused = false; // Resume the animation
      animateFlyThrough(); // Restart the animation
    }, 5 * 60 * 1000); // 5 minutes
  }, 5 * 60 * 1000);

  return () => {
    clearTimeout(restartTimeout); // Clear the timeout if the component unmounts
  };
}
