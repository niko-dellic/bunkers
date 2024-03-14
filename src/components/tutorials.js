import { useState } from "react";
import Image from "next/image";

export default function Tutorials({ showCanvas }) {
  const [currentStep, setCurrentStep] = useState(0);

  // Define tutorial steps grouped by the showCanvas value
  const tutorials = [
    {
      gif: "/assets/gif/00_pan.gif",
      alt: "pan gif",
      description:
        "01: Check your surroundings: Explore the map and see who you might want to make an alliance with given their vibe and what they got.",
    },
    {
      gif: "/assets/gif/01_draw.gif",
      alt: "draw gif",
      description: "02: Plant your flag: Begin to draw your bunker.",
    },
    {
      gif: "/assets/gif/03_add.gif",
      alt: "combine gif",
      description:
        "03: If you see another bunker with an opening, feel free to combine bunker!",
    },
    {
      gif: "/assets/gif/02_form.gif",
      alt: "form gif",
      description:
        "04: Make a plea to the surrounding bunkers by filling out the form and staking your claim in the world",
    },
    {
      gif: "/assets/gif/03_add.gif",
      alt: "danny gif",
      description:
        "05: Go to local merchants at the party to stockpile your bunker with good, or trade with others!",
    },
  ];

  // Function to handle navigation to the next step
  const nextStep = () => {
    const maxStep = tutorials.length - 1;
    setCurrentStep((currentStep) =>
      currentStep < maxStep ? currentStep + 1 : 0
    );
  };

  // Function to handle navigation to the previous step
  const previousStep = () => {
    const maxStep = tutorials.length - 1;
    setCurrentStep((currentStep) =>
      currentStep > 0 ? currentStep - 1 : maxStep
    );
  };

  // Render the current step based on showCanvas value
  const { gif, alt, description } = tutorials[currentStep];

  return (
    <div id="tutorials-wrapper">
      <Image
        src={gif}
        alt={alt}
        // set to fill
        layout="fill"
      />
      <div id="tutorial-steps">
        <p>{description}</p>
        <button onClick={nextStep}>{"<"}</button>
        <button onClick={previousStep}>{">"}</button>
      </div>
    </div>
  );
}
