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

export default function BunkerForm({ onFormDataChange, setResult }) {
  const [isSubmitting, setIsSubmitting] = useState(false); // Track submission state

  const handleSubmit = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    setIsSubmitting(true); // Disable the button and indicate submission

    const data = new FormData(e.target);
    const formProps = Object.fromEntries(data);
    const str = `${formProps.name} is the thing you always keep by your door/in your pantry/in your backpack for emergencies. You can only have one in your bunker. You choose ${formProps.item}. Your survival team is ${formProps.team}.`;
    formProps.prompt = str;

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

    if (OPENAI_API_KEY) {
      await genContent(formProps);
    } else {
      setIsSubmitting(false); // Ensure button is re-enabled if API key is missing
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Great pick. Give us a sense of your bunker</h2>
      <label>
        What is the thing you always keep by your door/in your pantry/in your
        backpack for emergencies
        <input type="text" name="name" />
      </label>
      <label style={{ display: "block" }}>
        You can only have one in your bunker. What do you choose?
        {items.map((item) => (
          <div key={item.id}>
            <input type="radio" id={item.id} name="item" value={item.value} />
            <label htmlFor={item.id}> {item.label}</label>
          </div>
        ))}
      </label>
      <label style={{ display: "block" }}>
        Whos on your survival team and why?
        <textarea
          name="team"
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
