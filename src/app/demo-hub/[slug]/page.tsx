import { notFound } from 'next/navigation';
import HubDemoClient from '@/components/demo/HubDemoClient';

interface HubDemoPageProps {
  params: Promise<{ slug: string }>;
}

interface HubDemoData {
  church: {
    name: string;
    subdomain: string;
    primary_color: string;
    accent_color: string;
    logo_url: string | null;
  };
  events: Array<{
    id: string;
    title: string;
    description: string | null;
    location: string | null;
    start_time: string;
    end_time: string | null;
    event_type: string;
  }>;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return {
    title: `Leader Dashboard Preview`,
    description: 'Preview the DNA Discipleship leader dashboard.',
    robots: 'noindex, nofollow',
  };
}

export default async function HubDemoPage({ params }: HubDemoPageProps) {
  const { slug } = await params;

  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    notFound();
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://dnadiscipleship.com';
  const res = await fetch(`${baseUrl}/api/demo/hub-data/${slug}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    notFound();
  }

  const data: HubDemoData = await res.json();
  const demoPageUrl = `/demo/${slug}`;

  return (
    <HubDemoClient
      church={data.church}
      events={data.events}
      demoPageUrl={demoPageUrl}
    />
  );
}
