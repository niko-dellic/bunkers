export default function DisplayBunkerProperties({ selectedBunker }) {
  if (typeof selectedBunker === "object") {
    // if type is object
    const data = selectedBunker;
    // drop id
    if (data) {
      delete data.id;
      // return the selectedBunker as a JSON string
      // return <pre>{JSON.stringify(data, null, 2)}</pre>; //NIKO

      return (
        <div>
          <h2 style={{ marginBottom: '20px' }}>Bunker discovery!!</h2>
          <label style={{ marginBottom: '20px' }} htmlFor="name" >Name:</label>
          <div>{data.name}</div>
          <label htmlFor="description" style={{ marginBottom: '20px' }}>Description:</label>
          <div>{data.description}</div>
          <label htmlFor="bartering" style={{ marginBottom: '20px' }}>Open to batering?</label>
          <div>{data.bartering}</div>
        </div>
      );


    } else {
      return <div>{data}</div>;
    }
  }
}
