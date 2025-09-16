"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Settings, Send, Bot, Loader2 } from "lucide-react"

export default function YouTubeAgentChat() {
  const [youtubeURL, setYoutubeURL] = useState("")
  const [persona, setPersona] = useState(null)
  const [history, setHistory] = useState([])
  const [userInput, setUserInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  const extractVideoId = (url) => {
    const match = url.match(/(?:youtube\.com.*(?:\?|&)v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
    return match ? match[1] : null
  }

  const handleGenerateAgent = async (e) => {
    e.preventDefault()
    const videoId = extractVideoId(youtubeURL)
    if (!videoId) return alert("Invalid YouTube URL")

    setLoading(true)
    try {
      const res = await fetch("/generate-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId }),
      })
      const data = await res.json()
      console.log("Generated agent:", data)
      setPersona(data.agent)
      setHistory([])
    } catch (err) {
      alert("Error generating agent")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleChat = async (e) => {
    e.preventDefault()
    if (!userInput.trim()) return

    const newHistory = [...history, [userInput, ""]]
    setHistory(newHistory)
    setUserInput("")
    setGenerating(true)

    try {
      const res = await fetch("/chat-with-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persona, history: newHistory }),
      })
      const data = await res.json()
      newHistory[newHistory.length - 1][1] = data.reply
      setHistory([...newHistory])
    } catch (err) {
      console.error("Chat error:", err)
      alert("Agent failed to reply.")
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-red-600 text-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
            <div className="w-6 h-4 bg-red-600 rounded-sm flex items-center justify-center">
              <div className="w-0 h-0 border-l-[6px] border-l-white border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent ml-1"></div>
            </div>
          </div>
          <h1 className="text-lg font-semibold">YouTube Agent Chat</h1>
        </div>
        <Button variant="ghost" size="icon" className="text-white hover:bg-red-700">
          <Settings className="w-5 h-5" />
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex w-full pt-16">
        {/* Left Sidebar */}
        <div className="w-80 bg-muted/30 border-r border-border p-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Generate AI Agent</h2>
            <form onSubmit={handleGenerateAgent} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">YouTube URL</label>
                <Input
                  placeholder="https://youtube.com/watch?v=..."
                  value={youtubeURL}
                  onChange={(e) => setYoutubeURL(e.target.value)}
                  className="bg-background"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white"
                disabled={!youtubeURL.trim() || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Bot className="w-4 h-4 mr-2" />
                    Generate Agent
                  </>
                )}
              </Button>
            </form>

            {persona && (
              <div className="mt-6 p-4 bg-card rounded-lg border">
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">Generated Agent</h3>
                <div className="space-y-2">
                  <p className="font-medium">{persona.name}</p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Age:</strong> {persona.age}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Tone:</strong> {persona.tone}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Interests:</strong> {persona.interests.join(", ")}
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">Chat with Agent</h3>
                <p className="text-sm text-muted-foreground">
                  {persona ? `Chatting with ${persona.name}` : "Generate an agent to start chatting"}
                </p>
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6">
            {history.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-md">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bot className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">
                    {persona
                      ? "Start a conversation with your YouTube agent!"
                      : "No agent generated yet. Paste a YouTube URL and click 'Generate Agent' to start chatting!"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map(([user, bot], i) => (
                  <div key={i} className="space-y-3">
                    {/* User message */}
                    <div className="flex justify-end">
                      <div className="max-w-[70%] bg-red-600 text-white rounded-lg px-4 py-2">
                        <p className="text-sm font-medium mb-1">You</p>
                        <p>{user}</p>
                      </div>
                    </div>
                    {/* Agent message */}
                    {bot && (
                      <div className="flex justify-start">
                        <div className="max-w-[70%] bg-card border rounded-lg px-4 py-2">
                          <p className="text-sm font-medium mb-1 text-muted-foreground">{persona?.name || "Agent"}</p>
                          <p>{bot}</p>
                        </div>
                      </div>
                    )}
                    {/* Loading indicator for generating response */}
                    {!bot && generating && i === history.length - 1 && (
                      <div className="flex justify-start">
                        <div className="max-w-[70%] bg-card border rounded-lg px-4 py-2">
                          <p className="text-sm font-medium mb-1 text-muted-foreground">{persona?.name || "Agent"}</p>
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-muted-foreground">Thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="p-6 border-t border-border">
            <form onSubmit={handleChat} className="flex gap-2">
              <Input
                placeholder={persona ? "Type your message..." : "Generate an agent to chat"}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                disabled={!persona || generating}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={!persona || !userInput.trim() || generating}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}