"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import DeckGL from "@deck.gl/react";
// import flyto interpolator
import { FlyToInterpolator } from "@deck.gl/core";
import { Map } from "react-map-gl";
import { GeoJsonLayer } from "deck.gl";
import { PostProcessEffect } from "deck.gl";
import {
  dotScreen,
  edgeWork,
  noise,
  vignette,
  zoomBlur,
  bulgePinch,
} from "@luma.gl/shadertools";
import { MaskExtension } from "@deck.gl/extensions";
import { buffer } from "@turf/turf";
import { BitmapLayer } from "@deck.gl/layers";
import { bbox } from "@turf/turf";
import MeshLayer from "./layers/ScenegraphLayer";
import BunkerGallery from "./BunkerGallery";
import "mapbox-gl/dist/mapbox-gl.css";
import UX from "./UX";
import Canvas from "./Canvas";
import CanvasAnimation from "./CanvasAnimation";
import { ArcLayer } from "@deck.gl/layers";
import { ScreenGridLayer, HeatmapLayer } from "@deck.gl/aggregation-layers";

import {
  convertToBounds,
  createNetworkEdges,
  generateRandomFlags,
  createBufferAndBbox,
  preventDefaultInputs,
} from "./utils";

const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

const _ascii = new PostProcessEffect(dotScreen, {
  size: 3,
});

const _edges = new PostProcessEffect(edgeWork, {
  intensity: 1,
  threshold: 0.25,
  color: [0, 0, 0],
  background: [0, 0, 0, 0],
});

const _noise = new PostProcessEffect(noise, {
  // opacity: 0.5,
  speed: 0.25,
  strength: 3,
});

const _vignette = new PostProcessEffect(vignette, {
  offset: 0.125,
  darkness: 0.0625,
  intensity: 0.1,
});

const _zoomBlur = new PostProcessEffect(zoomBlur, {
  strength: 0.0125,
  radius: 1,
  center: [0.5, 0.5],
});

const _buldgePinch = new PostProcessEffect(bulgePinch, {
  center: [0.5, 0.5],
  radius: 1,
  strength: 1,
  aspect: 1,
});

const numFlags = 350;

const INITIAL_VIEW_STATE = {
  // boston
  longitude: -71.08725092308282,
  latitude: 42.360366356946194,
  zoom: 16.5,
  pitch: 100,
  minPitch: 0,
  maxPitch: 179,
  minZoom: 13.5,
  maxZoom: 22,
};

export default function InteractiveMap({ isMobile }) {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [viewStateBounds, setViewStateBounds] = useState({});
  const [initialEntry, setInitialEntry] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [bunkerCentroids, setBunkerCentroids] = useState([]);
  const [allBunkerCentroids, setAllBunkerCentroids] = useState([]); // [bunkerCentroids, minesweeperBunkers
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

  // check to reload the database
  const [triggerFetch, setTriggerFetch] = useState(false);

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

        if (!isMobile) setBunkers(createBufferAndBbox(data, 0.0125, "miles"));
        setViewStateBounds({
          westLng: dataBounds[0],
          southLat: dataBounds[1],
          eastLng: dataBounds[2],
          northLat: dataBounds[3],
        });
      });
  }, []);

  useEffect(() => {
    // set timeout to fetch after waiting 3 seconds

    setTimeout(() => {
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
    }, 1000);
  }, [triggerFetch]);

  useEffect(() => {
    if (bunkerCentroids?.features?.length > 0) {
      setFlags(generateRandomFlags(bunkerCentroids));
      // combine the bunker centroids and the minesweeper bunkers
      const combinedBunkers = bunkerCentroids;

      if (minesweeperBunkers.length > 0) {
        const msPts = minesweeperBunkers.map((b) => {
          const v = JSON.parse(b.View);
          const props = JSON.parse(b.Data);
          return {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [v.longitude, v.latitude],
            },
            properties: props,
          };
        });

        combinedBunkers.features = combinedBunkers.features.concat(msPts);
      }

      setNetwork(createNetworkEdges(combinedBunkers));
      setAllBunkerCentroids(combinedBunkers);
    }
  }, [bunkerCentroids, minesweeperBunkers]);

  useEffect(() => {
    // set the map pitch to 0 if the canvas is shown
    if (showCanvas) {
      setViewState(() => ({
        ...viewState,
        pitch: 0,
        bearing: 0,
        zoom: 17.5,
      }));
    }
  }, [showCanvas]);

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
          if (!info.bitmap) {
            setSelectedBunker(null);
          }
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

    setViewState({
      ...viewState,
      pitch: 0,
      zoom: view.zoom,
      latitude: view.latitude,
      longitude: view.longitude,
      // transitionDuration: 1500,
      // transitionInterpolator: new FlyToInterpolator(),
    });
  }, [selectedBunker]);

  // useEffect(() => {
  //   if (bunkerCentroids && bunkerCentroids.features?.length > 0) {
  //     const cleanupAnimation = CanvasAnimation({
  //       bunkerCentroids,
  //       initialEntry,
  //       setViewState,
  //     });
  //     // Cleanup function to stop the animation if the component unmounts
  //     return () => {
  //       cleanupAnimation();
  //     };
  //   }
  // }, [initialEntry, bunkerCentroids]); // React to changes in `initialEntry` and `bunkerCentroids`

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
      data: allBunkerCentroids,
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
    viewState.pitch < 10 &&
      new ScreenGridLayer({
        id: "screen-grid-layer",
        data: allBunkerCentroids.features,
        cellSizePixels: 150,
        opacity: 0.125,
        colorRange: [
          [255, 255, 255, 102],
          [255, 255, 255, 153],
          [255, 255, 255, 204],
          [0, 0, 0, 255],
        ],
        getPosition: (d) => d.geometry.coordinates,
        getWeight: 1,
      }),
    // new HeatmapLayer({
    //   id: "heatmapLayer",
    //   data: allBunkerCentroids.features,
    //   getPosition: (d) => d.geometry.coordinates,
    //   // getWeight: 1,
    //   radiusPixels: 150,
    //   colorRange: [
    //     [255, 255, 255, 0],
    //     [255, 255, 255, 85],
    //     [255, 255, 255, 170],
    //     [255, 255, 255, 255],
    //   ],
    //   // threshold: 0.01,
    //   aggregation: "SUM",
    // }),

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
    !showCanvas &&
      new ArcLayer({
        id: "arc-layer",
        data: network.features,
        getSourcePosition: (d) => d.geometry.coordinates[0],
        getTargetPosition: (d) => d.geometry.coordinates[1],
        getSourceColor: [255, 255, 255],
        getTargetColor: [255, 255, 255],
        getWidth: 3,
        getHeight: -0.25,
        extensions: [new MaskExtension()],
        maskId: "geofence",
        maskInverted: false,
      }),
    flags &&
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
            coordinates: [-71.08749276834116, 42.3606773116409],
          },
          properties: {
            rotation: -65,
          },
        },
      ],
      scenegraphUrl: "./assets/glb/ml-small.glb",
      scale: 1,
    }),
    MeshLayer({
      id: "bad-boys",
      data: [
        {
          type: "Feature",
          geometry: {
            coordinates: [-71.10391548752061, 42.37657987930491],
          },
          properties: {
            rotation: 35,
            text: `
            [X: 42.3765 Y: -71.1039] \r\n
            ALERT! ALERT! ALERT! AFTER PARTY ALERT!
            71 BEACON ST APT 3 BZ 9048`,
          },
        },
      ],
      scenegraphUrl: "./assets/glb/badboys.glb",
      scale: 2,
      hover: true,
    }),
    MeshLayer({
      id: "magnus",
      data: [
        {
          type: "Feature",
          geometry: {
            coordinates: [-71.10370176761859, 42.37758970601866],
          },
          properties: {
            rotation: 40,
          },
        },
      ],
      scenegraphUrl: "./assets/glb/magnus.glb",
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
      setViewState({
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
          />
          <DeckGL
            viewState={viewState}
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

              setViewState(viewState);
              return viewState;
            }}
            controller={{ inertia: 750, keyboard: true }}
            layers={layers}
            autoResize={true}
            effects={[_ascii, _noise, _buldgePinch]}
            //on mouse move, set cursor to the event
            onHover={(event) => {
              // check if hovering over a pickable object
              if (!event.picked) {
                setSelectedBunker(null);
              }

              if (event.coordinate === undefined) return;
              let d;

              // Base radius and decay rate
              const a = 3500; // Adjust this base radius as needed
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
            autoTooltip={true}
            // set content for auto tooltip
            getTooltip={({ object }) => {
              if (!object || !object.properties?.text) return null;
              return {
                html: `<div class="border-effect">${object.properties.text}</div>`,
                style: {
                  backgroundColor: "#bdbdbd",
                  color: "black",
                  width: "300px",
                  height: "auto",
                },
              };
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
