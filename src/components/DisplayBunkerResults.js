import Image from "next/image";

export default function DisplayBunkerResults({
  userData,
  selectedBunker,
  imageResult,
}) {
  // Determine which object to use for mapping
  const objectToMap = userData || selectedBunker;
  let parsedData = null;
  let parsedItems = null;
  if (objectToMap && !userData && objectToMap?.Data) {
    // parse the data from the selectedBunker
    parsedData = JSON.parse(objectToMap?.Data);

    // parse the items array
    parsedItems = JSON.parse(objectToMap.Items);

    // if empty, put 3 empty objects
    if (parsedItems.length === 0) {
      parsedItems = [{}, {}, {}];
    } else {
      // if there are items, sort them by artifactValue
      parsedItems.sort((a, b) => {
        return a.artifactValue - b.artifactValue;
      });
    }
  }

  return (
    (userData || selectedBunker.Data) && (
      <div id={"selected-bunker"}>
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
        {/* add parsed items */}
        <div id="store-items-container">
          {parsedItems?.map((item, index) => (
            <div
              key={index}
              className={"store-item bounce"}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <span className={"item-value"}>
                {item.artifactValue ? item.artifactValue : "GO TRADE!!"}
              </span>
              <Image
                src={
                  item.artifactImageURL
                    ? item.artifactImageURL
                    : "/assets/img/gray_placeholder.png"
                }
                width={128}
                height={128}
                style={{
                  width: "100%",
                  height: "auto",
                  imageRendering: "pixelated",
                }}
                alt="Artifact"
              />
            </div>
          ))}
        </div>

        {/* if there are items,  */}
        {objectToMap.result && <div>{objectToMap.result}</div>}
        {parsedData?.result && <div>{parsedData.result}</div>}
      </div>
    )
  );
}
