"use client";

import { useEffect, useState, useRef } from "react";
import DeckGL from "@deck.gl/react";
import { Map } from "react-map-gl";
import { GeoJsonLayer } from "deck.gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

const INITIAL_VIEW_STATE = {
  // Los Angeles
  longitude: -71.06,
  latitude: 42.3601,
  zoom: 16,
  // maxZoom: 22,
  // minZoom: 13,
  pitch: 0,
  bearing: 0,
  minPitch: 0,
  maxPitch: 180,
};

export default function InteractiveMap({}) {
  // deck gl view state handler
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);

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
      getFillColor: (d) => {
        console.log(d);
        return [255, 0, 0];
      },
    }),
  ];

  return (
    <div>
      <DeckGL
        initialViewState={viewState}
        controller={true}
        layers={layers}
        autoTooltip={true}
        autoResize={true}
        onClick={(info) => console.log(info)}
      >
        <Map
          mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
          mapStyle="mapbox://styles/niko-dellic/clpimqkw300c201pg7cl4ej5q"
        />
      </DeckGL>
    </div>
  );
}
