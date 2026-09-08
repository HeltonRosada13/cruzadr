'use client';

import React from 'react';
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

export function PageContent() {
  return (
    <div className="min-h-screen bg-[#FDFDFC] text-[#1A1A1A] flex flex-col selection:bg-[#C5A059]/20 selection:text-[#1A1A1A]">
      {/* Navigation Bar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <Hero />

        {/* About Section */}
        <AboutActivity />

        {/* Featured Moments */}
        <FeaturedMoments />

        {/* Photo Gallery */}
        <PhotoGallery />

        {/* Video Gallery */}
        <VideoGallery />

        {/* Other Activities and Schedule */}
        <ActivitiesSchedule />

        {/* Testimonies */}
        <Testimonials />

        {/* Organized Social Media Channels */}
        <SocialMediaSection />
      </main>

      {/* Footer */}
      <Footer />

      {/* Floating WhatsApp Button */}
      <WhatsAppFloating />

      {/* Admin Manager Modal */}
      <AdminManagerModal />
    </div>
  );
}
