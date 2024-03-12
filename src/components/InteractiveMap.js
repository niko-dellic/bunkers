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
import { bbox, bboxPolygon, randomPoint } from "@turf/turf";
import { ArcLayer } from "@deck.gl/layers";
import { PathStyleExtension } from "@deck.gl/extensions";
import { WebMercatorViewport } from "@deck.gl/core";
import BunkerGallery from "./BunkerGallery";

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
  maxPitch: 179,
};

const postProcessEffect = new PostProcessEffect(dotScreen, {
  size: 3,
});

const maskRadius = 250;
const numFlags = 200;

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
  const bottomLeft = viewport?.unproject([bounds.minX, bounds.maxY]);
  const topRight = viewport?.unproject([bounds.maxX, bounds.minY]);

  // bottomLeft and topRight now contain [longitude, latitude] arrays
  const geoBounds = {
    westLng: bottomLeft[0],
    southLat: bottomLeft[1],
    eastLng: topRight[0],
    northLat: topRight[1],
  };

  return geoBounds;
}

export default function InteractiveMap({}) {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [cursor, setCursor] = useState(null);
  const [glb, setGlb] = useState(null);
  const [bunkerCentroids, setBunkerCentroids] = useState([]);
  const [bunkers, setBunkers] = useState([]);
  const [bunkerLayers, setBunkerLayers] = useState(null);
  const [network, setNetwork] = useState([]);
  const [showCanvas, setShowCanvas] = useState(false);
  const [canvasDrawingBounds, setCanvasDrawingBounds] = useState({
    minX: -Infinity,
    maxX: Infinity,
    minY: -Infinity,
    maxY: Infinity,
  });
  const [bounds, setBounds] = useState(null);
  const [p5Instance, setP5Instance] = useState(null);
  const [selectedBunker, setSelectedBunker] = useState(null);
  const [flags, setFlags] = useState(null);

  useEffect(() => {
    document.addEventListener("contextmenu", (event) => event.preventDefault());
  }, []);

  useEffect(() => {
    fetch("./assets/geojson/boston_bunkers.geojson")
      .then((res) => res.json())
      .then((data) => {
        setBunkerCentroids(data);
        // Create buffer and bbox for each point

        // get the bounding box for all of the bunkers
        const boundingBox = bboxPolygon(bbox(data));

        // populate 50 randomn points within the bounding box and a random rotation
        const randomPoints = randomPoint(numFlags, {
          bbox: boundingBox,
        });

        // set a random integer rotation for each point
        randomPoints.features = randomPoints.features.map((feature) => {
          feature.properties.rotation = Math.floor(Math.random() * 360);
          return feature;
        });
        setFlags(randomPoints);

        const buff = data.features.map((feature) => {
          return buffer(feature, 0.0125, { units: "miles" });
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
        pickable: true,
        onHover: (info) => {
          if (info.layer) {
            if (info.index !== selectedBunker) {
              setSelectedBunker(i);
            }
          }
        },
      });
    });
    setBunkerLayers(layers);
  }, [bunkers]);

  useEffect(() => {
    // Assuming bounds is your state variable with minX, maxX, minY, maxY
    if (canvasDrawingBounds.minX !== -Infinity) {
      const geoBounds = convertToBounds(canvasDrawingBounds, viewState);
      setBounds(geoBounds);
      // Now you can use geoBounds for whatever you need
    }
  }, [canvasDrawingBounds]); // Depend on bounds state

  // layers array
  const layers = [
    !showCanvas &&
      new GeoJsonLayer({
        id: "geofence",
        data: cursor,
        pointType: "circle",
        getFillColor: (d) => [255, 0, 0],
        operation: "mask",
        getPointRadius: maskRadius,
      }),
    !showCanvas &&
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
    !showCanvas &&
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
        getHeight: 0.5,
        extensions: [new MaskExtension()],
        maskId: "geofence",
      }),
    new ScenegraphLayer({
      id: "scenegraph-layer",
      data: flags?.features,
      scenegraph: "./assets/glb/flag.glb",
      getPosition: (d) => {
        return d.geometry.coordinates;
      },
      pickable: true,
      //rotate random
      getOrientation: (d) => [0, d.properties.rotation, 90],
      sizeScale: 10,
      _lighting: "pbr",
      // _animations: {
      //   "*": { speed: 5 },
      // },
    }),

    bunkerLayers && bunkerLayers,
  ];

  return (
    <>
      <div className="border-effect">
        <UX
          showCanvas={showCanvas}
          setShowCanvas={setShowCanvas}
          p5Instance={p5Instance}
          canvasDrawingBounds={canvasDrawingBounds}
          bounds={bounds}
          selectedBunker={selectedBunker}
        />
      </div>
      <div className="border-effect">
        <div id="canvas-wrapper">
          {/* {canvasDrawingBounds && (
            <div
              style={{
                position: "absolute",
                top: canvasDrawingBounds.minY,
                left: canvasDrawingBounds.minX,
                width: canvasDrawingBounds.maxX - canvasDrawingBounds.minX,
                height: canvasDrawingBounds.maxY - canvasDrawingBounds.minY,
                border: "5px inset red",
              }}
            />
          )} */}
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
            controller={{ inertia: 750 }}
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
            <Map
              mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
              // mercator projection
              projection="mercator"
              mapStyle="mapbox://styles/niko-dellic/cltohpb4n020q01phd3radn2i"
            />
          </DeckGL>
        </div>
      </div>
      <div className="border-effect" id="bunkerGallery">
        <BunkerGallery />
      </div>
    </>
  );
}
