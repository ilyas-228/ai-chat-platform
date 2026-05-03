import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageCircle, Zap, Shield, BarChart3 } from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">AI Chat</h1>
          </div>
          <Button
            onClick={() => setLocation("/chat")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Open Chat
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-5xl font-bold text-foreground mb-6">
            Your Personal AI Assistant
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Chat with multiple AI models powered by OpenRouter. Switch between different models to find the perfect assistant for your needs.
          </p>
          <Button
            onClick={() => setLocation("/chat")}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
          >
            <MessageCircle className="w-5 h-5" />
            Start Chatting Now
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-card border-y border-border">
        <div className="container mx-auto">
          <h3 className="text-3xl font-bold text-foreground text-center mb-12">
            Why Choose Our Platform?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h4 className="text-lg font-semibold text-foreground mb-2">Multiple Models</h4>
              <p className="text-sm text-muted-foreground">
                Switch between different AI models to find the best one for your task.
              </p>
            </Card>

            {/* Feature 2 */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h4 className="text-lg font-semibold text-foreground mb-2">Secure & Private</h4>
              <p className="text-sm text-muted-foreground">
                Your API key is stored securely on the server. Your conversations are private.
              </p>
            </Card>

            {/* Feature 3 */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
                <MessageCircle className="w-6 h-6 text-primary" />
              </div>
              <h4 className="text-lg font-semibold text-foreground mb-2">Context Aware</h4>
              <p className="text-sm text-muted-foreground">
                The AI remembers your entire conversation history for coherent, contextual responses.
              </p>
            </Card>

            {/* Feature 4 */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <h4 className="text-lg font-semibold text-foreground mb-2">Clean Interface</h4>
              <p className="text-sm text-muted-foreground">
                Minimalist design with intuitive controls. No clutter, just pure productivity.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <h3 className="text-3xl font-bold text-foreground mb-6">
            Ready to chat with AI?
          </h3>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Start your conversation now. Just click below and begin exploring the power of multiple AI models.
          </p>
          <Button
            onClick={() => setLocation("/chat")}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Open Chat
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8 px-4">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>
            AI Chat Platform • Powered by{" "}
            <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              OpenRouter
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
