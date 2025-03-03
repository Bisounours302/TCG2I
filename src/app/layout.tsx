import "./globals.css";
import Header from "@/src/app/components/Header";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Collectionnez et ouvrez vos boosters sur TCG2i !" />
        <link rel="preload" href="/placeholder-logo.png" as="image" />
        <link rel="icon" href="/ressources/icon.png" />
      </head>
      <body className="bg-gray-100 min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
