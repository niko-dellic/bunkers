import { ScenegraphLayer } from "deck.gl";

const ScenegraphLayerComponent = ({ data, id, scenegraphUrl, scale }) =>
  new ScenegraphLayer({
    id: id,
    data: data,
    scenegraph: scenegraphUrl,
    getPosition: (d) => d.geometry.coordinates,
    getOrientation: (d) => [0, d.properties.rotation, 90],
    sizeScale: scale,
    _lighting: "pbr",
    pickable: true,
    autoHighlight: true,
    highlightColor: [255, 255, 0],
    // onHover: (e) => {
    //   if (e.layer.props.data[0].properties.text) {
    //     // alert(e.layer.props.data[0].properties.text);
    //   }
    // },
  });

export default ScenegraphLayerComponent;
