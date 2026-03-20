'use client';

export function Providers({ children }: { children: React.ReactNode }) {
  return <div suppressHydrationWarning>{children}</div>;
}
