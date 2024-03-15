import Image from "next/image";

export default function InfoPanel({ minesweeperBunkers }) {
  return (
    <div className="info">
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Image
          src="/assets/img/smile.png"
          alt="smiley"
          height={50}
          width={50}
          style={{ height: "auto", paddingTop: "10px" }}
        />
      </div>
      <p id="info-title">Welcome to BunkerMatch</p>
      <div id="population">Population: {minesweeperBunkers.length}</div>

      <p className="instructions">
        Browse the map and find a place to create your new emergency shelter.
      </p>
    </div>
  );
}
