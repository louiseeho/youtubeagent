const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/generate-agent", async (req, res) => {
  const { videoId } = req.body;
  const apiKey = process.env.YOUTUBE_API_KEY;

  console.log("Received videoId:", videoId);
  console.log("Using API key:", apiKey ? "Loaded" : "MISSING");

  try {
    // Step 1: Fetch YouTube comments
    const youtubeRes = await axios.get(
      `https://www.googleapis.com/youtube/v3/commentThreads`,
      {
        params: {
          part: "snippet",
          videoId: videoId,
          maxResults: 1000,
          key: apiKey,
        },
      }
    );

    const comments = youtubeRes.data.items.map(
      (item) => item.snippet.topLevelComment.snippet.textDisplay
    );

    console.log("Fetched comments:", comments.length);

    // Step 2: Send comments to Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
You are a marketing assistant. Based on the following YouTube comments, generate a synthetic user persona that represents the typical commenter. Include estimated age group, tone, interests, and a sample comment.

Comments:
${comments.slice(0, 20).map((c, i) => `${i + 1}. ${c}`).join("\n")}

Respond in JSON format with fields:
{
  "name": "...",
  "age": "...",
  "tone": "...",
  "interests": [...],
  "sampleComment": "..."
}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const cleanText = text.replace(/```json|```/g, "").trim();


    // Step 3: Try parsing Gemini's response
    let agent;
    try {
      agent = JSON.parse(cleanText);
    } catch (parseErr) {
      console.warn("Gemini returned non-JSON text:", cleanText);
      return res.status(500).json({ error: "Gemini response was not JSON" });
    }

    res.json({ agent });

  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to generate agent" });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () =>
  console.log(`Server started on port ${PORT}`)
);

app.post("/chat-with-agent", async (req, res) => {
  const { persona, history } = req.body;
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    const chat = model.startChat({
      history: history.map(([user, bot]) => ({
        role: "user",
        parts: [{ text: user }],
      })).flatMap((msg, i) => [
        msg,
        {
          role: "model",
          parts: [{ text: history[i][1] }],
        },
      ]),
      generationConfig: {
        temperature: 0.7,
      },
    });

    const prompt = `You're a persona named ${persona.name}, a ${persona.age}-year-old who is ${persona.tone}. You're interested in ${persona.interests.join(", ")}. 
Speak informally and reply like you would in YouTube comments.`;

    const userInput = history[history.length - 1][0];

    const result = await chat.sendMessage(`${prompt}\n\n${userInput}`);
    const reply = result.response.text();

    res.json({ reply });
  } catch (error) {
    console.error("Chat error:", error.message);
    res.status(500).json({ error: "Failed to chat with agent" });
  }
});
