import { BitmapLayer } from "@deck.gl/layers";

const BitmapLayerComponent = ({ id, bounds, image, onClick }) =>
  new BitmapLayer({
    id,
    bounds,
    image,
    pickable: true,
    onClick,
  });

export default BitmapLayerComponent;
