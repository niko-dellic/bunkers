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
import { TripsLayer } from "@deck.gl/geo-layers";
import { ArcLayer } from "@deck.gl/layers";

import * as d3 from "d3-delaunay";

import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

const INITIAL_VIEW_STATE = {
  // boston
  longitude: -71.10411036688859,
  latitude: 42.37510184675266,
  zoom: 14.5,
  pitch: 50,
  bearing: 30,
  minPitch: 0,
  maxPitch: 180,
};

const postProcessEffect = new PostProcessEffect(dotScreen, {});

export default function InteractiveMap({}) {
  const [cursor, setCursor] = useState(null);
  const [glb, setGlb] = useState(null);
  const [bunkerCentroids, setBunkerCentroids] = useState([]);
  const [bunkers, setBunkers] = useState([]);
  const [bunkerLayers, setBunkerLayers] = useState(null);
  const [network, setNetwork] = useState([]);

  useEffect(() => {
    document.addEventListener("contextmenu", (event) => event.preventDefault());

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

  // layers array
  const layers = [
    new GeoJsonLayer({
      id: "geofence",
      data: cursor,
      pointType: "circle",
      getFillColor: (d) => [255, 0, 0],
      operation: "mask",
      getPointRadius: 1000,
    }),
    new GeoJsonLayer({
      id: "geofence-display",
      data: cursor,
      pointType: "circle",
      stroked: true,
      filled: false,
      getPointRadius: 1000,
      getFillColor: [255, 0, 0, 50],
      getLineColor: [255, 0, 0, 255],
      getLineWidth: 10,
    }),
    new GeoJsonLayer({
      id: "geojson-layer",
      data: bunkerCentroids,
      stroked: true,
      filled: true,
      pointType: "circle",
      getFillColor: [255, 255, 255],
      getPointRadius: 10,
      // set the max pixels to 3
      pointRadiusMaxPixels: 10,
      extensions: [new MaskExtension()],
      maskId: "geofence",
      maskInverted: true,
    }),
    // add networkgggggfghfhhfhghgfhg
    new GeoJsonLayer({
      id: "network-layer",
      data: network,
      stroked: true,
      lineWidthUnits: "pixels",
      getLineColor: [255, 255, 255, 100],
      getLineWidth: 3,
      extensions: [new MaskExtension()],
      maskId: "geofence",
      maskInverted: true,
    }),

    new ArcLayer({
      id: "arc-layer",
      data: network.features,
      getSourcePosition: (d) => {
        return d.geometry.coordinates[0];
      },
      getTargetPosition: (d) => d.geometry.coordinates[1],
      getSourceColor: [253, 128, 93],
      getTargetColor: [253, 128, 93],
      getWidth: 2,
      getHeight: 0.5,
      extensions: [new MaskExtension()],
      maskId: "geofence",
    }),
    // new TripsLayer({
    //   id: "trips-layer",
    //   data: network,
    //   getPath: (d) => d.waypoints.map((p) => p.coordinates),
    //   // deduct start timestamp from each data point to avoid overflow
    //   getTimestamps: (d) => d.waypoints.map((p) => p.timestamp - 1554772579000),
    //   getColor: [253, 128, 93],
    //   opacity: 0.8,
    //   widthMinPixels: 5,
    //   rounded: true,
    //   fadeTrail: true,
    //   trailLength: 200,
    //   currentTime: 100,
    // }),

    // new ScenegraphLayer({
    //   id: "scenegraph-layer",
    //   data:
    //     glb ||
    //     fetch("./assets/geojson/cambridge_bunkers.geojson")
    //       .then((res) => res.json())
    //       .then((data) => {
    //         const d = data.features;
    //         d.map((feature) => {
    //           feature.coordinates = feature.geometry.coordinates;
    //         });
    //         setGlb(d);
    //         return d;
    //       }),
    //   scenegraph: "./assets/glb/wind_turbine.glb",
    //   getPosition: (d) => {
    //     return d.coordinates;
    //   },
    //   pickable: true,
    //   getOrientation: (d) => [0, Math.random() * 360, 90],
    //   sizeScale: 0.05,
    //   _lighting: "pbr",
    //   _animations: {
    //     "*": { speed: 1 },
    //   },
    //   // extensions: [new MaskExtension()],
    //   // maskId: "geofence",
    //   // maskByInstance: false,
    // }),
    bunkerLayers && bunkerLayers,
  ];

  return (
    <div>
      <DeckGL
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
        layers={layers}
        autoTooltip={true}
        autoResize={true}
        effects={[postProcessEffect]}
        //on mouse move, set cursor to the event
        onHover={(event) => {
          // const d = [
          //   {
          //     type: "Feature",
          //     geometry: {
          //       type: "Point",
          //       coordinates: event.coordinate,
          //     },
          //   },
          // ];

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
            0.5,
            { units: "miles" }
          );

          setCursor(d);
        }}
      >
        {/* <Map
          mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
          mapStyle="mapbox://styles/mapbox/dark-v11"
        /> */}
      </DeckGL>
    </div>
  );
}
