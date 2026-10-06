'use client';

import React, { useState, useEffect } from 'react';
// 1. Remets tes propres imports ici (par exemple ton composant de terrain Konva ou tes états)

export default function Page() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fonction plein écran sécurisée (fonctionne sur PC, ignore proprement sur iPhone si non supporté)
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch((err) => {
          console.error("Plein écran non supporté", err);
        });
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Raccourci clavier 'F' pour le PC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        e.key.toLowerCase() === 'f' &&
        target?.tagName !== 'INPUT' &&
        target?.tagName !== 'SELECT' &&
        target?.tagName !== 'TEXTAREA'
      ) {
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    // min-h-screen et overflow-y-auto garantissent que le site peut défiler verticalement sur mobile
    <main className="min-h-screen overflow-y-auto bg-gray-900 text-white p-4">
      
      {/* Barre d'outils (Titre + Bouton Plein écran visible sur PC) */}
      <div className="flex justify-between items-center mb-4 max-w-7xl mx-auto w-full">
        <h1 className="text-xl font-bold">Tableau Tactique PWA</h1>
        <button
          onClick={toggleFullscreen}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors shadow"
        >
          {isFullscreen ? 'Quitter Plein écran' : 'Plein écran (F)'}
        </button>
      </div>

      {/* 2. TON VRAI TERRAIN ET TON CODE TACTIQUE VIENNENT ICI */}
      <div className="w-full max-w-7xl mx-auto flex flex-col items-center pb-12">
        {/* Colle ici l'intérieur de ton application (ton Konva stage, tes menus déroulants, etc.) */}
        
      </div>

    </main>
  );
}