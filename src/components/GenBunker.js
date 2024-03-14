import OpenAI from "openai";
import { useEffect } from "react";

const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export default function GenBunker({ userString, result, setResult }) {
  //   const [generatedText, setGeneratedText] = useState('');

  useEffect(() => {
    console.log("use effect called", userString);
    if (!userString) return;

    async function genContent(prompt) {
      const completion = await openai.chat.completions.create({
        messages: [{ role: "system", content: prompt }],
        model: "gpt-3.5-turbo",
      });
      setResult(completion.choices[0].message.content);
    }

    genContent(userString);
  }, [userString]);
}
