export default function DisplayBunkerProperties({ selectedBunker }) {
  // if type is object
  const { id, ...data } = selectedBunker.data;
  if (typeof selectedBunker === "object") {
    // return the selectedBunker as a JSON string
    return <pre>{JSON.stringify(data, null, 2)}</pre>;
  } else {
    return <div>{data}</div>;
  }
}
