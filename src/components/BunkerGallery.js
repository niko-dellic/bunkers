import Image from "next/image";

export default function BunkerGallery({
  minesweeperBunkers,
  selectedBunker,
  setSelectedBunker,
  setInitialEntry,
}) {
  return (
    <div id="bunker-gallery">
      {minesweeperBunkers.map((bunker, index) => {
        return (
          <div
            key={index}
            className="bunker-gallery-item"
            onClick={(e) => {
              // scroll to top
              window.scrollTo(0, 0);
              setInitialEntry(true);
              setSelectedBunker(bunker);
            }}
          >
            <Image
              src={bunker.ImageURL}
              alt={bunker.Data["name"] || `Bunker ${index + 1}`}
              sizes="500px"
              fill
              style={{
                objectFit: "contain",
              }}
            />
            <p>{bunker.Data.name}</p>
            <p>{bunker.Data.stockpile}</p>
            <p>{bunker.Data.fears}</p>
          </div>
        );
      })}
    </div>
  );
}
