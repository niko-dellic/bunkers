export default function InfoPanel({ minesweeperBunkers }) {
  return (
    <div>
      <h2>Welcome to BunkerTown, MA</h2>
      <p>
        Population:
        {minesweeperBunkers.length}
      </p>
      <p>Top items stockpiled:</p>
      {/* TO DO - add gpt data looking at top items */}
    </div>
  );
}
