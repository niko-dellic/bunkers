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

    // if less than 3, push 2 empties
    if (parsedItems.length < 3) {
      for (let i = 0; i <= 3 - parsedItems.length; i++) {
        parsedItems.push({});
      }
    }
  }

  return (
    (userData || selectedBunker.Data) && (
      <div id={"selected-bunker"}>
        <div>
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
            {/* for each key value pair in parsedItems */}
            {parsedItems?.map((item, index) => {
              {
                /* console.log(item?.ItemImageURL); */
              }

              let imgURL = item?.ItemImageURL || null;

              {
                /* replace all instances of badboys with & */
              }
              const newURL = imgURL?.replace(/badboys/g, "&");

              return (
                <div
                  key={index}
                  className="store-item bounce"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <img
                    src={newURL || "/assets/img/gray_placeholder.png"}
                    className="store-item-image"
                    alt={"Item Image"}
                  />
                  {item ? (
                    <>
                      <div className="store-item-name">
                        Name: {item?.ItemName}
                      </div>
                      <div className="store-item-name">
                        CAPS: {item?.ItemValue}
                      </div>
                    </>
                  ) : (
                    <div className="store-item-name">Empty</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* if there are items,  */}
        {objectToMap.result && <div>{objectToMap.result}</div>}
        {parsedData?.result && <div>{parsedData.result}</div>}
      </div>
    )
  );
}
