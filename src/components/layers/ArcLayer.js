import { ArcLayer } from "@deck.gl/layers";
import { MaskExtension } from "@deck.gl/extensions";

const ArcLayerComponent = ({ data }) => {
  // console.log(data);
  return new ArcLayer({
    id: "arc-layer",
    data: data.features,
    getSourcePosition: (d) => d.geometry.coordinates[0],
    getTargetPosition: (d) => d.geometry.coordinates[1],
    getSourceColor: [255, 255, 255, 200],
    getTargetColor: [255, 255, 255, 200],
    getWidth: 2,
    getHeight: 0,
    // extensions: [new MaskExtension()],
    // maskId: "geofence",
    // maskInverted: false,
  });
};

export default ArcLayerComponent;
