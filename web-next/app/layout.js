import "./globals.css";
import { inter } from "./components/Font";
import { UserProvider } from "./context/UserContext"; // 👈 import the provider

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <UserProvider> {/* 👈 wrap everything inside this */}
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
