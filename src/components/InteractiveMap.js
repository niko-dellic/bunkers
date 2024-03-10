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
  const [bounds, setBounds] = useState([]);
  const [glb, setGlb] = useState(null);
  const [bunkers, setBunkers] = useState([]);

  // console.log(bunkers);

  // prevent right click on page load
  useEffect(() => {
    document.addEventListener("contextmenu", (event) => event.preventDefault());

    fetch("./assets/geojson/cambridge_bunkers.geojson")
      .then((res) => res.json())
      .then((data) => {
        // crewate buffer and bbox for each point
        const buff = data.features.map((feature) => {
          return buffer(feature, 0.125, { units: "miles" });
        });
        const b = buff.map((b) => bbox(b));
        setBunkers(b);
      });
  }, []);

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
      data: "./assets/geojson/cambridge_bunkers.geojson",
      stroked: false,
      filled: false,
      pointType: "circle",
      getFillColor: (d) => {
        return [255, 0, 0];
      },
      getPointRadius: 250,
      extensions: [new MaskExtension()],
      maskId: "geofence",
      maskByInstance: false,
      onDataLoad: (data) => {
        // crewate buffer and bbox for each point
        const buff = data.features.map((feature) => {
          return buffer(feature, 0.125, { units: "miles" });
        });
        const b = buff.map((b) => bbox(b));
        setBounds(b);
      },
    }),

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
    bunkers.length > 0 &&
      bunkers.map(
        (b) =>
          new BitmapLayer({
            id: "bitmap-layer",
            // bounds: [-180, 90, -180, -90],
            bounds: b,
            image: "./assets/img/bunker.png",
            extensions: [new MaskExtension()],
            maskId: "geofence",
            maskByInstance: false,
          })
      ),
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
