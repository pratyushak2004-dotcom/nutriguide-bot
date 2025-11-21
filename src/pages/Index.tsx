import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, Loader2, BookOpen, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("nutriguide-chat", {
        body: { 
          messages: [...messages, userMessage],
        },
      });

      if (error) throw error;

      if (data?.response) {
        const assistantMessage: Message = {
          role: "assistant",
          content: data.response,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to get response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-soft">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-secondary">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                NutriGuide
              </h1>
              <p className="text-sm text-muted-foreground">Your Nutraceuticals Learning Assistant</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Welcome Card */}
        {messages.length === 0 && (
          <Card className="p-8 mb-6 bg-gradient-to-br from-card to-muted/50 border-primary/20 shadow-medium">
            <div className="text-center space-y-4">
              <div className="inline-flex p-4 rounded-full bg-primary/10">
                <BookOpen className="h-12 w-12 text-primary" />
              </div>
              <h2 className="text-3xl font-bold text-foreground">
                Welcome to NutriGuide! 🎓
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Your friendly AI assistant for learning about Nutraceuticals. Ask me anything about definitions, 
                classifications, functional foods, phytochemicals, health benefits, and more!
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6 text-left">
                <Card className="p-4 bg-primary/5 border-primary/20 hover:bg-primary/10 transition-colors">
                  <h3 className="font-semibold text-primary mb-2">📚 Study Help</h3>
                  <p className="text-sm text-muted-foreground">
                    Get short notes, summaries, and exam-style answers
                  </p>
                </Card>
                <Card className="p-4 bg-secondary/5 border-secondary/20 hover:bg-secondary/10 transition-colors">
                  <h3 className="font-semibold text-secondary mb-2">🧪 Detailed Explanations</h3>
                  <p className="text-sm text-muted-foreground">
                    Understand complex topics with simple examples
                  </p>
                </Card>
                <Card className="p-4 bg-primary/5 border-primary/20 hover:bg-primary/10 transition-colors">
                  <h3 className="font-semibold text-primary mb-2">📝 Assignment Help</h3>
                  <p className="text-sm text-muted-foreground">
                    Generate PPT points and assignment answers
                  </p>
                </Card>
                <Card className="p-4 bg-secondary/5 border-secondary/20 hover:bg-secondary/10 transition-colors">
                  <h3 className="font-semibold text-secondary mb-2">🎯 Exam Prep</h3>
                  <p className="text-sm text-muted-foreground">
                    Practice with 1-mark, 2-mark, and 5-mark questions
                  </p>
                </Card>
              </div>
            </div>
          </Card>
        )}

        {/* Chat Messages */}
        <div className="space-y-4 mb-6">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <Card
                className={`max-w-[80%] p-4 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "bg-card shadow-soft border-primary/10"
                }`}
              >
                <div className="whitespace-pre-wrap break-words">
                  {message.content}
                </div>
              </Card>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <Card className="max-w-[80%] p-4 bg-card shadow-soft border-primary/10">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-muted-foreground">Thinking...</span>
                </div>
              </Card>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <Card className="sticky bottom-4 p-4 bg-card/95 backdrop-blur-sm shadow-medium border-primary/20">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about nutraceuticals..."
              disabled={isLoading}
              className="flex-1 border-primary/20 focus-visible:ring-primary"
            />
            <Button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="bg-primary hover:bg-primary-dark text-primary-foreground shadow-soft"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Index;
