import Image from "next/image";

export default function DisplayBunkerResults({
  result,
  selectedBunker,
  imageResult,
}) {
  if (selectedBunker) {
    console.log("bunker!!", selectedBunker.item);
  }

  return (
    <>
      <div>
        {imageResult && (
          <Image
            src={imageResult.imgUrl}
            //src="/assets/img/bunker.png"
            width={256}
            height={256}
            alt="Generated Image"
          />
        )}
      </div>

      <div>
        {result &&
          Object.entries(result).forEach(([key, value]) => {
            <p>
              {key}: {value}
            </p>;
          })}
        {/* {result
          ? JSON.stringify(result, null, 2) //both are met
          : selectedBunker //else, if just this condition is met
          ? JSON.stringify(selectedBunker, null, 2) //then do this one
          : "No results to display"} */}
      </div>
    </>
  );
}
