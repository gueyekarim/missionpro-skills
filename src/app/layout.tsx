import "./globals.css";

export const metadata = {
  title: "MissionPro Skills",
  description: "Développer, démontrer et piloter les capacités."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}