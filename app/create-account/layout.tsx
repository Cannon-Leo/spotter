import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Member Account',
  robots: {
    index: false,
    follow: false,
  },
};

export default function CreateAccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

