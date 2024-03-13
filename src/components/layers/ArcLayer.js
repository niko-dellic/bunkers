import { ArcLayer } from "@deck.gl/layers";

const ArcLayerComponent = ({ data }) =>
  new ArcLayer({
    id: "arc-layer",
    data: data,
    getSourcePosition: (d) => d.geometry.coordinates[0],
    getTargetPosition: (d) => d.geometry.coordinates[1],
    getSourceColor: [255, 255, 255, 200],
    getTargetColor: [255, 255, 255, 200],
    getWidth: 2,
    getHeight: -0.33,
  });

export default ArcLayerComponent;
