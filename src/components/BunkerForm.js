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
  setResult,
  setImageResult,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false); // Track submission state

  const handleSubmit = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    setIsSubmitting(true); // Disable the button and indicate submission

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

      console.log(completion);

      const res = completion.choices[0].message.content;
      data.result = res;

      onFormDataChange(data);
      setResult(data);
      setIsSubmitting(false); // Re-enable the button after submission
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

      const imgUrl = image.data[0].url;
      data.imgUrl = imgUrl; //TURN BACK ON WHEN IMAGE ISSUE IS FIXED
      //data.imgUrl = "./assets/img/placeholder.png";
      console.log("Recieved image", imgUrl);

      onFormDataChange(data);
      // setIsSubmitting(false); // Re-enable the button after submission
      setImageResult(data);
    }

    if (OPENAI_API_KEY) {
      await genContent(formProps);
      if (formProps.result) {
        console.log("gpt recieved", formProps.result);
        await genImage(formProps);
      }
    } else {
      setIsSubmitting(false); // Ensure button is re-enabled if API key is missing
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Bunker Builder</h2>
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
