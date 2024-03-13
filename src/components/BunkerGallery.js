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
              src={`/assets/img/${bunker.data.id}.png`}
              alt={bunker.data.name}
              sizes="500px"
              fill
              style={{
                objectFit: "contain",
              }}
            />
            <p>{bunker.data.name}</p>
            <p>{bunker.data.stockpile}</p>
            <p>{bunker.data.fears}</p>
          </div>
        );
      })}
    </div>
  );
}
