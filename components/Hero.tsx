'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useChurch } from '@/lib/ChurchContext';
import { getHeroVideoBlobUrl } from '@/lib/videoStorage';
import { CountdownTimer } from './CountdownTimer';
import { isYouTubeVideoUrl, formatYouTubeEmbedUrl, getYouTubeWatchUrl } from '@/lib/utils';
import CoordinationsModal from '@/components/CoordinationsModal';
import { 
  ArrowDown, 
  Images, 
  Calendar, 
  MapPin, 
  Heart,
  ChevronDown,
  Volume2,
  VolumeX,
  Play,
  Pause,
  ExternalLink,
  X,
  Film,
  Users,
  Shield,
  Loader2
} from 'lucide-react';
import Image from 'next/image';

export function Hero() {
  const { data, setIsAdminOpen } = useChurch();
  const activity = data.currentActivity;
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);
  const isHeroVisibleRef = useRef<boolean>(true);
  
  // Start muted to comply strictly with mobile browser autoplay policies
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHeroVisible, setIsHeroVisible] = useState(true);
  const [customBlobUrl, setCustomBlobUrl] = useState<string | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isCoordinationsOpen, setIsCoordinationsOpen] = useState(false);
  const youtubeIframeRef = useRef<HTMLIFrameElement>(null);

  // Single main information title (avoids duplicate titles/eyebrows)
  const hasChurchName = Boolean(data.churchName && data.churchName.trim() !== '');
  const hasActivityName = Boolean(activity.name && activity.name.trim() !== '');
  const singleTitle = hasActivityName
    ? activity.name.trim()
    : hasChurchName
      ? data.churchName.trim()
      : '';

  const currentHeroVideoUrl = (activity.heroVideo || '').trim();
  const hasVideo = Boolean(customBlobUrl || currentHeroVideoUrl !== '');
  const isYouTube = hasVideo && (isYouTubeVideoUrl(currentHeroVideoUrl) || (customBlobUrl ? isYouTubeVideoUrl(customBlobUrl) : false));
  const rawVideo = isYouTube
    ? (isYouTubeVideoUrl(currentHeroVideoUrl) ? currentHeroVideoUrl : (customBlobUrl || currentHeroVideoUrl))
    : (customBlobUrl || currentHeroVideoUrl || '');
  const videoSrc = (!isYouTube && hasVideo) ? rawVideo : null;

  const hasActivityDetails = Boolean(
    (activity.description && activity.description.trim() !== '') ||
    (activity.theme && activity.theme.trim() !== '') ||
    (activity.formattedDate && activity.formattedDate.trim() !== '') ||
    (activity.location && activity.location.trim() !== '') ||
    (activity.date && activity.date.trim() !== '')
  );
  const hasAnyActivityInfo = hasActivityName || hasActivityDetails || hasChurchName;

  const hasAbout = Boolean(activity.description || activity.name || activity.theme || data.churchAbout);
  const hasHighlights = Boolean(data.highlights && data.highlights.length > 0);
  const hasPhotos = Boolean(data.photos && data.photos.length > 0);
  const hasVideos = Boolean(data.videos && data.videos.length > 0);
  const hasEvents = Boolean(data.upcomingEvents && data.upcomingEvents.length > 0);
  const hasTestimonies = Boolean(data.testimonies && data.testimonies.length > 0);
  const hasSocial = Boolean(data.socialLinks && data.socialLinks.length > 0);
  const hasBelowSections = hasAbout || hasHighlights || hasPhotos || hasVideos || hasEvents || hasTestimonies || hasSocial;

  // Always resolve the best YouTube link for the church
  const resolvedYouTubeUrl = isYouTubeVideoUrl(rawVideo)
    ? rawVideo
    : (isYouTubeVideoUrl(activity.heroVideo)
        ? activity.heroVideo
        : (isYouTubeVideoUrl(activity.videoPromoUrl)
            ? activity.videoPromoUrl
            : (data.videos?.find((v) => isYouTubeVideoUrl(v.videoUrl))?.videoUrl || '')));

  // Hydrate local video blob on mount or when uploaded
  useEffect(() => {
    let isMounted = true;
    
    // Only search for local IndexedDB blob if heroVideo is NOT configured as a YouTube link
    if (!isYouTubeVideoUrl(activity.heroVideo)) {
      getHeroVideoBlobUrl().then((blobUrl) => {
        if (isMounted && blobUrl) {
          setCustomBlobUrl(blobUrl);
        }
      });
    }

    const handleVideoUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<{ blobUrl: string | null }>;
      if (customEvent.detail !== undefined) {
        if (customEvent.detail.blobUrl && isYouTubeVideoUrl(customEvent.detail.blobUrl)) {
          setCustomBlobUrl(null);
        } else {
          setCustomBlobUrl(customEvent.detail.blobUrl);
        }
      }
    };

    window.addEventListener('hero-video-updated', handleVideoUpdated);

    return () => {
      isMounted = false;
      window.removeEventListener('hero-video-updated', handleVideoUpdated);
    };
  }, [activity.heroVideo]);

  const safePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    try {
      video.muted = isMuted;
      video.defaultMuted = true;
      video.playsInline = true;
      
      const promise = video.play();
      if (promise !== undefined) {
        playPromiseRef.current = promise;
        promise
          .then(() => {
            playPromiseRef.current = null;
            setIsPlaying(true);
          })
          .catch((err: unknown) => {
            playPromiseRef.current = null;
            // If browser autoplay policy restricted play -> ensure muted and retry
            video.muted = true;
            setIsMuted(true);
            video.play().then(() => setIsPlaying(true)).catch(() => {});
          });
      } else {
        setIsPlaying(true);
      }
    } catch {
      // Ignored
    }
  }, [isMuted]);

  const safePause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (playPromiseRef.current) {
      playPromiseRef.current
        .then(() => {
          if (videoRef.current) {
            videoRef.current.pause();
            setIsPlaying(false);
          }
        })
        .catch(() => {
          if (videoRef.current) {
            videoRef.current.pause();
            setIsPlaying(false);
          }
        });
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  // Imperative video element setup for mobile iOS & Android & Desktop
  useEffect(() => {
    const video = videoRef.current;
    if (!video || isYouTube) return;

    video.muted = isMuted;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');

    const handleCanPlay = () => {
      if (isHeroVisibleRef.current) {
        safePlay();
      }
    };

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('loadeddata', handleCanPlay);

    // Initial play attempt
    if (isHeroVisibleRef.current) {
      safePlay();
    }

    // Force play on first touch/tap on mobile screen
    const unlockAndPlay = () => {
      if (videoRef.current && videoRef.current.paused) {
        safePlay();
      }
    };

    window.addEventListener('touchstart', unlockAndPlay, { passive: true, once: true });
    window.addEventListener('click', unlockAndPlay, { passive: true, once: true });
    window.addEventListener('scroll', unlockAndPlay, { passive: true, once: true });

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('loadeddata', handleCanPlay);
      window.removeEventListener('touchstart', unlockAndPlay);
      window.removeEventListener('click', unlockAndPlay);
      window.removeEventListener('scroll', unlockAndPlay);
    };
  }, [videoSrc, isMuted, isYouTube, safePlay]);

  // Pause when scrolled past Hero
  useEffect(() => {
    const currentSection = sectionRef.current;
    if (!currentSection) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.1) {
            isHeroVisibleRef.current = true;
            setIsHeroVisible(true);
            safePlay();
            if (isYouTube && youtubeIframeRef.current?.contentWindow) {
              youtubeIframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo' }), '*');
            }
          } else {
            isHeroVisibleRef.current = false;
            setIsHeroVisible(false);
            safePause();
            if (isYouTube && youtubeIframeRef.current?.contentWindow) {
              youtubeIframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo' }), '*');
            }
          }
        });
      },
      {
        threshold: [0, 0.1, 0.3, 0.6],
        rootMargin: '0px 0px -40px 0px',
      }
    );

    observer.observe(currentSection);

    const handleScroll = () => {
      const heroHeight = currentSection.offsetHeight || 600;
      const scrollY = window.scrollY || window.pageYOffset || 0;

      if (scrollY > heroHeight * 0.7) {
        if (isHeroVisibleRef.current) {
          isHeroVisibleRef.current = false;
          setIsHeroVisible(false);
          safePause();
          if (isYouTube && youtubeIframeRef.current?.contentWindow) {
            youtubeIframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo' }), '*');
          }
        }
      } else if (scrollY < heroHeight * 0.35) {
        if (!isHeroVisibleRef.current) {
          isHeroVisibleRef.current = true;
          setIsHeroVisible(true);
          safePlay();
          if (isYouTube && youtubeIframeRef.current?.contentWindow) {
            youtubeIframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo' }), '*');
          }
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        safePause();
      } else if (isHeroVisibleRef.current) {
        safePlay();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [safePause, safePlay, isYouTube]);

  const toggleSound = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isYouTube) {
      const iframe = youtubeIframeRef.current;
      if (iframe?.contentWindow) {
        if (isMuted) {
          iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'unMute' }), '*');
          iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'setVolume', args: [100] }), '*');
          iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo' }), '*');
          setIsMuted(false);
        } else {
          iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'mute' }), '*');
          setIsMuted(true);
        }
      }
    } else if (videoRef.current) {
      const nextMuted = !isMuted;
      videoRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
      if (videoRef.current.paused) {
        safePlay();
      }
    }
  };

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isPlaying) {
      safePause();
    } else {
      safePlay();
    }
  };

  const scrollToSection = (id: string) => {
    const element = document.querySelector(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      ref={sectionRef}
      id="inicio"
      className="relative min-h-[90vh] lg:min-h-[95vh] flex flex-col justify-center items-center pt-28 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden bg-neutral-900 border-b border-neutral-200"
    >
      {/* Background Video with Cinematic Editorial Dark Gradient Overlays or Clean Ambient Canvas */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-[#141414]">
        {hasVideo ? (
          isYouTube ? (
            <iframe
              ref={youtubeIframeRef}
              src={formatYouTubeEmbedUrl(rawVideo, true, true)}
              title={activity.name || data.churchName}
              className="w-full h-full border-0 absolute inset-0 pointer-events-none scale-125"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <video
              ref={videoRef}
              key={videoSrc || 'empty'}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              className="w-full h-full object-cover object-center scale-105 transition-all duration-700"
            >
              {videoSrc && <source src={videoSrc} type="video/mp4" />}
            </video>
          )
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(197,160,89,0.18),rgba(20,20,20,0))]" />
        )}

        {/* Balanced Cinematic Overlays - Video is clearly visible and vivid */}
        <div className="absolute inset-0 bg-black/35 z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 z-10 pointer-events-none" />
      </div>

      {/* Floating Audio Controls - Only displayed if there is an active video */}
      {hasVideo && (
        <div 
          id="hero-floating-audio-control"
          className={`fixed bottom-20 right-4 sm:bottom-22 sm:right-6 z-30 flex items-center gap-2 bg-black/90 backdrop-blur-md border border-white/25 px-3.5 py-2 rounded-full text-white text-[10px] font-semibold tracking-wider shadow-2xl transition-all duration-400 ease-out ${
            isHeroVisible 
              ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' 
              : 'opacity-0 translate-y-6 scale-95 pointer-events-none'
          }`}
        >
          <span className={`w-2 h-2 rounded-full mr-0.5 ${!isMuted ? 'bg-emerald-500 animate-pulse' : 'bg-[#C5A059]'}`} />
          <span className="uppercase text-neutral-300 text-[9px] sm:text-[10px] hidden xs:inline">
            {isYouTube ? 'Áudio do Vídeo' : 'Vídeo Ao Vivo'}
          </span>
          <div className="w-[1px] h-3 bg-white/20 mx-0.5 hidden xs:block" />
          
          {/* Main Audio Button requested by user */}
          <button
            id="hero-btn-toggle-sound"
            onClick={toggleSound}
            aria-label={isMuted ? 'Ouvir áudio do vídeo' : 'Silenciar áudio do vídeo'}
            className={`px-3 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 font-bold text-[9px] sm:text-[10px] shadow-md ${
              !isMuted 
                ? 'bg-[#C5A059] hover:bg-[#B58E45] text-white ring-2 ring-[#C5A059]/50' 
                : 'bg-white/20 hover:bg-white/30 text-white border border-white/25 hover:border-white/40'
            }`}
            title={isMuted ? 'Clique para ouvir o áudio do vídeo' : 'Áudio ativo - Clique para silenciar'}
          >
            {isMuted ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-neutral-200" />
                <span className="uppercase tracking-wider">Ouvir Áudio do Vídeo</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 animate-pulse text-white" />
                <span className="uppercase tracking-wider font-extrabold text-white">Ouvindo Áudio</span>
                <span className="flex items-end gap-0.5 h-2.5 ml-0.5">
                  <span className="w-0.5 h-2 bg-white rounded-full animate-pulse" />
                  <span className="w-0.5 h-3 bg-white rounded-full animate-pulse delay-75" />
                  <span className="w-0.5 h-1.5 bg-white rounded-full animate-pulse delay-150" />
                </span>
              </>
            )}
          </button>

          {!isYouTube && (
            <button
              id="hero-btn-toggle-play"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pausar vídeo' : 'Reproduzir vídeo'}
              className="p-1 text-neutral-300 hover:text-white transition-colors cursor-pointer"
              title={isPlaying ? 'Pausar Vídeo' : 'Reproduzir Vídeo'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
          )}

          {isYouTube && (
            <a
              id="hero-btn-open-youtube"
              href={getYouTubeWatchUrl(rawVideo)}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 hover:text-[#C5A059] text-neutral-300 transition-colors"
              title="Abrir no YouTube"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      )}

      {/* Content */}
      <div className="relative z-20 max-w-5xl mx-auto text-center flex flex-col items-center">
        
        {/* BOTÃO COORDENAÇÕES (COMISSÕES DA CRUZADA NO WHATSAPP) */}
        {data.coordinations && data.coordinations.length > 0 && (
          <button
            id="hero-coordinations-button-top"
            onClick={() => setIsCoordinationsOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2 mb-4 rounded-full bg-[#C5A059] hover:bg-[#b08e4d] text-neutral-950 font-bold text-[11px] uppercase tracking-widest transition-all transform hover:-translate-y-0.5 shadow-lg ring-2 ring-[#C5A059]/40 cursor-pointer animate-in fade-in duration-300"
          >
            <Users className="w-3.5 h-3.5 stroke-[2.2]" />
            <span>Coordenações</span>
          </button>
        )}

        {/* Single Main Information Title (Rendered only when activity name or church name is set by admin) */}
        {singleTitle ? (
          <h1
            id="hero-activity-title"
            suppressHydrationWarning
            className="text-white text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-editorial italic font-normal tracking-tight leading-[0.95] mb-8 max-w-4xl drop-shadow-md"
          >
            {singleTitle}
          </h1>
        ) : null}

        {/* Quick event meta badges */}
        {(activity.formattedDate || activity.location) && (
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-9 text-xs sm:text-sm text-neutral-200">
            {activity.formattedDate && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-sm bg-black/50 border border-white/15 backdrop-blur-md">
                <Calendar className="w-3.5 h-3.5 text-[#C5A059]" />
                <span className="font-medium tracking-wide">{activity.formattedDate}</span>
              </div>
            )}
            {activity.location && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-sm bg-black/50 border border-white/15 backdrop-blur-md">
                <MapPin className="w-3.5 h-3.5 text-[#C5A059]" />
                <span className="font-medium tracking-wide">{activity.location}</span>
              </div>
            )}
            <div className="flex items-center gap-2 px-4 py-2 rounded-sm bg-[#C5A059]/20 border border-[#C5A059]/40 text-[#F6EEDF] backdrop-blur-md font-semibold">
              <Heart className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Entrada Livre</span>
            </div>
          </div>
        )}

        {/* Visitor Action Buttons or Waiting/Admin Callout */}
        {hasAnyActivityInfo ? (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mb-10">
            {hasAbout && (
              <button
                id="hero-btn-saber-mais"
                onClick={() => scrollToSection('#sobre')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 text-[11px] font-bold uppercase tracking-widest text-white bg-[#C5A059] hover:bg-[#B58E45] rounded-sm transition-all transform hover:-translate-y-0.5 cursor-pointer shadow-md"
              >
                <span>Saber Mais</span>
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
            )}

            {((data.photos && data.photos.length > 0) || (data.videos && data.videos.length > 0)) && (
              <button
                id="hero-btn-ver-fotos-videos"
                onClick={() => scrollToSection(data.photos && data.photos.length > 0 ? '#fotos' : '#videos')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 text-[11px] font-bold uppercase tracking-widest text-white border border-white/35 hover:border-white hover:bg-white/10 rounded-sm backdrop-blur-sm transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                <Images className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>Galeria</span>
              </button>
            )}
          </div>
        ) : (
          <div 
            id="hero-loading-empty-state"
            className="flex flex-col items-center justify-center gap-4 w-full max-w-lg mx-auto mb-10 text-center animate-fade-in"
          >
            {/* Círculo a Girar (Spinner Circular Animado) */}
            <div className="relative flex items-center justify-center w-14 h-14 my-1" aria-label="A Carregar">
              <div className="w-14 h-14 rounded-full border-2 border-[#C5A059]/25" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#C5A059] border-r-[#C5A059] animate-spin" />
              <Loader2 className="w-7 h-7 text-[#C5A059] animate-spin" />
            </div>

            <div className="flex flex-col items-center gap-1.5">
              <span className="text-base sm:text-lg font-bold tracking-widest text-white uppercase">
                A Carregar
              </span>
              <p className="text-xs sm:text-sm text-neutral-400 font-light max-w-sm leading-relaxed">
                Aguardando a publicação das informações oficiais...
              </p>
            </div>

            <button
              id="hero-btn-admin-config"
              onClick={() => setIsAdminOpen(true)}
              className="mt-1 inline-flex items-center gap-2 px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-neutral-950 bg-[#C5A059] hover:bg-[#B58E45] rounded-sm transition-all transform hover:-translate-y-0.5 cursor-pointer shadow-lg"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Acessar Painel de Gestão</span>
            </button>
          </div>
        )}

        {/* Real-time Countdown Timer component */}
        {(activity.date || activity.countdownTarget) && (
          <CountdownTimer
            targetDateString={activity.date || activity.countdownTarget || ''}
            activityName={activity.name || ''}
          />
        )}
      </div>

      {/* Down Scroll Indicator */}
      {hasBelowSections && (
        <div className="mt-8 z-20 flex flex-col items-center">
          <button
            onClick={() => scrollToSection('#sobre')}
            aria-label="Rolar para baixo"
            className="text-neutral-400 hover:text-white transition-colors flex flex-col items-center gap-1 cursor-pointer"
          >
            <span className="text-[10px] uppercase tracking-[0.3em] font-medium">Explorar Programação</span>
            <ChevronDown className="w-3.5 h-3.5 animate-bounce text-[#C5A059]" />
          </button>
        </div>
      )}

      {/* Interactive YouTube Video Modal Player with sound */}
      {isVideoModalOpen && (
        <div 
          id="hero-youtube-modal"
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setIsVideoModalOpen(false)}
        >
          <div 
            className="relative w-full max-w-4xl bg-black rounded-lg overflow-hidden border border-white/20 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 bg-neutral-900 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-white truncate max-w-xs sm:max-w-md">
                  {activity.name} — Vídeo Oficial YouTube
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={getYouTubeWatchUrl(resolvedYouTubeUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[11px] font-bold text-[#C5A059] hover:underline uppercase tracking-wider px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded-sm transition-colors"
                >
                  <span>Abrir no YouTube</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  onClick={() => setIsVideoModalOpen(false)}
                  className="p-1.5 text-neutral-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                  title="Fechar vídeo"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="relative aspect-video w-full bg-black">
              <iframe
                src={formatYouTubeEmbedUrl(resolvedYouTubeUrl, true) + '&autoplay=1&enablejsapi=1'}
                title={activity.name}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      {/* Coordinations Modal Dialog */}
      <CoordinationsModal
        isOpen={isCoordinationsOpen}
        onClose={() => setIsCoordinationsOpen(false)}
      />
    </section>
  );
}
