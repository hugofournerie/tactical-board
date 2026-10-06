'use client';

import React, { useState, useEffect } from 'react';
// Importe ici tes autres composants habituels (ton terrain Konva, tes listes, etc.)
// Exemple : import TacticalBoard from '@/components/TacticalBoard';

export default function Page() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fonction pour basculer en mode plein écran
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error("Erreur lors du passage en plein écran :", err);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Écouteur pour la touche 'F' du clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Évite de déclencher si l'utilisateur tape dans un champ de saisie (input / select)
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
    // min-h-screen et overflow-y-auto permettent le défilement complet sur mobile
    <main className="min-h-screen overflow-y-auto bg-gray-900 text-white p-4 flex flex-col">
      
      {/* Barre supérieure avec le titre et le bouton Plein écran */}
      <div className="flex justify-between items-center mb-4 max-w-7xl mx-auto w-full">
        <h1 className="text-xl font-bold">Tableau Tactique PWA</h1>
        <button
          onClick={toggleFullscreen}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors shadow"
        >
          {isFullscreen ? 'Quitter Plein écran' : 'Plein écran (F)'}
        </button>
      </div>

      {/* Contenu principal de ton application (ton terrain Konva / tes sélecteurs) */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-7xl mx-auto pb-8">
        {/* Insère ton composant de terrain ou ton code existant ici */}
        <div className="w-full bg-gray-800 rounded-lg p-4 shadow-lg text-center">
          <p className="text-gray-400 mb-2">Espace de ton terrain tactique</p>
          {/* <TacticalBoard /> */}
        </div>
      </div>

    </main>
  );
}