"use client";

import { useEffect, useState, useRef } from "react";
import DeckGL from "@deck.gl/react";
import { Map } from "react-map-gl";
import { GeoJsonLayer, ScenegraphLayer } from "deck.gl";
import { PostProcessEffect } from "deck.gl";
import { dotScreen } from "@luma.gl/shadertools";
import { MaskExtension } from "@deck.gl/extensions";
import { buffer } from "@turf/turf";
import { BitmapLayer } from "@deck.gl/layers";
import { bbox } from "@turf/turf";
import { ArcLayer } from "@deck.gl/layers";
import { PathStyleExtension } from "@deck.gl/extensions";
import { WebMercatorViewport } from "@deck.gl/core";

import * as d3 from "d3-delaunay";
import "mapbox-gl/dist/mapbox-gl.css";
import UX from "./UX";
import Canvas from "./Canvas";

const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

const INITIAL_VIEW_STATE = {
  // boston
  longitude: -71.10411036688859,
  latitude: 42.37510184675266,
  zoom: 14.5,
  // pitch: 50,
  // bearing: 30,
  minPitch: 0,
  maxPitch: 180,
};

const postProcessEffect = new PostProcessEffect(dotScreen, {
  size: 3,
});

const maskRadius = 150;

function convertToBounds(bounds, map) {
  const viewport = new WebMercatorViewport({
    width: map.width,
    height: map.height,
    latitude: map.latitude,
    longitude: map.longitude,
    zoom: map.zoom,
    pitch: map.pitch,
    bearing: map.bearing,
  });

  // Convert pixel bounds to geographical coordinates
  const bottomLeft = viewport.unproject([bounds.minX, bounds.maxY]);
  const topRight = viewport.unproject([bounds.maxX, bounds.minY]);

  // bottomLeft and topRight now contain [longitude, latitude] arrays
  const geoBounds = {
    westLng: bottomLeft[0],
    southLat: bottomLeft[1],
    eastLng: topRight[0],
    northLat: topRight[1],
  };

  console.log(geoBounds);
}

export default function InteractiveMap({}) {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [cursor, setCursor] = useState(null);
  const [glb, setGlb] = useState(null);
  const [bunkerCentroids, setBunkerCentroids] = useState([]);
  const [bunkers, setBunkers] = useState([]);
  const [bunkerLayers, setBunkerLayers] = useState(null);
  const [network, setNetwork] = useState([]);
  const [drawSequence, setDrawSequence] = useState(false);
  const [newDrawingPts, setNewDrawingPts] = useState([]);
  const [newDrawingScreenPts, setNewDrawingScreenPts] = useState([]);
  const [showCanvas, setShowCanvas] = useState(false);
  const map = useRef(null);
  const [canvasDrawingBounds, setCanvasDrawingBounds] = useState({
    minX: -Infinity,
    maxX: Infinity,
    minY: -Infinity,
    maxY: Infinity,
  });
  const [p5Instance, setP5Instance] = useState(null);

  useEffect(() => {
    document.addEventListener("contextmenu", (event) => event.preventDefault());
  }, []);

  useEffect(() => {
    fetch("./assets/geojson/boston_bunkers.geojson")
      .then((res) => res.json())
      .then((data) => {
        setBunkerCentroids(data);
        // Create buffer and bbox for each point
        const buff = data.features.map((feature) => {
          return buffer(feature, 0.0625, { units: "miles" });
        });
        const b = buff.map((b) => bbox(b));
        setBunkers(b);

        // Create a unique id for each feature
        data.features = data.features.map((feature, index) => {
          feature.id = index;
          return feature;
        });

        // Extract points for Delaunay triangulation
        const points = data.features.map((f) => f.geometry.coordinates);
        const delaunay = d3.Delaunay.from(
          points,
          (d) => d[0],
          (d) => d[1]
        );

        // Convert Delaunay edges to GeoJSON LineString features
        const edgesGeoJSON = {
          type: "FeatureCollection",
          features: [],
        };

        // Loop through each triangle in the Delaunay triangulation
        for (let i = 0; i < delaunay.triangles.length; i += 3) {
          for (let j = 0; j < 3; j++) {
            const startIndex = delaunay.triangles[i + j];
            const endIndex = delaunay.triangles[i + ((j + 1) % 3)];

            // Avoid duplicate edges
            if (
              !edgesGeoJSON.features.some((feature) => {
                const coords = feature.geometry.coordinates;
                return (
                  (coords[0] === points[startIndex] &&
                    coords[1] === points[endIndex]) ||
                  (coords[0] === points[endIndex] &&
                    coords[1] === points[startIndex])
                );
              })
            ) {
              edgesGeoJSON.features.push({
                type: "Feature",
                properties: {},
                geometry: {
                  type: "LineString",
                  coordinates: [points[startIndex], points[endIndex]],
                },
              });
            }
          }
        }

        // Now you can use `edgesGeoJSON` as the data source for a map layer
        setNetwork(edgesGeoJSON); // Assuming you have a state `network` to hold this data
      });
  }, []);
  useEffect(() => {
    const layers = bunkers.map((b, i) => {
      return new BitmapLayer({
        id: `bunker-layer-${i}`,
        bounds: b,
        image: "./assets/img/bunker.png",
        extensions: [new MaskExtension()],
        maskId: "geofence",
        maskByInstance: true,
      });
    });
    setBunkerLayers(layers);
  }, [bunkers]);

  useEffect(() => {
    // Assuming bounds is your state variable with minX, maxX, minY, maxY
    if (canvasDrawingBounds.minX !== -Infinity) {
      const geoBounds = convertToBounds(canvasDrawingBounds, viewState);
      // Now you can use geoBounds for whatever you need
    }
  }, [canvasDrawingBounds]); // Depend on bounds state

  // layers array
  const layers = [
    !drawSequence &&
      new GeoJsonLayer({
        id: "geofence",
        data: cursor,
        pointType: "circle",
        getFillColor: (d) => [255, 0, 0],
        operation: "mask",
        getPointRadius: maskRadius,
      }),
    !drawSequence &&
      new GeoJsonLayer({
        id: "geofence-display",
        data: cursor,
        pointType: "circle",
        stroked: true,
        filled: false,
        getPointRadius: maskRadius,
        getFillColor: [255, 0, 0, 50],
        getLineColor: [255, 0, 0, 255],
        getLineWidth: 3,
      }),
    new GeoJsonLayer({
      id: "geojson-layer",
      data: bunkerCentroids,
      stroked: false,
      filled: true,
      pointType: "circle",
      getFillColor: [255, 255, 255, 175],
      getPointRadius: 10,
      pointRadiusMaxPixels: 10,
      extensions: [new MaskExtension()],
      maskId: "geofence",
      maskInverted: true,
    }),
    !drawSequence &&
      new GeoJsonLayer({
        id: "network-layer",
        data: network,
        stroked: true,
        lineWidthUnits: "pixels",
        getLineColor: [255, 255, 255, 100],
        getLineWidth: 3,
        extensions: [new MaskExtension(), new PathStyleExtension()],
        maskId: "geofence",
        maskInverted: true,
        getDashArray: [1, 60],
      }),
    !drawSequence &&
      new ArcLayer({
        id: "arc-layer",
        data: network.features,
        getSourcePosition: (d) => {
          return d.geometry.coordinates[0];
        },
        getTargetPosition: (d) => d.geometry.coordinates[1],
        getSourceColor: [255, 255, 255, 200],
        getTargetColor: [255, 255, 255, 200],
        getWidth: 2,
        getHeight: -0.5,
        extensions: [new MaskExtension()],
        maskId: "geofence",
      }),
    drawSequence &&
      new GeoJsonLayer({
        id: "new-bunker-layer",
        data: [
          {
            type: "Feature",
            geometry: {
              type: newDrawingPts.length > 1 ? "Polygon" : "Point",
              coordinates:
                newDrawingPts.length > 1 ? [newDrawingPts] : newDrawingPts[0],
            },
          },
        ],
        stroked: true,
        filled: true,
        lineWidthUnits: "pixels",
        getLineColor: (d) => {
          return [255, 0, 0, 255];
        },
        pointType: "circle",
        getFillColor: [255, 0, 0, 100],
        getPointRadius: 10,
        getLineWidth: 5,
      }),
    // bunkerLayers && bunkerLayers,
  ];

  const handleDrawing = (event) => {
    if (drawSequence) {
      setNewDrawingPts([...newDrawingPts, event.coordinate]);

      const screenPts = newDrawingScreenPts;
      screenPts.push([event.x, event.y]);

      // Calculate the min and max for x and y from screenPts
      const minX = Math.min(...screenPts.map((pt) => pt[0]));
      const maxX = Math.max(...screenPts.map((pt) => pt[0]));
      const minY = Math.min(...screenPts.map((pt) => pt[1]));
      const maxY = Math.max(...screenPts.map((pt) => pt[1]));

      // Remap the points to the canvas dimensions
      const remappedPts = screenPts.map((pt) => {
        const remappedX = ((pt[0] - minX) / (maxX - minX)) * canvasDimensions.x;
        const remappedY = ((pt[1] - minY) / (maxY - minY)) * canvasDimensions.y;
        return [remappedX, remappedY];
      });

      setNewDrawingScreenPts(remappedPts);
    }
  };

  return (
    <div>
      <UX
        showCanvas={showCanvas}
        setShowCanvas={setShowCanvas}
        p5Instance={p5Instance}
        setP5Instance={setP5Instance}
      />
      <Canvas
        showCanvas={showCanvas}
        setShowCanvas={setShowCanvas}
        canvasDrawingBounds={canvasDrawingBounds}
        setCanvasDrawingBounds={setCanvasDrawingBounds}
        p5Instance={p5Instance}
        setP5Instance={setP5Instance}
      />
      <DeckGL
        initialViewState={INITIAL_VIEW_STATE}
        onViewStateChange={(e) => setViewState(e.viewState)}
        ref={map}
        controller={true}
        layers={layers}
        autoTooltip={true}
        autoResize={true}
        effects={[postProcessEffect]}
        //on mouse move, set cursor to the event
        onHover={(event) => {
          // create a point buffer
          if (event.coordinate === undefined) return;
          let d;

          d = buffer(
            {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: event.coordinate,
              },
            },
            maskRadius,
            { units: "meters" }
          );

          setCursor(d);
        }}
      >
        {/* <Map
          mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
          // mercator projection
          projection="mercator"
          mapStyle="mapbox://styles/mapbox/dark-v11"
        /> */}
      </DeckGL>
    </div>
  );
}
