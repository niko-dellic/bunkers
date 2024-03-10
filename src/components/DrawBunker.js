// import { P5Wrapper } from "@p5-wrapper/react";
import { ReactP5Wrapper } from "@p5-wrapper/react";

function sketch(p) {
  let isDrawing = false;
  const interval = 10;

  p.setup = () => {
    p.createCanvas(window.innerWidth, window.innerHeight);
    p.background(255, 255, 255, 0); // Transparent background
  };

  p.draw = () => {
    if (!isDrawing) return;

    p.stroke(p.key === "r" ? "red" : "black"); // 'r' for red, other keys for black
    p.strokeWeight(10);
    p.line(p.pmouseX, p.pmouseY, p.mouseX, p.mouseY);
  };

  p.mousePressed = () => {
    isDrawing = true;
  };

  p.mouseReleased = () => {
    isDrawing = false;
  };
}

// function sketch(p) {
//   let newDrawingScreenPts = []; // This will be updated with the actual points

//   p.myCustomRedrawAccordingToNewPropsHandler = function (props) {
//     if (props.newDrawingScreenPts) {
//       newDrawingScreenPts = props.newDrawingScreenPts;
//       p.redraw(); // Force a redraw to update the canvas with new points
//     }
//   };

//   p.setup = () => {
//     p.createCanvas(400, 400);
//     p.background(255, 255, 255, 0); // Transparent background
//     p.noLoop(); // Prevent continuous drawing
//   };

//   p.draw = () => {
//     p.background(255); // Redraw background to clear previous drawings
//     p.stroke("black");
//     p.strokeWeight(2);

//     // Draw the boundary based on newDrawingScreenPts
//     p.beginShape();
//     newDrawingScreenPts.forEach((pt) => {
//       p.vertex(pt[0], pt[1]);
//     });
//     p.endShape(p.CLOSE); // Use CLOSE to close the shape (connect the last point with the first)
//   };
// }

export default function DrawBunker({
  drawSequence,
  newDrawingScreenPts,
  canvasDimensions,
}) {
  const handleSaveDrawing = () => {
    // Note: Saving functionality needs to be adapted to work with @p5-wrapper/react.
    // This library may not directly expose p5 methods like saveCanvas(),
    // so you might need to implement a custom saving function.
    // One approach could be to access the canvas DOM element and save it as an image.
    console.log(
      "Implement the save functionality based on your project requirements."
    );
  };

  return (
    <div>
      {/* set background color to white */}
      <ReactP5Wrapper
        sketch={sketch}
        newDrawingScreenPts={newDrawingScreenPts}
        canvasDimensions={canvasDimensions}
      />
      <button onClick={handleSaveDrawing}>Save Drawing</button>
    </div>
  );
}
