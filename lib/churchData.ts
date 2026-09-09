import { ChurchSettings } from './types';

export const initialChurchData: ChurchSettings = {
  churchName: "",
  logoPrefix: "",
  logoSuffix: "",
  logoImageUrl: "",
  churchMotto: "",
  churchAbout: "",
  phone: "",
  whatsappNumber: "",
  whatsappMessage: "",
  email: "",
  address: "",
  cityCountry: "",
  worshipSchedule: [],
  socialLinks: [],
  coordinations: [],
  currentActivity: {
    id: "act-main",
    name: "",
    subtitle: "",
    badge: "",
    heroEyebrow: "",
    description: "",
    theme: "",
    themeVerse: "",
    date: "",
    formattedDate: "",
    time: "",
    location: "",
    address: "",
    organization: "",
    targetAudience: "",
    goal: "",
    importantNotes: "",
    pastors: [],
    heroVideo: "",
    videoPromoUrl: "",
    ctaButtonText: "",
    ctaButtonLink: "",
    countdownTarget: "",
  },
  highlights: [],
  photos: [],
  videos: [],
  upcomingEvents: [],
  testimonies: [],
  developedBy: {
    name: "Baobá Universe",
    description: "Soluções Digitais e Desenvolvimento Web de Alto Impacto",
    url: "https://baobauniverse.com"
  },
  editTimestamp: 0,
  lastUpdatedAt: new Date().toISOString()
};

export function hasUserContent(data?: Partial<ChurchSettings> | null): boolean {
  if (!data) return false;
  if (typeof data.churchName === 'string' && data.churchName.trim() !== '') return true;
  if (typeof data.churchMotto === 'string' && data.churchMotto.trim() !== '') return true;
  if (typeof data.churchAbout === 'string' && data.churchAbout.trim() !== '') return true;
  if (typeof data.phone === 'string' && data.phone.trim() !== '') return true;
  if (typeof data.whatsappNumber === 'string' && data.whatsappNumber.trim() !== '') return true;
  if (typeof data.address === 'string' && data.address.trim() !== '') return true;
  
  const act = data.currentActivity;
  if (act) {
    if (typeof act.name === 'string' && act.name.trim() !== '') return true;
    if (typeof act.theme === 'string' && act.theme.trim() !== '') return true;
    if (typeof act.description === 'string' && act.description.trim() !== '') return true;
    if (typeof act.date === 'string' && act.date.trim() !== '') return true;
    if (typeof act.location === 'string' && act.location.trim() !== '') return true;
    if (typeof act.heroVideo === 'string' && act.heroVideo.trim() !== '') return true;
    if (typeof act.videoPromoUrl === 'string' && act.videoPromoUrl.trim() !== '') return true;
  }

  if (Array.isArray(data.photos) && data.photos.length > 0) return true;
  if (Array.isArray(data.videos) && data.videos.length > 0) return true;
  if (Array.isArray(data.highlights) && data.highlights.length > 0) return true;
  if (Array.isArray(data.upcomingEvents) && data.upcomingEvents.length > 0) return true;
  if (Array.isArray(data.testimonies) && data.testimonies.length > 0) return true;
  if (Array.isArray(data.coordinations) && data.coordinations.length > 0) return true;
  if (Array.isArray(data.worshipSchedule) && data.worshipSchedule.length > 0) return true;
  if (Array.isArray(data.socialLinks) && data.socialLinks.length > 0) return true;

  return false;
}

