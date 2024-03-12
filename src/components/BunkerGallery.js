import Image from "next/image";

export default function BunkerGallery({
  minesweeperBunkers,
  selectedBunker,
  setSelectedBunker,
}) {
  return (
    <div id="bunker-gallery">
      {minesweeperBunkers.map((bunker, index) => {
        return (
          <div
            key={index}
            className="bunker-gallery-item"
            onClick={() => {
              setSelectedBunker(bunker);
            }}
          >
            <Image
              src={`/assets/img/${bunker.data.id}.png`}
              alt={bunker.data.name}
              sizes="500px"
              fill
              style={{
                objectFit: "contain",
              }}
            />
            <p>{bunker.data.name}</p>
          </div>
        );
      })}
    </div>
  );
}
