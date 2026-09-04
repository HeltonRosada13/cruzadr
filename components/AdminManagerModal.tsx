 'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useChurch } from '@/lib/ChurchContext';
import { PhotoItem, ChurchEvent, Testimony, CoordinationGroup, SocialLink, SocialPlatform } from '@/lib/types';
import { saveHeroVideoBlob, clearHeroVideoBlob, saveVideoFileBlob, generateVideoThumbnailAndDuration } from '@/lib/videoStorage';
import { processAndOptimizeImage } from '@/lib/imageUtils';
import { AdminHighlightsTab } from '@/components/AdminHighlightsTab';
import { isYouTubeVideoUrl, formatYouTubeEmbedUrl, extractYouTubeId, resolveWhatsAppGroupLink } from '@/lib/utils';
import Image from 'next/image';
import { 
  Settings, 
  X, 
  Save, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  Video, 
  Calendar, 
  Share2, 
  Phone, 
  Info,
  Church,
  CheckCircle2,
  Sparkles,
  Star,
  Link2,
  FileText,
  FolderOpen,
  UploadCloud,
  Film,
  PlayCircle,
  AlertCircle,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Eye,
  Cloud,
  Database,
  Camera,
  Upload,
  Check,
  Layers,
  Pencil,
  MapPin,
  Clock,
  User,
  MessageCircle,
  Globe,
  Copy,
  Download,
  Lock,
  KeyRound,
  ShieldCheck,
  LogOut,
  Quote,
  MessageSquareHeart,
  Users,
  MessageSquare,
  Search,
  Send,
  Radio,
  Music2,
  Headphones
} from 'lucide-react';

export function AdminManagerModal() {
  const { isAdminOpen, data } = useChurch();
  if (!isAdminOpen) return null;
  return <AdminManagerModalInner key={data.currentActivity?.id || 'admin-modal'} />;
}

function AdminManagerModalInner() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('caf_admin_authenticated') === 'true';
    }
    return false;
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  const { 
    data, 
    isAdminOpen, 
    setIsAdminOpen, 
    updateCurrentActivity, 
    updateChurchInfo,
    addPhoto,
    addBatchPhotos,
    removePhoto,
    addVideo,
    addBatchVideos,
    removeVideo,
    setPrimaryFeaturedVideo,
    resetVideosToDefaults,
    clearAllOldVideos,
    addUpcomingEvent,
    updateUpcomingEvent,
    removeUpcomingEvent,
    addSocialLink,
    addBatchSocialLinks,
    updateSocialLink,
    removeSocialLink,
    resetSocialLinksToDefaults,
    resetToDefaults,
    addHighlight,
    updateHighlight,
    removeHighlight,
    resetHighlightsToDefaults,
    addTestimony,
    updateTestimony,
    removeTestimony,
    resetTestimoniesToDefaults,
    addCoordination,
    updateCoordination,
    removeCoordination,
    resetCoordinationsToDefaults,
    syncNowWithCloud,
    syncState,
    firebaseProjectId,
    isQuotaExceeded,
    firebaseConsoleUrl
  } = useChurch();

  const [activeTab, setActiveTab] = useState<'activity' | 'highlights' | 'photos' | 'videos' | 'events' | 'testimonies' | 'social' | 'coordinations' | 'church' | 'cloud'>('activity');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Coordinations Form States
  const [newCoordForm, setNewCoordForm] = useState({
    name: '',
    category: 'Música & Louvor',
    description: '',
    leaderOrContact: '',
    whatsappLink: '',
    isActive: true,
  });
  const [editingCoordId, setEditingCoordId] = useState<string | null>(null);
  const [editCoordForm, setEditCoordForm] = useState({
    name: '',
    category: '',
    description: '',
    leaderOrContact: '',
    whatsappLink: '',
    isActive: true,
  });

  // Video Upload States
  const [uploadedVideoName, setUploadedVideoName] = useState<string | null>(null);
  const [uploadedVideoSize, setUploadedVideoSize] = useState<string | null>(null);
  const [isDraggingVideo, setIsDraggingVideo] = useState(false);
  const [isVideoProcessing, setIsVideoProcessing] = useState(false);
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const galleryVideoFileInputRef = useRef<HTMLInputElement>(null);
  const galleryBatchVideoFileInputRef = useRef<HTMLInputElement>(null);
  const [isGalleryVideoUploading, setIsGalleryVideoUploading] = useState(false);
  const [isBatchVideoUploading, setIsBatchVideoUploading] = useState(false);
  const [batchVideoUploadProgress, setBatchVideoUploadProgress] = useState<string | null>(null);
  const [uploadedGalleryVideoId, setUploadedGalleryVideoId] = useState<string | null>(null);
  const [uploadedGalleryVideoMeta, setUploadedGalleryVideoMeta] = useState<{ name: string; size: string } | null>(null);
  const [setAsFeaturedImmediately, setSetAsFeaturedImmediately] = useState(true);
  const [replaceOldVideosOnUpload, setReplaceOldVideosOnUpload] = useState(false);
  const [setAsHeroVideoOnUpload, setSetAsHeroVideoOnUpload] = useState(true);
  const [batchYouTubeUrls, setBatchYouTubeUrls] = useState('');
  const [isProcessingBatchYouTube, setIsProcessingBatchYouTube] = useState(false);
  const [videoSearchQuery, setVideoSearchQuery] = useState('');

  // Social Links & Digital Channels States
  const [newSocialForm, setNewSocialForm] = useState<{
    platform: SocialPlatform;
    name: string;
    handle: string;
    url: string;
    description: string;
    badgeText: string;
  }>({
    platform: 'WhatsApp',
    name: '',
    handle: '',
    url: '',
    description: '',
    badgeText: '',
  });
  const [editingSocialId, setEditingSocialId] = useState<string | null>(null);
  const [editingSocialForm, setEditingSocialForm] = useState<SocialLink | null>(null);
  const [batchSocialUrls, setBatchSocialUrls] = useState('');
  const [isProcessingBatchSocial, setIsProcessingBatchSocial] = useState(false);
  const [socialSearchQuery, setSocialSearchQuery] = useState('');

  // Photo / Image Upload States & File Input Refs
  const photoFileInputRef = useRef<HTMLInputElement>(null);
  const photoBatchFileInputRef = useRef<HTMLInputElement>(null);
  const heroImageFileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const videoThumbFileInputRef = useRef<HTMLInputElement>(null);
  const eventImageFileInputRef = useRef<HTMLInputElement>(null);
  const editEventImageFileInputRef = useRef<HTMLInputElement>(null);
  const testimonyAvatarFileInputRef = useRef<HTMLInputElement>(null);
  const editTestimonyAvatarFileInputRef = useRef<HTMLInputElement>(null);

  const [isPhotoUploading, setIsPhotoUploading] = useState(false);
  const [isBatchPhotoUploading, setIsBatchPhotoUploading] = useState(false);
  const [isHeroImageUploading, setIsHeroImageUploading] = useState(false);
  const [isLogoUploading, setIsLogoUploading] = useState(false);
  const [isVideoThumbUploading, setIsVideoThumbUploading] = useState(false);
  const [isEventImageUploading, setIsEventImageUploading] = useState(false);
  const [isEditEventImageUploading, setIsEditEventImageUploading] = useState(false);
  const [isTestimonyAvatarUploading, setIsTestimonyAvatarUploading] = useState(false);
  const [isEditTestimonyAvatarUploading, setIsEditTestimonyAvatarUploading] = useState(false);
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);
  const [uploadedPhotoMeta, setUploadedPhotoMeta] = useState<{ name: string; size: string } | null>(null);

  // Form states initialized directly from current church data
  const [activityForm, setActivityForm] = useState({
    ...data.currentActivity,
    badge: data.currentActivity?.badge || '',
    heroEyebrow: data.currentActivity?.heroEyebrow || '',
  });
  const [churchForm, setChurchForm] = useState({
    churchName: data.churchName || 'Igreja Catedral de Amor e Fé',
    logoPrefix: data.logoPrefix || 'Catedral de',
    logoSuffix: data.logoSuffix || 'Amor e Fé',
    logoImageUrl: data.logoImageUrl || '',
    churchMotto: data.churchMotto || '',
    churchAbout: data.churchAbout || '',
    phone: data.phone || '',
    whatsappNumber: data.whatsappNumber || '',
    whatsappMessage: data.whatsappMessage || '',
    email: data.email || '',
    address: data.address || '',
    cityCountry: data.cityCountry || '',
  });

  // New photo input states
  const [newPhoto, setNewPhoto] = useState({
    title: '',
    description: '',
    imageUrl: '',
    category: 'Louvor' as const,
    date: 'Atividade Recente',
    photographer: 'Comunicação Oficial',
  });

  // New video input states
  const [newVideo, setNewVideo] = useState({
    title: '',
    description: '',
    thumbnailUrl: '',
    videoUrl: '',
    duration: '05:00 min',
    category: 'Destaques',
    date: 'Atividade Oficial',
  });

  // New event input states
  const [newEvent, setNewEvent] = useState({
    title: '',
    category: 'Geral',
    date: '',
    time: '19h00',
    location: 'Templo Central',
    description: '',
    fullDetails: '',
    imageUrl: 'https://images.unsplash.com/photo-1519834785169-98be25ec3f84?auto=format&fit=crop&w=800&q=80',
    speaker: 'Conselho Pastoral',
    featured: false,
  });

  // Edit event state
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editingEventForm, setEditingEventForm] = useState<ChurchEvent | null>(null);

  // Testimony input & edit states
  const [newTestimony, setNewTestimony] = useState({
    name: '',
    role: 'Membro da Catedral',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop&crop=faces&q=80',
    content: '',
    activityName: data.currentActivity?.name || 'Culto da Família',
    date: 'Agosto de 2026',
  });

  const [editingTestimonyId, setEditingTestimonyId] = useState<string | null>(null);
  const [editingTestimonyForm, setEditingTestimonyForm] = useState<Testimony | null>(null);

  // Listen to open-admin-tab custom event
  useEffect(() => {
    const handleOpenAdminTab = (e: Event) => {
      const customEvent = e as CustomEvent<{ tab?: string }>;
      if (customEvent.detail?.tab) {
        setActiveTab(customEvent.detail.tab as any);
      }
      setChurchForm({
        churchName: data.churchName || '',
        logoPrefix: data.logoPrefix !== undefined ? data.logoPrefix : 'Catedral de',
        logoSuffix: data.logoSuffix !== undefined ? data.logoSuffix : 'Amor e Fé',
        logoImageUrl: data.logoImageUrl || '',
        churchMotto: data.churchMotto || '',
        churchAbout: data.churchAbout || '',
        phone: data.phone || '',
        whatsappNumber: data.whatsappNumber || '',
        whatsappMessage: data.whatsappMessage || '',
        email: data.email || '',
        address: data.address || '',
        cityCountry: data.cityCountry || '',
      });
      setIsAdminOpen(true);
    };
    window.addEventListener('open-admin-tab', handleOpenAdminTab);
    return () => window.removeEventListener('open-admin-tab', handleOpenAdminTab);
  }, [setIsAdminOpen, data]);

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // Handler for Single Gallery Photo File Selection
  const handleProcessGalleryPhotoFile = async (file: File) => {
    if (!file) return;
    try {
      setIsPhotoUploading(true);
      const result = await processAndOptimizeImage(file);
      
      const cleanName = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

      setNewPhoto((prev) => ({
        ...prev,
        imageUrl: result.dataUrl,
        title: prev.title.trim() ? prev.title : cleanName,
      }));

      setUploadedPhotoMeta({
        name: file.name,
        size: result.formattedSize,
      });

      showNotification(`Foto "${file.name}" carregada e otimizada! Clique em "Publicar Fotografia" para salvar.`);
    } catch (err) {
      console.error('Error uploading photo:', err);
      showNotification('Erro ao carregar imagem. Verifique se é um arquivo JPEG, PNG ou WebP válido.');
    } finally {
      setIsPhotoUploading(false);
    }
  };

  // Handler for Multiple / Batch Gallery Photos Upload
  const handleProcessBatchGalleryPhotos = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    try {
      setIsBatchPhotoUploading(true);
      const batchList: Omit<PhotoItem, 'id'>[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          const result = await processAndOptimizeImage(file);
          const cleanName = file.name
            .replace(/\.[^/.]+$/, '')
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase());

          batchList.push({
            title: cleanName || `Momento Catedral #${data.photos.length + batchList.length + 1}`,
            description: 'Fotografia oficial da igreja catedral de amor e fé',
            imageUrl: result.dataUrl,
            category: newPhoto.category || 'Louvor',
            date: 'Atividade Recente',
            photographer: 'Comunicação Oficial',
          });
        }
      }
      if (batchList.length > 0) {
        addBatchPhotos(batchList);
        showNotification(`${batchList.length} fotografias foram publicadas na galeria com sucesso e salvas!`);
      }
    } catch (err) {
      console.error('Error batch uploading photos:', err);
      showNotification('Erro ao carregar o lote de fotos.');
    } finally {
      setIsBatchPhotoUploading(false);
    }
  };

  // Handler for Hero / Activity Banner Cover Photo
  const handleProcessHeroImageFile = async (file: File) => {
    if (!file) return;
    try {
      setIsHeroImageUploading(true);
      const result = await processAndOptimizeImage(file, 1920, 1080, 0.88);
      const updated = {
        ...activityForm,
        heroImage: result.dataUrl,
      };
      setActivityForm(updated);
      updateCurrentActivity({ heroImage: result.dataUrl });
      showNotification(`Foto de capa do Hero atualizada com sucesso (${result.formattedSize})!`);
    } catch (err) {
      console.error('Error uploading hero image:', err);
      showNotification('Erro ao carregar imagem de capa.');
    } finally {
      setIsHeroImageUploading(false);
    }
  };

  // Handler for Church Logo Image File
  const handleProcessLogoFile = async (file: File) => {
    if (!file) return;
    try {
      setIsLogoUploading(true);
      const result = await processAndOptimizeImage(file, 400, 400, 0.9);
      setChurchForm((prev) => ({
        ...prev,
        logoImageUrl: result.dataUrl,
      }));
      showNotification(`Logotipo da igreja carregado com sucesso (${result.formattedSize})!`);
    } catch (err) {
      console.error('Error uploading logo:', err);
      showNotification('Erro ao carregar ficheiro de logotipo.');
    } finally {
      setIsLogoUploading(false);
    }
  };

  // Handler for Video Thumbnail Image
  const handleProcessVideoThumbFile = async (file: File) => {
    if (!file) return;
    try {
      setIsVideoThumbUploading(true);
      const result = await processAndOptimizeImage(file, 1280, 720, 0.85);
      setNewVideo((prev) => ({
        ...prev,
        thumbnailUrl: result.dataUrl,
      }));
      showNotification(`Miniatura do vídeo carregada (${result.formattedSize})!`);
    } catch (err) {
      console.error('Error uploading video thumb:', err);
      showNotification('Erro ao carregar miniatura.');
    } finally {
      setIsVideoThumbUploading(false);
    }
  };

  // Handler for Event Cover Image
  const handleProcessEventImageFile = async (file: File) => {
    if (!file) return;
    try {
      setIsEventImageUploading(true);
      const result = await processAndOptimizeImage(file, 1280, 720, 0.85);
      setNewEvent((prev) => ({
        ...prev,
        imageUrl: result.dataUrl,
      }));
      showNotification(`Foto de divulgação do evento carregada (${result.formattedSize})!`);
    } catch (err) {
      console.error('Error uploading event image:', err);
      showNotification('Erro ao carregar foto do evento.');
    } finally {
      setIsEventImageUploading(false);
    }
  };

  // Handler for Edit Event Cover Image
  const handleProcessEditEventImageFile = async (file: File) => {
    if (!file) return;
    try {
      setIsEditEventImageUploading(true);
      const result = await processAndOptimizeImage(file, 1280, 720, 0.85);
      setEditingEventForm((prev) => prev ? ({
        ...prev,
        imageUrl: result.dataUrl,
      }) : null);
      showNotification(`Foto de divulgação do evento atualizada (${result.formattedSize})!`);
    } catch (err) {
      console.error('Error uploading edit event image:', err);
      showNotification('Erro ao atualizar foto do evento.');
    } finally {
      setIsEditEventImageUploading(false);
    }
  };

  const handleProcessVideoFile = async (file: File) => {
    if (!file) return;
    
    // Check if valid video file
    if (!file.type.startsWith('video/') && !file.name.match(/\.(mp4|webm|mov|mkv|ogg|m4v)$/i)) {
      showNotification('Por favor selecione um ficheiro de vídeo válido (MP4, WebM, MOV, etc.).');
      return;
    }

    try {
      setIsVideoProcessing(true);
      const objectUrl = await saveHeroVideoBlob(file);
      
      const newActivity = {
        ...activityForm,
        heroVideo: objectUrl,
      };

      setActivityForm(newActivity);
      updateCurrentActivity(newActivity);
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('hero-video-updated', { detail: { blobUrl: objectUrl } }));
      }

      setUploadedVideoName(file.name);
      setUploadedVideoSize((file.size / (1024 * 1024)).toFixed(1) + ' MB');
      showNotification(`Vídeo "${file.name}" carregado com sucesso! Já está a funcionar na página inicial.`);
    } catch (err) {
      console.error('Error processing video:', err);
      showNotification('Erro ao carregar o vídeo. Tente novamente.');
    } finally {
      setIsVideoProcessing(false);
    }
  };

  const handleClearCustomVideo = async () => {
    await clearHeroVideoBlob();
    const defaultVideo = 'https://assets.mixkit.co/videos/preview/mixkit-hands-raised-in-a-church-service-41846-large.mp4';
    const newActivity = {
      ...activityForm,
      heroVideo: defaultVideo,
    };
    setActivityForm(newActivity);
    updateCurrentActivity(newActivity);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hero-video-updated', { detail: { blobUrl: null } }));
    }
    setUploadedVideoName(null);
    setUploadedVideoSize(null);
    showNotification('Vídeo restaurado para a versão padrão.');
  };

  const handleSelectPresetVideo = async (url: string, name: string) => {
    await clearHeroVideoBlob();
    const newActivity = {
      ...activityForm,
      heroVideo: url,
    };
    setActivityForm(newActivity);
    updateCurrentActivity(newActivity);
    syncNowWithCloud();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hero-video-updated', { detail: { blobUrl: null } }));
    }
    setUploadedVideoName(name);
    setUploadedVideoSize(null);
    showNotification(`Vídeo "${name}" selecionado e sincronizado com todos os telemóveis e computadores!`);
  };

  const handleSaveActivity = (e: React.FormEvent) => {
    e.preventDefault();
    updateCurrentActivity(activityForm);
    syncNowWithCloud();
    showNotification('Atividade principal salva com sucesso! Todas as alterações foram gravadas permanentemente.');
  };

  const handleSaveChurchInfo = (e: React.FormEvent) => {
    e.preventDefault();
    updateChurchInfo(churchForm);
    syncNowWithCloud();
    showNotification('Dados de contacto e da igreja salvos com sucesso!');
  };

  const handleClearAllToBlank = async () => {
    const confirmed = window.confirm(
      'Tem a certeza de que deseja esvaziar todos os campos do site para começar do zero?\n\n' +
      '• Todas as fotos, vídeos, eventos, destaques e textos de exemplo serão limpos.\n' +
      '• Somente as informações que publicar a partir de agora na área do administrador aparecerão no site.\n' +
      '• Esta alteração será enviada a todos os utilizadores em tempo real.'
    );
    if (!confirmed) return;

    resetToDefaults();
    setActivityForm({
      id: 'act-main',
      name: '',
      subtitle: '',
      badge: '',
      heroEyebrow: '',
      description: '',
      theme: '',
      themeVerse: '',
      date: '',
      formattedDate: '',
      time: '',
      location: '',
      address: '',
      organization: '',
      targetAudience: '',
      goal: '',
      importantNotes: '',
      pastors: [],
      heroVideo: '',
      videoPromoUrl: '',
      ctaButtonText: '',
      ctaButtonLink: '',
      countdownTarget: '',
    });
    setChurchForm({
      churchName: 'Igreja Catedral de Amor e Fé',
      logoPrefix: 'Catedral de',
      logoSuffix: 'Amor e Fé',
      logoImageUrl: '',
      churchMotto: '',
      churchAbout: '',
      phone: '',
      whatsappNumber: '',
      whatsappMessage: '',
      email: '',
      address: '',
      cityCountry: '',
    });
    await syncNowWithCloud();
    showNotification('Todos os campos foram esvaziados! O site está limpo e pronto para as suas publicações oficiais.');
  };

  const handleAddPhotoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhoto.title || !newPhoto.imageUrl) return;
    addPhoto(newPhoto);
    setNewPhoto({
      title: '',
      description: '',
      imageUrl: '',
      category: 'Louvor',
      date: 'Atividade Recente',
      photographer: 'Comunicação Oficial',
    });
    showNotification('Fotografia adicionada à galeria!');
  };

  // Handler for Videos / Photos in the Videos Gallery Section
  const handleProcessGalleryVideoFile = async (file: File) => {
    if (!file) return;
    try {
      setIsGalleryVideoUploading(true);
      const cleanTitle = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());

      if (file.type.startsWith('video/') || file.name.match(/\.(mp4|webm|mov|mkv|ogg|m4v|avi)$/i)) {
        const { thumbnailDataUrl, durationFormatted } = await generateVideoThumbnailAndDuration(file);
        const videoId = 'v-' + Date.now().toString();
        setUploadedGalleryVideoId(videoId);
        const blobUrl = await saveVideoFileBlob(videoId, file);

        setNewVideo((prev) => ({
          ...prev,
          title: prev.title || cleanTitle,
          videoUrl: blobUrl,
          thumbnailUrl: thumbnailDataUrl,
          duration: durationFormatted,
        }));
        setUploadedGalleryVideoMeta({
          name: file.name,
          size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
        });
        showNotification(`Vídeo "${file.name}" carregado das suas pastas com sucesso!`);
      } else if (file.type.startsWith('image/')) {
        const imgRes = await processAndOptimizeImage(file, 1280, 720, 0.85);
        setUploadedGalleryVideoId(null);
        setNewVideo((prev) => ({
          ...prev,
          title: prev.title || cleanTitle,
          thumbnailUrl: imgRes.dataUrl,
          videoUrl: prev.videoUrl || imgRes.dataUrl,
          duration: prev.duration || '03:00 min',
        }));
        setUploadedGalleryVideoMeta({
          name: file.name,
          size: imgRes.formattedSize,
        });
        showNotification(`Foto "${file.name}" carregada das suas pastas para o vídeo!`);
      } else {
        showNotification('Por favor selecione um ficheiro de vídeo ou imagem.');
      }
    } catch (err) {
      console.error('Error processing gallery video:', err);
      showNotification('Erro ao processar ficheiro das suas pastas.');
    } finally {
      setIsGalleryVideoUploading(false);
    }
  };

  // Handler for Batch / Multiple Video Files Upload (Supports unlimited videos: >10, >20, >50)
  const handleProcessBatchGalleryVideoFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    try {
      setIsBatchVideoUploading(true);
      const batchVideosToSave: (Omit<import('@/lib/types').VideoItem, 'id'> & { id?: string })[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setBatchVideoUploadProgress(`A processar vídeo ${i + 1} de ${files.length}: ${file.name}...`);
        const cleanTitle = file.name
          .replace(/\.[^/.]+$/, '')
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase());

        if (file.type.startsWith('video/') || file.name.match(/\.(mp4|webm|mov|mkv|ogg|m4v|avi)$/i)) {
          const { thumbnailDataUrl, durationFormatted } = await generateVideoThumbnailAndDuration(file);
          const videoId = 'v-' + Date.now().toString() + '-' + i;
          const blobUrl = await saveVideoFileBlob(videoId, file);

          batchVideosToSave.push({
            id: videoId,
            title: cleanTitle || `Vídeo da Atividade #${data.videos.length + i + 1}`,
            description: 'Registo em vídeo da igreja catedral de amor e fé',
            videoUrl: blobUrl,
            thumbnailUrl: thumbnailDataUrl,
            duration: durationFormatted || '05:00 min',
            category: 'Destaques',
            date: 'Atividade Oficial',
          });

          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('gallery-video-updated', { detail: { id: videoId, blobUrl } }));
          }
        } else if (file.type.startsWith('image/')) {
          const imgRes = await processAndOptimizeImage(file, 480, 270, 0.75);
          const videoId = 'v-' + Date.now().toString() + '-' + i;
          batchVideosToSave.push({
            id: videoId,
            title: cleanTitle || `Momento em Vídeo #${data.videos.length + i + 1}`,
            description: 'Registo em destaque',
            videoUrl: imgRes.dataUrl,
            thumbnailUrl: imgRes.dataUrl,
            duration: '03:00 min',
            category: 'Destaques',
            date: 'Atividade Oficial',
          });
        }
      }

      if (batchVideosToSave.length > 0) {
        addBatchVideos(batchVideosToSave);
        await syncNowWithCloud();
        showNotification(`${batchVideosToSave.length} vídeos foram adicionados à galeria e salvos com sucesso! Total: ${data.videos.length + batchVideosToSave.length}`);
      }
    } catch (err) {
      console.error('Error batch processing videos:', err);
      showNotification('Erro ao processar lote de vídeos.');
    } finally {
      setIsBatchVideoUploading(false);
      setBatchVideoUploadProgress(null);
    }
  };

  // Handler for Batch YouTube Links (Allows pasting 5, 10, 20 or more YouTube links at once)
  const handleBatchYouTubeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchYouTubeUrls.trim()) {
      showNotification('Por favor cole um ou mais links do YouTube.');
      return;
    }

    try {
      setIsProcessingBatchYouTube(true);
      const lines = batchYouTubeUrls
        .split(/[\n,;]+/)
        .map((l) => l.trim())
        .filter(Boolean);

      const newBatchItems: (Omit<import('@/lib/types').VideoItem, 'id'> & { id?: string })[] = [];

      lines.forEach((line, idx) => {
        const ytId = extractYouTubeId(line);
        if (ytId) {
          const videoId = 'v-yt-' + Date.now() + '-' + idx;
          newBatchItems.push({
            id: videoId,
            title: `Vídeo Oficial do YouTube #${data.videos.length + idx + 1}`,
            description: 'Transmissão e registo oficial da igreja',
            videoUrl: `https://www.youtube.com/watch?v=${ytId}`,
            thumbnailUrl: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
            duration: '15:00 min',
            category: 'Destaques',
            date: 'Atividade Oficial',
          });
        }
      });

      if (newBatchItems.length === 0) {
        showNotification('Nenhum link de YouTube válido foi detectado. Certifique-se de que são links do tipo https://www.youtube.com/watch?v=... ou https://youtu.be/...');
        return;
      }

      addBatchVideos(newBatchItems);
      await syncNowWithCloud();
      setBatchYouTubeUrls('');
      showNotification(`${newBatchItems.length} novos vídeos do YouTube foram adicionados e salvos na galeria! Total agora: ${data.videos.length + newBatchItems.length}`);
    } catch (err) {
      console.error('Error batch importing YouTube links:', err);
      showNotification('Erro ao importar vídeos do YouTube.');
    } finally {
      setIsProcessingBatchYouTube(false);
    }
  };

  const handleAddVideoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // If the user hasn't chosen or typed a video yet, immediately open the device's video & photo folders!
    if (!newVideo.videoUrl) {
      galleryVideoFileInputRef.current?.click();
      return;
    }

    let embedUrl = newVideo.videoUrl.trim();
    let thumbUrl = newVideo.thumbnailUrl ? newVideo.thumbnailUrl.trim() : '';

    const ytId = extractYouTubeId(embedUrl);
    if (ytId) {
      embedUrl = `https://www.youtube.com/watch?v=${ytId}`;
      if (!thumbUrl || thumbUrl.includes('unsplash')) {
        thumbUrl = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
      }
    }

    if (!thumbUrl) {
      thumbUrl = 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&w=800&q=80';
    }

    const titleToUse = newVideo.title.trim() || (ytId ? 'Vídeo do YouTube' : 'Momento em Destaque');
    const finalVideoId = uploadedGalleryVideoId || ('v-' + Date.now().toString());

    if (replaceOldVideosOnUpload) {
      clearAllOldVideos();
    }

    addVideo({
      ...newVideo,
      id: finalVideoId,
      title: titleToUse,
      videoUrl: embedUrl,
      thumbnailUrl: thumbUrl,
    });

    if (setAsHeroVideoOnUpload) {
      await clearHeroVideoBlob().catch(() => {});
      updateCurrentActivity({ heroVideo: embedUrl });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('hero-video-updated', { detail: { blobUrl: embedUrl } }));
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gallery-video-updated', { detail: { id: finalVideoId, blobUrl: embedUrl } }));
    }

    // Force instant cloud sync so all browsers and devices get this video immediately
    await syncNowWithCloud();

    setUploadedGalleryVideoId(null);
    setNewVideo({
      title: '',
      description: '',
      thumbnailUrl: '',
      videoUrl: '',
      duration: '05:00 min',
      category: 'Destaques',
      date: 'Atividade Oficial',
    });
    setUploadedGalleryVideoMeta(null);
    showNotification(
      setAsHeroVideoOnUpload
        ? `Vídeo "${titleToUse}" publicado com sucesso na Galeria e no Cabeçalho (Hero)!`
        : `Vídeo "${titleToUse}" publicado com sucesso na Galeria do site!`
    );
  };

  const handleAddEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date) return;
    addUpcomingEvent(newEvent);
    setNewEvent({
      title: '',
      category: 'Geral',
      date: '',
      time: '19h00',
      location: 'Templo Central',
      description: '',
      fullDetails: '',
      imageUrl: 'https://images.unsplash.com/photo-1519834785169-98be25ec3f84?auto=format&fit=crop&w=800&q=80',
      speaker: 'Conselho Pastoral',
      featured: false,
    });
    showNotification('Nova atividade cadastrada com sucesso!');
  };

  const handleStartEditEvent = (event: ChurchEvent) => {
    setEditingEventId(event.id);
    setEditingEventForm({ ...event });
  };

  const handleCancelEditEvent = () => {
    setEditingEventId(null);
    setEditingEventForm(null);
  };

  const handleSaveEditedEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEventId || !editingEventForm) return;
    if (!editingEventForm.title.trim() || !editingEventForm.date.trim()) {
      showNotification('Por favor preencha o título e a data da atividade.');
      return;
    }

    updateUpcomingEvent(editingEventId, editingEventForm);
    showNotification(`Atividade "${editingEventForm.title}" atualizada com sucesso e salva permanentemente!`);
    setEditingEventId(null);
    setEditingEventForm(null);
  };

  // Handlers for Testimonies (Upload Avatar, Create, Edit, Delete)
  const handleProcessTestimonyAvatarFile = async (file: File, isEditMode = false) => {
    if (!file) return;
    try {
      if (isEditMode) {
        setIsEditTestimonyAvatarUploading(true);
      } else {
        setIsTestimonyAvatarUploading(true);
      }
      const result = await processAndOptimizeImage(file, 400, 400, 0.85);
      if (isEditMode) {
        setEditingTestimonyForm((prev) => prev ? { ...prev, avatarUrl: result.dataUrl } : null);
      } else {
        setNewTestimony((prev) => ({ ...prev, avatarUrl: result.dataUrl }));
      }
      showNotification(`Foto de ${file.name} carregada e otimizada com sucesso!`);
    } catch (err) {
      console.error('Error uploading testimony photo:', err);
      showNotification('Erro ao carregar a foto. Verifique se é uma imagem válida.');
    } finally {
      setIsTestimonyAvatarUploading(false);
      setIsEditTestimonyAvatarUploading(false);
    }
  };

  const handleAddTestimonySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTestimony.name.trim() || !newTestimony.content.trim()) {
      showNotification('Por favor, preencha o nome da pessoa e o texto do testemunho.');
      return;
    }

    addTestimony({
      name: newTestimony.name.trim(),
      role: newTestimony.role.trim() || 'Membro da Igreja',
      avatarUrl: newTestimony.avatarUrl.trim() || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop&crop=faces&q=80',
      content: newTestimony.content.trim(),
      activityName: newTestimony.activityName.trim() || data.currentActivity?.name || 'Culto da Catedral',
      date: newTestimony.date.trim() || 'Agosto de 2026',
    });

    setNewTestimony({
      name: '',
      role: 'Membro da Catedral',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop&crop=faces&q=80',
      content: '',
      activityName: data.currentActivity?.name || 'Culto da Família',
      date: 'Agosto de 2026',
    });

    showNotification('Testemunho publicado e salvo permanentemente!');
  };

  const handleStartEditTestimony = (testimony: Testimony) => {
    setEditingTestimonyId(testimony.id);
    setEditingTestimonyForm({ ...testimony });
  };

  const handleCancelEditTestimony = () => {
    setEditingTestimonyId(null);
    setEditingTestimonyForm(null);
  };

  const handleSaveEditedTestimony = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTestimonyId || !editingTestimonyForm) return;
    if (!editingTestimonyForm.name.trim() || !editingTestimonyForm.content.trim()) {
      showNotification('Por favor, preencha o nome e o testemunho.');
      return;
    }

    updateTestimony(editingTestimonyId, editingTestimonyForm);
    showNotification(`Testemunho de "${editingTestimonyForm.name}" atualizado com sucesso!`);
    setEditingTestimonyId(null);
    setEditingTestimonyForm(null);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput.trim() === 'CAF2026') {
      setIsAuthenticated(true);
      setPasswordError(false);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('caf_admin_authenticated', 'true');
      }
    } else {
      setPasswordError(true);
    }
  };

  const handleLogoutAdmin = () => {
    setIsAuthenticated(false);
    setPasswordInput('');
    setPasswordError(false);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('caf_admin_authenticated');
    }
  };

  // Se não estiver autenticado, exibir tela de senha com campo oculto / mascarado
  if (!isAuthenticated) {
    return (
      <div
        id="admin-management-modal"
        className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      >
        <div className="relative w-full max-w-md bg-[#FDFDFC] rounded-sm overflow-hidden border border-neutral-300 shadow-2xl p-6 sm:p-8 space-y-6">
          <button
            onClick={() => setIsAdminOpen(false)}
            aria-label="Fechar"
            className="absolute top-4 right-4 p-2 rounded-sm text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="text-center space-y-2 pt-2">
            <div className="w-12 h-12 rounded-sm bg-[#1A1A1A] text-[#C5A059] flex items-center justify-center mx-auto shadow-md">
              <Lock className="w-6 h-6 stroke-[1.8]" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold font-editorial text-neutral-900 tracking-tight">
              Área Restrita do Administrador
            </h3>
            <p className="text-xs text-neutral-500 font-light max-w-xs mx-auto">
              Digite a senha autorizada para gerenciar publicações e configurações da igreja.
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-700 block mb-1.5 flex items-center justify-between">
                <span>Senha de Segurança</span>
                <span className="text-[9px] text-neutral-400 font-normal">Acesso Protegido</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  autoFocus
                  placeholder="••••••••••••"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    if (passwordError) setPasswordError(false);
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-sm bg-white border text-sm text-neutral-900 tracking-widest focus:outline-none transition-colors ${
                    passwordError 
                      ? 'border-red-500 ring-1 ring-red-500' 
                      : 'border-neutral-300 focus:border-black'
                  }`}
                />
              </div>

              {passwordError && (
                <div className="mt-2 p-2.5 rounded-sm bg-red-50 border border-red-200 text-[11px] text-red-700 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                  <span>Senha incorreta. Acesso negado.</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setIsAdminOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-sm border border-neutral-300 text-xs font-bold uppercase tracking-wider text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 px-4 rounded-sm bg-[#1A1A1A] hover:bg-black text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow"
              >
                <KeyRound className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>Entrar</span>
              </button>
            </div>
          </form>

          <div className="pt-2 border-t border-neutral-100 text-center">
            <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-mono flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Ambiente Seguro • Catedral de Amor e Fé
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id="admin-management-modal"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-5xl bg-[#FDFDFC] rounded-sm overflow-hidden border border-neutral-300 shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border-b border-neutral-200 bg-white gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-sm bg-[#1A1A1A] flex items-center justify-center text-[#C5A059] shrink-0">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-editorial italic text-neutral-900">
                  Painel de Gestão & Configuração do Portal
                </h2>
                <span className="text-[9px] px-2 py-0.5 rounded-sm bg-[#C5A059]/15 text-[#C5A059] uppercase font-bold tracking-widest border border-[#C5A059]/30">
                  Administrador
                </span>
                {isQuotaExceeded || syncState === 'quota_exceeded' ? (
                  <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-sm bg-amber-50 text-amber-800 font-semibold border border-amber-300">
                    <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                    <span>Modo Local Ativo (Cota Firebase Excedida)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-sm bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                    <Database className="w-2.5 h-2.5 text-emerald-600" />
                    <span>Firebase: {firebaseProjectId}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 font-light mt-0.5">
                {isQuotaExceeded || syncState === 'quota_exceeded' ? (
                  <span>Todas as alterações são salvas localmente no seu navegador e não serão perdidas.</span>
                ) : (
                  <span>Os dados são sincronizados no Google Cloud Firestore do projeto <strong>{firebaseProjectId}</strong>.</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={handleClearAllToBlank}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-wider bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 transition-colors cursor-pointer"
              title="Esvaziar todos os campos do site para começar do zero"
            >
              <Trash2 className="w-3 h-3 text-rose-600" />
              <span className="hidden sm:inline">Esvaziar Todos os Campos</span>
              <span className="sm:hidden">Esvaziar</span>
            </button>

            <button
              onClick={async () => {
                await syncNowWithCloud();
                if (!isQuotaExceeded) {
                  showNotification('Sincronização com Firebase Firestore concluída com sucesso!');
                } else {
                  showNotification('A cota diária gratuita do Firebase ainda está no limite. Alterações salvas localmente.');
                }
              }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer border ${
                isQuotaExceeded || syncState === 'quota_exceeded'
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-neutral-100 hover:bg-[#C5A059]/15 hover:text-[#91712f] text-neutral-700 border-neutral-200'
              }`}
              title="Testar ou forçar sincronização com Firebase"
            >
              <RefreshCw className={`w-3 h-3 ${syncState === 'syncing' ? 'animate-spin text-[#C5A059]' : ''}`} />
              <span className="hidden sm:inline">
                {syncState === 'syncing' ? 'A Sincronizar...' : 'Sincronizar Cloud'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleLogoutAdmin}
              className="p-2 rounded-sm bg-neutral-100 hover:bg-red-50 text-neutral-600 hover:text-red-700 transition-colors cursor-pointer border border-neutral-200"
              title="Bloquear painel / Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setIsAdminOpen(false)}
              className="p-2 rounded-sm bg-neutral-100 hover:bg-neutral-200 text-neutral-700 hover:text-black transition-colors cursor-pointer"
              title="Fechar janela"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quota Exceeded Warning Banner */}
        {(isQuotaExceeded || syncState === 'quota_exceeded') && (
          <div className="bg-amber-50/90 border-b border-amber-200 px-6 py-3 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-950">
                  Cota Diária Gratuita do Firestore Atingida (Free Tier - Spark)
                </p>
                <p className="text-amber-800 text-[11px] mt-0.5 leading-relaxed">
                  O limite diário de 20.000 gravações gratuitas foi atingido. O site está a funcionar perfeitamente com <strong>salvamento local (localStorage)</strong> para não perder nenhum dado. A cota gratuita renova-se automaticamente a cada 24h (à meia-noite PST).
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-center flex-shrink-0">
              <a
                href={firebaseConsoleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-sm bg-amber-200/80 hover:bg-amber-300 text-amber-950 text-[10px] font-bold uppercase tracking-wider transition-colors"
              >
                <span>Console Firebase</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 flex items-center gap-2 text-emerald-800 text-xs font-semibold animate-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 p-3 bg-neutral-50 border-b border-neutral-200 overflow-x-auto">
          {[
            { id: 'activity', label: 'Atividade Principal', icon: Sparkles },
            { id: 'church', label: 'Logotipo & Identidade', icon: Church },
            { id: 'highlights', label: `Destaques (${data.highlights.length})`, icon: Star },
            { id: 'photos', label: `Fotos (${data.photos.length})`, icon: ImageIcon },
            { id: 'videos', label: `Vídeos (${data.videos.length})`, icon: Video },
            { id: 'events', label: `Próximas Atividades (${data.upcomingEvents.length})`, icon: Calendar },
            { id: 'coordinations', label: `Coordenações (${data.coordinations?.length || 0})`, icon: Users },
            { id: 'testimonies', label: `Testemunhos (${data.testimonies?.length || 0})`, icon: MessageSquareHeart },
            { id: 'social', label: `Redes Sociais & Links (${data.socialLinks?.length || 0})`, icon: Share2 },
            { id: 'cloud', label: 'Nuvem & Vercel', icon: Globe },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                id={`admin-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#1A1A1A] text-white shadow-sm'
                    : 'text-neutral-600 hover:bg-neutral-200/70 hover:text-black'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
          {/* TAB 1: ATIVIDADE PRINCIPAL */}
          {activeTab === 'activity' && (
            <form onSubmit={handleSaveActivity} className="space-y-4">
              <div className="p-3.5 rounded-sm bg-[#C5A059]/10 border border-[#C5A059]/20 text-xs text-neutral-800 mb-4 font-light">
                Edite os dados que aparecem no Hero e na seção &quot;Sobre a Atividade&quot;. As alterações afetam imediatamente a contagem regressiva e os destaques.
              </div>

              {/* SEÇÃO DEDICADA: FAIXA / TEXTO DE DESTAQUE SUPERIOR DO HERO */}
              <div className="p-4 rounded-sm bg-neutral-900 text-white border border-neutral-700 space-y-3 mb-4 shadow-sm">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#C5A059]" />
                    <label className="text-xs font-bold uppercase tracking-widest text-white">
                      Texto em Destaque no Topo do Hero (Faixa Dourada / Eyebrow)
                    </label>
                  </div>
                  <span className="text-[9px] uppercase tracking-wider bg-[#C5A059]/20 text-[#C5A059] px-2 py-0.5 rounded font-bold border border-[#C5A059]/40">
                    Cabeçalho Principal
                  </span>
                </div>

                <p className="text-[11px] text-neutral-300 font-light leading-relaxed">
                  Este é o texto exibido em letras maiúsculas douradas logo acima do título principal no Hero do site.
                </p>

                {/* Live Preview of the Golden Eyebrow Badge */}
                <div className="p-3 bg-black/60 rounded-sm border border-neutral-800 flex items-center justify-center text-center">
                  <span className="text-[#C5A059] text-[11px] sm:text-xs font-bold tracking-[0.3em] uppercase flex items-center gap-2 drop-shadow-xs">
                    <Sparkles className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
                    <span className="truncate">
                      {activityForm.heroEyebrow || 'EVENTO ESPECIAL DO ANO — IGREJA CATEDRAL DE AMOR E FÉ'}
                    </span>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-300 block mb-1">
                      Texto Completo da Faixa do Hero *
                    </label>
                    <input
                      type="text"
                      value={activityForm.heroEyebrow || ''}
                      onChange={(e) => setActivityForm({ ...activityForm, heroEyebrow: e.target.value })}
                      placeholder="Ex: EVENTO ESPECIAL DO ANO — IGREJA CATEDRAL DE AMOR E FÉ"
                      className="w-full px-3 py-2 rounded-sm bg-neutral-800 border border-neutral-600 text-xs text-white focus:outline-none focus:border-[#C5A059] font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-300 block mb-1">
                      Etiqueta / Badge Curto
                    </label>
                    <input
                      type="text"
                      value={activityForm.badge || ''}
                      onChange={(e) => setActivityForm({ ...activityForm, badge: e.target.value })}
                      placeholder="Ex: Evento Especial do Ano"
                      className="w-full px-3 py-2 rounded-sm bg-neutral-800 border border-neutral-600 text-xs text-white focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>
                </div>
              </div>

              {/* SEÇÃO DEDICADA: TÍTULO PRINCIPAL E SUBTÍTULO DO HERO */}
              <div className="p-4 rounded-sm bg-neutral-900 text-white border border-neutral-700 space-y-3 mb-4 shadow-sm">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#C5A059]" />
                    <label className="text-xs font-bold uppercase tracking-widest text-white">
                      Título Principal & Subtítulo do Hero (Destaque Central)
                    </label>
                  </div>
                  <span className="text-[9px] uppercase tracking-wider bg-[#C5A059]/20 text-[#C5A059] px-2 py-0.5 rounded font-bold border border-[#C5A059]/40">
                    Centro do Hero
                  </span>
                </div>

                <p className="text-[11px] text-neutral-300 font-light leading-relaxed">
                  Edite o título de grande impacto e o subtítulo descritivo exibidos no centro do Hero da página inicial.
                </p>

                {/* Live Preview of Title and Subtitle */}
                <div className="p-4 bg-black/80 rounded-sm border border-neutral-800 text-center space-y-2">
                  <h2 className="text-white text-xl sm:text-2xl font-editorial italic font-normal tracking-tight leading-tight max-w-xl mx-auto drop-shadow-md">
                    {activityForm.name || 'GRANDE CONFERÊNCIA RENOVO'}
                  </h2>
                  <p className="text-neutral-300 text-xs font-light max-w-md mx-auto leading-relaxed truncate">
                    {activityForm.subtitle || 'Um momento de fé, comunhão, transformação e celebração.'}
                  </p>
                </div>

                <div className="space-y-3 pt-1">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-300 block mb-1">
                      Título Principal da Atividade / Conferência *
                    </label>
                    <input
                      type="text"
                      value={activityForm.name}
                      onChange={(e) => setActivityForm({ ...activityForm, name: e.target.value })}
                      placeholder="Ex: GRANDE CONFERÊNCIA RENOVO ou CRUZADA DE CURAS E MILAGRES"
                      className="w-full px-3 py-2.5 rounded-sm bg-neutral-800 border border-neutral-600 text-sm text-white focus:outline-none focus:border-[#C5A059] font-serif"
                      required
                    />
                    <span className="text-[10px] text-neutral-400 mt-0.5 block">
                      Exibido em fonte editorial itálica e grande formato no topo da página.
                    </span>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-300 block mb-1">
                      Subtítulo / Frase de Impacto *
                    </label>
                    <textarea
                      rows={2}
                      value={activityForm.subtitle}
                      onChange={(e) => setActivityForm({ ...activityForm, subtitle: e.target.value })}
                      placeholder="Ex: Um momento de fé, comunhão, transformação e celebração."
                      className="w-full px-3 py-2 rounded-sm bg-neutral-800 border border-neutral-600 text-xs text-white focus:outline-none focus:border-[#C5A059]"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-700 block mb-1">
                    Data e Hora para a Contagem Regressiva (ISO Formato)
                  </label>
                  <input
                    type="datetime-local"
                    value={activityForm.date.slice(0, 16)}
                    onChange={(e) => setActivityForm({ ...activityForm, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-sm bg-neutral-50 border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-black"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-700 block mb-1">
                    Texto Exibido da Data (Ex: 25 a 28 de Setembro)
                  </label>
                  <input
                    type="text"
                    value={activityForm.formattedDate}
                    onChange={(e) => setActivityForm({ ...activityForm, formattedDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-sm bg-neutral-50 border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-black"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-700 block mb-1">
                    Horário Detalhado
                  </label>
                  <input
                    type="text"
                    value={activityForm.time}
                    onChange={(e) => setActivityForm({ ...activityForm, time: e.target.value })}
                    className="w-full px-3 py-2 rounded-sm bg-neutral-50 border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-black"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-700 block mb-1">
                    Local / Templo
                  </label>
                  <input
                    type="text"
                    value={activityForm.location}
                    onChange={(e) => setActivityForm({ ...activityForm, location: e.target.value })}
                    className="w-full px-3 py-2 rounded-sm bg-neutral-50 border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-black"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-700 block mb-1">
                    Tema da Atividade
                  </label>
                  <input
                    type="text"
                    value={activityForm.theme}
                    onChange={(e) => setActivityForm({ ...activityForm, theme: e.target.value })}
                    className="w-full px-3 py-2 rounded-sm bg-neutral-50 border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-black"
                    required
                  />
                </div>

                {/* SEÇÃO DEDICADA: ESCOLHER VÍDEO DE FUNDO DO HERO */}
                <div className="md:col-span-2 p-4 rounded-sm bg-neutral-50 border-2 border-dashed border-neutral-300 hover:border-black transition-colors space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Film className="w-4 h-4 text-[#C5A059]" />
                        <label className="text-xs font-bold uppercase tracking-widest text-neutral-900">
                          Vídeo de Fundo da Atividade Principal
                        </label>
                      </div>
                      <p className="text-[11px] text-neutral-500 font-light mt-0.5">
                        Clique em &quot;Escolher Vídeo&quot; para selecionar um ficheiro de vídeo do seu computador/celular. O vídeo é carregado e começa a funcionar imediatamente na página!
                      </p>
                    </div>

                    {activityForm.heroVideo && (
                      <button
                        type="button"
                        onClick={handleClearCustomVideo}
                        className="text-[10px] uppercase tracking-wider text-neutral-600 hover:text-red-600 flex items-center gap-1 font-semibold cursor-pointer whitespace-nowrap self-start sm:self-auto"
                        title="Restaurar vídeo padrão"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Restaurar Padrão</span>
                      </button>
                    )}
                  </div>

                  {/* Hidden Native File Input */}
                  <input
                    ref={videoFileInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/ogg,video/quicktime,video/m4v,video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleProcessVideoFile(file);
                      }
                    }}
                    className="hidden"
                  />

                  {/* Drag and Drop & Button Area */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingVideo(true);
                    }}
                    onDragLeave={() => setIsDraggingVideo(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingVideo(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) {
                        handleProcessVideoFile(file);
                      }
                    }}
                    className={`p-5 rounded-sm flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                      isDraggingVideo 
                        ? 'bg-[#C5A059]/20 border-2 border-[#C5A059]' 
                        : 'bg-white border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50/50 shadow-sm'
                    }`}
                    onClick={() => videoFileInputRef.current?.click()}
                  >
                    <div className="w-12 h-12 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center mb-3 shadow-md">
                      {isVideoProcessing ? (
                        <RefreshCw className="w-5 h-5 animate-spin text-[#C5A059]" />
                      ) : (
                        <FolderOpen className="w-5 h-5 text-[#C5A059]" />
                      )}
                    </div>

                    <button
                      type="button"
                      id="btn-escolher-video-pasta"
                      disabled={isVideoProcessing}
                      className="px-5 py-2.5 bg-[#1A1A1A] text-white hover:bg-black rounded-sm text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm mb-2 cursor-pointer transition-all"
                    >
                      <FolderOpen className="w-4 h-4 text-[#C5A059]" />
                      <span>{isVideoProcessing ? 'A carregar ficheiro...' : 'Escolher Vídeo (Abrir Pasta)'}</span>
                    </button>

                    <p className="text-[11px] text-neutral-600 font-medium">
                      ou arraste o ficheiro de vídeo diretamente para aqui
                    </p>
                    <span className="text-[10px] text-neutral-400 mt-1">
                      Formatos suportados: MP4, WebM, MOV, OGG (reprodução contínua otimizada)
                    </span>
                  </div>

                  {/* Active Video Status & Mini Player */}
                  {activityForm.heroVideo && (
                    <div className="p-3 bg-white rounded-sm border border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="w-24 h-14 bg-black rounded-sm overflow-hidden flex-shrink-0 relative border border-neutral-300">
                          {isYouTubeVideoUrl(activityForm.heroVideo) ? (
                            <iframe
                              src={formatYouTubeEmbedUrl(activityForm.heroVideo, false)}
                              className="w-full h-full border-0 pointer-events-none scale-110"
                              title="Preview do Vídeo YouTube"
                            />
                          ) : (
                            <video
                              src={activityForm.heroVideo}
                              autoPlay
                              loop
                              muted
                              playsInline
                              className="w-full h-full object-cover"
                            />
                          )}
                          <div className="absolute top-1 right-1 bg-emerald-500 w-2 h-2 rounded-full animate-ping" />
                        </div>
                        <div className="overflow-hidden">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                            <span className="truncate">
                              {isYouTubeVideoUrl(activityForm.heroVideo)
                                ? 'Vídeo do YouTube Ativo no Hero'
                                : (uploadedVideoName || 'Vídeo Ativo em Reprodução no Hero')}
                            </span>
                          </div>
                          {uploadedVideoSize && !isYouTubeVideoUrl(activityForm.heroVideo) && (
                            <span className="text-[10px] text-neutral-500 block">
                              Tamanho: {uploadedVideoSize} • Armazenado e sincronizado localmente
                            </span>
                          )}
                          <span className="text-[10px] text-emerald-700 font-medium block">
                            ● Já a funcionar na página principal e sincronizado em todos os aparelhos
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsAdminOpen(false);
                          const el = document.querySelector('#inicio');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="w-full sm:w-auto px-3.5 py-1.5 bg-[#C5A059] text-white hover:bg-[#B58E45] rounded-sm text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Ver no Hero</span>
                      </button>
                    </div>
                  )}

                  {/* Presets and URL Fallback Option */}
                  <div className="pt-3 border-t border-neutral-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-800 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                        Vídeos Oficiais em Nuvem (Sincronização Instantânea em Todos os Telemóveis):
                      </span>
                    </div>

                    <div className="p-2.5 bg-neutral-100/70 border border-neutral-200 rounded-sm">
                      <p className="text-[10px] text-neutral-600 font-light mb-2">
                        💡 <strong>Sincronização Global</strong>: Ao escolher qualquer vídeo abaixo ou inserir um link do YouTube / MP4, a alteração é aplicada <strong>imediatamente em todos os telemóveis e computadores</strong> sem necessidade de publicar em cada aparelho separadamente.
                      </p>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSelectPresetVideo('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 'Louvor & Culto Congregacional')}
                          className="px-2 py-1.5 rounded-sm bg-white hover:bg-[#C5A059] hover:text-white border border-neutral-300 text-[10px] text-neutral-800 font-semibold transition-all cursor-pointer text-center"
                        >
                          🙏 Louvor & Adoração
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectPresetVideo('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'Velas & Vigília de Fé')}
                          className="px-2 py-1.5 rounded-sm bg-white hover:bg-[#C5A059] hover:text-white border border-neutral-300 text-[10px] text-neutral-800 font-semibold transition-all cursor-pointer text-center"
                        >
                          🕯️ Vigília & Oração
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectPresetVideo('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 'Coral & Celebração')}
                          className="px-2 py-1.5 rounded-sm bg-white hover:bg-[#C5A059] hover:text-white border border-neutral-300 text-[10px] text-neutral-800 font-semibold transition-all cursor-pointer text-center"
                        >
                          🎶 Coral & Impacto
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectPresetVideo('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', 'Cruzada & Evangelismo')}
                          className="px-2 py-1.5 rounded-sm bg-white hover:bg-[#C5A059] hover:text-white border border-neutral-300 text-[10px] text-neutral-800 font-semibold transition-all cursor-pointer text-center"
                        >
                          🔥 Cruzada & Fé
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="url"
                        value={activityForm.heroVideo || ''}
                        onChange={(e) => {
                          const url = e.target.value;
                          setActivityForm({ ...activityForm, heroVideo: url });
                          if (url) {
                            updateCurrentActivity({ heroVideo: url.trim() });
                          }
                        }}
                        placeholder="Cole a URL do YouTube (ex: https://youtu.be/... ou https://youtube.com/watch?v=...) ou .mp4"
                        className="flex-1 px-3 py-2 rounded-sm bg-white border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-black"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          if (activityForm.heroVideo) {
                            const trimmedUrl = activityForm.heroVideo.trim();
                            await clearHeroVideoBlob();
                            updateCurrentActivity({ heroVideo: trimmedUrl });
                            syncNowWithCloud();
                            if (typeof window !== 'undefined') {
                              window.dispatchEvent(new CustomEvent('hero-video-updated', { detail: { blobUrl: trimmedUrl } }));
                            }
                            showNotification('Vídeo do YouTube/Hero configurado e sincronizado com sucesso para todos os navegadores!');
                          }
                        }}
                        className="px-3.5 py-2 bg-[#1A1A1A] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-wider rounded-sm transition-colors cursor-pointer"
                      >
                        Aplicar
                      </button>
                    </div>
                  </div>
                </div>

                {/* SEÇÃO DEDICADA: ESCOLHER IMAGEM DE CAPA DO HERO */}
                <div className="md:col-span-2 p-4 rounded-sm bg-neutral-50 border border-neutral-300 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Camera className="w-4 h-4 text-[#C5A059]" />
                        <label className="text-xs font-bold uppercase tracking-widest text-neutral-900">
                          Imagem de Fundo / Poster de Capa da Atividade
                        </label>
                      </div>
                      <p className="text-[11px] text-neutral-500 font-light mt-0.5">
                        Carregue uma fotografia da sua galeria ou do computador/celular. A imagem será comprimida em alta definição e exibida no Hero.
                      </p>
                    </div>

                    <input
                      type="file"
                      ref={heroImageFileInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleProcessHeroImageFile(file);
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => heroImageFileInputRef.current?.click()}
                      disabled={isHeroImageUploading}
                      className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#C5A059] text-white rounded-sm text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm cursor-pointer transition-all whitespace-nowrap"
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>{isHeroImageUploading ? 'A Carregar Imagem...' : 'Carregar Foto de Capa'}</span>
                    </button>
                  </div>

                  {/* Active Hero Image Preview */}
                  {activityForm.heroImage && (
                    <div className="p-3 bg-white rounded-sm border border-neutral-200 flex items-center gap-3">
                      <div className="w-20 h-14 bg-neutral-100 rounded-sm overflow-hidden flex-shrink-0 relative border border-neutral-300">
                        <Image
                          src={activityForm.heroImage}
                          alt="Poster da Atividade"
                          width={80}
                          height={56}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                          <span className="truncate">Foto de Capa Ativa</span>
                        </div>
                        <input
                          type="url"
                          value={activityForm.heroImage}
                          onChange={(e) => setActivityForm({ ...activityForm, heroImage: e.target.value })}
                          placeholder="Ou insira a URL direta da imagem"
                          className="mt-1 w-full px-2.5 py-1 rounded-sm bg-neutral-50 border border-neutral-300 text-[11px] text-neutral-700"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-700 block mb-1">
                    Organização Responsável
                  </label>
                  <input
                    type="text"
                    value={activityForm.organization}
                    onChange={(e) => setActivityForm({ ...activityForm, organization: e.target.value })}
                    className="w-full px-3 py-2 rounded-sm bg-neutral-50 border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-700 block mb-1">
                    Público-Alvo
                  </label>
                  <input
                    type="text"
                    value={activityForm.targetAudience}
                    onChange={(e) => setActivityForm({ ...activityForm, targetAudience: e.target.value })}
                    className="w-full px-3 py-2 rounded-sm bg-neutral-50 border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-black"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-700 block mb-1">
                    Objetivo da Atividade
                  </label>
                  <textarea
                    rows={2}
                    value={activityForm.goal}
                    onChange={(e) => setActivityForm({ ...activityForm, goal: e.target.value })}
                    className="w-full px-3 py-2 rounded-sm bg-neutral-50 border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-black"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-700 block mb-1">
                    Informações Importantes / Avisos
                  </label>
                  <textarea
                    rows={2}
                    value={activityForm.importantNotes}
                    onChange={(e) => setActivityForm({ ...activityForm, importantNotes: e.target.value })}
                    className="w-full px-3 py-2 rounded-sm bg-neutral-50 border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-sm font-bold text-[10px] uppercase tracking-widest text-white bg-[#1A1A1A] hover:bg-[#C5A059] transition-all shadow-sm cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: GERENCIAR MOMENTOS EM DESTAQUE */}
          {activeTab === 'highlights' && (
            <AdminHighlightsTab
              highlights={data.highlights}
              addHighlight={addHighlight}
              updateHighlight={updateHighlight}
              removeHighlight={removeHighlight}
              resetHighlightsToDefaults={resetHighlightsToDefaults}
              syncNowWithCloud={syncNowWithCloud}
              showNotification={showNotification}
            />
          )}

          {/* TAB 3: GERENCIAR FOTOS */}
          {activeTab === 'photos' && (
            <div className="space-y-6">
              {/* HIDDEN FILE INPUTS */}
              <input
                type="file"
                ref={photoFileInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleProcessGalleryPhotoFile(file);
                }}
              />
              <input
                type="file"
                ref={photoBatchFileInputRef}
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = e.target.files;
                  if (files && files.length > 0) handleProcessBatchGalleryPhotos(files);
                }}
              />

              {/* CARD DE CARREGAMENTO DIRETO DA GALERIA DO DISPOSITIVO */}
              <div 
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingPhoto(true);
                }}
                onDragLeave={() => setIsDraggingPhoto(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingPhoto(false);
                  const files = e.dataTransfer.files;
                  if (files && files.length > 1) {
                    handleProcessBatchGalleryPhotos(files);
                  } else if (files && files[0]) {
                    handleProcessGalleryPhotoFile(files[0]);
                  }
                }}
                className={`p-6 rounded-sm border-2 border-dashed transition-all text-center ${
                  isDraggingPhoto
                    ? 'border-[#C5A059] bg-[#C5A059]/10'
                    : 'border-neutral-300 bg-neutral-50/80 hover:border-black'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-neutral-200 flex items-center justify-center mx-auto mb-3 text-[#C5A059]">
                  {isPhotoUploading || isBatchPhotoUploading ? (
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  ) : (
                    <Camera className="w-6 h-6" />
                  )}
                </div>

                <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-widest mb-1">
                  Carregar Fotografias para a Galeria
                </h3>
                <p className="text-xs text-neutral-600 max-w-md mx-auto mb-4 font-light">
                  Selecione fotos do seu telemóvel, computador ou arraste os ficheiros diretamente para esta área. As imagens são otimizadas e publicadas na cloud do Firebase.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    id="btn-escolher-foto-galeria"
                    onClick={() => photoFileInputRef.current?.click()}
                    disabled={isPhotoUploading || isBatchPhotoUploading}
                    className="px-5 py-2.5 bg-[#1A1A1A] hover:bg-[#C5A059] text-white rounded-sm text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm cursor-pointer transition-all"
                  >
                    <FolderOpen className="w-4 h-4 text-[#C5A059]" />
                    <span>{isPhotoUploading ? 'A Otimizar Foto...' : 'Escolher Foto (Abrir Galeria/Pastas)'}</span>
                  </button>

                  <button
                    type="button"
                    id="btn-lote-fotos-galeria"
                    onClick={() => photoBatchFileInputRef.current?.click()}
                    disabled={isPhotoUploading || isBatchPhotoUploading}
                    className="px-4 py-2.5 bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 rounded-sm text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm cursor-pointer transition-all"
                  >
                    <Layers className="w-4 h-4 text-neutral-600" />
                    <span>{isBatchPhotoUploading ? 'A Carregar Lote...' : 'Carregar Múltiplas Fotos (Lote)'}</span>
                  </button>
                </div>
              </div>

              {/* FORMULÁRIO DE PUBLICAÇÃO DE FOTO COM PRÉ-VISUALIZAÇÃO */}
              <form onSubmit={handleAddPhotoSubmit} className="p-5 rounded-sm bg-white border border-neutral-200 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                  <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-widest flex items-center gap-2">
                    <Plus className="w-3.5 h-3.5 text-[#C5A059]" /> Detalhes da Fotografia a Publicar
                  </h4>
                  {newPhoto.imageUrl && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-sm flex items-center gap-1">
                      <Check className="w-3 h-3" /> Imagem Carregada Pronta
                    </span>
                  )}
                </div>

                {/* Live Photo Preview if Image is Loaded */}
                {newPhoto.imageUrl && (
                  <div className="p-3 bg-neutral-50 rounded-sm border border-neutral-200 flex items-center gap-4">
                    <div className="w-20 h-20 bg-neutral-200 rounded-sm overflow-hidden flex-shrink-0 relative border border-neutral-300">
                      <Image
                        src={newPhoto.imageUrl}
                        alt="Pré-visualização"
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-xs font-bold text-neutral-900 truncate">
                        {newPhoto.title || 'Foto sem título'}
                      </p>
                      {uploadedPhotoMeta && (
                        <p className="text-[11px] text-neutral-500">
                          Arquivo: {uploadedPhotoMeta.name} • {uploadedPhotoMeta.size}
                        </p>
                      )}
                      <p className="text-[10px] text-emerald-700 font-medium mt-0.5">
                        ● Pronta para publicação na Galeria Oficial
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-600 block mb-1">Título da Foto</label>
                    <input
                      type="text"
                      placeholder="Ex: Coral Catedral em Adoração"
                      value={newPhoto.title}
                      onChange={(e) => setNewPhoto({ ...newPhoto, title: e.target.value })}
                      className="w-full px-3 py-2 rounded-sm bg-neutral-50 border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-black"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-600 block mb-1">Categoria</label>
                    <select
                      value={newPhoto.category}
                      onChange={(e) => setNewPhoto({ ...newPhoto, category: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-sm bg-neutral-50 border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-black"
                    >
                      <option value="Louvor">Louvor</option>
                      <option value="Palavra">Palavra</option>
                      <option value="Juventude">Juventude</option>
                      <option value="Comunhão">Comunhão</option>
                      <option value="Famílias">Famílias</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">
                        URL ou Origem da Imagem
                      </label>
                      <button
                        type="button"
                        onClick={() => photoFileInputRef.current?.click()}
                        className="text-[10px] text-[#C5A059] hover:underline font-bold uppercase cursor-pointer"
                      >
                        Carregar Ficheiro da Galeria
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Carregue pelo botão acima ou cole a URL direta da foto"
                      value={newPhoto.imageUrl}
                      onChange={(e) => setNewPhoto({ ...newPhoto, imageUrl: e.target.value })}
                      className="w-full px-3 py-2 rounded-sm bg-neutral-50 border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-black"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-600 block mb-1">Descrição</label>
                    <input
                      type="text"
                      placeholder="Breve relato sobre este momento da igreja..."
                      value={newPhoto.description}
                      onChange={(e) => setNewPhoto({ ...newPhoto, description: e.target.value })}
                      className="w-full px-3 py-2 rounded-sm bg-neutral-50 border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-black"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-2.5 rounded-sm text-xs font-bold uppercase tracking-widest text-white bg-[#1A1A1A] hover:bg-[#C5A059] transition-all shadow-sm cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4" /> 
                    <span>Publicar Fotografia na Galeria</span>
                  </button>
                </div>
              </form>

              {/* Photo List */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">
                  Fotografias Ativas no Site ({data.photos.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {data.photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="p-3 rounded-sm bg-neutral-50 border border-neutral-200 flex items-center justify-between gap-3 hover:border-neutral-300 transition-colors"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <Image
                          src={photo.imageUrl}
                          alt={photo.title}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-sm object-cover flex-shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="truncate">
                          <p className="text-xs font-bold text-neutral-900 truncate">{photo.title}</p>
                          <span className="text-[9px] uppercase tracking-widest text-[#C5A059] font-medium">{photo.category}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          removePhoto(photo.id);
                          showNotification('Foto removida');
                        }}
                        className="p-2 rounded-sm text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Remover"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: GERENCIAR VÍDEOS */}
          {activeTab === 'videos' && (
            <div className="space-y-6">
              {/* HIDDEN GALLERY VIDEO & PHOTO INPUT (SINGLE / SMART MULTI) */}
              <input
                type="file"
                ref={galleryVideoFileInputRef}
                accept="video/*,image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = e.target.files;
                  if (files && files.length > 1) {
                    handleProcessBatchGalleryVideoFiles(files);
                  } else if (files && files[0]) {
                    handleProcessGalleryVideoFile(files[0]);
                  }
                }}
              />

              {/* HIDDEN DEDICATED BATCH VIDEOS INPUT */}
              <input
                type="file"
                ref={galleryBatchVideoFileInputRef}
                accept="video/*,image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = e.target.files;
                  if (files && files.length > 0) {
                    handleProcessBatchGalleryVideoFiles(files);
                  }
                }}
              />

              {/* Informative Multi-Video Support Banner */}
              <div className="p-4 rounded-sm bg-[#C5A059]/10 border border-[#C5A059]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <Film className="w-4 h-4 text-[#C5A059] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                      Suporte Completo a Múltiplos Vídeos na Galeria
                    </h4>
                    <p className="text-xs text-neutral-600 font-light mt-0.5">
                      Pode publicar quantos vídeos desejar. Selecione múltiplos ficheiros de vídeo de uma só vez ou adicione links do YouTube. Todos ficam disponíveis na galeria interativa com player e miniaturas.
                    </p>
                  </div>
                </div>
                <div className="px-2.5 py-1 bg-white/80 rounded-sm border border-[#C5A059]/30 text-[#C5A059] font-bold text-[10px] uppercase tracking-wider shrink-0">
                  {data.videos.length} {data.videos.length === 1 ? 'Vídeo Publicado' : 'Vídeos Publicados'}
                </div>
              </div>

              {/* UPLOAD HERO / FOLDER PICKER ZONE */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingVideo(true);
                }}
                onDragLeave={() => setIsDraggingVideo(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingVideo(false);
                  const files = e.dataTransfer.files;
                  if (files && files.length > 1) {
                    handleProcessBatchGalleryVideoFiles(files);
                  } else if (files && files[0]) {
                    handleProcessGalleryVideoFile(files[0]);
                  }
                }}
                className={`p-6 rounded-sm border-2 border-dashed transition-all text-center ${
                  isDraggingVideo
                    ? 'border-[#C5A059] bg-[#C5A059]/10'
                    : 'border-neutral-300 bg-neutral-50/90 hover:border-neutral-400'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-neutral-200 flex items-center justify-center mx-auto mb-3 text-[#C5A059]">
                  {isGalleryVideoUploading || isBatchVideoUploading ? (
                    <RefreshCw className="w-6 h-6 animate-spin text-[#C5A059]" />
                  ) : (
                    <FolderOpen className="w-6 h-6 text-[#C5A059]" />
                  )}
                </div>

                <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-widest mb-1">
                  Carregar Vídeos das Pastas ou Galeria do Dispositivo
                </h3>
                <p className="text-xs text-neutral-600 max-w-lg mx-auto mb-4 font-light leading-relaxed">
                  Abra as pastas do seu computador ou celular. Suporta carregar <strong>1 vídeo por vez</strong> ou <strong>vários vídeos em lote simultaneamente</strong> (MP4, WebM, MOV) com geração automática de miniaturas e duração.
                </p>

                {isBatchVideoUploading && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-sm text-center max-w-md mx-auto">
                    <RefreshCw className="w-4 h-4 animate-spin text-[#C5A059] mx-auto mb-1" />
                    <p className="text-xs font-bold text-neutral-900">
                      {batchVideoUploadProgress || 'A processar e salvar múltiplos vídeos...'}
                    </p>
                    <span className="text-[10px] text-neutral-500">Por favor aguarde enquanto geramos as miniaturas</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    id="btn-abrir-pastas-videos-fotos"
                    onClick={() => galleryVideoFileInputRef.current?.click()}
                    disabled={isGalleryVideoUploading || isBatchVideoUploading}
                    className="px-5 py-2.5 bg-[#1A1A1A] hover:bg-[#C5A059] text-white rounded-sm text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm cursor-pointer transition-all"
                  >
                    <FolderOpen className="w-4 h-4 text-[#C5A059]" />
                    <span>{isGalleryVideoUploading ? 'A Carregar Ficheiro...' : 'Escolher 1 Vídeo'}</span>
                  </button>

                  <button
                    type="button"
                    id="btn-carregar-lote-videos"
                    onClick={() => galleryBatchVideoFileInputRef.current?.click()}
                    disabled={isGalleryVideoUploading || isBatchVideoUploading}
                    className="px-5 py-2.5 bg-[#C5A059] hover:bg-neutral-900 text-white rounded-sm text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm cursor-pointer transition-all"
                  >
                    <Film className="w-4 h-4 text-white" />
                    <span>{isBatchVideoUploading ? 'A Processar Lote...' : 'Carregar Vários Vídeos (Lote)'}</span>
                  </button>
                </div>
              </div>

              {/* BATCH YOUTUBE IMPORTER FORM (ALLOWS >10, >20 VIDEOS AT ONCE) */}
              <form onSubmit={handleBatchYouTubeSubmit} className="p-5 rounded-sm bg-neutral-50 border border-neutral-200 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                  <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-widest flex items-center gap-2">
                    <Film className="w-4 h-4 text-red-600" /> Publicar Vários Links do YouTube de Uma Só Vez (Lote)
                  </h3>
                  <span className="text-[10px] font-bold text-[#C5A059] uppercase tracking-wider bg-[#C5A059]/10 px-2 py-0.5 rounded">
                    Mais de 10 Vídeos Suportados
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-700">
                      Cole os Links do YouTube (1 link por linha)
                    </label>
                    <span className="text-[10px] text-neutral-400">
                      Ex: https://www.youtube.com/watch?v=... ou https://youtu.be/...
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={batchYouTubeUrls}
                    onChange={(e) => setBatchYouTubeUrls(e.target.value)}
                    placeholder={`https://www.youtube.com/watch?v=ScMzIvxBSi4\nhttps://www.youtube.com/watch?v=ysz5S6PUM-U\nhttps://youtu.be/dQw4w9WgXcQ\nCole quantos links desejar (10, 20, 50 vídeos)...`}
                    className="w-full px-3 py-2 rounded-sm bg-white border border-neutral-300 text-xs font-mono text-neutral-900 focus:outline-none focus:border-black resize-y"
                  />
                  <p className="text-[11px] text-neutral-500 mt-1 font-light">
                    O sistema extrai automaticamente o ID, gera a miniatura oficial em alta resolução e publica todos os vídeos diretamente na galeria do site.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-neutral-500 font-medium">
                    {batchYouTubeUrls.split(/[\n,;]+/).filter((l) => l.trim()).length} link(s) digitado(s)
                  </span>
                  <button
                    type="submit"
                    id="btn-publicar-lote-youtube"
                    disabled={isProcessingBatchYouTube || !batchYouTubeUrls.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-sm text-xs font-bold uppercase tracking-widest text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-all shadow-sm cursor-pointer"
                  >
                    {isProcessingBatchYouTube ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <Film className="w-4 h-4 text-white" />
                    )}
                    <span>{isProcessingBatchYouTube ? 'A Publicar Lote...' : 'Publicar Todos os Vídeos em Lote'}</span>
                  </button>
                </div>
              </form>

              {/* VIDEO DETAILS FORM (SINGLE VIDEO) */}
              <form onSubmit={handleAddVideoSubmit} className="p-5 rounded-sm bg-neutral-50 border border-neutral-200 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                  <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-widest flex items-center gap-2">
                    <Video className="w-4 h-4 text-[#C5A059]" /> Publicar Vídeo Individual ou Link YouTube
                  </h3>
                  <button
                    type="button"
                    onClick={() => galleryVideoFileInputRef.current?.click()}
                    className="text-[11px] text-[#C5A059] hover:underline font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>Escolher das Pastas</span>
                  </button>
                </div>

                {/* Uploaded Video File Preview Badge */}
                {uploadedGalleryVideoMeta && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-sm flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="text-xs text-emerald-900 font-medium truncate">
                        Ficheiro Selecionado: <strong>{uploadedGalleryVideoMeta.name}</strong> ({uploadedGalleryVideoMeta.size})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => galleryVideoFileInputRef.current?.click()}
                      className="text-[10px] text-emerald-700 hover:underline font-bold uppercase tracking-wider shrink-0 cursor-pointer"
                    >
                      Trocar Ficheiro
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-600 block mb-1">
                      Título do Vídeo
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Momento de Louvor e Adoração"
                      value={newVideo.title}
                      onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                      className="w-full px-3 py-2 rounded-sm bg-white border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-600 block mb-1">
                      Duração (Ex: 05:20 min)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 08:30 min"
                      value={newVideo.duration}
                      onChange={(e) => setNewVideo({ ...newVideo, duration: e.target.value })}
                      className="w-full px-3 py-2 rounded-sm bg-white border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-black"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">
                        Link do Vídeo ou Ficheiro Local
                      </label>
                      <button
                        type="button"
                        onClick={() => galleryVideoFileInputRef.current?.click()}
                        className="text-[10px] text-[#C5A059] hover:underline font-bold uppercase cursor-pointer flex items-center gap-1"
                      >
                        <FolderOpen className="w-3 h-3" />
                        <span>Abrir Pastas do Dispositivo</span>
                      </button>
                    </div>

                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Cole o link do YouTube (ex: https://www.youtube.com/watch?v=... ou https://youtu.be/...)"
                        value={newVideo.videoUrl}
                        onChange={(e) => {
                          const url = e.target.value;
                          const ytId = extractYouTubeId(url);
                          const autoThumb = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : newVideo.thumbnailUrl;
                          setNewVideo({ 
                            ...newVideo, 
                            videoUrl: url,
                            thumbnailUrl: autoThumb || newVideo.thumbnailUrl
                          });
                        }}
                        className="flex-1 px-3 py-2 rounded-sm bg-white border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-black"
                      />
                      <button
                        type="button"
                        onClick={() => galleryVideoFileInputRef.current?.click()}
                        className="px-3.5 py-2 bg-neutral-800 hover:bg-black text-white rounded-sm text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                        title="Abrir Pastas e Galeria"
                      >
                        <FolderOpen className="w-3.5 h-3.5 text-[#C5A059]" />
                        <span>Pastas</span>
                      </button>
                    </div>
                  </div>

                  {newVideo.thumbnailUrl && (
                    <div className="md:col-span-2 p-3 bg-white rounded-sm border border-neutral-200 flex items-center gap-3">
                      <Image
                        src={newVideo.thumbnailUrl}
                        alt="Pré-visualização do vídeo"
                        width={64}
                        height={40}
                        className="w-16 h-10 rounded-sm object-cover bg-neutral-100 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="truncate text-xs text-neutral-700 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-neutral-900 block truncate">Miniatura Pronta</span>
                          {extractYouTubeId(newVideo.videoUrl) && (
                            <span className="px-1.5 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded text-[9px] font-bold uppercase">
                              YouTube Reconhecido
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-neutral-500 font-light truncate">{newVideo.duration} • Pronto para publicação imediata</span>
                      </div>
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-600 block mb-1">
                      Descrição do Vídeo
                    </label>
                    <input
                      type="text"
                      placeholder="Resumo do conteúdo do vídeo..."
                      value={newVideo.description}
                      onChange={(e) => setNewVideo({ ...newVideo, description: e.target.value })}
                      className="w-full px-3 py-2 rounded-sm bg-white border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-black"
                    />
                  </div>

                  <div className="md:col-span-2 pt-2 space-y-2 border-t border-neutral-200">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-neutral-800">
                      <input
                        type="checkbox"
                        checked={setAsHeroVideoOnUpload}
                        onChange={(e) => setSetAsHeroVideoOnUpload(e.target.checked)}
                        className="rounded text-[#C5A059] focus:ring-0 cursor-pointer"
                      />
                      <span>Exibir também no Hero (Vídeo Principal do Cabeçalho da Página)</span>
                    </label>

                    <label className="flex items-start gap-2 cursor-pointer select-none text-xs text-neutral-700">
                      <input
                        type="checkbox"
                        checked={replaceOldVideosOnUpload}
                        onChange={(e) => setReplaceOldVideosOnUpload(e.target.checked)}
                        className="rounded text-[#C5A059] focus:ring-0 cursor-pointer mt-0.5"
                      />
                      <div>
                        <span>Substituir galeria anterior (manter apenas este vídeo novo como destaque único)</span>
                        <p className="text-[10px] text-neutral-500 font-light">
                          Deixe <strong>desmarcado</strong> para acumular e somar vídeos ilimitadamente (mais de 10, 20 ou 50 vídeos).
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    id="btn-publicar-video"
                    className="flex items-center gap-2 px-6 py-2.5 rounded-sm text-xs font-bold uppercase tracking-widest text-white bg-[#1A1A1A] hover:bg-[#C5A059] transition-all shadow-sm cursor-pointer"
                  >
                    <Video className="w-4 h-4 text-[#C5A059]" />
                    <span>Publicar Vídeo</span>
                  </button>
                </div>
              </form>

              {/* Video List */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 pb-2">
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-neutral-900 flex items-center gap-2">
                      Vídeos na Galeria do Site ({data.videos.length})
                      <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[9px] font-bold uppercase">
                        Ilimitado (10+ vídeos)
                      </span>
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        clearAllOldVideos();
                        showNotification('Todos os vídeos foram removidos da galeria.');
                      }}
                      className="text-[10px] text-red-600 hover:underline font-bold uppercase tracking-wider cursor-pointer"
                    >
                      Limpar Todos os Vídeos
                    </button>
                    <span className="text-neutral-300">•</span>
                    <button
                      type="button"
                      onClick={() => {
                        resetVideosToDefaults();
                        showNotification('Galeria restaurada para os vídeos padrão.');
                      }}
                      className="text-[10px] text-neutral-600 hover:text-neutral-900 hover:underline font-bold uppercase tracking-wider cursor-pointer"
                    >
                      Restaurar Padrão
                    </button>
                  </div>
                </div>

                {/* Quick Search for Admin when there are many videos */}
                {data.videos.length > 4 && (
                  <div className="relative">
                    <input
                      type="text"
                      placeholder={`Pesquisar entre os ${data.videos.length} vídeos publicados...`}
                      value={videoSearchQuery}
                      onChange={(e) => setVideoSearchQuery(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-neutral-200 rounded-sm focus:outline-none focus:border-black"
                    />
                    {videoSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setVideoSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 text-xs font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                )}

                {data.videos.length === 0 ? (
                  <div className="p-6 text-center bg-neutral-50 rounded-sm border border-neutral-200">
                    <p className="text-xs text-neutral-500 mb-3">Nenhum vídeo publicado no momento.</p>
                    <button
                      type="button"
                      onClick={() => galleryVideoFileInputRef.current?.click()}
                      className="px-4 py-2 bg-[#1A1A1A] text-white text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-[#C5A059] transition-colors cursor-pointer"
                    >
                      Carregar Primeiro Vídeo
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
                    {data.videos
                      .filter((v) => {
                        if (!videoSearchQuery.trim()) return true;
                        const q = videoSearchQuery.toLowerCase();
                        return v.title.toLowerCase().includes(q) || v.description.toLowerCase().includes(q);
                      })
                      .map((vid, index) => {
                      const isFeatured = index === 0;
                      return (
                        <div
                          key={vid.id}
                          className={`p-3 rounded-sm border flex flex-col justify-between gap-3 transition-all ${
                            isFeatured
                              ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-300/50'
                              : 'bg-neutral-50 border-neutral-200 hover:border-neutral-300'
                          }`}
                        >
                          <div className="flex items-start gap-3 overflow-hidden">
                            <div className="relative w-16 h-12 rounded-sm overflow-hidden flex-shrink-0 bg-neutral-200">
                              <Image
                                src={vid.thumbnailUrl}
                                alt={vid.title}
                                fill
                                className="object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <div className="truncate flex-1">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                {isFeatured ? (
                                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-[#C5A059] text-white rounded-xs">
                                    ★ Destaque Principal
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-medium text-neutral-500">
                                    Posição #{index + 1}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs font-bold text-neutral-900 truncate">{vid.title}</p>
                              <span className="text-[10px] text-[#C5A059] font-medium">{vid.duration}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-neutral-200/60 text-xs gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              {!isFeatured ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPrimaryFeaturedVideo(vid.id);
                                    showNotification(`"${vid.title}" definido como vídeo de destaque principal!`);
                                  }}
                                  className="text-[10px] text-[#C5A059] hover:underline font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                                >
                                  ★ Destaque
                                </button>
                              ) : (
                                <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">
                                  ★ Topo
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={async () => {
                                  await clearHeroVideoBlob();
                                  updateCurrentActivity({ heroVideo: vid.videoUrl });
                                  syncNowWithCloud();
                                  if (typeof window !== 'undefined') {
                                    window.dispatchEvent(new CustomEvent('hero-video-updated', { detail: { blobUrl: vid.videoUrl } }));
                                  }
                                  showNotification(`"${vid.title}" definido como Vídeo do Hero no Cabeçalho!`);
                                }}
                                className="text-[10px] text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                                title="Definir este vídeo como fundo principal do Hero"
                              >
                                🎬 Usar no Hero
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                removeVideo(vid.id);
                                showNotification('Vídeo removido da galeria');
                              }}
                              className="p-1.5 rounded-sm text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer ml-auto"
                              title="Remover vídeo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: PRÓXIMAS ATIVIDADES */}
          {activeTab === 'events' && (
            <div className="space-y-6">
              {/* HIDDEN EVENT IMAGE INPUTS */}
              <input
                type="file"
                ref={eventImageFileInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleProcessEventImageFile(file);
                }}
              />
              <input
                type="file"
                ref={editEventImageFileInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleProcessEditEventImageFile(file);
                }}
              />

              {/* EDIT FORM (WHEN EDITING AN EXISTING EVENT) */}
              {editingEventId && editingEventForm ? (
                <form
                  onSubmit={handleSaveEditedEvent}
                  className="p-5 rounded-sm bg-amber-50/50 border-2 border-[#C5A059]/60 shadow-md space-y-4 animate-in fade-in duration-200"
                >
                  <div className="flex items-center justify-between border-b border-[#C5A059]/30 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#C5A059] text-white flex items-center justify-center">
                        <Pencil className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-[#9A7B38] block">
                          Modo de Edição Ativo
                        </span>
                        <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                          Editar Atividade: {editingEventForm.title || 'Sem título'}
                        </h3>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleCancelEditEvent}
                      className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-600 hover:text-black bg-white hover:bg-neutral-100 rounded-sm border border-neutral-300 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-3 h-3" /> Cancelar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-700 block mb-1">
                        Título da Atividade / Evento *
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Noite de Avivamento e Louvor"
                        value={editingEventForm.title}
                        onChange={(e) => setEditingEventForm({ ...editingEventForm, title: e.target.value })}
                        className="w-full px-3 py-2 rounded-sm bg-white border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-700 block mb-1">
                        Categoria
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Juventude, Famílias, Louvor, Cruzada, Doutrina"
                        value={editingEventForm.category}
                        onChange={(e) => setEditingEventForm({ ...editingEventForm, category: e.target.value })}
                        className="w-full px-3 py-2 rounded-sm bg-white border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-[#C5A059]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-700 block mb-1">
                        Data (Ex: 15 de Outubro de 2026) *
                      </label>
                      <input
                        type="text"
                        value={editingEventForm.date}
                        onChange={(e) => setEditingEventForm({ ...editingEventForm, date: e.target.value })}
                        className="w-full px-3 py-2 rounded-sm bg-white border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-[#C5A059]"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-700 block mb-1">
                        Horário (Ex: 19h00)
                      </label>
                      <input
                        type="text"
                        value={editingEventForm.time}
                        onChange={(e) => setEditingEventForm({ ...editingEventForm, time: e.target.value })}
                        className="w-full px-3 py-2 rounded-sm bg-white border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-[#C5A059]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-700 block mb-1">
                        Local do Evento
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Templo Central / Sala Multiuso"
                        value={editingEventForm.location}
                        onChange={(e) => setEditingEventForm({ ...editingEventForm, location: e.target.value })}
                        className="w-full px-3 py-2 rounded-sm bg-white border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-[#C5A059]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-700 block mb-1">
                        Preletor / Responsável
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Bispo Manuel & Pastores Convidados"
                        value={editingEventForm.speaker || ''}
                        onChange={(e) => setEditingEventForm({ ...editingEventForm, speaker: e.target.value })}
                        className="w-full px-3 py-2 rounded-sm bg-white border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-[#C5A059]"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-700">
                          Foto / Cartaz de Divulgação
                        </label>
                        <button
                          type="button"
                          onClick={() => editEventImageFileInputRef.current?.click()}
                          disabled={isEditEventImageUploading}
                          className="text-[10px] text-[#C5A059] hover:underline font-bold uppercase cursor-pointer flex items-center gap-1"
                        >
                          <Camera className="w-3 h-3" />
                          <span>{isEditEventImageUploading ? 'A Carregar...' : 'Trocar Foto'}</span>
                        </button>
                      </div>

                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={editingEventForm.imageUrl}
                          onChange={(e) => setEditingEventForm({ ...editingEventForm, imageUrl: e.target.value })}
                          placeholder="Cole a URL ou carregue do seu computador"
                          className="flex-1 px-3 py-2 rounded-sm bg-white border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-[#C5A059]"
                        />
                        <button
                          type="button"
                          onClick={() => editEventImageFileInputRef.current?.click()}
                          className="px-3 py-2 bg-neutral-800 hover:bg-black text-white rounded-sm text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                        >
                          <UploadCloud className="w-3.5 h-3.5 text-[#C5A059]" />
                          <span>Carregar Nova</span>
                        </button>
                      </div>

                      {editingEventForm.imageUrl && (
                        <div className="mt-2 flex items-center gap-3 p-2 bg-white rounded-sm border border-neutral-200">
                          <div className="relative w-16 h-10 rounded-sm overflow-hidden bg-neutral-100 flex-shrink-0">
                            <Image
                              src={editingEventForm.imageUrl}
                              alt="Pré-visualização"
                              fill
                              className="object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="text-[11px] text-neutral-700 truncate">
                            <span className="font-bold text-neutral-900">Foto atual do cartaz</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-700 block mb-1">
                        Pequena Descrição (Exibida no Card)
                      </label>
                      <input
                        type="text"
                        value={editingEventForm.description}
                        onChange={(e) => setEditingEventForm({ ...editingEventForm, description: e.target.value })}
                        className="w-full px-3 py-2 rounded-sm bg-white border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-[#C5A059]"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-700 block mb-1">
                        Detalhes Completos para o Modal &quot;Saber Mais&quot;
                      </label>
                      <textarea
                        rows={3}
                        value={editingEventForm.fullDetails}
                        onChange={(e) => setEditingEventForm({ ...editingEventForm, fullDetails: e.target.value })}
                        className="w-full px-3 py-2 rounded-sm bg-white border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-[#C5A059]"
                      />
                    </div>

                    <div className="md:col-span-2 flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="edit-event-featured"
                        checked={!!editingEventForm.featured}
                        onChange={(e) => setEditingEventForm({ ...editingEventForm, featured: e.target.checked })}
                        className="w-4 h-4 rounded border-neutral-300 text-[#C5A059] focus:ring-[#C5A059] cursor-pointer"
                      />
                      <label htmlFor="edit-event-featured" className="text-xs font-bold text-neutral-800 cursor-pointer">
                        ★ Marcar como Atividade em Destaque Especial
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#C5A059]/30">
                    <button
                      type="button"
                      onClick={handleCancelEditEvent}
                      className="px-4 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest text-neutral-700 bg-white hover:bg-neutral-100 border border-neutral-300 transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-2 px-5 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest text-white bg-[#1A1A1A] hover:bg-[#C5A059] transition-colors cursor-pointer shadow-sm"
                    >
                      <Save className="w-3.5 h-3.5 text-[#C5A059]" /> Salvar Alterações da Atividade
                    </button>
                  </div>
                </form>
              ) : (
                /* CREATE NEW EVENT FORM */
                <form onSubmit={handleAddEventSubmit} className="p-5 rounded-sm bg-neutral-50 border border-neutral-200 space-y-4">
                  <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-widest flex items-center gap-2">
                    <Plus className="w-3.5 h-3.5 text-[#C5A059]" /> Cadastrar Nova Atividade / Evento
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-600 block mb-1">Título do Evento *</label>
                      <input
                        type="text"
                        placeholder="Ex: Noite de Avivamento e Louvor"
                        value={newEvent.title}
                        onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                        className="w-full px-3 py-2 rounded-sm bg-white border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-black"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-600 block mb-1">Categoria</label>
                      <input
                        type="text"
                        placeholder="Ex: Juventude, Famílias, Louvor, Cruzada"
                        value={newEvent.category}
                        onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                        className="w-full px-3 py-2 rounded-sm bg-white border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-black"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-600 block mb-1">Data (Ex: 15 de Outubro de 2026) *</label>
                      <input
                        type="text"
                        value={newEvent.date}
                        onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                        className="w-full px-3 py-2 rounded-sm bg-white border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-black"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-600 block mb-1">Horário</label>
                      <input
                        type="text"
                        value={newEvent.time}
                        onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                        className="w-full px-3 py-2 rounded-sm bg-white border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-black"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-600 block mb-1">Local</label>
                      <input
                        type="text"
                        value={newEvent.location}
                        onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                        className="w-full px-3 py-2 rounded-sm bg-white border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-black"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-600 block mb-1">Preletor / Responsável</label>
                      <input
                        type="text"
                        placeholder="Ex: Conselho Pastoral"
                        value={newEvent.speaker}
                        onChange={(e) => setNewEvent({ ...newEvent, speaker: e.target.value })}
                        className="w-full px-3 py-2 rounded-sm bg-white border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-black"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">
                          Foto de Divulgação do Evento
                        </label>
                        <button
                          type="button"
                          onClick={() => eventImageFileInputRef.current?.click()}
                          disabled={isEventImageUploading}
                          className="text-[10px] text-[#C5A059] hover:underline font-bold uppercase cursor-pointer flex items-center gap-1"
                        >
                          <Camera className="w-3 h-3" />
                          <span>{isEventImageUploading ? 'A Carregar...' : 'Carregar Foto'}</span>
                        </button>
                      </div>

                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={newEvent.imageUrl}
                          onChange={(e) => setNewEvent({ ...newEvent, imageUrl: e.target.value })}
                          placeholder="Carregue uma foto ou cole a URL"
                          className="flex-1 px-3 py-2 rounded-sm bg-white border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-black"
                        />
                        <button
                          type="button"
                          onClick={() => eventImageFileInputRef.current?.click()}
                          className="px-3 py-2 bg-neutral-800 hover:bg-black text-white rounded-sm text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                        >
                          <UploadCloud className="w-3.5 h-3.5 text-[#C5A059]" />
                          <span>Carregar</span>
                        </button>
                      </div>

                      {newEvent.imageUrl && (
                        <div className="mt-2 flex items-center gap-2 p-2 bg-white rounded-sm border border-neutral-200">
                          <Image
                            src={newEvent.imageUrl}
                            alt="Capa do Evento"
                            width={48}
                            height={32}
                            className="w-12 h-8 rounded-sm object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <span className="text-[11px] text-neutral-700 truncate">Foto do evento carregada</span>
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-600 block mb-1">Pequena Descrição</label>
                      <input
                        type="text"
                        value={newEvent.description}
                        onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                        className="w-full px-3 py-2 rounded-sm bg-white border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-black"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-600 block mb-1">Detalhes Completos para o Modal</label>
                      <textarea
                        rows={2}
                        value={newEvent.fullDetails}
                        onChange={(e) => setNewEvent({ ...newEvent, fullDetails: e.target.value })}
                        className="w-full px-3 py-2 rounded-sm bg-white border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-black"
                      />
                    </div>

                    <div className="md:col-span-2 flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="new-event-featured"
                        checked={!!newEvent.featured}
                        onChange={(e) => setNewEvent({ ...newEvent, featured: e.target.checked })}
                        className="w-4 h-4 rounded border-neutral-300 text-[#C5A059] focus:ring-[#C5A059] cursor-pointer"
                      />
                      <label htmlFor="new-event-featured" className="text-xs font-medium text-neutral-700 cursor-pointer">
                        Marcar como Atividade em Destaque Especial
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="flex items-center gap-2 px-5 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest text-white bg-[#1A1A1A] hover:bg-[#C5A059] transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Salvar Atividade
                    </button>
                  </div>
                </form>
              )}

              {/* LIST OF REGISTERED EVENTS WITH EDIT & DELETE BUTTONS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-900 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>Atividades Cadastradas ({data.upcomingEvents.length})</span>
                  </h4>
                  <span className="text-[10px] text-neutral-500">
                    Clique em &quot;Editar&quot; para alterar qualquer informação
                  </span>
                </div>

                {data.upcomingEvents.length === 0 ? (
                  <div className="p-8 text-center bg-neutral-50 border border-neutral-200 rounded-sm">
                    <Calendar className="w-8 h-8 text-neutral-400 mx-auto mb-2 opacity-50" />
                    <p className="text-xs text-neutral-600 font-medium">Nenhuma atividade cadastrada no momento.</p>
                    <p className="text-[10px] text-neutral-400 mt-1">Preencha o formulário acima para cadastrar a primeira atividade.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.upcomingEvents.map((ev) => {
                      const isCurrentlyEditing = editingEventId === ev.id;
                      return (
                        <div
                          key={ev.id}
                          className={`p-3.5 rounded-sm border transition-all flex flex-col justify-between gap-3 ${
                            isCurrentlyEditing
                              ? 'bg-amber-50/80 border-[#C5A059] ring-2 ring-[#C5A059]/40'
                              : 'bg-neutral-50 border-neutral-200 hover:border-neutral-300'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="relative w-20 h-16 rounded-sm overflow-hidden bg-neutral-200 flex-shrink-0">
                              <Image
                                src={ev.imageUrl}
                                alt={ev.title}
                                fill
                                className="object-cover"
                                referrerPolicy="no-referrer"
                              />
                              {ev.featured && (
                                <span className="absolute top-1 left-1 text-[8px] font-bold uppercase tracking-wider px-1 py-0.2 bg-[#C5A059] text-white rounded-xs">
                                  ★ Destaque
                                </span>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-neutral-200 text-neutral-800 rounded-xs">
                                  {ev.category || 'Geral'}
                                </span>
                                {isCurrentlyEditing && (
                                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-amber-200 text-amber-900 rounded-xs animate-pulse">
                                    Em Edição
                                  </span>
                                )}
                              </div>
                              <h5 className="text-xs font-bold text-neutral-900 truncate" title={ev.title}>
                                {ev.title}
                              </h5>
                              <p className="text-[10px] text-[#9A7B38] font-semibold mt-0.5 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-[#C5A059]" />
                                <span>{ev.date} {ev.time ? `• ${ev.time}` : ''}</span>
                              </p>
                              {ev.location && (
                                <p className="text-[10px] text-neutral-500 truncate flex items-center gap-1 mt-0.5">
                                  <MapPin className="w-3 h-3 text-neutral-400" />
                                  <span>{ev.location}</span>
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-neutral-200/70">
                            <button
                              type="button"
                              onClick={() => handleStartEditEvent(ev)}
                              className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 px-2.5 py-1 rounded-sm transition-colors cursor-pointer ${
                                isCurrentlyEditing
                                  ? 'bg-[#C5A059] text-white'
                                  : 'text-neutral-700 bg-white border border-neutral-300 hover:bg-[#1A1A1A] hover:text-white hover:border-[#1A1A1A]'
                              }`}
                            >
                              <Pencil className="w-3 h-3" />
                              <span>{isCurrentlyEditing ? 'A Editar Agora' : 'Editar Atividade'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (editingEventId === ev.id) {
                                  handleCancelEditEvent();
                                }
                                removeUpcomingEvent(ev.id);
                                showNotification(`Atividade "${ev.title}" removida com sucesso`);
                              }}
                              className="p-1.5 rounded-sm text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Remover Atividade"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: TESTEMUNHOS */}
          {activeTab === 'testimonies' && (
            <div className="space-y-6">
              <div className="p-3.5 rounded-sm bg-[#C5A059]/10 border border-[#C5A059]/20 text-xs text-neutral-800 font-light flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-neutral-900 mb-0.5">Gestão de Testemunhos & Relatos de Fé</h4>
                  <p className="text-[11px] text-neutral-600">
                    Cadastre a foto das pessoas que testemunham, seu nome, função na igreja e o relato completo do que Deus fez em suas vidas. Todos os testemunhos aparecem na seção oficial &quot;Vozes de Transformação&quot;.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    resetTestimoniesToDefaults();
                    showNotification('Testemunhos restaurados para as versões padrão.');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-white hover:bg-neutral-100 text-neutral-700 text-[10px] font-bold uppercase tracking-wider border border-neutral-300 transition-colors whitespace-nowrap self-start sm:self-auto cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Restaurar Padrão</span>
                </button>
              </div>

              {/* FORMULÁRIO DE CADASTRO DE NOVO TESTEMUNHO */}
              <form onSubmit={handleAddTestimonySubmit} className="p-5 rounded-sm bg-neutral-50/70 border border-neutral-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-900 flex items-center gap-2">
                    <Quote className="w-4 h-4 text-[#C5A059]" />
                    <span>Adicionar Novo Testemunho</span>
                  </h4>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    {data.testimonies?.length || 0} Testemunhos Cadastrados
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-700 block mb-1">
                      Nome da Pessoa que Testemunha *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Irmã Maria Domingos"
                      value={newTestimony.name}
                      onChange={(e) => setNewTestimony({ ...newTestimony, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-sm bg-white border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-black"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-700 block mb-1">
                      Cargo / Função na Igreja
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Membro da Catedral / Visitante"
                      value={newTestimony.role}
                      onChange={(e) => setNewTestimony({ ...newTestimony, role: e.target.value })}
                      className="w-full px-3 py-2 rounded-sm bg-white border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-700 block mb-1">
                      Culto / Atividade Relacionada
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Culto de Cura e Libertação"
                      value={newTestimony.activityName}
                      onChange={(e) => setNewTestimony({ ...newTestimony, activityName: e.target.value })}
                      className="w-full px-3 py-2 rounded-sm bg-white border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-700 block mb-1">
                      Data / Mês do Relato
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Agosto de 2026"
                      value={newTestimony.date}
                      onChange={(e) => setNewTestimony({ ...newTestimony, date: e.target.value })}
                      className="w-full px-3 py-2 rounded-sm bg-white border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-black"
                    />
                  </div>

                  {/* UPLOAD DA FOTO DA PESSOA */}
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-700 block mb-1">
                      Foto da Pessoa que Testemunha
                    </label>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      {newTestimony.avatarUrl ? (
                        <div className="relative w-12 h-12 rounded-full overflow-hidden border border-neutral-300 shrink-0 bg-neutral-200">
                          <Image
                            src={newTestimony.avatarUrl}
                            alt="Prévia do Avatar"
                            fill
                            className="object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-neutral-200 border border-neutral-300 flex items-center justify-center text-neutral-400 shrink-0">
                          <User className="w-5 h-5" />
                        </div>
                      )}

                      <div className="flex-1 w-full space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            ref={testimonyAvatarFileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleProcessTestimonyAvatarFile(f, false);
                            }}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => testimonyAvatarFileInputRef.current?.click()}
                            disabled={isTestimonyAvatarUploading}
                            className="px-3 py-1.5 rounded-sm bg-[#1A1A1A] hover:bg-[#C5A059] text-white text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <Camera className="w-3 h-3" />
                            <span>{isTestimonyAvatarUploading ? 'A Carregar Foto...' : 'Carregar Foto da Pessoa'}</span>
                          </button>
                          <span className="text-[10px] text-neutral-400">ou cole a URL abaixo:</span>
                        </div>
                        <input
                          type="text"
                          placeholder="https://..."
                          value={newTestimony.avatarUrl}
                          onChange={(e) => setNewTestimony({ ...newTestimony, avatarUrl: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-sm bg-white border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-black font-mono text-[11px]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ÁREA DE ESCREVER TESTEMUNHO */}
                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-700 block mb-1">
                      Texto do Testemunho / Relato da Transformação *
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Escreva aqui o testemunho completo da pessoa: o que aconteceu, a oração realizada e a bênção alcançada..."
                      value={newTestimony.content}
                      onChange={(e) => setNewTestimony({ ...newTestimony, content: e.target.value })}
                      className="w-full px-3 py-2 rounded-sm bg-white border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-black resize-y"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#1A1A1A] hover:bg-[#C5A059] text-white text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Publicar Testemunho no Site</span>
                  </button>
                </div>
              </form>

              {/* LISTA DE TESTEMUNHOS CADASTRADOS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-900">
                    Testemunhos Publicados ({data.testimonies?.length || 0})
                  </h4>
                </div>

                {(!data.testimonies || data.testimonies.length === 0) ? (
                  <div className="p-8 text-center bg-neutral-50 rounded-sm border border-dashed border-neutral-300 text-neutral-500 text-xs">
                    Nenhum testemunho cadastrado no momento. Preencha o formulário acima para adicionar o primeiro relato!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.testimonies.map((testimony) => {
                      const isEditing = editingTestimonyId === testimony.id;

                      if (isEditing && editingTestimonyForm) {
                        return (
                          <form
                            key={testimony.id}
                            onSubmit={handleSaveEditedTestimony}
                            className="p-4 rounded-sm bg-[#FDFDFC] border-2 border-[#C5A059] shadow-md space-y-3 md:col-span-2 animate-in fade-in"
                          >
                            <div className="flex items-center justify-between pb-2 border-b border-[#C5A059]/30">
                              <span className="text-xs font-bold uppercase tracking-wider text-[#C5A059] flex items-center gap-1.5">
                                <Pencil className="w-3.5 h-3.5" />
                                A Editar Testemunho: {testimony.name}
                              </span>
                              <button
                                type="button"
                                onClick={handleCancelEditTestimony}
                                className="text-[10px] text-neutral-500 hover:text-black font-semibold"
                              >
                                Cancelar
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-700 block mb-1">
                                  Nome *
                                </label>
                                <input
                                  type="text"
                                  value={editingTestimonyForm.name}
                                  onChange={(e) => setEditingTestimonyForm({ ...editingTestimonyForm, name: e.target.value })}
                                  className="w-full px-2.5 py-1.5 rounded-sm bg-white border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-black"
                                  required
                                />
                              </div>

                              <div>
                                <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-700 block mb-1">
                                  Função / Cargo
                                </label>
                                <input
                                  type="text"
                                  value={editingTestimonyForm.role}
                                  onChange={(e) => setEditingTestimonyForm({ ...editingTestimonyForm, role: e.target.value })}
                                  className="w-full px-2.5 py-1.5 rounded-sm bg-white border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-black"
                                />
                              </div>

                              <div>
                                <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-700 block mb-1">
                                  Culto / Atividade
                                </label>
                                <input
                                  type="text"
                                  value={editingTestimonyForm.activityName || ''}
                                  onChange={(e) => setEditingTestimonyForm({ ...editingTestimonyForm, activityName: e.target.value })}
                                  className="w-full px-2.5 py-1.5 rounded-sm bg-white border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-black"
                                />
                              </div>

                              {/* Foto na Edição */}
                              <div className="sm:col-span-3">
                                <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-700 block mb-1">
                                  Foto da Pessoa
                                </label>
                                <div className="flex items-center gap-3">
                                  {editingTestimonyForm.avatarUrl ? (
                                    <div className="relative w-10 h-10 rounded-full overflow-hidden border border-neutral-300 shrink-0">
                                      <Image
                                        src={editingTestimonyForm.avatarUrl}
                                        alt="Avatar"
                                        fill
                                        className="object-cover"
                                        referrerPolicy="no-referrer"
                                      />
                                    </div>
                                  ) : null}
                                  <input
                                    ref={editTestimonyAvatarFileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const f = e.target.files?.[0];
                                      if (f) handleProcessTestimonyAvatarFile(f, true);
                                    }}
                                    className="hidden"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => editTestimonyAvatarFileInputRef.current?.click()}
                                    disabled={isEditTestimonyAvatarUploading}
                                    className="px-2.5 py-1 rounded-sm bg-neutral-800 hover:bg-black text-white text-[10px] font-bold uppercase tracking-wider transition-colors shrink-0 cursor-pointer"
                                  >
                                    <Camera className="w-3 h-3 inline mr-1" />
                                    <span>{isEditTestimonyAvatarUploading ? 'A Carregar...' : 'Trocar Foto'}</span>
                                  </button>
                                  <input
                                    type="text"
                                    value={editingTestimonyForm.avatarUrl}
                                    onChange={(e) => setEditingTestimonyForm({ ...editingTestimonyForm, avatarUrl: e.target.value })}
                                    className="flex-1 px-2.5 py-1 rounded-sm bg-white border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-black font-mono text-[11px]"
                                  />
                                </div>
                              </div>

                              <div className="sm:col-span-3">
                                <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-700 block mb-1">
                                  Texto do Testemunho *
                                </label>
                                <textarea
                                  rows={3}
                                  value={editingTestimonyForm.content}
                                  onChange={(e) => setEditingTestimonyForm({ ...editingTestimonyForm, content: e.target.value })}
                                  className="w-full px-2.5 py-1.5 rounded-sm bg-white border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-black resize-y"
                                  required
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200">
                              <button
                                type="button"
                                onClick={handleCancelEditTestimony}
                                className="px-3 py-1.5 rounded-sm border border-neutral-300 text-[10px] font-bold uppercase tracking-wider text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
                              >
                                Cancelar
                              </button>
                              <button
                                type="submit"
                                className="px-4 py-1.5 rounded-sm bg-[#C5A059] hover:bg-[#A9833D] text-white text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
                              >
                                Salvar Alterações
                              </button>
                            </div>
                          </form>
                        );
                      }

                      return (
                        <div
                          key={testimony.id}
                          className="p-4 rounded-sm bg-white border border-neutral-200 hover:border-neutral-300 shadow-xs transition-all space-y-3 flex flex-col justify-between"
                        >
                          <div className="space-y-2.5">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                {testimony.avatarUrl ? (
                                  <div className="relative w-10 h-10 rounded-full overflow-hidden border border-neutral-200 shrink-0">
                                    <Image
                                      src={testimony.avatarUrl}
                                      alt={testimony.name}
                                      fill
                                      className="object-cover"
                                      referrerPolicy="no-referrer"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 shrink-0">
                                    <User className="w-5 h-5" />
                                  </div>
                                )}
                                <div>
                                  <h5 className="text-xs font-bold text-neutral-900">{testimony.name}</h5>
                                  <p className="text-[10px] text-neutral-500">{testimony.role}</p>
                                </div>
                              </div>
                              <span className="text-[9px] px-2 py-0.5 rounded-sm bg-neutral-100 text-neutral-600 font-mono shrink-0">
                                {testimony.date || 'Recente'}
                              </span>
                            </div>

                            <p className="text-xs text-neutral-700 font-light italic leading-relaxed bg-neutral-50 p-2.5 rounded-sm border border-neutral-100 line-clamp-3">
                              &ldquo;{testimony.content}&rdquo;
                            </p>

                            {testimony.activityName && (
                              <div className="text-[10px] text-[#C5A059] font-medium flex items-center gap-1">
                                <Sparkles className="w-3 h-3 shrink-0" />
                                <span>{testimony.activityName}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                            <button
                              type="button"
                              onClick={() => handleStartEditTestimony(testimony)}
                              className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-neutral-700 bg-white border border-neutral-200 hover:bg-[#1A1A1A] hover:text-white transition-colors cursor-pointer"
                            >
                              <Pencil className="w-3 h-3" />
                              <span>Editar</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                removeTestimony(testimony.id);
                                showNotification(`Testemunho de "${testimony.name}" removido com sucesso.`);
                              }}
                              className="p-1 rounded-sm text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Remover Testemunho"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: COORDENAÇÕES & COMISSÕES DA CRUZADA */}
          {activeTab === 'coordinations' && (
            <div className="space-y-6">
              {/* Header Box */}
              <div className="p-4 rounded-sm bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-950 text-white border border-neutral-800 space-y-2 shadow-sm">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#C5A059]" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                      Grupos de WhatsApp das Coordenações e Comissões
                    </h3>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/40">
                    Cruzada de Milagres
                  </span>
                </div>
                <p className="text-xs text-neutral-300 font-light leading-relaxed max-w-2xl">
                  Adicione e edite os botões de direcionamento para os grupos do WhatsApp das comissões oficiais (ex: Comissão Nacional de Música e Louvor, Protocolo, Evangelização, Intercessão, etc.). Ao clicar no botão &quot;Coordenações&quot; no cabeçalho, os voluntários e fiéis poderão ingressar diretamente.
                </p>
              </div>

              {/* Form: Add New Coordination Group */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newCoordForm.name.trim()) {
                    alert('Por favor, informe o nome da comissão ou coordenação.');
                    return;
                  }
                  if (!newCoordForm.whatsappLink.trim()) {
                    alert('Por favor, informe o link do grupo do WhatsApp.');
                    return;
                  }

                  const cleanLink = resolveWhatsAppGroupLink(newCoordForm.whatsappLink);

                  addCoordination({
                    name: newCoordForm.name.trim(),
                    category: newCoordForm.category.trim() || 'Comissão Oficial',
                    description: newCoordForm.description.trim(),
                    leaderOrContact: newCoordForm.leaderOrContact.trim(),
                    whatsappLink: cleanLink,
                    isActive: newCoordForm.isActive,
                  });

                  setNewCoordForm({
                    name: '',
                    category: 'Música & Louvor',
                    description: '',
                    leaderOrContact: '',
                    whatsappLink: '',
                    isActive: true,
                  });

                  showNotification('Nova comissão adicionada com sucesso!');
                }}
                className="p-5 rounded-sm bg-neutral-50 border border-neutral-200 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-neutral-200 pb-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-900 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-[#C5A059]" />
                    <span>Adicionar Nova Comissão / Grupo de WhatsApp</span>
                  </h4>
                  <span className="text-[10px] text-neutral-500 font-light">
                    * Campos obrigatórios
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-700 block mb-1">
                      Nome da Comissão / Coordenação *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Comissão Nacional De Música | Louvor Da Cruzada de Milagres do Dr Paul Enenche"
                      value={newCoordForm.name}
                      onChange={(e) => setNewCoordForm({ ...newCoordForm, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-sm bg-white border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-[#C5A059] font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-700 block mb-1">
                      Categoria / Área de Atuação *
                    </label>
                    <select
                      value={newCoordForm.category}
                      onChange={(e) => setNewCoordForm({ ...newCoordForm, category: e.target.value })}
                      className="w-full px-3 py-2 rounded-sm bg-white border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-[#C5A059]"
                    >
                      <option value="Música & Louvor">Música & Louvor</option>
                      <option value="Protocolo & Ordem">Protocolo & Ordem</option>
                      <option value="Evangelização & Missões">Evangelização & Missões</option>
                      <option value="Intercessão & Oração">Intercessão & Oração</option>
                      <option value="Comunicação & Mídia">Comunicação & Mídia</option>
                      <option value="Logística & Transportes">Logística & Transportes</option>
                      <option value="Segurança & Trânsito">Segurança & Trânsito</option>
                      <option value="Consolidação & Acompanhamento">Consolidação & Acompanhamento</option>
                      <option value="Outra Comissão Especial">Outra Comissão Especial</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-700 block mb-1">
                      Link do Grupo do WhatsApp (Convite oficial) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: https://chat.whatsapp.com/Gabc123456789xyz"
                      value={newCoordForm.whatsappLink}
                      onChange={(e) => setNewCoordForm({ ...newCoordForm, whatsappLink: e.target.value })}
                      className="w-full px-3 py-2 rounded-sm bg-white border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-[#C5A059] font-mono"
                    />
                    <span className="text-[10px] text-neutral-500 mt-0.5 block">
                      Insira o link de convite do grupo do WhatsApp (abre diretamente o link configurado).
                    </span>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-700 block mb-1">
                      Descrição / Instruções aos Membros da Equipa (Opcional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Ex: Coordenação oficial para ensaios gerais, escalas e alinhamento espiritual de todos os coristas e instrumentistas..."
                      value={newCoordForm.description}
                      onChange={(e) => setNewCoordForm({ ...newCoordForm, description: e.target.value })}
                      className="w-full px-3 py-2 rounded-sm bg-white border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-700 block mb-1">
                      Líder ou Contacto de Referência (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Coordenação Nacional de Louvor"
                      value={newCoordForm.leaderOrContact}
                      onChange={(e) => setNewCoordForm({ ...newCoordForm, leaderOrContact: e.target.value })}
                      className="w-full px-3 py-2 rounded-sm bg-white border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-5">
                    <input
                      type="checkbox"
                      id="new-coord-active"
                      checked={newCoordForm.isActive}
                      onChange={(e) => setNewCoordForm({ ...newCoordForm, isActive: e.target.checked })}
                      className="rounded text-neutral-900 focus:ring-0 cursor-pointer"
                    />
                    <label htmlFor="new-coord-active" className="text-xs text-neutral-700 font-medium cursor-pointer">
                      Comissão activa (visível para os visitantes no modal)
                    </label>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-sm font-bold text-[10px] uppercase tracking-widest text-white bg-[#1A1A1A] hover:bg-[#C5A059] transition-all shadow-sm cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Comissão</span>
                  </button>
                </div>
              </form>

              {/* List of Existing Coordinations */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-neutral-600" />
                    <span>Comissões Cadastradas ({(data.coordinations || []).length})</span>
                  </h4>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Deseja restaurar as 3 comissões oficiais padrão da Cruzada de Milagres?')) {
                        resetCoordinationsToDefaults();
                        showNotification('Comissões padrão restauradas com sucesso.');
                      }
                    }}
                    className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 hover:text-black flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restaurar Padrão da Cruzada</span>
                  </button>
                </div>

                {(!data.coordinations || data.coordinations.length === 0) ? (
                  <div className="text-center py-10 px-4 border border-dashed border-neutral-300 rounded-sm bg-neutral-50">
                    <Users className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-neutral-700">Nenhuma comissão cadastrada</p>
                    <p className="text-[11px] text-neutral-500 font-light mt-0.5">
                      Use o formulário acima ou clique em &quot;Restaurar Padrão da Cruzada&quot;.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.coordinations.map((coord, idx) => {
                      const isEditing = editingCoordId === coord.id;

                      if (isEditing) {
                        return (
                          <div
                            key={coord.id}
                            className="p-4 rounded-sm bg-neutral-900 text-white border border-neutral-700 space-y-3 shadow-md"
                          >
                            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#C5A059]">
                                Editando Comissão #{idx + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => setEditingCoordId(null)}
                                className="text-neutral-400 hover:text-white p-1"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="md:col-span-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-300 block mb-1">
                                  Nome da Comissão *
                                </label>
                                <input
                                  type="text"
                                  value={editCoordForm.name}
                                  onChange={(e) => setEditCoordForm({ ...editCoordForm, name: e.target.value })}
                                  className="w-full px-3 py-2 rounded-sm bg-neutral-800 border border-neutral-600 text-xs text-white focus:outline-none focus:border-[#C5A059]"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-300 block mb-1">
                                  Categoria / Área *
                                </label>
                                <input
                                  type="text"
                                  value={editCoordForm.category}
                                  onChange={(e) => setEditCoordForm({ ...editCoordForm, category: e.target.value })}
                                  className="w-full px-3 py-2 rounded-sm bg-neutral-800 border border-neutral-600 text-xs text-white focus:outline-none focus:border-[#C5A059]"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-300 block mb-1">
                                  Link do WhatsApp *
                                </label>
                                <input
                                  type="text"
                                  value={editCoordForm.whatsappLink}
                                  onChange={(e) => setEditCoordForm({ ...editCoordForm, whatsappLink: e.target.value })}
                                  className="w-full px-3 py-2 rounded-sm bg-neutral-800 border border-neutral-600 text-xs text-white focus:outline-none focus:border-[#C5A059] font-mono"
                                />
                              </div>

                              <div className="md:col-span-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-300 block mb-1">
                                  Descrição
                                </label>
                                <textarea
                                  rows={2}
                                  value={editCoordForm.description}
                                  onChange={(e) => setEditCoordForm({ ...editCoordForm, description: e.target.value })}
                                  className="w-full px-3 py-2 rounded-sm bg-neutral-800 border border-neutral-600 text-xs text-white focus:outline-none focus:border-[#C5A059]"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-300 block mb-1">
                                  Líder ou Contacto
                                </label>
                                <input
                                  type="text"
                                  value={editCoordForm.leaderOrContact}
                                  onChange={(e) => setEditCoordForm({ ...editCoordForm, leaderOrContact: e.target.value })}
                                  className="w-full px-3 py-2 rounded-sm bg-neutral-800 border border-neutral-600 text-xs text-white focus:outline-none focus:border-[#C5A059]"
                                />
                              </div>

                              <div className="flex items-center gap-2 pt-4">
                                <input
                                  type="checkbox"
                                  id={`edit-active-${coord.id}`}
                                  checked={editCoordForm.isActive}
                                  onChange={(e) => setEditCoordForm({ ...editCoordForm, isActive: e.target.checked })}
                                  className="rounded bg-neutral-800 text-[#C5A059] focus:ring-0 cursor-pointer"
                                />
                                <label htmlFor={`edit-active-${coord.id}`} className="text-xs text-neutral-300 cursor-pointer">
                                  Activa e visível no modal
                                </label>
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
                              <button
                                type="button"
                                onClick={() => setEditingCoordId(null)}
                                className="px-3 py-1.5 rounded-sm bg-neutral-800 text-neutral-300 text-xs hover:bg-neutral-700 cursor-pointer"
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (!editCoordForm.name.trim()) return;
                                  updateCoordination(coord.id, {
                                    ...editCoordForm,
                                    whatsappLink: resolveWhatsAppGroupLink(editCoordForm.whatsappLink),
                                  });
                                  setEditingCoordId(null);
                                  showNotification('Comissão atualizada com sucesso!');
                                }}
                                className="px-4 py-1.5 rounded-sm bg-[#C5A059] text-neutral-950 font-bold text-xs hover:bg-[#D4AF37] cursor-pointer"
                              >
                                Salvar Alterações
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={coord.id}
                          className={`p-4 rounded-sm border transition-all ${
                            coord.isActive !== false
                              ? 'bg-white border-neutral-200 hover:border-neutral-300'
                              : 'bg-neutral-100/70 border-neutral-200 opacity-60'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="space-y-1.5 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                {coord.category && (
                                  <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-sm bg-[#C5A059]/15 text-[#8c6b24] border border-[#C5A059]/30">
                                    {coord.category}
                                  </span>
                                )}
                                {coord.isActive === false && (
                                  <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-sm bg-neutral-200 text-neutral-600">
                                    Inativa
                                  </span>
                                )}
                              </div>
                              <h5 className="text-xs sm:text-sm font-bold text-neutral-900 leading-snug">
                                {coord.name}
                              </h5>
                              {coord.description && (
                                <p className="text-xs text-neutral-600 font-light leading-relaxed">
                                  {coord.description}
                                </p>
                              )}
                              {coord.leaderOrContact && (
                                <p className="text-[11px] text-neutral-500 font-light">
                                  Responsável: <strong className="text-neutral-700 font-medium">{coord.leaderOrContact}</strong>
                                </p>
                              )}
                              <div className="pt-1 flex items-center gap-2 text-[11px] font-mono text-neutral-500">
                                <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span className="truncate max-w-md">{coord.whatsappLink}</span>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-1.5 shrink-0 self-start">
                              <a
                                href={resolveWhatsAppGroupLink(coord.whatsappLink)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-sm text-emerald-700 hover:bg-emerald-50 border border-emerald-200 transition-colors"
                                title="Testar link no WhatsApp"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCoordId(coord.id);
                                  setEditCoordForm({
                                    name: coord.name,
                                    category: coord.category || '',
                                    description: coord.description || '',
                                    leaderOrContact: coord.leaderOrContact || '',
                                    whatsappLink: coord.whatsappLink,
                                    isActive: coord.isActive !== false,
                                  });
                                }}
                                className="p-2 rounded-sm text-neutral-700 hover:bg-neutral-100 border border-neutral-200 transition-colors cursor-pointer"
                                title="Editar Comissão"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Remover a comissão "${coord.name}"?`)) {
                                    removeCoordination(coord.id);
                                    showNotification('Comissão removida.');
                                  }
                                }}
                                className="p-2 rounded-sm text-red-600 hover:bg-red-50 border border-red-200 transition-colors cursor-pointer"
                                title="Excluir Comissão"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: REDES SOCIAIS & LINKS */}
          {activeTab === 'social' && (
            <div className="space-y-6">
              {/* Header Info & Sync */}
              <div className="p-4 rounded-sm bg-neutral-50 border border-neutral-200 text-xs text-neutral-600 font-light flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-neutral-900 text-sm mb-1 flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-[#C5A059]" />
                    <span>Canais Digitais & Redes Sociais Oficiais</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#C5A059]/20 text-[#8c6b2d] text-[10px] font-bold">
                      {data.socialLinks?.length || 0} canais publicados
                    </span>
                  </h3>
                  <p className="text-neutral-500 text-[11px]">
                    Cadastre múltiplos canais para a igreja: vários números de WhatsApp (Secretaria, Pastores, Intercessão), Instagram, YouTube, Facebook, TikTok, Spotify, Telegram e Web. Todos aparecem para os visitantes e são salvos na nuvem.
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                  <button
                    type="button"
                    onClick={async () => {
                      await syncNowWithCloud();
                      showNotification('Todos os links e canais digitais foram sincronizados com sucesso!');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1A1A] hover:bg-black text-white text-[10px] font-bold uppercase tracking-wider rounded-sm transition-all whitespace-nowrap cursor-pointer shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Sincronizar Tudo</span>
                  </button>
                  {data.socialLinks && data.socialLinks.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Tem certeza de que deseja remover todos os canais digitais? O site ficará sem redes sociais até que adicione novas.')) {
                          resetSocialLinksToDefaults();
                          showNotification('Todos os canais digitais foram removidos.');
                        }
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-sm border border-red-200 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Limpar Todos</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="p-3 bg-white border border-neutral-200 rounded-sm">
                <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">
                  Atalhos Rápidos para Criar Canais Populares:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { platform: 'WhatsApp' as SocialPlatform, label: '+ WhatsApp', defaultName: 'WhatsApp da Igreja', badge: 'Atendimento', desc: 'Atendimento direto com a equipe pastoral e secretaria' },
                    { platform: 'Instagram' as SocialPlatform, label: '+ Instagram', defaultName: 'Instagram Oficial', badge: 'Oficial', desc: 'Fotos, transmissões e avisos diários' },
                    { platform: 'YouTube' as SocialPlatform, label: '+ YouTube', defaultName: 'YouTube - Cultos Ao Vivo', badge: 'Ao Vivo', desc: 'Transmissões ao vivo dos cultos e mensagens' },
                    { platform: 'Facebook' as SocialPlatform, label: '+ Facebook', defaultName: 'Facebook Oficial', badge: 'Oficial', desc: 'Acompanhe novidades e publicações da igreja' },
                    { platform: 'TikTok' as SocialPlatform, label: '+ TikTok', defaultName: 'TikTok Oficial', badge: 'Vídeos', desc: 'Vídeos curtos, mensagens e momentos inspiradores' },
                    { platform: 'Spotify' as SocialPlatform, label: '+ Spotify / Podcast', defaultName: 'Spotify - Mensagens & Louvores', badge: 'Áudio', desc: 'Ouça mensagens bíblicas e louvores em qualquer lugar' },
                    { platform: 'Telegram' as SocialPlatform, label: '+ Telegram', defaultName: 'Canal Oficial Telegram', badge: 'Devocionais', desc: 'Devocionais diários, estudos bíblicos e avisos' },
                    { platform: 'Website' as SocialPlatform, label: '+ Site / Portal', defaultName: 'Portal Oficial', badge: 'Web', desc: 'Portal oficial da Catedral de Amor e Fé' },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setNewSocialForm({
                          platform: preset.platform,
                          name: preset.defaultName,
                          handle: preset.platform === 'WhatsApp' ? (data.whatsappNumber || '+244 ') : '@',
                          url: '',
                          description: preset.desc,
                          badgeText: preset.badge,
                        });
                        showNotification(`Formulário preenchido para ${preset.platform}. Insira o link ou telefone e clique em Adicionar!`);
                      }}
                      className="px-2.5 py-1 text-[11px] font-medium bg-neutral-100 hover:bg-[#C5A059]/15 hover:text-[#8c6b2d] hover:border-[#C5A059]/40 border border-neutral-200 rounded-sm text-neutral-700 transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form 1: Adicionar Novo Canal Individual */}
              <div className="p-4 rounded-sm bg-white border border-neutral-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-900 flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>Cadastrar Novo Canal Digital ou Rede Social</span>
                  </h4>
                  <span className="text-[10px] text-neutral-400">Você pode adicionar quantos canais desejar</span>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newSocialForm.name.trim()) {
                      alert('Por favor, informe o nome do canal (ex: WhatsApp Gabinete Pastoral, Instagram Oficial).');
                      return;
                    }
                    if (!newSocialForm.url.trim() && !newSocialForm.handle.trim()) {
                      alert('Por favor, informe o Link (URL) ou o número de WhatsApp.');
                      return;
                    }

                    let finalUrl = newSocialForm.url.trim();
                    if (newSocialForm.platform === 'WhatsApp') {
                      const rawDigits = (newSocialForm.handle || finalUrl).replace(/\D/g, '');
                      if (rawDigits && !finalUrl.startsWith('http')) {
                        finalUrl = `https://wa.me/${rawDigits}`;
                      }
                    } else if (finalUrl && !finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
                      finalUrl = `https://${finalUrl}`;
                    }

                    addSocialLink({
                      platform: newSocialForm.platform,
                      name: newSocialForm.name.trim(),
                      handle: newSocialForm.handle.trim() || (newSocialForm.platform === 'WhatsApp' ? finalUrl : '@oficial'),
                      url: finalUrl,
                      description: newSocialForm.description.trim(),
                      badgeText: newSocialForm.badgeText.trim() || 'Oficial',
                    });

                    const addedName = newSocialForm.name;
                    setNewSocialForm({
                      platform: 'WhatsApp',
                      name: '',
                      handle: '',
                      url: '',
                      description: '',
                      badgeText: '',
                    });
                    showNotification(`Canal "${addedName}" adicionado com sucesso!`);
                  }}
                  className="space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-700 block mb-1">
                        Plataforma *
                      </label>
                      <select
                        value={newSocialForm.platform}
                        onChange={(e) => {
                          const p = e.target.value as SocialPlatform;
                          setNewSocialForm((prev) => ({
                            ...prev,
                            platform: p,
                            name: prev.name || (p === 'WhatsApp' ? 'WhatsApp da Igreja' : `${p} Oficial`),
                          }));
                        }}
                        className="w-full px-3 py-2 rounded-sm bg-neutral-50 border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 font-medium"
                      >
                        <option value="WhatsApp">WhatsApp (Atendimento / Grupos)</option>
                        <option value="Instagram">Instagram</option>
                        <option value="YouTube">YouTube</option>
                        <option value="Facebook">Facebook</option>
                        <option value="TikTok">TikTok</option>
                        <option value="Spotify">Spotify / Podcast</option>
                        <option value="Telegram">Telegram</option>
                        <option value="Website">Site / Portal Oficial</option>
                        <option value="Rádio">Rádio Online / Web Rádio</option>
                        <option value="X">X (Twitter)</option>
                        <option value="Outro">Outro Link Personalizado</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-700 block mb-1">
                        Nome do Canal / Rede *
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: WhatsApp - Gabinete Pastoral, Instagram Jovens, Cultos Ao Vivo YouTube"
                        value={newSocialForm.name}
                        onChange={(e) => setNewSocialForm({ ...newSocialForm, name: e.target.value })}
                        required
                        className="w-full px-3 py-2 rounded-sm bg-white border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-700 block">
                          Link Oficial (URL) {newSocialForm.platform === 'WhatsApp' ? 'ou wa.me/' : '*'}
                        </label>
                        <span className="text-[9px] text-neutral-400">
                          {newSocialForm.platform === 'WhatsApp' ? 'Link ou https://wa.me/244...' : 'https://...'}
                        </span>
                      </div>
                      <input
                        type="text"
                        placeholder={
                          newSocialForm.platform === 'WhatsApp'
                            ? 'https://wa.me/244923847110 ou link de grupo'
                            : 'https://...'
                        }
                        value={newSocialForm.url}
                        onChange={(e) => setNewSocialForm({ ...newSocialForm, url: e.target.value })}
                        className="w-full px-3 py-2 rounded-sm bg-white border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-700 block">
                          Identificador / @handle / Telefone
                        </label>
                        <span className="text-[9px] text-neutral-400">Exibido nos cartões</span>
                      </div>
                      <input
                        type="text"
                        placeholder={
                          newSocialForm.platform === 'WhatsApp'
                            ? '+244 923 847 110'
                            : '@catedraldeamorefe'
                        }
                        value={newSocialForm.handle}
                        onChange={(e) => setNewSocialForm({ ...newSocialForm, handle: e.target.value })}
                        className="w-full px-3 py-2 rounded-sm bg-white border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-700 block mb-1">
                        Descrição Breve (Opcional)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Atendimento pastoral, pedidos de oração e aconselhamento"
                        value={newSocialForm.description}
                        onChange={(e) => setNewSocialForm({ ...newSocialForm, description: e.target.value })}
                        className="w-full px-3 py-2 rounded-sm bg-white border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-700 block mb-1">
                        Etiqueta / Badge (Ex: Oficial, Ao Vivo)
                      </label>
                      <input
                        type="text"
                        placeholder="Oficial, Ao Vivo, 24h, Juventude"
                        value={newSocialForm.badgeText}
                        onChange={(e) => setNewSocialForm({ ...newSocialForm, badgeText: e.target.value })}
                        className="w-full px-3 py-2 rounded-sm bg-white border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1A1A1A] hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-sm transition-all cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span>Adicionar Canal Digital</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Form 2: Adicionar Vários Links em Lote (Batch Import) */}
              <div className="p-4 rounded-sm bg-neutral-50/80 border border-neutral-200 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#C5A059] text-white flex items-center justify-center">
                      <Share2 className="w-3 h-3" />
                    </div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-900">
                      Publicar Vários Links em Lote (Importação em Massa)
                    </h4>
                  </div>
                  <span className="text-[10px] text-neutral-500 font-medium">
                    Cole múltiplos links (1 por linha)
                  </span>
                </div>

                <p className="text-[11px] text-neutral-600 font-light">
                  Cole vários links ou números de telefone abaixo (um em cada linha). O sistema detecta automaticamente se é WhatsApp, Instagram, YouTube, Facebook, TikTok, Spotify, Telegram ou Site e adiciona todos de uma vez só!
                </p>

                <textarea
                  rows={4}
                  placeholder={`https://wa.me/244923847110\nhttps://instagram.com/catedraldeamorefe\nhttps://youtube.com/@catedraldeamorefe\nhttps://facebook.com/catedraldeamorefe\nhttps://tiktok.com/@catedraldeamorefe\nhttps://t.me/catedraldeamorefe\nhttps://catedraldeamorefe.org`}
                  value={batchSocialUrls}
                  onChange={(e) => setBatchSocialUrls(e.target.value)}
                  className="w-full px-3 py-2 rounded-sm bg-white border border-neutral-300 text-xs font-mono text-neutral-900 focus:outline-none focus:border-neutral-900 leading-relaxed"
                />

                <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                  <div className="text-[10px] text-neutral-500">
                    Exemplo: Links de grupos de WhatsApp, perfis sociais ou canais de vídeo.
                  </div>

                  <button
                    type="button"
                    disabled={isProcessingBatchSocial || !batchSocialUrls.trim()}
                    onClick={() => {
                      if (!batchSocialUrls.trim()) {
                        alert('Por favor, cole pelo menos um link ou número de WhatsApp.');
                        return;
                      }

                      setIsProcessingBatchSocial(true);
                      try {
                        const lines = batchSocialUrls
                          .split('\n')
                          .map((l) => l.trim())
                          .filter((l) => l.length > 0);

                        if (lines.length === 0) {
                          alert('Nenhum link válido encontrado nas linhas inseridas.');
                          setIsProcessingBatchSocial(false);
                          return;
                        }

                        const newLinks: (Omit<SocialLink, 'id'> & { id?: string })[] = [];

                        lines.forEach((line, idx) => {
                          let platform: SocialPlatform = 'Website';
                          let name = '';
                          let handle = '';
                          let url = line;
                          let description = '';
                          let badgeText = 'Oficial';

                          const lower = line.toLowerCase();

                          if (lower.includes('wa.me') || lower.includes('whatsapp') || /^\+?\d[\d\s-]{6,}$/.test(line)) {
                            platform = 'WhatsApp';
                            const digits = line.replace(/\D/g, '');
                            url = digits ? `https://wa.me/${digits}` : line;
                            handle = line.startsWith('http') ? (digits ? `+${digits}` : line) : line;
                            name = `WhatsApp Oficial ${data.socialLinks.length + idx + 1}`;
                            description = 'Atendimento e contato direto com a Catedral de Amor e Fé';
                            badgeText = 'Atendimento';
                          } else if (lower.includes('instagram.com')) {
                            platform = 'Instagram';
                            const match = line.match(/instagram\.com\/([a-zA-Z0-9_.-]+)/);
                            handle = match ? `@${match[1]}` : '@catedraldeamorefe';
                            name = 'Instagram Oficial';
                            description = 'Fotos, transmissões, bastidores e avisos diários da igreja';
                          } else if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
                            platform = 'YouTube';
                            const match = line.match(/youtube\.com\/(@?[a-zA-Z0-9_.-]+)/);
                            handle = match ? match[1] : 'Canal Oficial';
                            name = 'YouTube - Cultos Ao Vivo';
                            description = 'Assista às nossas transmissões ao vivo, mensagens bíblicas e louvores';
                            badgeText = 'Ao Vivo';
                          } else if (lower.includes('facebook.com') || lower.includes('fb.com') || lower.includes('fb.watch')) {
                            platform = 'Facebook';
                            name = 'Facebook Oficial';
                            handle = 'Página da Catedral';
                            description = 'Acompanhe novidades, eventos e transmissões oficiais';
                          } else if (lower.includes('tiktok.com')) {
                            platform = 'TikTok';
                            const match = line.match(/tiktok\.com\/(@[a-zA-Z0-9_.-]+)/);
                            handle = match ? match[1] : '@catedraldeamorefe';
                            name = 'TikTok Oficial';
                            description = 'Vídeos curtos, mensagens de fé e momentos inspiradores';
                          } else if (lower.includes('spotify.com')) {
                            platform = 'Spotify';
                            name = 'Spotify & Podcasts';
                            handle = 'Catedral Play';
                            description = 'Ouça mensagens bíblicas e louvores em qualquer lugar';
                            badgeText = 'Podcasts';
                          } else if (lower.includes('t.me') || lower.includes('telegram')) {
                            platform = 'Telegram';
                            const match = line.match(/t\.me\/([a-zA-Z0-9_.-]+)/);
                            handle = match ? `@${match[1]}` : 'Canal Oficial';
                            name = 'Canal do Telegram';
                            description = 'Receba devocionais diários, avisos e estudos bíblicos';
                          } else if (lower.includes('twitter.com') || lower.includes('x.com')) {
                            platform = 'X';
                            const match = line.match(/(?:twitter|x)\.com\/([a-zA-Z0-9_.-]+)/);
                            handle = match ? `@${match[1]}` : '@catedral';
                            name = 'X (Twitter) Oficial';
                            description = 'Reflexões e notícias rápidas da Catedral de Amor e Fé';
                          } else if (lower.includes('radio') || lower.includes('fm')) {
                            platform = 'Rádio';
                            name = 'Rádio Amor e Fé Web';
                            handle = '24 Horas no Ar';
                            description = 'Programação gospel, orações e louvores sem interrupções';
                            badgeText = '24 Horas';
                          } else {
                            platform = 'Website';
                            name = `Portal Oficial ${data.socialLinks.length + idx + 1}`;
                            handle = 'Link Externo';
                            description = 'Portal oficial e informações da Catedral de Amor e Fé';
                          }

                          if (!url.startsWith('http://') && !url.startsWith('https://') && platform !== 'WhatsApp') {
                            url = `https://${url}`;
                          }

                          newLinks.push({
                            platform,
                            name,
                            handle,
                            url,
                            description,
                            badgeText,
                          });
                        });

                        addBatchSocialLinks(newLinks);
                        setBatchSocialUrls('');
                        showNotification(`${newLinks.length} canais digitais adicionados com sucesso em lote!`);
                      } catch (err) {
                        console.error(err);
                        alert('Erro ao processar links em lote.');
                      } finally {
                        setIsProcessingBatchSocial(false);
                      }
                    }}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      isProcessingBatchSocial || !batchSocialUrls.trim()
                        ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                        : 'bg-[#C5A059] hover:bg-[#b08d47] text-white shadow-xs'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isProcessingBatchSocial ? 'Adicionando...' : 'Adicionar Links em Lote'}</span>
                  </button>
                </div>
              </div>

              {/* Search & Filter Bar */}
              {data.socialLinks && data.socialLinks.length > 0 && (
                <div className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-sm border border-neutral-200">
                  <div className="flex items-center gap-2 flex-1 max-w-sm">
                    <Search className="w-3.5 h-3.5 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="Pesquisar canal por nome, @handle ou plataforma..."
                      value={socialSearchQuery}
                      onChange={(e) => setSocialSearchQuery(e.target.value)}
                      className="w-full text-xs text-neutral-900 bg-transparent focus:outline-none placeholder:text-neutral-400"
                    />
                    {socialSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setSocialSearchQuery('')}
                        className="text-neutral-400 hover:text-neutral-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="text-[11px] text-neutral-500 font-medium">
                    {data.socialLinks.filter((item) => {
                      if (!socialSearchQuery.trim()) return true;
                      const q = socialSearchQuery.toLowerCase();
                      return (
                        item.name.toLowerCase().includes(q) ||
                        item.platform.toLowerCase().includes(q) ||
                        (item.handle && item.handle.toLowerCase().includes(q)) ||
                        (item.description && item.description.toLowerCase().includes(q))
                      );
                    }).length} de {data.socialLinks.length} canais
                  </div>
                </div>
              )}

              {/* Published Social Links List */}
              {(!data.socialLinks || data.socialLinks.length === 0) ? (
                <div className="p-8 text-center bg-white border border-dashed border-neutral-300 rounded-sm space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#C5A059]/10 text-[#C5A059] flex items-center justify-center mx-auto">
                    <Share2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
                    Nenhum Canal ou Rede Social Publicada Ainda
                  </h4>
                  <p className="text-xs text-neutral-500 max-w-md mx-auto">
                    Como o site inicia limpo para o administrador configurar, utilize o formulário acima ou os atalhos rápidos para adicionar os canais oficiais da igreja (WhatsApp, Instagram, YouTube, etc.).
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.socialLinks
                    .filter((item) => {
                      if (!socialSearchQuery.trim()) return true;
                      const q = socialSearchQuery.toLowerCase();
                      return (
                        item.name.toLowerCase().includes(q) ||
                        item.platform.toLowerCase().includes(q) ||
                        (item.handle && item.handle.toLowerCase().includes(q)) ||
                        (item.description && item.description.toLowerCase().includes(q))
                      );
                    })
                    .map((social) => {
                      const isEditing = editingSocialId === social.id;
                      const isWhatsApp = social.platform === 'WhatsApp' || social.id === 'soc-whatsapp';

                      const rawNum = social.handle || data.whatsappNumber || '';
                      const cleanNum = rawNum.replace(/\D/g, '');
                      const directWhatsAppUrl = cleanNum 
                        ? `https://wa.me/${cleanNum}${data.whatsappMessage ? `?text=${encodeURIComponent(data.whatsappMessage)}` : ''}`
                        : '';

                      let targetUrl = social.url || '';
                      if (isWhatsApp && !targetUrl) {
                        targetUrl = directWhatsAppUrl;
                      }

                      return (
                        <div
                          key={social.id}
                          className={`p-4 rounded-sm border transition-all ${
                            isWhatsApp 
                              ? 'bg-emerald-50/40 border-emerald-300' 
                              : 'bg-white border-neutral-200 hover:border-neutral-300 shadow-xs'
                          }`}
                        >
                          {isEditing && editingSocialForm ? (
                            /* Inline Edit Form */
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                let finalUrl = editingSocialForm.url.trim();
                                if (editingSocialForm.platform === 'WhatsApp') {
                                  const rawDigits = (editingSocialForm.handle || finalUrl).replace(/\D/g, '');
                                  if (rawDigits && !finalUrl.startsWith('http')) {
                                    finalUrl = `https://wa.me/${rawDigits}`;
                                  }
                                } else if (finalUrl && !finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
                                  finalUrl = `https://${finalUrl}`;
                                }

                                updateSocialLink(social.id, {
                                  ...editingSocialForm,
                                  url: finalUrl,
                                });
                                setEditingSocialId(null);
                                setEditingSocialForm(null);
                                showNotification(`Canal "${editingSocialForm.name}" atualizado com sucesso!`);
                              }}
                              className="space-y-3"
                            >
                              <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                                <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                                  Editar Canal: {social.name}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingSocialId(null);
                                    setEditingSocialForm(null);
                                  }}
                                  className="text-neutral-400 hover:text-neutral-600 text-xs"
                                >
                                  Cancelar
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                  <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-700 block mb-1">
                                    Plataforma
                                  </label>
                                  <select
                                    value={editingSocialForm.platform}
                                    onChange={(e) => setEditingSocialForm({ ...editingSocialForm, platform: e.target.value as SocialPlatform })}
                                    className="w-full px-2.5 py-1.5 rounded-sm bg-neutral-50 border border-neutral-300 text-xs font-medium"
                                  >
                                    <option value="WhatsApp">WhatsApp</option>
                                    <option value="Instagram">Instagram</option>
                                    <option value="YouTube">YouTube</option>
                                    <option value="Facebook">Facebook</option>
                                    <option value="TikTok">TikTok</option>
                                    <option value="Spotify">Spotify / Podcast</option>
                                    <option value="Telegram">Telegram</option>
                                    <option value="Website">Site / Portal</option>
                                    <option value="Rádio">Rádio Online</option>
                                    <option value="X">X (Twitter)</option>
                                    <option value="Outro">Outro</option>
                                  </select>
                                </div>

                                <div className="sm:col-span-2">
                                  <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-700 block mb-1">
                                    Nome do Canal *
                                  </label>
                                  <input
                                    type="text"
                                    value={editingSocialForm.name}
                                    onChange={(e) => setEditingSocialForm({ ...editingSocialForm, name: e.target.value })}
                                    required
                                    className="w-full px-2.5 py-1.5 rounded-sm bg-white border border-neutral-300 text-xs"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-700 block mb-1">
                                    Link URL Oficial *
                                  </label>
                                  <input
                                    type="text"
                                    value={editingSocialForm.url}
                                    onChange={(e) => setEditingSocialForm({ ...editingSocialForm, url: e.target.value })}
                                    required
                                    className="w-full px-2.5 py-1.5 rounded-sm bg-white border border-neutral-300 text-xs font-mono"
                                  />
                                </div>

                                <div>
                                  <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-700 block mb-1">
                                    Identificador / @handle / Telefone
                                  </label>
                                  <input
                                    type="text"
                                    value={editingSocialForm.handle}
                                    onChange={(e) => setEditingSocialForm({ ...editingSocialForm, handle: e.target.value })}
                                    className="w-full px-2.5 py-1.5 rounded-sm bg-white border border-neutral-300 text-xs"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="sm:col-span-2">
                                  <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-700 block mb-1">
                                    Descrição Breve
                                  </label>
                                  <input
                                    type="text"
                                    value={editingSocialForm.description || ''}
                                    onChange={(e) => setEditingSocialForm({ ...editingSocialForm, description: e.target.value })}
                                    className="w-full px-2.5 py-1.5 rounded-sm bg-white border border-neutral-300 text-xs"
                                  />
                                </div>

                                <div>
                                  <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-700 block mb-1">
                                    Etiqueta / Badge
                                  </label>
                                  <input
                                    type="text"
                                    value={editingSocialForm.badgeText || ''}
                                    onChange={(e) => setEditingSocialForm({ ...editingSocialForm, badgeText: e.target.value })}
                                    className="w-full px-2.5 py-1.5 rounded-sm bg-white border border-neutral-300 text-xs"
                                  />
                                </div>
                              </div>

                              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingSocialId(null);
                                    setEditingSocialForm(null);
                                  }}
                                  className="px-3 py-1.5 text-xs text-neutral-600 hover:text-neutral-900"
                                >
                                  Cancelar
                                </button>
                                <button
                                  type="submit"
                                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1A1A1A] hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-sm transition-all"
                                >
                                  <Save className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Salvar Alterações</span>
                                </button>
                              </div>
                            </form>
                          ) : (
                            /* Regular Card View */
                            <div className="space-y-3">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2.5">
                                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white ${
                                    isWhatsApp ? 'bg-emerald-600' :
                                    social.platform === 'Instagram' ? 'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600' :
                                    social.platform === 'YouTube' ? 'bg-red-600' :
                                    social.platform === 'Facebook' ? 'bg-blue-600' :
                                    social.platform === 'Spotify' ? 'bg-emerald-700' :
                                    social.platform === 'Telegram' ? 'bg-sky-500' :
                                    social.platform === 'TikTok' ? 'bg-neutral-900' :
                                    'bg-[#C5A059]'
                                  }`}>
                                    {isWhatsApp ? <MessageCircle className="w-4 h-4 fill-current" /> :
                                     social.platform === 'Instagram' ? <Share2 className="w-4 h-4" /> :
                                     social.platform === 'YouTube' ? <Video className="w-4 h-4" /> :
                                     social.platform === 'Facebook' ? <Share2 className="w-4 h-4" /> :
                                     social.platform === 'Spotify' ? <Headphones className="w-4 h-4" /> :
                                     social.platform === 'Telegram' ? <Send className="w-4 h-4" /> :
                                     social.platform === 'TikTok' ? <Music2 className="w-4 h-4" /> :
                                     <Globe className="w-4 h-4" />}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                                        {social.name}
                                      </h4>
                                      <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-neutral-100 text-neutral-600 font-semibold">
                                        {social.platform}
                                      </span>
                                      {social.badgeText && (
                                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#C5A059]/15 text-[#8c6b2d] font-bold">
                                          {social.badgeText}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-neutral-500 font-mono">
                                      {social.handle || 'Sem handle'}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingSocialId(social.id);
                                      setEditingSocialForm({ ...social });
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-neutral-700 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-sm transition-colors"
                                  >
                                    <Pencil className="w-3 h-3 text-neutral-500" />
                                    <span>Editar</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (confirm(`Remover o canal "${social.name}"?`)) {
                                        removeSocialLink(social.id);
                                        showNotification(`Canal "${social.name}" removido.`);
                                      }
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-sm transition-colors"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>Excluir</span>
                                  </button>
                                </div>
                              </div>

                              {social.description && (
                                <p className="text-xs text-neutral-600 font-light bg-neutral-50/50 p-2 rounded-sm border border-neutral-100">
                                  {social.description}
                                </p>
                              )}

                              {/* Target URL & Live Test Link */}
                              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-neutral-100">
                                <div className="flex items-center gap-1.5 text-[11px] text-neutral-600 truncate flex-1 min-w-0">
                                  <span className="font-bold text-[10px] uppercase tracking-wider flex-shrink-0 text-neutral-800">
                                    Link / Destino:
                                  </span>
                                  <code className="bg-white px-2 py-0.5 rounded text-[11px] text-neutral-900 font-mono border border-neutral-200 truncate">
                                    {targetUrl || 'Nenhum link definido'}
                                  </code>
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {targetUrl && (
                                    <a
                                      href={targetUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white px-3 py-1.5 rounded-sm transition-colors whitespace-nowrap shadow-xs ${
                                        isWhatsApp 
                                          ? 'bg-emerald-600 hover:bg-emerald-700' 
                                          : 'bg-[#1A1A1A] hover:bg-black'
                                      }`}
                                    >
                                      <span>Testar Link</span>
                                      <ExternalLink className="w-3 h-3 text-white" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: DADOS DA IGREJA & WHATSAPP */}
          {activeTab === 'church' && (
            <form onSubmit={handleSaveChurchInfo} className="space-y-5">
              {/* SEÇÃO DEDICADA: LOGOTIPO & CABEÇALHO */}
              <div className="p-4 rounded-sm bg-neutral-900 text-white border border-neutral-700 space-y-4 shadow-sm">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Church className="w-4 h-4 text-[#C5A059]" />
                    <label className="text-xs font-bold uppercase tracking-widest text-white">
                      Identidade Visual do Cabeçalho & Logotipo (Barra Superior)
                    </label>
                  </div>
                  <span className="text-[9px] uppercase tracking-wider bg-[#C5A059]/20 text-[#C5A059] px-2 py-0.5 rounded font-bold border border-[#C5A059]/40">
                    Topo do Site (Navbar)
                  </span>
                </div>

                <p className="text-[11px] text-neutral-300 font-light leading-relaxed">
                  Personalize o logotipo, o ícone/imagem e os textos que aparecem no canto superior esquerdo da barra de navegação.
                </p>

                {/* Live Preview of Header Logo */}
                <div className="p-4 bg-white rounded-sm border border-neutral-300 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-10 h-10 rounded-sm bg-[#1A1A1A] flex items-center justify-center text-white shadow-xs relative overflow-hidden shrink-0">
                      {churchForm.logoImageUrl && churchForm.logoImageUrl.trim() !== '' ? (
                        <Image
                          src={churchForm.logoImageUrl}
                          alt="Logo Preview"
                          fill
                          sizes="40px"
                          className="object-contain p-0.5"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Church className="w-5 h-5 text-white stroke-[2]" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] tracking-[0.3em] font-light text-neutral-400 uppercase leading-tight">
                        {churchForm.logoPrefix || 'Catedral de'}
                      </span>
                      <span className="text-base sm:text-lg font-bold tracking-tighter leading-none text-neutral-900">
                        {churchForm.logoSuffix || 'Amor e Fé'}
                      </span>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-neutral-400 border border-neutral-200 px-2.5 py-1 rounded-sm bg-neutral-50">
                      Pré-visualização do Topo
                    </span>
                  </div>
                </div>

                {/* Hidden File Input for Church Logo */}
                <input
                  type="file"
                  ref={logoFileInputRef}
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleProcessLogoFile(file);
                    e.target.value = '';
                  }}
                  className="hidden"
                />

                {/* Upload & Image Controls */}
                <div className="p-3 bg-neutral-800/80 rounded-sm border border-neutral-700 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#C5A059] flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5" />
                      Ícone ou Imagem do Logotipo
                    </label>
                    {churchForm.logoImageUrl && (
                      <button
                        type="button"
                        onClick={() => setChurchForm({ ...churchForm, logoImageUrl: '' })}
                        className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1 underline cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        Usar Ícone Padrão
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                    <div className="sm:col-span-5">
                      <button
                        type="button"
                        onClick={() => logoFileInputRef.current?.click()}
                        disabled={isLogoUploading}
                        className="w-full h-9 px-3 rounded-sm bg-[#C5A059] hover:bg-[#b08e4d] text-neutral-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                      >
                        {isLogoUploading ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            A Carregar Imagem...
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-3.5 h-3.5" />
                            Carregar Imagem de Logo
                          </>
                        )}
                      </button>
                    </div>

                    <div className="sm:col-span-7">
                      <input
                        type="url"
                        value={churchForm.logoImageUrl || ''}
                        onChange={(e) => setChurchForm({ ...churchForm, logoImageUrl: e.target.value })}
                        placeholder="Ou cole a URL da imagem do logotipo (PNG/JPG)..."
                        className="w-full h-9 px-3 rounded-sm bg-neutral-900 border border-neutral-700 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#C5A059]"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-300 block mb-1">
                      Prefixo do Logotipo (Texto Superior Menor) *
                    </label>
                    <input
                      type="text"
                      value={churchForm.logoPrefix || ''}
                      onChange={(e) => setChurchForm({ ...churchForm, logoPrefix: e.target.value })}
                      placeholder="Ex: Catedral de ou Igreja"
                      className="w-full px-3 py-2 rounded-sm bg-neutral-800 border border-neutral-600 text-xs text-white focus:outline-none focus:border-[#C5A059]"
                    />
                    <span className="text-[10px] text-neutral-400 mt-0.5 block">
                      Texto menor com espaçamento largo acima do nome principal
                    </span>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-300 block mb-1">
                      Nome Principal do Logotipo (Texto em Destaque) *
                    </label>
                    <input
                      type="text"
                      value={churchForm.logoSuffix || ''}
                      onChange={(e) => setChurchForm({ ...churchForm, logoSuffix: e.target.value })}
                      placeholder="Ex: Amor e Fé ou Dunamis Angola"
                      className="w-full px-3 py-2 rounded-sm bg-neutral-800 border border-neutral-600 text-xs text-white focus:outline-none focus:border-[#C5A059] font-bold"
                    />
                    <span className="text-[10px] text-neutral-400 mt-0.5 block">
                      Texto principal em destaque negrito
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-700 block mb-1">
                    Nome Oficial Completo da Igreja
                  </label>
                  <input
                    type="text"
                    value={churchForm.churchName}
                    onChange={(e) => setChurchForm({ ...churchForm, churchName: e.target.value })}
                    className="w-full px-3 py-2 rounded-sm bg-neutral-50 border border-neutral-300 text-xs text-neutral-900 focus:border-black"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-700 block mb-1">
                    Lema / Frase de Missão
                  </label>
                  <input
                    type="text"
                    value={churchForm.churchMotto}
                    onChange={(e) => setChurchForm({ ...churchForm, churchMotto: e.target.value })}
                    className="w-full px-3 py-2 rounded-sm bg-neutral-50 border border-neutral-300 text-xs text-neutral-900 focus:border-black"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-700 block mb-1">
                    Número do WhatsApp (com DDI e DDD)
                  </label>
                  <input
                    type="text"
                    value={churchForm.whatsappNumber}
                    onChange={(e) => setChurchForm({ ...churchForm, whatsappNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-sm bg-neutral-50 border border-neutral-300 text-xs text-neutral-900 focus:border-black"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-700 block mb-1">
                    E-mail Oficial
                  </label>
                  <input
                    type="email"
                    value={churchForm.email}
                    onChange={(e) => setChurchForm({ ...churchForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-sm bg-neutral-50 border border-neutral-300 text-xs text-neutral-900 focus:border-black"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-700 block mb-1">
                    Sobre a Igreja / Comunidade
                  </label>
                  <textarea
                    rows={3}
                    value={churchForm.churchAbout || ''}
                    onChange={(e) => setChurchForm({ ...churchForm, churchAbout: e.target.value })}
                    placeholder="Descrição institucional exibida no rodapé e sobre a igreja..."
                    className="w-full px-3 py-2 rounded-sm bg-neutral-50 border border-neutral-300 text-xs text-neutral-900 focus:border-black"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-700 block mb-1">
                    Mensagem Padrão do WhatsApp
                  </label>
                  <input
                    type="text"
                    value={churchForm.whatsappMessage}
                    onChange={(e) => setChurchForm({ ...churchForm, whatsappMessage: e.target.value })}
                    className="w-full px-3 py-2 rounded-sm bg-neutral-50 border border-neutral-300 text-xs text-neutral-900 focus:border-black"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-700 block mb-1">
                    Endereço Completo & Localização
                  </label>
                  <input
                    type="text"
                    value={churchForm.address}
                    onChange={(e) => setChurchForm({ ...churchForm, address: e.target.value })}
                    className="w-full px-3 py-2 rounded-sm bg-neutral-50 border border-neutral-300 text-xs text-neutral-900 focus:border-black"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-sm font-bold text-[10px] uppercase tracking-widest text-white bg-[#1A1A1A] hover:bg-[#C5A059] transition-all shadow-sm cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar Dados da Igreja</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 7: NUVEM, VERCEL & SINCRONIZAÇÃO GLOBAL */}
          {activeTab === 'cloud' && (
            <div className="space-y-6">
              {/* Quota Exceeded Notice Card if reached */}
              {isQuotaExceeded && (
                <div className="p-4 rounded-sm bg-amber-950/20 border border-amber-500/40 text-neutral-800">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-sm bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0 border border-amber-500/30">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-2">
                          <span>Limite Diário de Gravação Gratuita do Firestore Atingido</span>
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 border border-amber-500/40 font-semibold">
                            Quota Excedida
                          </span>
                        </h4>
                        <a
                          href={firebaseConsoleUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:text-amber-900 underline"
                        >
                          <span>Abrir Firebase Console</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <p className="text-xs text-neutral-600 font-light mt-1 leading-relaxed">
                        O limite de unidades diárias gratuitas de gravação do Firestore no projeto <strong>{firebaseProjectId}</strong> foi atingido para hoje. 
                        <strong> Seus dados continuam 100% salvos e protegidos localmente neste navegador.</strong> A cota reinicia automaticamente no início do próximo dia.
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <a
                          href={firebaseConsoleUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Atualizar Plano no Firebase</span>
                        </a>
                        <button
                          type="button"
                          onClick={async () => {
                            showNotification('Tentando sincronizar com a Nuvem...');
                            const ok = await syncNowWithCloud();
                            if (ok) {
                              showNotification('✓ Sincronizado com sucesso com o Firestore!');
                            } else {
                              showNotification('A cota ainda está esgotada para hoje. Dados salvos localmente.');
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-neutral-200 hover:bg-neutral-300 text-neutral-800 text-[10px] font-bold uppercase tracking-wider transition-colors"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Testar Conexão Novamente</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Status Header Box */}
              <div className="p-5 rounded-sm bg-neutral-900 text-white border border-neutral-800 shadow-md">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-sm bg-[#C5A059]/20 text-[#C5A059] flex items-center justify-center shrink-0 border border-[#C5A059]/30">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold tracking-wide text-white flex items-center gap-2">
                        <span>Sincronização em Tempo Real (Vercel, Celulares e Outros Navegadores)</span>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full border ${isQuotaExceeded ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'}`}>
                          {isQuotaExceeded ? 'Modo Offline / Local' : 'Nuvem Ativa'}
                        </span>
                      </h3>
                      <p className="text-xs text-neutral-400 font-light mt-1 max-w-2xl leading-relaxed">
                        Todas as informações alteradas aqui são salvas com segurança. Qualquer visitante em <strong>cruzadadodr.vercel.app</strong>, no Chrome, Safari, Edge ou telemóvel recebe as atualizações instantaneamente.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      showNotification('A sincronizar com a Nuvem e Vercel...');
                      const ok = await syncNowWithCloud();
                      if (ok) {
                        showNotification('✓ Sucesso! Dados salvos na nuvem. Todos os navegadores e Vercel já estão sincronizados.');
                      } else {
                        showNotification('Dados gravados localmente e na fila da nuvem.');
                      }
                    }}
                    className="flex items-center justify-center gap-2 px-5 py-3 rounded-sm font-bold text-xs uppercase tracking-wider text-black bg-[#C5A059] hover:bg-[#D4AF37] transition-all shadow-lg cursor-pointer shrink-0"
                  >
                    <RefreshCw className={`w-4 h-4 ${syncState === 'syncing' ? 'animate-spin' : ''}`} />
                    <span>Sincronizar Tudo com Vercel Agora</span>
                  </button>
                </div>
              </div>

              {/* Step by Step Explanation for Vercel */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-sm border border-neutral-200 bg-neutral-50/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="w-4 h-4 text-[#C5A059]" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                      1. Banco de Dados na Nuvem (Automático)
                    </h4>
                  </div>
                  <p className="text-xs text-neutral-600 font-light leading-relaxed">
                    Sempre que você clica em <strong>Salvar</strong> em qualquer aba deste painel, o sistema transmite os textos, fotos e vídeos para o Firestore do projeto <strong>{firebaseProjectId}</strong>. O Vercel consulta esta mesma base e atualiza a tela sem você precisar mexer em código.
                  </p>
                </div>

                <div className="p-4 rounded-sm border border-neutral-200 bg-neutral-50/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Cloud className="w-4 h-4 text-[#C5A059]" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                      2. Exportação para Deploy no GitHub / Vercel
                    </h4>
                  </div>
                  <p className="text-xs text-neutral-600 font-light leading-relaxed">
                    Se você deseja que o código fonte do repositório no GitHub já venha com todos os seus textos pré-configurados como padrão de fábrica, utilize o botão de exportação abaixo.
                  </p>
                </div>
              </div>

              {/* Quick JSON Export / Backup */}
              <div className="p-4 rounded-sm border border-neutral-200 bg-white space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                      <Download className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span>Backup & Exportação dos Dados Atuais</span>
                    </h4>
                    <p className="text-[11px] text-neutral-500 font-light mt-0.5">
                      Copie ou baixe o arquivo JSON com todo o conteúdo atual da catedral para guardar ou importar no código.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const jsonStr = JSON.stringify(data, null, 2);
                        navigator.clipboard?.writeText(jsonStr);
                        showNotification('✓ JSON copiado para a área de transferência!');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-sm border border-neutral-300 bg-neutral-50 hover:bg-neutral-100 text-neutral-800 text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 text-neutral-600" />
                      <span>Copiar JSON</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const jsonStr = JSON.stringify(data, null, 2);
                        const blob = new Blob([jsonStr], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `catedral_dados_${new Date().toISOString().slice(0, 10)}.json`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        showNotification('✓ Ficheiro de backup baixado com sucesso!');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-sm bg-[#1A1A1A] hover:bg-[#C5A059] text-white text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Baixar Ficheiro</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-500 font-light">
          <button
            onClick={() => {
              if (confirm('Deseja restaurar os dados de exemplo padrão?')) {
                resetToDefaults();
                showNotification('Dados restaurados para o padrão original.');
              }
            }}
            className="flex items-center gap-1.5 text-neutral-500 hover:text-black transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Demonstração Inicial</span>
          </button>

          <button
            onClick={() => setIsAdminOpen(false)}
            className="px-4 py-2 rounded-sm bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-semibold text-xs transition-colors cursor-pointer"
          >
            Fechar Painel
          </button>
        </div>
      </div>
    </div>
  );
}
