"use client";

import { useEffect, useState } from "react";
import DeckGL from "@deck.gl/react";
// import flyto interpolator
import { Map } from "react-map-gl";
import { GeoJsonLayer, PostProcessEffect } from "deck.gl";
import { dotScreen, noise } from "@luma.gl/shadertools";
import { MaskExtension } from "@deck.gl/extensions";
import { buffer } from "@turf/turf";
import { BitmapLayer } from "@deck.gl/layers";
import { bbox } from "@turf/turf";
import MeshLayer from "./layers/ScenegraphLayer";
import "mapbox-gl/dist/mapbox-gl.css";
import CanvasAnimation from "./CanvasAnimation";
// import { ArcLayer } from "@deck.gl/layers";
// import { ScreenGridLayer, HeatmapLayer } from "@deck.gl/aggregation-layers";
// import AnimatedArcLayer from "./layers/animated-arc-group";

import {
  createNetworkEdges,
  generateRandomFlags,
  createBufferAndBbox,
  preventDefaultInputs,
} from "./utils";

const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

const _ascii = new PostProcessEffect(dotScreen, {
  size: 1.5,
});

const _noise = new PostProcessEffect(noise, {
  amount: 0.5,
});

export default function InteractiveMap({
  isMobile,
  showCanvas,
  selectedBunker,
  setMinesweeperBunkers,
  minesweeperBunkers,
  triggerFetch,
  setSelectedBunker,
  initialEntry,
  viewState,
  setViewState,
}) {
  const [viewStateBounds, setViewStateBounds] = useState({});
  const [cursor, setCursor] = useState(null);
  const [bunkerCentroids, setBunkerCentroids] = useState([]);
  const [allBunkerCentroids, setAllBunkerCentroids] = useState([]); // [bunkerCentroids, minesweeperBunkers
  const [bunkers, setBunkers] = useState([]);
  const [bunkerLayers, setBunkerLayers] = useState(null);
  const [minesweeperBunkerLayers, setMinesweeperBunkerLayers] = useState(null);
  const [network, setNetwork] = useState([]);
  // bonus 3d flags
  const [flags, setFlags] = useState(null);

  useEffect(() => {
    preventDefaultInputs();
    fetch("./assets/geojson/starter_map.geojson")
      .then((res) => res.json())
      .then((data) => {
        // Create a unique id for each feature
        data.features = data.features.map((feature, index) => {
          feature.id = index;
          return feature;
        });

        const dataBounds = bbox(data);
        // get the bounding box for all of the bunkers
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
    // set timeout to fetch after waiting 1 second
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

      // get dataBounds = bbox(data);
      const dataBounds = bbox(combinedBunkers);
      setViewStateBounds({
        westLng: dataBounds[0],
        southLat: dataBounds[1],
        eastLng: dataBounds[2],
        northLat: dataBounds[3],
      });
    }
  }, [bunkerCentroids, minesweeperBunkers]);

  useEffect(() => {
    // set the map pitch to 0 if the canvas is shown
    if (showCanvas) {
      setViewState(() => ({
        ...viewState,
        pitch: 0,
        bearing: 0,
        zoom: 18.5,
      }));
    }
  }, [showCanvas]);

  useEffect(() => {
    const layers = bunkers.map((b, i) => {
      // get the img url from the start map

      const img =
        bunkerCentroids.features[i].properties.imgURL ||
        "./assets/img/placeholder.png";

      return new BitmapLayer({
        id: `bunker-${i}`,
        bounds: b,
        image: img,
        extensions: [new MaskExtension()],
        maskId: "geofence",
        maskByInstance: true,
        pickable: true,
        onHover: (info) => {
          // console.log(bunkerCentroids.features[i]);

          if (!info.bitmap) {
            setSelectedBunker(null);
          }
          const hoveredBunker = bunkerCentroids.features[i];
          setSelectedBunker(hoveredBunker.properties);
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

          pickable: true,
          onHover: () => {
            setSelectedBunker(b);
          },
        });
      } catch (error) {
        console.error("Failed to load image:", error);
      }
    });

    setMinesweeperBunkerLayers(layers);
  }, [minesweeperBunkers]);

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
      onHover: (info) => setSelectedBunker(info.properties),
      ...(isMobile
        ? {}
        : {
            extensions: [new MaskExtension()],
            maskId: "geofence",
            maskInverted: true,
          }),
    }),
    // viewState.pitch < 10 &&
    //   new ScreenGridLayer({
    //     id: "screen-grid-layer",
    //     data: allBunkerCentroids.features,
    //     cellSizePixels: 150,
    //     opacity: 0.125,
    //     colorRange: [
    //       [255, 255, 255, 102],
    //       [255, 255, 255, 153],
    //       [255, 255, 255, 204],
    //       [0, 0, 0, 255],
    //     ],
    //     getPosition: (d) => d.geometry.coordinates,
    //     getWeight: 1,
    //   }),
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
      getLineWidth: 1,
      extensions: [new MaskExtension()],
      maskId: "geofence",
      maskInverted: true,
    }),
    !showCanvas &&
      new GeoJsonLayer({
        id: "network-layer-inclusion",
        data: network,
        stroked: true,
        lineWidthUnits: "pixels",
        getLineColor: [255, 255, 255],
        getLineWidth: 3,
        extensions: [new MaskExtension()],
        maskId: "geofence",
        maskInverted: false,
      }),
    // !showCanvas &&
    //   new ArcLayer({
    //     id: "arc-layer",
    //     data: network.features,
    //     getSourcePosition: (d) => d.geometry.coordinates[0],
    //     getTargetPosition: (d) => d.geometry.coordinates[1],
    //     getSourceColor: [255, 255, 255],
    //     getTargetColor: [255, 255, 255],
    //     getWidth: 3,
    //     getHeight: -0.25,
    //     extensions: [new MaskExtension()],
    //     maskId: "geofence",
    //     maskInverted: false,
    //   }),
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
            ALERT! ALERT! ALERT! AFTER PARTY ALERT!`,
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

  return (
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
      controller={{ keyboard: true }}
      layers={layers}
      autoResize={true}
      effects={[_noise, _ascii]} //_halftone,_hueSaturation
      //on mouse move, set cursor to the event
      onHover={(event) => {
        // check if hovering over a pickable object
        // if (!event.picked) {
        //   setSelectedBunker(null);
        // }

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
          html: `<div>${object.properties.text}</div>`,
          style: {
            border: "5px outset white",
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
        projection="mercator"
        mapStyle="mapbox://styles/niko-dellic/cltohpb4n020q01phd3radn2i"
      />
    </DeckGL>
  );
}
