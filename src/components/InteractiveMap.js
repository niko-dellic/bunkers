"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import DeckGL from "@deck.gl/react";
// import flyto interpolator
import { FlyToInterpolator } from "@deck.gl/core";
import { Map } from "react-map-gl";
import { GeoJsonLayer } from "deck.gl";
import { PostProcessEffect } from "deck.gl";
import { dotScreen } from "@luma.gl/shadertools";
import { MaskExtension } from "@deck.gl/extensions";
import { buffer } from "@turf/turf";
import { BitmapLayer } from "@deck.gl/layers";
import { bbox, bboxPolygon, randomPoint } from "@turf/turf";
import ArcLayer from "./layers/ArcLayer";
import MeshLayer from "./layers/ScenegraphLayer";
import BunkerGallery from "./BunkerGallery";
import "mapbox-gl/dist/mapbox-gl.css";
import UX from "./UX";
import Canvas from "./Canvas";

import {
  convertToBounds,
  createNetworkEdges,
  generateRandomFlags,
  createBufferAndBbox,
  preventDefaultInputs,
} from "./utils";

const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

const postProcessEffect = new PostProcessEffect(dotScreen, {
  size: 3,
});

const numFlags = 350;

export default function InteractiveMap({ isMobile }) {
  const [initialViewState, setInitialViewState] = useState({
    // boston
    longitude: -71.08725092308282,
    latitude: 42.360366356946194,
    zoom: 16.5,
    pitch: 100,
    minPitch: 0,
    maxPitch: 179,
    minZoom: 15,
    maxZoom: 22,
  });
  const [viewState, setViewState] = useState(initialViewState);
  const [viewStateBounds, setViewStateBounds] = useState({});
  const [initialEntry, setInitialEntry] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [bunkerCentroids, setBunkerCentroids] = useState([]);
  const [bunkers, setBunkers] = useState([]);
  const [bunkerLayers, setBunkerLayers] = useState(null);
  const [minesweeperBunkers, setMinesweeperBunkers] = useState([]);
  const [minesweeperBunkerLayers, setMinesweeperBunkerLayers] = useState(null);
  const [network, setNetwork] = useState([]);
  const [showCanvas, setShowCanvas] = useState(false);
  const [canvasDrawingBounds, setCanvasDrawingBounds] = useState({
    minX: -Infinity,
    maxX: Infinity,
    minY: -Infinity,
    maxY: Infinity,
  });
  // projected drawing bounds
  const [bounds, setBounds] = useState(null);
  const [imageViewState, setImageViewState] = useState(null);

  const [p5Instance, setP5Instance] = useState(null);
  const [selectedBunker, setSelectedBunker] = useState(null);

  // bonus 3d flags
  const [flags, setFlags] = useState(null);

  // create function to handle bunker hover
  const handleBunkerTrigger = (info) => {
    if (info) {
      setSelectedBunker(info);
    } else {
      setSelectedBunker(null);
    }
  };

  useEffect(() => {
    preventDefaultInputs();
    fetch("./assets/geojson/boston_bunkers.geojson")
      .then((res) => res.json())
      .then((data) => {
        // Create a unique id for each feature
        data.features = data.features.map((feature, index) => {
          feature.id = index;
          return feature;
        });

        // get the bounding box for all of the bunkers
        const dataBounds = bbox(data);

        setBunkerCentroids(data);
        setFlags(generateRandomFlags(numFlags, data));
        if (!isMobile) setBunkers(createBufferAndBbox(data, 0.0125, "miles"));
        setNetwork(createNetworkEdges(data));
        setViewStateBounds({
          westLng: dataBounds[0],
          southLat: dataBounds[1],
          eastLng: dataBounds[2],
          northLat: dataBounds[3],
        });
      });

    fetch("https://99f-bunker-api.azurewebsites.net/api/LoadData", {
      method: "GET",
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "DELETE, POST, GET, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, Authorization, X-Requested-With",
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setMinesweeperBunkers(data);
      });
  }, []);

  useEffect(() => {
    const layers = bunkers.map((b, i) => {
      return new BitmapLayer({
        id: `bunker-${i}`,
        bounds: b,
        image: "./assets/img/placeholder.png",
        extensions: [new MaskExtension()],
        maskId: "geofence",
        maskByInstance: true,
        pickable: true,
        onHover: (info) => {
          const hoveredBunker = bunkerCentroids.features[i];
          handleBunkerTrigger(hoveredBunker.properties);
        },
      });
    });
    setBunkerLayers(layers);
  }, [bunkers]);

  useEffect(() => {
    const layers = minesweeperBunkers.map((b, i) => {
      try {
        let imageBounds = JSON.parse(b.Bounds);
        imageBounds = [
          imageBounds.westLng,
          imageBounds.southLat,
          imageBounds.eastLng,
          imageBounds.northLat,
        ];

        return new BitmapLayer({
          id: `msBunkers-${i}`,
          bounds: imageBounds,
          image: b.ImageURL,
          extensions: [new MaskExtension()],
          maskId: "geofence",
          maskByInstance: true,
          pickable: true,
          onClick: () => handleBunkerTrigger(b),
        });
      } catch (error) {
        console.error("Failed to load image:", error);
      }
    });

    setMinesweeperBunkerLayers(layers);
  }, [minesweeperBunkers]);

  useEffect(() => {
    // Assuming bounds is your state variable with minX, maxX, minY, maxY
    if (canvasDrawingBounds.minX !== -Infinity) {
      const [geoBounds, vstate] = convertToBounds(
        canvasDrawingBounds,
        viewState
      );
      setBounds(geoBounds);
      setImageViewState(vstate);
      // Now you can use geoBounds for whatever you need
    }
  }, [canvasDrawingBounds]); // Depend on bounds state

  // useEffect to handle selectedBunker
  useEffect(() => {
    if (
      !selectedBunker ||
      typeof selectedBunker !== "object" ||
      !selectedBunker.View
    )
      return;
    const view = JSON.parse(selectedBunker.View);

    setInitialViewState({
      ...viewState,
      pitch: 0,
      zoom: view.zoom,
      latitude: view.latitude,
      longitude: view.longitude,
      // transitionDuration: 1500,
      // transitionInterpolator: new FlyToInterpolator(),
    });
  }, [selectedBunker]);

  // layers array
  const layers = [
    !showCanvas &&
      !isMobile &&
      new GeoJsonLayer({
        id: "geofence",
        data: cursor,
        getFillColor: (d) => [255, 0, 0],
        operation: "mask",
      }),
    !showCanvas &&
      new GeoJsonLayer({
        id: "geofence-display",
        data: cursor,
        stroked: true,
        filled: false,
        getLineColor: [255, 0, 0, 255],
        getLineWidth: 2,
        // pixels
        lineWidthUnits: "pixels",
      }),
    new GeoJsonLayer({
      id: "points-layer",
      data: bunkerCentroids,
      stroked: false,
      filled: true,
      pointType: "circle",
      getFillColor: [255, 255, 255, 175],
      getPointRadius: 10,
      pointRadiusMaxPixels: 10,
      pickable: isMobile ? true : false,
      autoHighlight: true,
      autoHighlightColor: [0, 255, 255],
      onHover: (info) => handleBunkerTrigger(info.properties),
      ...(isMobile
        ? {}
        : {
            extensions: [new MaskExtension()],
            maskId: "geofence",
            maskInverted: true,
          }),
    }),
    new GeoJsonLayer({
      id: "network-layer",
      data: network,
      stroked: true,
      lineWidthUnits: "pixels",
      getLineColor: [255, 255, 255, 100],
      getLineWidth: 2,
      extensions: [new MaskExtension()],
      maskId: "geofence",
      maskInverted: true,
    }),
    !showCanvas && ArcLayer({ data: network }),
    MeshLayer({
      id: "flags",
      data: flags?.features,
      scenegraphUrl: "./assets/glb/flag.glb",
      scale: 10,
    }),
    MeshLayer({
      id: "media-lab",
      data: [
        {
          type: "Feature",
          geometry: {
            coordinates: [-71.0922, 42.3588],
          },
          properties: {
            rotation: -65,
          },
        },
      ],
      scenegraphUrl: "./assets/glb/mediaLab.glb",
      scale: 2,
    }),

    !isMobile && bunkerLayers && bunkerLayers,
    minesweeperBunkerLayers && minesweeperBunkerLayers,
  ];

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
      setInitialViewState({
        ...vs,
        transitionDuration: 1500,
        transitionInterpolator: new FlyToInterpolator(),
      });
    },
    [initialEntry]
  );

  return (
    <>
      <div className="border-effect">
        <UX
          showCanvas={showCanvas}
          setShowCanvas={setShowCanvas}
          p5Instance={p5Instance}
          canvasDrawingBounds={canvasDrawingBounds}
          bounds={bounds}
          imageViewState={imageViewState}
          selectedBunker={selectedBunker}
        />
      </div>
      <div className="border-effect">
        <div
          id="canvas-wrapper"
          // onMouseEnter={(e) => {
          //   if (!showCanvas) {
          //     togglePlanView(true);
          //   }
          // }}
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
          />
          <DeckGL
            initialViewState={initialViewState}
            onViewStateChange={(e) => {
              const viewState = e.viewState;
              //check if viewStateBounds is an empty object
              if (Object.keys(viewStateBounds).length === 0) return viewState;

              viewState.longitude = Math.min(
                viewStateBounds.eastLng,
                Math.max(viewStateBounds.westLng, viewState.longitude)
              );
              viewState.latitude = Math.min(
                viewStateBounds.northLat,
                Math.max(viewStateBounds.southLat, viewState.latitude)
              );

              // if pitch 90, set to 89.999
              if (viewState.pitch === 90) {
                viewState.pitch = 89.999;
              }
              // check if the viewState is undergoing a transition
              if (viewState.transitionDuration || !initialEntry) {
                return viewState;
              }

              // console.log(e);

              // try to set the viewState
              try {
                setViewState(viewState);
              } catch (error) {
                // console.error(error);
              }

              return viewState;
            }}
            controller={{ inertia: 750, keyboard: true }}
            layers={layers}
            autoResize={true}
            effects={[postProcessEffect]}
            //on mouse move, set cursor to the event
            onHover={(event) => {
              if (event.coordinate === undefined) return;
              let d;

              // Base radius and decay rate
              const a = 2000; // Adjust this base radius as needed
              const b = 0.25; // Adjust this rate to control the scaling sensitivity

              const dynamicRadius = a * Math.exp(-b * viewState.zoom);

              d = buffer(
                {
                  type: "Feature",
                  geometry: {
                    type: "Point",
                    coordinates: event.coordinate,
                  },
                },
                // mask radius divided by square root of viewstate.zoom
                dynamicRadius,
                { units: "meters" }
              );

              setCursor(d);
            }}
          >
            <Map
              mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
              // mercator projection
              projection="mercator"
              mapStyle="mapbox://styles/niko-dellic/cltohpb4n020q01phd3radn2i"
            />
          </DeckGL>
        </div>
      </div>
      <div className="border-effect" id="bunker-gallery-wrapper">
        <BunkerGallery
          minesweeperBunkers={minesweeperBunkers}
          selectedBunker={selectedBunker}
          setSelectedBunker={setSelectedBunker}
          setInitialEntry={setInitialEntry}
        />
      </div>
    </>
  );
}
