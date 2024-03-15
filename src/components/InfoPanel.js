export default function InfoPanel({ minesweeperBunkers }) {
  return (
    // <div>
    //   <h2>Welcome to BunkerTown, MA</h2>
    //   <p>
    //     Population:
    //     {minesweeperBunkers.length}
    //   </p>
    //   <p>Top items stockpiled:</p>
    //   {/* TO DO - add gpt data looking at top items */}
    // </div>

    <div class="info">
      <div style={{ display: "flex", justifyContent: "center" }}>
        <img
          src="/assets/img/smile.png"
          alt="Description of image"
          style={{ width: "50px", paddingTop: "10px" }}
        />
      </div>
      <div id="info-title">Welcome to BunkerMatch</div>
      <div id="population">
        Population:
        {minesweeperBunkers.length}
      </div>

      <p class="instructions">
        Browse the map and find a place to create your new emergency shelter.
      </p>
    </div>
  );
}
