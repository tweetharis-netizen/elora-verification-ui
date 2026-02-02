import Head from 'next/head';
import HeroSection from '../components/landing/HeroSection';
import FeatureHighlights from '../components/landing/FeatureHighlights';
import FounderStory from '../components/landing/FounderStory';

export default function HomePage() {
  return (
    <>
      <Head>
        <title>Elora — Empowering Education Through AI</title>
        <meta
          name="description"
          content="Elora helps students learn with personalized AI guidance and empowers teachers with intelligent classroom tools. Try it free today."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Landing page uses same background as rest of app (defined in globals.css body) */}
      <div className="min-h-screen">
        <HeroSection />
        <FeatureHighlights />
        <FounderStory />
      </div>
    </>
  );
}
