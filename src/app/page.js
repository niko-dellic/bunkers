"use client";

import { useEffect, useState, useCallback } from "react";
import InteractiveMap from "../components/InteractiveMap";
import Canvas from "../components/Canvas";
import BunkerGallery from "../components/BunkerGallery";
import Credits from "../components/Credits";
// import head
import Head from "next/head";
import UX from "../components/UX";

import { FlyToInterpolator } from "@deck.gl/core";

export default function Home() {
  const isMobile = useMobileDetect();
  const [showCanvas, setShowCanvas] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [p5Instance, setP5Instance] = useState(null);
  const [canvasDrawingBounds, setCanvasDrawingBounds] = useState({
    minX: -Infinity,
    maxX: Infinity,
    minY: -Infinity,
    maxY: Infinity,
  });
  // projected drawing bounds
  const [bounds, setBounds] = useState(null);
  const [imageViewState, setImageViewState] = useState(null);
  // selected bunker
  const [selectedBunker, setSelectedBunker] = useState(null);
  // all bunkers
  const [minesweeperBunkers, setMinesweeperBunkers] = useState([]);
  // check to reload the database
  const [triggerFetch, setTriggerFetch] = useState(false);
  const [initialEntry, setInitialEntry] = useState(false);

  const [viewState, setViewState] = useState({
    longitude: -71.08725092308282,
    latitude: 42.360366356946194,
    zoom: 16.5,
    pitch: 100,
    minPitch: 0,
    maxPitch: 179,
    minZoom: 13.5,
    maxZoom: 22,
  });

  const togglePlanView = useCallback(
    (bool) => {
      if (initialEntry) return;
      let vs;
      if (bool) {
        vs = { ...viewState, pitch: 0 };
      } else {
        vs = { ...viewState, pitch: 110 };
      }
      setInitialEntry(true);
      setViewState({
        ...vs,
        transitionDuration: 1500,
        transitionInterpolator: new FlyToInterpolator(),
      });
    },
    [initialEntry]
  );

  useEffect(() => {
    // Function to handle key down
    const handleKeyDown = (e) => {
      if (e.key === " ") {
        // Prevent default action to avoid any side effect like scrolling
        e.preventDefault();
        setShowCredits((prevShowCredits) => !prevShowCredits);
      }
    };

    // Add event listener to the window
    window.addEventListener("keydown", handleKeyDown);

    // Cleanup function to remove the event listener
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []); // Empty dependency array means this effect runs only once on mount

  return (
    isMobile !== undefined && (
      <>
        <Head>
          <link
            rel="icon"
            href="/icon?<generated>"
            type="image/<generated>"
            sizes="<generated>"
          />
        </Head>
        <main id={isMobile ? "main-mobile" : ""}>
          <div className="border-effect">
            <UX
              isMobile={isMobile}
              showCanvas={showCanvas}
              setShowCanvas={setShowCanvas}
              p5Instance={p5Instance}
              canvasDrawingBounds={canvasDrawingBounds}
              bounds={bounds}
              imageViewState={imageViewState}
              selectedBunker={selectedBunker}
              setMinesweeperBunkers={setMinesweeperBunkers}
              minesweeperBunkers={minesweeperBunkers}
              setTriggerFetch={setTriggerFetch}
              triggerFetch={triggerFetch}
            />
          </div>
          <div className="border-effect">
            <div
              id="canvas-wrapper"
              onMouseEnter={(e) => {
                if (!showCanvas) {
                  togglePlanView(true);
                }
              }}
              // onMouseLeave={(e) => {
              //   togglePlanView(false);
              // }}
            >
              <Canvas
                showCanvas={showCanvas}
                setShowCanvas={setShowCanvas}
                canvasDrawingBounds={canvasDrawingBounds}
                setCanvasDrawingBounds={setCanvasDrawingBounds}
                p5Instance={p5Instance}
                setP5Instance={setP5Instance}
                setBounds={setBounds}
                setImageViewState={setImageViewState}
                viewState={viewState}
              />
              <InteractiveMap
                isMobile={isMobile}
                viewState={viewState}
                setViewState={setViewState}
                showCanvas={showCanvas}
                setShowCanvas={setShowCanvas}
                p5Instance={p5Instance}
                canvasDrawingBounds={canvasDrawingBounds}
                setCanvasDrawingBounds={setCanvasDrawingBounds}
                selectedBunker={selectedBunker}
                setSelectedBunker={setSelectedBunker}
                minesweeperBunkers={minesweeperBunkers}
                setMinesweeperBunkers={setMinesweeperBunkers}
                triggerFetch={triggerFetch}
                setP5Instance={setP5Instance}
                initialEntry={initialEntry}
                setInitialEntry={setInitialEntry}
                setBounds={setBounds}
                setImageViewState={setImageViewState}
              />
            </div>
          </div>
          <div className="border-effect" id="bunker-gallery-wrapper">
            <BunkerGallery
              minesweeperBunkers={minesweeperBunkers}
              setSelectedBunker={setSelectedBunker}
              setInitialEntry={setInitialEntry}
              triggerFetch={triggerFetch}
              setTriggerFetch={setTriggerFetch}
            />
          </div>

          <Credits />
        </main>
      </>
    )
  );
}

function useMobileDetect() {
  const [isMobile, setIsMobile] = useState(undefined);

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    setIsMobile(
      /mobile|android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(
        userAgent
      )
    );
  }, []);

  return isMobile;
}
