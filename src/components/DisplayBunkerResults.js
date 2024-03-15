import Image from "next/image";

export default function DisplayBunkerResults({
  userData,
  selectedBunker,
  imageResult,
}) {
  // Determine which object to use for mapping
  const objectToMap = userData || selectedBunker;
  let parsedData = null;
  if (objectToMap && !userData && objectToMap?.Data) {
    // parse the data from the selectedBunker
    parsedData = JSON.parse(objectToMap?.Data);
  }

  return (
    (userData || selectedBunker.Data) && (
      <>
        {imageResult ? (
          <Image
            src={imageResult}
            width={256}
            height={256}
            alt="Generated Image"
            style={{
              width: "100%",
              height: "auto",
              imageRendering: "pixelated",
            }}
            className={"generated-image"}
          />
        ) : parsedData?.genImageURL ? (
          <Image
            src={parsedData?.genImageURL}
            width={256}
            height={256}
            alt="Generated Image"
            style={{
              width: "100%",
              height: "auto",
              imageRendering: "pixelated",
            }}
            className={"generated-image"}
          />
        ) : (
          <Image
            src="/assets/gif/loading.gif"
            width={72}
            height={72}
            alt="Loading"
          />
        )}
        {objectToMap.result && (
          <div>
            <p>{objectToMap.result}</p>
          </div>
        )}
        {parsedData?.result && (
          <div>
            <p>{parsedData.result}</p>
          </div>
        )}
      </>
    )
  );
}
