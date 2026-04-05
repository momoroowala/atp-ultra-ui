import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSendMessage, disabled = false, placeholder = "Ask about your trading strategy..." }: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-border bg-background/80 backdrop-blur-sm">
      <div className="flex items-end space-x-3 max-w-4xl mx-auto">
        <div className="flex-1">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "min-h-[44px] max-h-32 resize-none rounded-xl border-border",
              "focus:ring-2 focus:ring-primary focus:border-transparent",
              "bg-muted text-foreground placeholder:text-muted-foreground"
            )}
            rows={1}
          />
        </div>
        <Button
          type="submit"
          disabled={!message.trim() || disabled}
          className={cn(
            "rounded-xl px-4 py-2 h-11 min-w-11",
            "bg-primary hover:bg-primary/90 text-primary-foreground",
            "shadow-trading transition-all duration-200",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            !disabled && message.trim() && "animate-pulse-glow"
          )}
        >
          {disabled ? (
            <TrendingUp className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </form>
  );
}