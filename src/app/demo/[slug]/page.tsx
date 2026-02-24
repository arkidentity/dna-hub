import { notFound } from 'next/navigation';
import DemoPageClient from '@/components/demo/DemoPageClient';

interface DemoPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ temp?: string }>;
}

interface DemoChurchData {
  church: {
    id: string;
    name: string;
    subdomain: string;
    primary_color: string;
    accent_color: string;
    logo_url: string | null;
    icon_url: string | null;
    app_title: string;
    header_style: string;
  };
  demo: {
    video_url: string | null;
    default_temp: 'cold' | 'warm' | 'hot';
    demo_seeded_at: string | null;
  };
}

const VALID_TEMPS = ['cold', 'warm', 'hot'] as const;
type Temp = (typeof VALID_TEMPS)[number];

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return {
    title: `Your DNA Discipleship Demo`,
    description: 'A personalized demo of the DNA Discipleship app built for your church.',
    robots: 'noindex, nofollow', // Don't index prospect demo pages
  };
}

export default async function DemoPage({ params, searchParams }: DemoPageProps) {
  const { slug } = await params;
  const { temp: tempParam } = await searchParams;

  // Validate slug format
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    notFound();
  }

  // Fetch church + demo config from our public API
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://dnadiscipleship.com';
  const res = await fetch(`${baseUrl}/api/demo/church/${slug}`, {
    cache: 'no-store', // Always fresh — demo config can change
  });

  if (!res.ok) {
    notFound();
  }

  const data: DemoChurchData = await res.json();

  // Resolve temperature: URL param → demo default → 'warm'
  const temp: Temp = VALID_TEMPS.includes(tempParam as Temp)
    ? (tempParam as Temp)
    : data.demo.default_temp ?? 'warm';

  const appUrl = `https://${slug}.dailydna.app`;
  const hubDemoUrl = `/demo-hub/${slug}`;
  const bookCallUrl = '/assessment/book-call';
  const assessmentUrl = '/assessment';

  return (
    <DemoPageClient
      church={data.church}
      demo={data.demo}
      temp={temp}
      appUrl={appUrl}
      hubDemoUrl={hubDemoUrl}
      bookCallUrl={bookCallUrl}
      assessmentUrl={assessmentUrl}
    />
  );
}
