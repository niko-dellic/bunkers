import { WebMercatorViewport } from "@deck.gl/core";
import { bbox, bboxPolygon, buffer, randomPoint } from "@turf/turf";
import * as d3 from "d3-delaunay";

// Convert viewport bounds to geographical bounds
export function convertToBounds(bounds, viewState) {
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

  const viewProps = {
    longitude: centroid[0],
    latitude: centroid[1],
    zoom: viewState.zoom,
  };

  return [geoBounds, viewProps];
}

// Create network edges from points using Delaunay triangulation
export function createNetworkEdges(data) {
  const points = data.features.map((f) => f.geometry.coordinates);
  const delaunay = d3.Delaunay.from(
    points,
    (d) => d[0],
    (d) => d[1]
  );
  const edgesGeoJSON = { type: "FeatureCollection", features: [] };

  for (let i = 0; i < delaunay.triangles.length; i += 3) {
    for (let j = 0; j < 3; j++) {
      const startIndex = delaunay.triangles[i + j];
      const endIndex = delaunay.triangles[i + ((j + 1) % 3)];

      if (
        !edgesGeoJSON.features.some((feature) => {
          const coords = feature.geometry.coordinates;
          return (
            (coords[0] === points[startIndex] &&
              coords[1] === points[endIndex]) ||
            (coords[0] === points[endIndex] && coords[1] === points[startIndex])
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

  return edgesGeoJSON;
}

// Generate random points for flags with random rotation
export function generateRandomFlags(data) {
  const numFlags = 500;
  const dataBounds = bbox(data);
  const boundingBox = bboxPolygon(dataBounds);

  const randomPoints = randomPoint(numFlags, { bbox: boundingBox });
  randomPoints.features = randomPoints.features.map((feature) => {
    feature.properties.rotation = Math.floor(Math.random() * 360);
    return feature;
  });

  return randomPoints;
}

// Buffer and bbox utility wrapper for turf functions
export function createBufferAndBbox(data, radius = 0.0125, units = "miles") {
  return data.features.map((feature) => {
    const buffered = buffer(feature, radius, { units });
    return bbox(buffered);
  });
}

// Prevent default context menu
export function preventDefaultInputs() {
  document.addEventListener("contextmenu", (event) => event.preventDefault());
  //prevent keyboard from scrolling down page
  document.addEventListener("keydown", function (e) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
    }
  });
}
