"use client";

import { useEffect, useState, useRef } from "react";
import DeckGL from "@deck.gl/react";
import { Map } from "react-map-gl";
import { GeoJsonLayer, ScenegraphLayer } from "deck.gl";
import { PostProcessEffect } from "deck.gl";
import { dotScreen } from "@luma.gl/shadertools";
import { MaskExtension } from "@deck.gl/extensions";

import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

const INITIAL_VIEW_STATE = {
  // boston
  longitude: -71.10411036688859,
  latitude: 42.37510184675266,
  zoom: 12.5,
  pitch: 0,
  bearing: 0,
  minPitch: 0,
  maxPitch: 180,
};

const postProcessEffect = new PostProcessEffect(dotScreen, {});

export default function InteractiveMap({}) {
  // prevent right click on page load
  useEffect(() => {
    document.addEventListener("contextmenu", (event) => event.preventDefault());
  }, []);

  // layers array
  const layers = [
    new GeoJsonLayer({
      id: "geojson-layer",
      data: "./assets/geojson/cambridge_bunkers.geojson",
      pickable: true,
      stroked: false,
      filled: true,
      pointType: "circle",
      getFillColor: (d) => {
        return [255, 0, 0];
      },
      pointRadiusMinPixels: 5,
    }),

    new ScenegraphLayer({
      id: "scenegraph-layer",
      data: fetch("./assets/geojson/cambridge_bunkers.geojson")
        .then((res) => res.json())
        .then((data) => {
          const d = data.features;
          d.map((feature) => {
            feature.coordinates = feature.geometry.coordinates;
          });

          return data.features;
        }),
      scenegraph: "./assets/glb/wind_turbine.glb",
      getPosition: (d) => {
        return d.coordinates;
      },
      pickable: true,
      //rotate random
      getOrientation: (d) => [0, Math.random() * 360, 90],
      sizeScale: 0.05,
      _lighting: "pbr",
      _animations: {
        "*": { speed: 5 },
      },
    }),
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
      >
        <Map
          mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
          mapStyle="mapbox://styles/mapbox/dark-v11"
        />
      </DeckGL>
    </div>
  );
}
