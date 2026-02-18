import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import LogoStrip from './components/LogoStrip';
import FeaturesGrid from './components/FeaturesGrid';
import ImpactCalculator from './components/ImpactCalculator';
import Testimonials from './components/Testimonials';
import ValueProps from './components/ValueProps';
import CTA from './components/CTA';
import Footer from './components/Footer';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-elora-100 selection:text-elora-900">
      <Navbar />
      <main>
        <Hero />
        <LogoStrip />
        <FeaturesGrid />
        <ImpactCalculator />
        <Testimonials />
        <ValueProps />
        <CTA />
      </main>
      <Footer />
    </div>
  );
};

export default App;