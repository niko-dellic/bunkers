"use client";

import { useEffect, useState, useRef } from "react";
import DeckGL from "@deck.gl/react";
import { FlyToInterpolator } from "@deck.gl/core";
import { Map } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { _TerrainExtension as TerrainExtension } from "@deck.gl/extensions";

const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

const INITIAL_VIEW_STATE = {
  // Los Angeles
  longitude: -118.29037160461509,
  latitude: 34.02176712375918,
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

  // state for zoning and parcel data formatted as array of features
  const [zoningData, setZoningData] = useState([]);
  const [parcelData, setParcelData] = useState([]);

  // state of list of unique zone and parcel types
  const [zoneTypes, setZoneTypes] = useState([]);
  const [parcelTypes, setParcelTypes] = useState([]);

  // state for selected polygons
  const [selectedZone, setSelectedZone] = useState(null);
  const [selectedParcel, setSelectedParcel] = useState(null);

  // state for enabled layers - TILES, ZONING, PARCEL
  const [enabledLayers, setEnabledLayers] = useState([]);

  // transitory state for tile points that are generated when tiles are loaded
  const newTilePtsRef = useRef([]);
  // state for tile points that are generated when tiles are loaded
  const [tilePts, setTilePts] = useState([]);

  // state for toggling draw sequence and freezing the viewport
  const [toggleDrawSequence, setToggleDrawSequence] = useState(false);
  const [togglePointPlacement, setTogglePointPlacement] = useState(false);

  // state for gltf object for scene graph layer
  const [gltf, setGltf] = useState(null);

  // used to pick the site boundary
  const [siteSelection, setSiteSelection] = useState([]);
  const [hoveredIcon, setHoveredIcon] = useState(null);

  // const ifc models use state
  const [ifcModels, setIfcModels] = useState([]);

  // prevent right click on page load
  useEffect(() => {
    document.addEventListener("contextmenu", (event) => event.preventDefault());
  }, []);

  // handle click event for flying to selected polygon
  const onClick = (event) => {
    if (event.object) {
      const [longitude, latitude] = event.coordinate;
      const current_bearing = viewState.bearing;
      let new_bearing = Math.random() * 90;
      // find the shortest path to from current bearing to new bearing given a max change of 90 degrees
      if (new_bearing - current_bearing > 45) {
        new_bearing = new_bearing - 90;
      } else if (new_bearing - current_bearing < -45) {
        new_bearing = new_bearing + 90;
      }

      setViewState({
        ...viewState,
        longitude: longitude,
        latitude: latitude,
        zoom: 17,
        transitionDuration: 500,
        transitionInterpolator: new FlyToInterpolator(),
        // set bearing and pivot to random between 0 and 360
        bearing: new_bearing,
        pitch: 60,
      });
    }
  };

  // layers array
  const layers = [];

  return (
    <div>
      <DeckGL
        // add globe view
        viewState={viewState}
        onViewStateChange={({ viewState }) => setViewState(viewState)}
        // controller
        controller={!toggleDrawSequence && !togglePointPlacement}
        layers={layers}
        // autoTooltip={true}
        getTooltip={({ object }) => {
          if (!object) {
            return null;
          }

          const tooltip = {
            html: "",
            style: {
              backgroundColor: "black",
              color: "white",
              fontSize: "12px",
              padding: "5px",
              fontWeight: "bold",
            },
          };

          if (object.properties.zone_cmplt) {
            tooltip.html = `Zone: ${object.properties.zone_cmplt}`;
          } else if (object.properties.tract) {
            tooltip.html = `Parcel: ${object.properties.tract}`;
          }

          return tooltip;
        }}
      >
        <Map
          mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
          mapStyle="mapbox://styles/niko-dellic/clpimqkw300c201pg7cl4ej5q"
        />
      </DeckGL>
    </div>
  );
}
