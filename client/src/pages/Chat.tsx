import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Copy, Send, Trash2, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

const MODELS = [
  { id: "openrouter/auto", label: "Auto (Best Available)" },
  { id: "openai/gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
];

interface ChatMessage {
  id?: number;
  role: "user" | "assistant";
  content: string;
  model?: string;
  createdAt?: Date;
  isOptimistic?: boolean;
}

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState("openrouter/auto");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sendMessageMutation = trpc.chat.sendMessage.useMutation();
  const clearHistoryMutation = trpc.chat.clearHistory.useMutation();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);

    // Add user message immediately to the UI
    const optimisticUserMessage: ChatMessage = {
      role: "user",
      content: userMessage,
      model: selectedModel,
      createdAt: new Date(),
      isOptimistic: true,
    };
    setMessages((prev) => [...prev, optimisticUserMessage]);

    try {
      const result = await sendMessageMutation.mutateAsync({
        content: userMessage,
        model: selectedModel as "openrouter/auto" | "openai/gpt-3.5-turbo",
        appUrl: window.location.origin,
        appName: "AI Chat Platform",
      });

      if (result.success) {
        // Add AI response to messages
        const aiMessage: ChatMessage = {
          role: "assistant",
          content: result.message,
          model: selectedModel,
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
        toast.success("Message sent successfully");
      }
    } catch (error) {
      // Remove the optimistic user message on error
      setMessages((prev) => prev.slice(0, -1));
      const errorMessage = error instanceof Error ? error.message : "Failed to send message";
      toast.error(errorMessage);
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (!window.confirm("Are you sure you want to clear all messages?")) return;

    try {
      await clearHistoryMutation.mutateAsync();
      setMessages([]);
      toast.success("Chat cleared");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to clear chat";
      toast.error(errorMessage);
    }
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">AI Chat</h1>
            <p className="text-sm text-muted-foreground">Powered by OpenRouter</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearChat}
            className="gap-2"
            disabled={messages.length === 0 || isLoading}
          >
            <Trash2 className="w-4 h-4" />
            Clear Chat
          </Button>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground mb-2">Start a conversation</p>
              <p className="text-sm text-muted-foreground">Select a model and send your first message</p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <Card
                className={`max-w-md lg:max-w-2xl px-4 py-3 shadow-md ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-card-foreground border border-border"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    {message.role === "assistant" ? (
                      <Streamdown>{message.content}</Streamdown>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    )}
                  </div>
                  {message.role === "assistant" && (
                    <button
                      onClick={() => handleCopyMessage(message.content)}
                      className="flex-shrink-0 p-1 hover:bg-muted rounded transition-colors"
                      title="Copy message"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {message.createdAt && (
                  <p className="text-xs mt-2 opacity-70">
                    {message.role === "user" ? "You" : "AI"} • {new Date(message.createdAt).toLocaleTimeString()}
                  </p>
                )}
              </Card>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <Card className="bg-card text-card-foreground px-4 py-3 shadow-md border border-border flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <p className="text-sm">AI is typing...</p>
            </Card>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-card shadow-lg">
        <div className="container mx-auto px-4 py-4 space-y-3">
          {/* Model Selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-foreground">Model:</label>
            <Select value={selectedModel} onValueChange={setSelectedModel} disabled={isLoading}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODELS.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message... (Press Enter to send)"
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
