// src/components/ui/chat-avatar.tsx
import { User, Bot, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatAvatarProps {
  type: 'user' | 'bot' | 'thinking';
  className?: string;
}

export function ChatAvatar({ type, className }: ChatAvatarProps) {
  const baseClasses = "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center";
  
  if (type === 'user') {
    return (
      <div className={cn(baseClasses, "bg-primary text-primary-foreground", className)}>
        <User className="h-4 w-4" />
      </div>
    );
  }
  
  return (
    <div className={cn(baseClasses, "bg-muted text-muted-foreground", className)}>
      {type === 'thinking' ? (
        <MessageCircle className="h-4 w-4" />
      ) : (
        <Bot className="h-4 w-4" />
      )}
    </div>
  );
}