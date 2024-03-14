import OpenAI from "openai";
import { useEffect } from "react";

const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

let openai;

if (OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
  });
}

export default function GenBunker({ onFormDataChange, userData, setResult }) {
  useEffect(() => {
    if (!userData?.prompt) return;

    async function genContent(data) {
      const prompt = data.prompt;
      const completion = await openai.chat.completions.create({
        messages: [{ role: "system", content: prompt }],
        model: "gpt-3.5-turbo",
      });

      const res = completion.choices[0].message.content;
      data.result = res;

      console.log(data);
      onFormDataChange(data);
      setResult(data);
    }
    OPENAI_API_KEY && genContent(userData);
  }, [userData]);
}
