import React, { useState } from "react";

function App() {
  const [youtubeURL, setYoutubeURL] = useState("");
  const [persona, setPersona] = useState(null);
  const [history, setHistory] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const extractVideoId = (url) => {
    const match = url.match(/(?:youtube\.com.*(?:\?|&)v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  };

  const handleGenerateAgent = async (e) => {
    e.preventDefault();
    const videoId = extractVideoId(youtubeURL);
    if (!videoId) return alert("Invalid YouTube URL");

    setLoading(true);
    try {
      const res = await fetch("/generate-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId }),
      });
      const data = await res.json();
      console.log("Generated agent:", data);
      setPersona(data.agent);
      setHistory([]);
    } catch (err) {
      alert("Error generating agent");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const newHistory = [...history, [userInput, ""]];
    setHistory(newHistory);
    setUserInput("");
    setGenerating(true);

    try {
      const res = await fetch("/chat-with-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persona, history: newHistory }),
      });
      const data = await res.json();
      newHistory[newHistory.length - 1][1] = data.reply;
      setHistory([...newHistory]);
    } catch (err) {
      console.error("Chat error:", err);
      alert("Agent failed to reply.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 20, fontFamily: "sans-serif" }}>
      <h1>YouTube Agent Chat</h1>

      <form onSubmit={handleGenerateAgent}>
        <input
          type="text"
          placeholder="Paste YouTube URL"
          value={youtubeURL}
          onChange={(e) => setYoutubeURL(e.target.value)}
          style={{ width: "100%", padding: 8 }}
        />
        <button type="submit" style={{ marginTop: 10, padding: "8px 16px" }}>
          {loading ? "Generating..." : "Generate Agent"}
        </button>
      </form>

      <hr style={{ margin: "20px 0" }} />

      <div style={{ minHeight: 100 }}>
        {persona ? (
          <div style={{ marginBottom: 10 }}>
            <h2>{persona.name}</h2>
            <p><strong>Age:</strong> {persona.age}</p>
            <p><strong>Tone:</strong> {persona.tone}</p>
            <p><strong>Interests:</strong> {persona.interests.join(", ")}</p>
          </div>
        ) : (
          <p><em>Generate an agent to begin chatting.</em></p>
        )}
      </div>

      <div style={{ border: "1px solid #ccc", padding: 10, minHeight: 150, marginBottom: 10 }}>
        {history.length === 0 ? (
          <p style={{ color: "#888" }}><em>No messages yet.</em></p>
        ) : (
          history.map(([user, bot], i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <p><strong>You:</strong> {user}</p>
              {bot && <p><strong>{persona?.name || "Agent"}:</strong> {bot}</p>}
              <hr />
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleChat}>
        <input
          type="text"
          placeholder={persona ? "Say something..." : "Generate an agent to chat"}
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          style={{ width: "100%", padding: 8 }}
          disabled={!persona || generating}
        />
        <button
          type="submit"
          style={{ marginTop: 10, padding: "8px 16px" }}
          disabled={!persona || generating}
        >
          {generating ? "Replying..." : "Send"}
        </button>
      </form>
    </div>
  );
}

export default App;