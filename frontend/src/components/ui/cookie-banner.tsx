
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Cookie, X } from "lucide-react";

const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const cookieConsent = localStorage.getItem("leilaogpt-cookie-consent");
    if (!cookieConsent) {
      // Mostra o banner após 1 segundo
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("leilaogpt-cookie-consent", "accepted");
    setIsVisible(false);
  };

  const rejectCookies = () => {
    localStorage.setItem("leilaogpt-cookie-consent", "rejected");
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-4 left-4 right-4 z-50 md:left-6 md:right-6"
        >
          <Card className="shadow-lg border-border/50 bg-background/95 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Cookie className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="font-semibold text-sm mb-1">
                      Utilizamos cookies
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Utilizamos cookies para melhorar sua experiência, personalizar conteúdo e analisar nosso tráfego. 
                      Ao continuar navegando, você concorda com nossa política de cookies.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={acceptCookies}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      size="sm"
                    >
                      Aceitar todos
                    </Button>
                    <Button
                      onClick={rejectCookies}
                      variant="outline"
                      size="sm"
                    >
                      Rejeitar
                    </Button>
                    <Button
                      onClick={() => setIsVisible(false)}
                      variant="ghost"
                      size="icon"
                      className="sm:ml-auto"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieBanner;
