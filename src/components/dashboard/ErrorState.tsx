import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const { t } = useLanguage();
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <h2 className="font-display text-lg font-bold text-foreground">{t("error.title")}</h2>
      <p className="font-body text-sm text-muted-foreground">{message}</p>
      <Button onClick={onRetry} variant="outline" className="gap-2 border-primary/30 text-primary hover:border-primary hover:bg-primary/10">
        <RefreshCw className="h-4 w-4" /> {t("error.retry")}
      </Button>
    </div>
  );
}
