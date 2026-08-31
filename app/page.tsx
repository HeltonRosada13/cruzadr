'use client';

import React from 'react';
import { ChurchProvider, useChurch } from '@/lib/ChurchContext';
import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { AboutActivity } from '@/components/AboutActivity';
import { FeaturedMoments } from '@/components/FeaturedMoments';
import { PhotoGallery } from '@/components/PhotoGallery';
import { VideoGallery } from '@/components/VideoGallery';
import { ActivitiesSchedule } from '@/components/ActivitiesSchedule';
import { Testimonials } from '@/components/Testimonials';
import { SocialMediaSection } from '@/components/SocialMediaSection';
import { WhatsAppFloating } from '@/components/WhatsAppFloating';
import { AdminManagerModal } from '@/components/AdminManagerModal';
import { Footer } from '@/components/Footer';
import { Church, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

function PageLoadingScreen() {
  return (
    <div
      id="app-initial-loader"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#121212] text-white px-4 select-none"
    >
      <div className="relative flex flex-col items-center max-w-sm w-full text-center">
        {/* Ambient warm glow */}
        <div className="absolute w-56 h-56 bg-[#C5A059]/10 rounded-full blur-3xl -top-12 pointer-events-none" />

        {/* Church Icon Badge */}
        <div className="w-16 h-16 rounded-md bg-[#1A1A1A] border border-[#C5A059]/30 flex items-center justify-center mb-6 shadow-2xl relative">
          <Church className="w-8 h-8 text-[#C5A059] animate-pulse" />
          <div className="absolute -inset-1 rounded-md border border-[#C5A059]/20 animate-ping pointer-events-none opacity-30" />
        </div>

        {/* Brand Title */}
        <span className="text-[10px] uppercase tracking-[0.35em] text-[#C5A059] font-bold mb-2">
          Portal Oficial
        </span>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-100 font-sans mb-3">
          Igreja Catedral de Amor e Fé
        </h1>

        {/* Loading Indicator */}
        <div className="flex items-center gap-2.5 text-neutral-400 text-xs mt-3 py-2 px-4 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm shadow-inner">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C5A059]" />
          <span>A carregar as informações oficiais...</span>
        </div>

        {/* Subtle Progress Bar */}
        <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden mt-6">
          <div className="w-full h-full bg-gradient-to-r from-[#C5A059]/30 via-[#C5A059] to-[#C5A059]/30 animate-pulse rounded-full" />
        </div>
      </div>
    </div>
  );
}

function PageContent() {
  const { isReady } = useChurch();

  if (!isReady) {
    return <PageLoadingScreen />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="min-h-screen bg-[#FDFDFC] text-[#1A1A1A] flex flex-col selection:bg-[#C5A059]/20 selection:text-[#1A1A1A]"
    >
      {/* Navigation Bar */}
      <Navbar />

      {/* Hero Section */}
      <main className="flex-1">
        <Hero />

        {/* About Section */}
        <AboutActivity />

        {/* Featured Moments */}
        <FeaturedMoments />

        {/* Photo Gallery with Continuous Marquee & Lightbox */}
        <PhotoGallery />

        {/* Video Gallery with Carousel & Modal Player */}
        <VideoGallery />

        {/* Other Activities and Schedule */}
        <ActivitiesSchedule />

        {/* Testimonies / Messages */}
        <Testimonials />

        {/* Organized Social Media Channels */}
        <SocialMediaSection />
      </main>

      {/* Comprehensive Footer with Baobá Universe Attribution */}
      <Footer />

      {/* Interactive Floating WhatsApp Button */}
      <WhatsAppFloating />

      {/* Real-time Content & Activity Admin Manager */}
      <AdminManagerModal />
    </motion.div>
  );
}

export default function HomePage() {
  return (
    <ChurchProvider>
      <PageContent />
    </ChurchProvider>
  );
}


