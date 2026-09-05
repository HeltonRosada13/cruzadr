'use client';

import React, { useState } from 'react';
import { useChurch } from '@/lib/ChurchContext';
import { resolveWhatsAppGroupLink } from '@/lib/utils';
import { 
  Users, 
  MessageSquare, 
  ExternalLink, 
  Copy, 
  Check, 
  X, 
  Search, 
  Music, 
  ShieldCheck, 
  Flame, 
  HeartHandshake,
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';

interface CoordinationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CoordinationsModal({ isOpen, onClose }: CoordinationsModalProps) {
  const { data } = useChurch();
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const coordinations = (data.coordinations && data.coordinations.length > 0)
    ? data.coordinations.filter(c => c.isActive !== false)
    : [];

  const filtered = coordinations.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.category && c.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCopyLink = (id: string, link: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(link);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const getCategoryIcon = (category?: string, name?: string) => {
    const text = `${category || ''} ${name || ''}`.toLowerCase();
    if (text.includes('músic') || text.includes('louvor') || text.includes('coral') || text.includes('canto')) {
      return <Music className="w-4 h-4 text-[#C5A059]" />;
    }
    if (text.includes('protocol') || text.includes('ordem') || text.includes('segurança') || text.includes('recep')) {
      return <ShieldCheck className="w-4 h-4 text-blue-400" />;
    }
    if (text.includes('evang') || text.includes('missõ') || text.includes('fogo') || text.includes('rua')) {
      return <Flame className="w-4 h-4 text-amber-500" />;
    }
    if (text.includes('comunh') || text.includes('social') || text.includes('apoio') || text.includes('saúde')) {
      return <HeartHandshake className="w-4 h-4 text-emerald-400" />;
    }
    return <Users className="w-4 h-4 text-[#C5A059]" />;
  };

  return (
    <div
      id="coordinations-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="coordinations-modal-container"
        className="bg-neutral-950 border border-neutral-800 rounded-sm w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-white animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 border-b border-neutral-800 relative">
          <button
            id="close-coordinations-modal-btn"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 rounded-sm transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/40">
              <Users className="w-3 h-3" />
              Grupos Oficiais no WhatsApp
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-editorial italic text-white tracking-tight font-normal">
            Coordenações & Comissões da Cruzada
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 font-light mt-1 max-w-xl leading-relaxed">
            Faça parte da equipe activa da <span className="text-white font-medium">{data.currentActivity?.name || 'Grande Cruzada de Milagres'}</span>. Seleccione a sua área de actuação para ingressar directamente no grupo oficial.
          </p>

          {/* Search bar */}
          {coordinations.length > 2 && (
            <div className="mt-4 relative">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Pesquisar por comissão, ministério ou área (ex: Música, Protocolo, Evangelização)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-neutral-900/90 border border-neutral-700 rounded-sm text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#C5A059] transition-colors"
              />
            </div>
          )}
        </div>

        {/* Content list */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3.5 custom-scrollbar flex-1 bg-neutral-950">
          {filtered.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-neutral-800 rounded-sm">
              <Layers className="w-10 h-10 text-neutral-600 mx-auto mb-3 stroke-[1.5]" />
              <p className="text-sm text-neutral-300 font-medium">Nenhuma comissão encontrada</p>
              <p className="text-xs text-neutral-500 mt-1">
                {searchTerm ? 'Tente buscar por outros termos.' : 'Nenhuma coordenação activa no momento.'}
              </p>
            </div>
          ) : (
            filtered.map((coord, index) => {
              const whatsappUrl = resolveWhatsAppGroupLink(coord.whatsappLink);

              return (
                <div
                  key={coord.id || index}
                  id={`coordination-card-${coord.id || index}`}
                  className="p-4 sm:p-5 rounded-sm bg-neutral-900/80 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all duration-200 space-y-3 group"
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-sm bg-black/60 border border-neutral-800 flex items-center justify-center shrink-0 mt-0.5 group-hover:border-[#C5A059]/40 transition-colors">
                        {getCategoryIcon(coord.category, coord.name)}
                      </div>
                      <div>
                        {coord.category && (
                          <span className="text-[10px] uppercase font-bold tracking-wider text-[#C5A059] block mb-0.5">
                            {coord.category}
                          </span>
                        )}
                        <h3 className="text-sm sm:text-base font-bold text-white leading-snug group-hover:text-[#F3E5AB] transition-colors">
                          {coord.name}
                        </h3>
                      </div>
                    </div>
                  </div>

                  {coord.description && (
                    <p className="text-xs text-neutral-400 font-light leading-relaxed pl-12">
                      {coord.description}
                    </p>
                  )}

                  {coord.leaderOrContact && (
                    <div className="pl-12 text-[11px] text-neutral-400 flex items-center gap-1.5 font-light">
                      <Info className="w-3 h-3 text-[#C5A059]" />
                      <span>Responsável: <strong className="text-neutral-200 font-normal">{coord.leaderOrContact}</strong></span>
                    </div>
                  )}

                  <div className="pt-2 sm:pl-12 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-sm bg-[#25D366] hover:bg-[#20ba59] text-neutral-950 font-bold text-xs uppercase tracking-wider transition-all transform hover:-translate-y-0.5 shadow-sm cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4 fill-current" />
                      <span>Entrar no Grupo do WhatsApp</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                    </a>

                    <button
                      type="button"
                      onClick={() => handleCopyLink(coord.id, whatsappUrl)}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-sm bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 text-xs font-semibold tracking-wide transition-colors cursor-pointer"
                      title="Copiar link de convite"
                    >
                      {copiedId === coord.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-neutral-400" />
                          <span>Copiar Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 bg-neutral-900 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-xs text-neutral-400">
          <p className="font-light">
            Não encontrou a sua área ou precisa de suporte? Fale com a nossa equipa central.
          </p>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
            <a
              href={`https://wa.me/${data.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent('Olá, preciso de orientações sobre as coordenações da Cruzada.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-sm bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs border border-neutral-700 inline-flex items-center gap-1.5 transition-colors"
            >
              <span>Suporte Geral</span>
              <ArrowRight className="w-3 h-3" />
            </a>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-sm bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
