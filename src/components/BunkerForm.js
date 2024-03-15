import { useState } from "react";
import OpenAI from "openai";

const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

let openai;

if (OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
  });
}

const items = [
  { id: "item1", value: "Spices", label: "Spices" },
  { id: "item2", value: "Soap", label: "Soap" },
  { id: "item3", value: "Music", label: "Music" },
  { id: "item4", value: "Monopoly", label: "Monopoly" },
];

export default function BunkerForm({
  onFormDataChange,
  userData,
  setUserData,
  setImageResult,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false); // Track submission state

  const storeFormData = async (e) => {
    const data = new FormData(e.target);
    const formProps = Object.fromEntries(data);
    //const str = `${formProps.name} is the thing you always keep by your door/in your pantry/in your backpack for emergencies. You can only have one in your bunker. You choose ${formProps.item}. Your survival team is ${formProps.team}.`;
    const str = `In 2 sentences, give a detailed description of a fun quirky bunker stockpiling ${formProps.item}, vibes are ${formProps.vibe}, and protection from ${formProps.fear}.`;

    formProps.prompt = str; //Sets the prompt as an attribute of formProps

    async function genContent(data) {
      const prompt = data.prompt;
      const completion = await openai.chat.completions.create({
        messages: [{ role: "system", content: prompt }],
        model: "gpt-3.5-turbo",
      });

      const res = completion.choices[0].message.content;
      data.result = res;
    }

    async function genImage(data) {
      const prompt = data.result;
      //TURNING OFF GENERATION WHILE IMAGE ISSUE IS FIXED
      const image = await openai.images.generate({
        prompt:
          "2d game graphics pixel art, view from above isometric, minesweeper, greytone" +
          prompt,
        //size: "256x256", //dalle2 only
        size: "1024x1024",
        quality: "standard",
        n: 1,
        model: "dall-e-3",
      });

      data.genImageURL = image.data[0].url;
    }

    if (OPENAI_API_KEY) {
      await genContent(formProps);
      setUserData(formProps);
      try {
        await genImage(formProps);
      } catch (err) {
        // add a placeholder image if the image generation fails
        alert("Image generation failed. Please try again.");
        formProps.genImageURL = "./assets/img/placeholder.png";
      }
    }
    setImageResult(formProps.genImageURL);
    setUserData(formProps);
  };

  const handleSubmit = async (data) => {
    onFormDataChange(data);
  };

  return (
    <form
      onSubmit={async (e) => {
        e.stopPropagation();
        e.preventDefault();
        setIsSubmitting(true); // Disable the button and indicate submission

        if (!userData) {
          await storeFormData(e);
        } else {
          await handleSubmit(userData);
        }
        setIsSubmitting(false); // Re-enable the button after submission
      }}
    >
      {!userData && <FormContents />}
      <button
        type="submit"
        disabled={isSubmitting}
        style={{ backgroundColor: isSubmitting ? "grey" : "initial" }}
      >
        Submit
      </button>
    </form>
  );
}

function FormContents() {
  return (
    <>
      <label>
        What are you stockpiling?
        <input type="text" name="item" />
      </label>
      {/* <label style={{ display: "block" }}>
        You can only have one in your bunker. What do you choose?
        {items.map((item) => (
          <div key={item.id}>
            <input type="radio" id={item.id} name="item" value={item.value} />
            <label htmlFor={item.id}> {item.label}</label>
          </div>
        ))}
      </label> */}
      <label style={{ display: "block" }}>
        {`What's your bunkers vibe?`}
        <textarea
          name="vibe"
          style={{ resize: "none", width: "100%", margin: "10px 0" }}
        />
      </label>
      <label style={{ display: "block" }}>
        What world ending scenario are you most afraid of?
        <textarea
          name="fear"
          style={{ resize: "none", width: "100%", margin: "10px 0" }}
        />
      </label>
    </>
  );
}
