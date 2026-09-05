'use client';

import React from 'react';
import Image from 'next/image';
import { useChurch } from '@/lib/ChurchContext';
import { 
  Church, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Instagram, 
  Facebook, 
  Youtube, 
  MessageCircle, 
  Heart, 
  ExternalLink,
  ChevronRight,
  Shield,
  Globe,
  Send,
  Radio,
  Music2,
  Headphones,
  Share2
} from 'lucide-react';

export function Footer() {
  const { data, setIsAdminOpen } = useChurch();

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'Instagram':
        return Instagram;
      case 'Facebook':
        return Facebook;
      case 'YouTube':
        return Youtube;
      case 'WhatsApp':
        return MessageCircle;
      case 'TikTok':
        return Music2;
      case 'Spotify':
        return Headphones;
      case 'Telegram':
        return Send;
      case 'Website':
        return Globe;
      case 'Rádio':
        return Radio;
      default:
        return Share2;
    }
  };

  const scrollTo = (href: string) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer id="contacto" className="bg-[#141414] text-neutral-300 border-t border-neutral-800 relative overflow-hidden pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 pb-12 border-b border-neutral-800/80">
          
          {/* Links Rápidos (Navegação) */}
          <div className="lg:col-span-4 space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C5A059]">
              Navegação Rápida
            </h3>

            <ul className="grid grid-cols-2 gap-2 text-xs">
              {[
                { label: 'Início', href: '#inicio' },
                { label: 'Sobre a Atividade', href: '#sobre' },
                { label: 'Momentos em Destaque', href: '#destaques' },
                { label: 'Galeria de Fotos', href: '#fotos' },
                { label: 'Galeria de Vídeos', href: '#videos' },
                { label: 'Agenda de Atividades', href: '#atividades' },
                { label: 'Redes Sociais', href: '#redes-sociais' },
              ].map((link, idx) => (
                <li key={idx}>
                  <button
                    onClick={() => scrollTo(link.href)}
                    className="text-neutral-400 hover:text-[#C5A059] transition-colors flex items-center gap-1 cursor-pointer font-light"
                  >
                    <ChevronRight className="w-3 h-3 text-[#C5A059]" />
                    <span>{link.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Sede & Contactos */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C5A059] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Sede & Contactos</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-neutral-300 font-light">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-3.5 h-3.5 text-[#C5A059] flex-shrink-0 mt-0.5" />
                <span>{data.address}, {data.cityCountry}</span>
              </div>

              <div className="flex items-center gap-2.5">
                <Phone className="w-3.5 h-3.5 text-[#C5A059] flex-shrink-0" />
                <span>{data.phone}</span>
              </div>

              <div className="flex items-center gap-2.5">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <a
                  href={`https://wa.me/${data.whatsappNumber.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:underline font-medium"
                >
                  WhatsApp Oficial
                </a>
              </div>

              <div className="flex items-center gap-2.5">
                <Mail className="w-3.5 h-3.5 text-[#C5A059] flex-shrink-0" />
                <span className="truncate">{data.email}</span>
              </div>
            </div>
          </div>

          {/* Redes Sociais & Painel de Gestão */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C5A059]">
              Conecte-se
            </h3>

            <div className="flex items-center gap-2">
              {data.socialLinks.map((social) => {
                const Icon = getPlatformIcon(social.platform);
                let socialTargetUrl = social.url;
                if (social.platform === 'WhatsApp' || social.id === 'soc-whatsapp') {
                  const rawNum = social.handle || data.whatsappNumber || social.url || '';
                  const cleanNum = rawNum.replace(/\D/g, '');
                  if (cleanNum) {
                    const msg = data.whatsappMessage ? `?text=${encodeURIComponent(data.whatsappMessage)}` : '';
                    socialTargetUrl = `https://wa.me/${cleanNum}${msg}`;
                  }
                }

                return (
                  <a
                    key={social.id}
                    href={socialTargetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.name}
                    className="w-8 h-8 rounded-sm bg-neutral-900 border border-neutral-800 hover:border-[#C5A059] hover:bg-[#C5A059]/10 text-neutral-400 hover:text-[#C5A059] flex items-center justify-center transition-all cursor-pointer"
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Bar with Baobá Universe Attribution */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-neutral-400 font-light">
          <div>
            <p>© {new Date().getFullYear()} {data.churchName}. Todos os direitos reservados.</p>
          </div>

          {/* Baobá Universe Agency Badge */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-sm bg-neutral-900 border border-neutral-800 text-neutral-300">
            <span className="text-[11px]">Desenvolvido com excelência por</span>
            <a
              href="https://baobauniverse.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-[#C5A059] hover:text-[#E2C58A] transition-colors inline-flex items-center gap-1"
            >
              Baobá Universe
              <ExternalLink className="w-3 h-3 text-[#C5A059]" />
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}
