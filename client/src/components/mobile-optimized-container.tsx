import React, { ReactNode } from "react";
import { useMobile } from "@/hooks/use-mobile";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MobileOptimizedContainerProps {
  children: ReactNode;
  maxHeight?: string;
  className?: string;
}

export function MobileOptimizedContainer({
  children,
  maxHeight = "80vh",
  className = "",
}: MobileOptimizedContainerProps) {
  const isMobile = useMobile();

  if (isMobile) {
    return (
      <Card className={`overflow-hidden ${className}`}>
        <ScrollArea className="h-full w-full" style={{ maxHeight }}>
          {children}
        </ScrollArea>
      </Card>
    );
  }

  return <div className={className}>{children}</div>;
}
