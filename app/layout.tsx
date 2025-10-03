import "./globals.css";
import { ReactNode } from "react";
export default function RootLayout({ children }: { children: ReactNode }) {
console.info('[RootLayout] render');
return (
<html lang="en" suppressHydrationWarning>
<body className="bg-background text-foreground">{children}</body>
</html>
);
}
