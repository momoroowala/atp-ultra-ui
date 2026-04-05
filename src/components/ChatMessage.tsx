import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp: Date;
  isTyping?: boolean;
}
export function ChatMessage({
  message,
  isUser,
  timestamp,
  isTyping = false
}: ChatMessageProps) {
  const [isVisible, setIsVisible] = useState(true); // Remove animation delay

  useEffect(() => {
    // Remove the animation delay for ChatGPT-like instant appearance
    setIsVisible(true);
  }, []);

  return (
    <div className={cn(
      "flex w-full mb-4",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-[85%] px-6 py-4 rounded-2xl",
        isUser 
          ? "bg-primary text-white ml-6 rounded-br-md shadow-sm" 
          : "bg-muted text-foreground mr-6 rounded-bl-md shadow-sm border border-border/20"
      )}>
        <div className="text-base leading-relaxed">
          {!message && !isTyping ? (
            <div className="flex items-center space-x-1">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="ml-2 opacity-70">Trader Assist is thinking...</span>
            </div>
          ) : isTyping ? (
            <div className="flex items-center space-x-1">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="ml-2 opacity-70">Trader Assist is thinking...</span>
            </div>
          ) : (
            <div className="max-w-none">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  // Custom styling for markdown elements with proper text colors
                  p: ({ children }) => (
                    <p className={cn(
                      "mb-2 last:mb-0 font-normal",
                      isUser ? "text-white" : "text-foreground"
                    )}>
                      {children}
                    </p>
                  ),
                  strong: ({ children }) => (
                    <strong className={cn(
                      "font-semibold",
                      isUser ? "text-white" : "text-foreground"
                    )}>
                      {children}
                    </strong>
                  ),
                  em: ({ children }) => (
                    <em className={cn(
                      "italic font-normal",
                      isUser ? "text-white" : "text-foreground"
                    )}>
                      {children}
                    </em>
                  ),
                  ul: ({ children }) => (
                    <ul className={cn(
                      "list-disc pl-4 space-y-1 font-normal",
                      isUser ? "text-white" : "text-foreground"
                    )}>
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className={cn(
                      "list-decimal pl-4 space-y-1 font-normal",
                      isUser ? "text-white" : "text-foreground"
                    )}>
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className={cn(
                      "leading-relaxed font-normal",
                      isUser ? "text-white" : "text-foreground"
                    )}>
                      {children}
                    </li>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className={cn(
                      "border-l-4 border-primary/30 pl-4 italic font-normal opacity-90",
                      isUser ? "text-white" : "text-foreground"
                    )}>
                      {children}
                    </blockquote>
                  ),
                  code: ({ children }) => (
                    <code className={cn(
                      "px-1 py-0.5 rounded text-sm font-mono",
                      isUser 
                        ? "bg-white/20 text-white" 
                        : "bg-foreground/10 text-foreground"
                    )}>
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre className={cn(
                      "p-3 rounded-lg overflow-x-auto font-mono",
                      isUser 
                        ? "bg-white/20 text-white" 
                        : "bg-foreground/10 text-foreground"
                    )}>
                      {children}
                    </pre>
                  ),
                  h1: ({ children }) => (
                    <h1 className={cn(
                      "text-xl font-bold mb-2",
                      isUser ? "text-white" : "text-foreground"
                    )}>
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className={cn(
                      "text-lg font-bold mb-2",
                      isUser ? "text-white" : "text-foreground"
                    )}>
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className={cn(
                      "text-base font-bold mb-2",
                      isUser ? "text-white" : "text-foreground"
                    )}>
                      {children}
                    </h3>
                  ),
                  h4: ({ children }) => (
                    <h4 className={cn(
                      "text-base font-semibold mb-2",
                      isUser ? "text-white" : "text-foreground"
                    )}>
                      {children}
                    </h4>
                  ),
                  h5: ({ children }) => (
                    <h5 className={cn(
                      "text-sm font-semibold mb-2",
                      isUser ? "text-white" : "text-foreground"
                    )}>
                      {children}
                    </h5>
                  ),
                  h6: ({ children }) => (
                    <h6 className={cn(
                      "text-sm font-semibold mb-2",
                      isUser ? "text-white" : "text-foreground"
                    )}>
                      {children}
                    </h6>
                  ),
                  // Ensure regular text is not bold
                  div: ({ children }) => (
                    <div className={cn(
                      "font-normal",
                      isUser ? "text-white" : "text-foreground"
                    )}>
                      {children}
                    </div>
                  ),
                  span: ({ children }) => (
                    <span className={cn(
                      "font-normal",
                      isUser ? "text-white" : "text-foreground"
                    )}>
                      {children}
                    </span>
                  ),
                }}
              >
                {message}
              </ReactMarkdown>
            </div>
          )}
        </div>
        <div className={cn(
          "text-[11px] mt-2 flex justify-end opacity-60",
          isUser ? "text-white" : "text-muted-foreground"
        )}>
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}