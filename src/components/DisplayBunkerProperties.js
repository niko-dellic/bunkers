export default function DisplayBunkerProperties({ selectedBunker }) {
  // if type is object
  if (typeof selectedBunker === "object") {
    // return the selectedBunker as a JSON string
    return <pre>{JSON.stringify(selectedBunker, null, 2)}</pre>;
  } else {
    return <div>{selectedBunker}</div>;
  }
}
