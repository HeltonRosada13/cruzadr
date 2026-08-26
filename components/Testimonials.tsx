'use client';

import React, { useState, useEffect } from 'react';
import { useChurch } from '@/lib/ChurchContext';
import { Quote, ChevronLeft, ChevronRight, User } from 'lucide-react';
import Image from 'next/image';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80';

export function Testimonials() {
  const { data } = useChurch();
  const testimonies = Array.isArray(data?.testimonies) ? data.testimonies : [];
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto rotate when multiple testimonies exist
  useEffect(() => {
    if (testimonies.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonies.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [testimonies.length]);

  if (!testimonies || testimonies.length === 0) return null;

  // Derive valid safe index purely during render
  const safeIndex = (currentIndex >= 0 && currentIndex < testimonies.length)
    ? currentIndex
    : 0;

  const current = testimonies[safeIndex] || testimonies[0];

  if (!current) return null;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? testimonies.length - 1 : (prev - 1 + testimonies.length) % testimonies.length));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonies.length);
  };

  const avatarSrc = current.avatarUrl && current.avatarUrl.trim() !== '' ? current.avatarUrl : DEFAULT_AVATAR;

  return (
    <section
      id="testemunhos"
      className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto relative scroll-mt-20 bg-[#FDFDFC]"
    >
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-14">
        <span className="text-[10px] uppercase tracking-[0.3em] text-[#C5A059] font-bold block mb-3">
          Vozes da Congregação
        </span>
        <h2
          id="section-title-testemunhos"
          className="text-3xl sm:text-4xl md:text-5xl font-editorial italic text-neutral-900 tracking-tight font-normal"
        >
          Mensagens e Testemunhos
        </h2>
        <div className="w-12 h-[1px] bg-[#C5A059] mx-auto mt-4" />
        <p className="mt-4 text-sm sm:text-base text-neutral-600 font-light leading-relaxed">
          Relatos sinceros de vidas tocadas e abençoadas nas atividades da Igreja Catedral de Amor e Fé.
        </p>
      </div>

      {/* Testimonial Box */}
      <div className="relative bg-white rounded-sm border border-neutral-200/90 p-8 sm:p-12 shadow-sm">
        {/* Background Quote Icon */}
        <Quote className="absolute top-6 right-8 w-16 h-16 text-[#C5A059]/10 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          {/* Avatar */}
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border border-[#C5A059] shadow-sm flex-shrink-0 bg-neutral-100 flex items-center justify-center">
            {avatarSrc ? (
              <Image
                src={avatarSrc}
                alt={current.name || 'Testemunho'}
                fill
                sizes="96px"
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <User className="w-8 h-8 text-neutral-400" />
            )}
          </div>

          {/* Testimonial Content */}
          <div className="flex-1 text-center md:text-left">
            <p className="text-base sm:text-lg md:text-xl text-neutral-800 font-editorial italic leading-relaxed mb-6">
              «{current.content || ''}»
            </p>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-t border-neutral-100 pt-4">
              <div>
                <h4 className="text-sm sm:text-base font-bold text-neutral-900">
                  {current.name || 'Membro da Congregação'}
                </h4>
                <p className="text-xs text-neutral-500 font-light">
                  {current.role || 'Membro'}
                  {current.date ? (
                    <>
                      {' '}• <span className="text-[#C5A059] font-medium">{current.date}</span>
                    </>
                  ) : null}
                </p>
              </div>

              {/* Slider Controls */}
              {testimonies.length > 1 && (
                <div className="flex items-center justify-center md:justify-end gap-2">
                  <button
                    onClick={handlePrev}
                    aria-label="Testemunho anterior"
                    className="p-2 rounded-sm bg-neutral-50 hover:bg-[#1A1A1A] hover:text-white border border-neutral-200 text-neutral-700 transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleNext}
                    aria-label="Próximo testemunho"
                    className="p-2 rounded-sm bg-neutral-50 hover:bg-[#1A1A1A] hover:text-white border border-neutral-200 text-neutral-700 transition-all cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Indicators */}
        {testimonies.length > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            {testimonies.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Testemunho ${idx + 1}`}
                className={`h-1.5 transition-all cursor-pointer rounded-sm ${
                  safeIndex === idx ? 'w-6 bg-[#C5A059]' : 'w-2 bg-neutral-200 hover:bg-neutral-300'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
