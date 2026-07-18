import type { Metadata } from 'next';
import './globals.css';
import NavigationWrapper from './components/NavigationWrapper';

export const metadata: Metadata = {
  title: 'Dataconsole',
  description: 'Hospital Data Management Console',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 m-0 p-0 overflow-hidden">
        <NavigationWrapper>
          {children}
        </NavigationWrapper>
      </body>
    </html>
  );
}