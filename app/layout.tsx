import './globals.css';
export const metadata = {
  title: 'CertSherpa Quiz',
  description: 'One-page quiz powered by Supabase',
};

export default function RootLayout(
  { children }: { children: React.ReactNode }
) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}


