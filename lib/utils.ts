import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isYouTubeVideoUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  return (
    trimmed.includes('youtube.com') ||
    trimmed.includes('youtu.be') ||
    trimmed.includes('youtube-nocookie.com') ||
    /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/i.test(trimmed)
  );
}

export function extractYouTubeId(url: string | undefined | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  
  // Handle various YouTube URL formats:
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://youtube.com/watch?v=VIDEO_ID&t=10s
  // - https://youtu.be/VIDEO_ID
  // - https://www.youtube.com/embed/VIDEO_ID
  // - https://www.youtube.com/v/VIDEO_ID
  // - https://www.youtube.com/shorts/VIDEO_ID
  // - https://www.youtube.com/live/VIDEO_ID
  // - https://youtube-nocookie.com/embed/VIDEO_ID
  // - Raw 11-char YouTube ID
  const patterns = [
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/)|youtube-nocookie\.com\/embed\/)([a-zA-Z0-9_-]{11})/i,
    /^[a-zA-Z0-9_-]{11}$/
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match) {
      return match[1] || match[0];
    }
  }

  return null;
}

export function formatYouTubeEmbedUrl(url: string | undefined | null, autoPlay = false, isBackground = false): string {
  if (!url) return '';
  const videoId = extractYouTubeId(url);
  if (videoId) {
    const params = new URLSearchParams();
    params.set('autoplay', autoPlay ? '1' : '0');
    params.set('playsinline', '1');
    params.set('enablejsapi', '1');
    params.set('rel', '0');
    params.set('modestbranding', '1');
    
    if (isBackground) {
      params.set('mute', '1');
      params.set('controls', '0');
      params.set('loop', '1');
      params.set('playlist', videoId); // Required by YouTube for single video looping
      params.set('disablekb', '1');
      params.set('fs', '0');
      params.set('iv_load_policy', '3');
    }

    return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
  }
  return url;
}

export function getYouTubeWatchUrl(url: string | undefined | null): string {
  if (!url) return '';
  const videoId = extractYouTubeId(url);
  if (videoId) {
    return `https://www.youtube.com/watch?v=${videoId}`;
  }
  return url;
}

/**
 * Resolves a WhatsApp link or group invite link directly as entered.
 * Preserves the exact URL (e.g. chat.whatsapp.com/xxx) without defaulting to phone numbers.
 */
export function resolveWhatsAppGroupLink(rawLink: string | undefined | null): string {
  if (!rawLink || typeof rawLink !== 'string') return '#';
  const trimmed = rawLink.trim();
  if (!trimmed) return '#';

  // Already a full HTTP or HTTPS URL (e.g. https://chat.whatsapp.com/xxx)
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // Missing protocol but starts with a known domain (e.g. chat.whatsapp.com/..., wa.me/...)
  if (/^(chat\.whatsapp\.com|wa\.me|api\.whatsapp\.com|www\.)/i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  // If it's an invite hash code like "AbC123XyZ..."
  if (/^[A-Za-z0-9_-]{18,36}$/.test(trimmed)) {
    return `https://chat.whatsapp.com/${trimmed}`;
  }

  // If it contains a slash and a dot (e.g., domain/path)
  if (trimmed.includes('.') && trimmed.includes('/')) {
    return `https://${trimmed}`;
  }

  // If it's strictly a phone number (e.g., +244 923 847 110 or 923847110)
  const digitsOnly = trimmed.replace(/\D/g, '');
  if (digitsOnly.length >= 8 && (/^\+/.test(trimmed) || !trimmed.includes('.'))) {
    return `https://wa.me/${digitsOnly}`;
  }

  return trimmed.startsWith('//') ? `https:${trimmed}` : `https://${trimmed}`;
}

