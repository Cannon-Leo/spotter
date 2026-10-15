import type { Metadata } from 'next';
import SpotterHome from './home-view';

export const metadata: Metadata = {
  title: 'Spotter | Official Gym Member Portal',
  description: 'Official gym member portal',
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Spotter | Official Gym Member Portal',
    description: 'Official gym member portal',
    type: 'website',
    siteName: 'Spotter',
    locale: 'en_US',
    url: '/',
  },
  twitter: {
    card: 'summary',
    title: 'Spotter | Official Gym Member Portal',
    description: 'Official gym member portal',
  },
};

export default function Page() {
  return <SpotterHome />;
}
