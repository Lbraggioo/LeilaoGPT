
import { useAuth } from "@/contexts/auth-context";
import { ChatProvider } from "@/contexts/chat-context";
import LoginForm from "@/components/auth/login-form";
import ChatLayout from "@/components/chat/chat-layout";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <ChatProvider>
      <ChatLayout />
    </ChatProvider>
  );
};

export default Index;
