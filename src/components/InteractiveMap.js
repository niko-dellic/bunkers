"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import DeckGL from "@deck.gl/react";
// import flyto interpolator
import { FlyToInterpolator } from "@deck.gl/core";
import { Map } from "react-map-gl";
import { GeoJsonLayer, ScenegraphLayer } from "deck.gl";
import { PostProcessEffect } from "deck.gl";
import { dotScreen } from "@luma.gl/shadertools";
import { MaskExtension } from "@deck.gl/extensions";
import { buffer } from "@turf/turf";
import { BitmapLayer } from "@deck.gl/layers";
import { bbox, bboxPolygon, randomPoint } from "@turf/turf";
import { ArcLayer } from "@deck.gl/layers";
import { WebMercatorViewport } from "@deck.gl/core";
import BunkerGallery from "./BunkerGallery";

import * as d3 from "d3-delaunay";
import "mapbox-gl/dist/mapbox-gl.css";
import UX from "./UX";
import Canvas from "./Canvas";

const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

const postProcessEffect = new PostProcessEffect(dotScreen, {
  size: 3,
});

const numFlags = 350;

function convertToBounds(bounds, viewState) {
  if (!viewState || !bounds) return;

  const viewport = new WebMercatorViewport({
    width: viewState.width,
    height: viewState.height,
    latitude: viewState.latitude,
    longitude: viewState.longitude,
    zoom: viewState.zoom,
    pitch: viewState.pitch,
    bearing: viewState.bearing,
  });

  // get centroid from average of bounds
  let centroid = [
    (bounds.minX + bounds.maxX) / 2,
    (bounds.minY + bounds.maxY) / 2,
  ];
  // Convert pixel bounds to geographical coordinates
  const bottomLeft = viewport?.unproject([bounds.minX, bounds.maxY]);
  const topRight = viewport?.unproject([bounds.maxX, bounds.minY]);
  centroid = viewport?.unproject(centroid);

  // bottomLeft and topRight now contain [longitude, latitude] arrays
  const geoBounds = {
    westLng: bottomLeft[0],
    southLat: bottomLeft[1],
    eastLng: topRight[0],
    northLat: topRight[1],
  };

  const geoCentroid = {
    longitude: centroid[0],
    latitude: centroid[1],
  };

  return [geoBounds, geoCentroid];
}

export default function InteractiveMap({ isMobile }) {
  const [initialViewState, setInitialViewState] = useState({
    // boston
    longitude: -71.10411036688859,
    latitude: 42.37510184675266,
    zoom: 16,
    pitch: 100,
    minPitch: 0,
    maxPitch: 179,
    minZoom: 15,
    maxZoom: 22,
  });
  // const [viewState, setViewState] = useState(initialViewState);
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
  const [imageCentroid, setImageCentroid] = useState(null);

  const [p5Instance, setP5Instance] = useState(null);
  const [selectedBunker, setSelectedBunker] = useState(null);

  // bonus 3d flags
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
        const dataBounds = bbox(data);
        const boundingBox = bboxPolygon(dataBounds);

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

        if (!isMobile) {
          setBunkers(b);
        }

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
        setNetwork(edgesGeoJSON);

        // set viewStateBounds from bounding box of the data
        setViewStateBounds({
          westLng: dataBounds[0],
          southLat: dataBounds[1],
          eastLng: dataBounds[2],
          northLat: dataBounds[3],
        });
      });

    fetch("./assets/json/bunkers-metadata.json")
      .then((res) => res.json())
      .then((data) => {
        setMinesweeperBunkers([data, data, data, data]);
      });
  }, []);

  // create function to handle bunker hover
  const handleBunkerHover = (info) => {
    if (info.layer) {
      if (info.index !== selectedBunker) {
        setSelectedBunker(info.index);
      }
    } else if (info) {
      setSelectedBunker(info);
    } else {
      setSelectedBunker(null);
    }
  };

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
        onHover: (info) => handleBunkerHover(info),
      });
    });
    setBunkerLayers(layers);
  }, [bunkers]);

  useEffect(() => {
    let centroid;
    const layers = minesweeperBunkers.map((b, i) => {
      // flatten  "bounds": {} to an array
      const imageBounds = [
        b.bounds.westLng,
        b.bounds.southLat,
        b.bounds.eastLng,
        b.bounds.northLat,
      ];

      // get average of the lat and long for centroid
      centroid = [b.imageCentroid.longitude, b.imageCentroid.latitude];

      return new BitmapLayer({
        id: `msBunkers-${i}`,
        bounds: imageBounds,
        image: `./assets/img/${b.data.id}.png`,
        extensions: [new MaskExtension()],
        // maskId: "geofence",
        // maskByInstance: true,
        pickable: true,
        onHover: () => handleBunkerHover(b),
      });
    });

    setMinesweeperBunkerLayers(layers);
  }, [minesweeperBunkers]);

  useEffect(() => {
    // Assuming bounds is your state variable with minX, maxX, minY, maxY
    if (canvasDrawingBounds.minX !== -Infinity) {
      const [geoBounds, centroid] = convertToBounds(
        canvasDrawingBounds,
        initialViewState
      );
      setBounds(geoBounds);
      setImageCentroid(centroid);
      // Now you can use geoBounds for whatever you need
    }
  }, [canvasDrawingBounds]); // Depend on bounds state

  // useEffect to handle selectedBunker
  useEffect(() => {
    if (!selectedBunker || typeof selectedBunker !== "object") return;

    setInitialViewState({
      ...initialViewState,
      pitch: 0,
      zoom: 20,
      latitude: selectedBunker.imageCentroid.latitude,
      longitude: selectedBunker.imageCentroid.longitude,
      transitionDuration: 1500,
      transitionInterpolator: new FlyToInterpolator(),
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
      onHover: (info) => handleBunkerHover(info),
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
        getHeight: -0.33,
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

    !isMobile && bunkerLayers && bunkerLayers,
    minesweeperBunkerLayers && minesweeperBunkerLayers,
  ];

  const togglePlanView = useCallback(
    (bool) => {
      if (initialEntry) return;
      let vs;
      if (bool) {
        vs = { ...initialViewState, pitch: 0 };
      } else {
        vs = { ...initialViewState, pitch: 110 };
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
          imageCentroid={imageCentroid}
          selectedBunker={selectedBunker}
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
            initialViewState={initialViewState}
            onViewStateChange={({ viewState }) => {
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
              // setViewState(viewState);
              return viewState;
            }}
            controller={{ inertia: 750, keyboard: true }}
            layers={layers}
            autoTooltip={true}
            autoResize={true}
            effects={[postProcessEffect]}
            //on mouse move, set cursor to the event
            onHover={(event) => {
              if (event.coordinate === undefined) return;
              let d;

              // Base radius and decay rate
              const a = 2000; // Adjust this base radius as needed
              const b = 0.25; // Adjust this rate to control the scaling sensitivity

              const dynamicRadius = a * Math.exp(-b * initialViewState.zoom);

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
