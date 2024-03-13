export default function DisplayBunkerProperties({ selectedBunker }) {
  if (typeof selectedBunker === "object") {
    // if type is object
    const data = selectedBunker;
    // drop id
    if (data) {
      delete data.id;
      // return the selectedBunker as a JSON string
      return <pre>{JSON.stringify(data, null, 2)}</pre>;
    } else {
      return <div>{data}</div>;
    }
  }
}
