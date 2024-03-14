export default function DisplayBunkerResults({ result, selectedBunker }) {
  return (
    <div>
      {result
        ? JSON.stringify(result, null, 2)
        : selectedBunker
        ? JSON.stringify(selectedBunker, null, 2)
        : "No results to display"}
    </div>
  );
}
