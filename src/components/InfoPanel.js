import Image from "next/image";

export default function InfoPanel({ minesweeperBunkers }) {
  return (
    <div className="info">
      <div id="population">Population: {minesweeperBunkers.length}</div>

      <div className="smiley">
        <Image
          src="/assets/img/smile.png"
          alt="smiley"
          height={50}
          width={50}
          style={{ height: "auto", paddingTop: "10px" }}
        />
      </div>
      {/* <p id="info-title">Welcome to BunkerMatch</p> */}

      <p className="instructions">
        Browse the map and find a place to build your bunker.
      </p>
    </div>
  );
}
