'use client';
// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Rect, Circle, Text, Group } from 'react-konva';

interface Player {
  id: string;
  x: number;
  y: number;
  number: string;
  color: string;
  name: string;
}

const MIN_DISTANCE = 44;
const DESIGN_WIDTH = 800;
const DESIGN_HEIGHT = 500;

const DEFAULT_FORMATIONS = [
  { key: '4-3-3', team: 'PSG' },
  { key: '4-4-2', team: 'Real Madrid' },
  { key: '4-2-3-1', team: 'Bayern Munich' },
  { key: '4-3-1-2', team: 'Real Madrid' },
  { key: '4-1-4-1', team: 'Manchester City' },
  { key: '3-4-3', team: 'Chelsea' },
  { key: '3-4-2-1', team: 'Bayer Leverkusen' },
  { key: '3-5-2', team: 'Inter Milan' },
  { key: '5-2-3', team: 'FCVB' },
  { key: '5-3-2', team: 'Inter Milan' },
  { key: '5-4-1', team: 'Atlético Madrid' },
  { key: '4-5-1', team: 'Arsenal' },
];

const resolveCollisions = (playerList: Player[]): Player[] => {
  const result = [...playerList];
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const dx = result[j].x - result[i].x;
        const dy = result[j].y - result[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < MIN_DISTANCE) {
          const overlap = MIN_DISTANCE - dist;
          const angle = dist === 0 ? Math.PI / 4 : Math.atan2(dy, dx);
          const shiftX = Math.cos(angle) * (overlap / 2 + 1);
          const shiftY = Math.sin(angle) * (overlap / 2 + 1);

          result[i] = {
            ...result[i],
            x: Math.max(30, Math.min(770, result[i].x - shiftX)),
            y: Math.max(30, Math.min(470, result[i].y - shiftY)),
          };
          result[j] = {
            ...result[j],
            x: Math.max(30, Math.min(770, result[j].x + shiftX)),
            y: Math.max(30, Math.min(470, result[j].y + shiftY)),
          };
        }
      }
    }
  }
  return result;
};

const FORMATIONS_BLUE: Record<string, { x: number; y: number; number: string; name: string }[]> = {
  '4-3-3': [
    { x: 60, y: 250, number: '1', name: 'Gardien' },
    { x: 180, y: 80, number: '2', name: 'Défenseur D' },
    { x: 150, y: 190, number: '4', name: 'Stoppeur' },
    { x: 150, y: 310, number: '5', name: 'Stoppeur' },
    { x: 180, y: 420, number: '3', name: 'Défenseur G' },
    { x: 260, y: 250, number: '6', name: 'Milieu Déf' },
    { x: 310, y: 150, number: '8', name: 'Milieu C' },
    { x: 310, y: 350, number: '10', name: 'Milieu Off' },
    { x: 370, y: 100, number: '7', name: 'Ailier D' },
    { x: 380, y: 250, number: '9', name: 'Attaquant' },
    { x: 370, y: 400, number: '11', name: 'Ailier G' },
  ],
  '4-4-2': [
    { x: 60, y: 250, number: '1', name: 'Gardien' },
    { x: 180, y: 80, number: '2', name: 'Défenseur D' },
    { x: 150, y: 190, number: '4', name: 'Stoppeur' },
    { x: 150, y: 310, number: '5', name: 'Stoppeur' },
    { x: 180, y: 420, number: '3', name: 'Défenseur G' },
    { x: 280, y: 80, number: '7', name: 'Milieu D' },
    { x: 270, y: 200, number: '6', name: 'Milieu C' },
    { x: 270, y: 300, number: '8', name: 'Milieu C' },
    { x: 280, y: 420, number: '11', name: 'Milieu G' },
    { x: 370, y: 180, number: '9', name: 'Attaquant' },
    { x: 370, y: 320, number: '10', name: 'Attaquant' },
  ],
  '4-2-3-1': [
    { x: 60, y: 250, number: '1', name: 'Gardien' },
    { x: 180, y: 80, number: '2', name: 'Défenseur D' },
    { x: 150, y: 190, number: '4', name: 'Stoppeur' },
    { x: 150, y: 310, number: '5', name: 'Stoppeur' },
    { x: 180, y: 420, number: '3', name: 'Défenseur G' },
    { x: 250, y: 190, number: '6', name: 'Milieu Déf' },
    { x: 250, y: 310, number: '8', name: 'Milieu Déf' },
    { x: 310, y: 90, number: '7', name: 'Ailier D' },
    { x: 310, y: 250, number: '10', name: 'Milieu Off' },
    { x: 310, y: 410, number: '11', name: 'Ailier G' },
    { x: 380, y: 250, number: '9', name: 'Attaquant' },
  ],
  '4-3-1-2': [
    { x: 60, y: 250, number: '1', name: 'Gardien' },
    { x: 180, y: 80, number: '2', name: 'Défenseur D' },
    { x: 150, y: 190, number: '4', name: 'Stoppeur' },
    { x: 150, y: 310, number: '5', name: 'Stoppeur' },
    { x: 180, y: 420, number: '3', name: 'Défenseur G' },
    { x: 250, y: 120, number: '8', name: 'Milieu C' },
    { x: 240, y: 250, number: '6', name: 'Milieu Déf' },
    { x: 250, y: 380, number: '7', name: 'Milieu C' },
    { x: 310, y: 250, number: '10', name: 'Milieu Off' },
    { x: 370, y: 180, number: '9', name: 'Attaquant' },
    { x: 370, y: 320, number: '11', name: 'Attaquant' },
  ],
  '4-1-4-1': [
    { x: 60, y: 250, number: '1', name: 'Gardien' },
    { x: 180, y: 80, number: '2', name: 'Défenseur D' },
    { x: 150, y: 190, number: '4', name: 'Stoppeur' },
    { x: 150, y: 310, number: '5', name: 'Stoppeur' },
    { x: 180, y: 420, number: '3', name: 'Défenseur G' },
    { x: 230, y: 250, number: '6', name: 'Milieu Déf' },
    { x: 310, y: 80, number: '7', name: 'Milieu D' },
    { x: 300, y: 190, number: '8', name: 'Milieu C' },
    { x: 300, y: 310, number: '10', name: 'Milieu C' },
    { x: 310, y: 420, number: '11', name: 'Milieu G' },
    { x: 380, y: 250, number: '9', name: 'Attaquant' },
  ],
  '3-4-3': [
    { x: 60, y: 250, number: '1', name: 'Gardien' },
    { x: 150, y: 120, number: '4', name: 'DC D' },
    { x: 140, y: 250, number: '5', name: 'DC C' },
    { x: 150, y: 380, number: '6', name: 'DC G' },
    { x: 250, y: 60, number: '2', name: 'Piston D' },
    { x: 250, y: 180, number: '8', name: 'Milieu C' },
    { x: 250, y: 320, number: '10', name: 'Milieu C' },
    { x: 250, y: 440, number: '3', name: 'Piston G' },
    { x: 370, y: 100, number: '7', name: 'Ailier D' },
    { x: 380, y: 250, number: '9', name: 'Attaquant' },
    { x: 370, y: 400, number: '11', name: 'Ailier G' },
  ],
  '3-4-2-1': [
    { x: 60, y: 250, number: '1', name: 'Gardien' },
    { x: 150, y: 120, number: '4', name: 'DC D' },
    { x: 140, y: 250, number: '5', name: 'DC C' },
    { x: 150, y: 380, number: '6', name: 'DC G' },
    { x: 240, y: 60, number: '2', name: 'Piston D' },
    { x: 240, y: 180, number: '8', name: 'Milieu C' },
    { x: 240, y: 320, number: '10', name: 'Milieu C' },
    { x: 240, y: 440, number: '3', name: 'Piston G' },
    { x: 320, y: 170, number: '7', name: 'Milieu Off' },
    { x: 320, y: 330, number: '11', name: 'Milieu Off' },
    { x: 380, y: 250, number: '9', name: 'Attaquant' },
  ],
  '3-5-2': [
    { x: 60, y: 250, number: '1', name: 'Gardien' },
    { x: 150, y: 120, number: '4', name: 'DC D' },
    { x: 140, y: 250, number: '5', name: 'DC C' },
    { x: 150, y: 380, number: '6', name: 'DC G' },
    { x: 240, y: 60, number: '2', name: 'Piston D' },
    { x: 260, y: 160, number: '8', name: 'Milieu C' },
    { x: 250, y: 250, number: '6', name: 'Milieu Déf' },
    { x: 260, y: 340, number: '10', name: 'Milieu C' },
    { x: 240, y: 440, number: '3', name: 'Piston G' },
    { x: 370, y: 180, number: '9', name: 'Attaquant' },
    { x: 370, y: 320, number: '11', name: 'Attaquant' },
  ],
  '5-2-3': [
    { x: 60, y: 250, number: '1', name: 'Gardien' },
    { x: 190, y: 60, number: '2', name: 'Piston D' },
    { x: 140, y: 160, number: '4', name: 'DC D' },
    { x: 130, y: 250, number: '5', name: 'DC C' },
    { x: 140, y: 340, number: '6', name: 'DC G' },
    { x: 190, y: 440, number: '3', name: 'Piston G' },
    { x: 280, y: 180, number: '8', name: 'Milieu C' },
    { x: 280, y: 320, number: '10', name: 'Milieu C' },
    { x: 370, y: 100, number: '7', name: 'Ailier D' },
    { x: 380, y: 250, number: '9', name: 'Attaquant' },
    { x: 370, y: 400, number: '11', name: 'Ailier G' },
  ],
  '5-3-2': [
    { x: 60, y: 250, number: '1', name: 'Gardien' },
    { x: 190, y: 60, number: '2', name: 'Piston D' },
    { x: 140, y: 160, number: '4', name: 'DC D' },
    { x: 130, y: 250, number: '5', name: 'DC C' },
    { x: 140, y: 340, number: '6', name: 'DC G' },
    { x: 190, y: 440, number: '3', name: 'Piston G' },
    { x: 270, y: 150, number: '8', name: 'Milieu C' },
    { x: 260, y: 250, number: '6', name: 'Milieu Déf' },
    { x: 270, y: 350, number: '10', name: 'Milieu C' },
    { x: 370, y: 180, number: '9', name: 'Attaquant' },
    { x: 370, y: 320, number: '11', name: 'Attaquant' },
  ],
  '5-4-1': [
    { x: 60, y: 250, number: '1', name: 'Gardien' },
    { x: 190, y: 60, number: '2', name: 'Piston D' },
    { x: 140, y: 160, number: '4', name: 'DC D' },
    { x: 130, y: 250, number: '5', name: 'DC C' },
    { x: 140, y: 340, number: '6', name: 'DC G' },
    { x: 190, y: 440, number: '3', name: 'Piston G' },
    { x: 280, y: 80, number: '7', name: 'Milieu D' },
    { x: 270, y: 200, number: '8', name: 'Milieu C' },
    { x: 270, y: 300, number: '10', name: 'Milieu C' },
    { x: 280, y: 420, number: '11', name: 'Milieu G' },
    { x: 380, y: 250, number: '9', name: 'Attaquant' },
  ],
  '4-5-1': [
    { x: 60, y: 250, number: '1', name: 'Gardien' },
    { x: 180, y: 80, number: '2', name: 'Défenseur D' },
    { x: 150, y: 190, number: '4', name: 'Stoppeur' },
    { x: 150, y: 310, number: '5', name: 'Stoppeur' },
    { x: 180, y: 420, number: '3', name: 'Défenseur G' },
    { x: 270, y: 70, number: '7', name: 'Milieu D' },
    { x: 260, y: 160, number: '8', name: 'Milieu C' },
    { x: 250, y: 250, number: '6', name: 'Milieu Déf' },
    { x: 260, y: 340, number: '10', name: 'Milieu C' },
    { x: 270, y: 430, number: '11', name: 'Milieu G' },
    { x: 380, y: 250, number: '9', name: 'Attaquant' },
  ],
};

const FORMATIONS_RED: Record<string, { x: number; y: number; number: string; name: string }[]> = Object.fromEntries(
  Object.entries(FORMATIONS_BLUE).map(([key, list]) => [
    key,
    list.map((p) => ({
      ...p,
      x: 800 - p.x,
    })),
  ])
);

export default function TacticalCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(DESIGN_WIDTH);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Facteur de réduction appliqué uniquement sur les petits écrans (< 768px)
  const isMobile = containerWidth < 768;
  const mobileScaleFactor = isMobile ? 0.82 : 1;
  const scale = (containerWidth / DESIGN_WIDTH) * mobileScaleFactor;

  const [selectedBlueFormation, setSelectedBlueFormation] = useState<string>('4-3-3');
  const [selectedRedFormation, setSelectedRedFormation] = useState<string>('4-3-3');

  const [customFormations, setCustomFormations] = useState<Record<string, { x: number; y: number; number: string; name: string }[]>>({});
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [newTactiqueName, setNewTactiqueName] = useState<string>('');
  
  const [tactiqueToDelete, setTactiqueToDelete] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('custom_tactical_formations');
    if (saved) {
      try {
        setCustomFormations(JSON.parse(saved));
      } catch (e) {
        console.error('Erreur de chargement des tactiques :', e);
      }
    }
  }, []);

  const [players, setPlayers] = useState<Player[]>(() => {
    const initialPlayers: Player[] = [
      ...FORMATIONS_BLUE['4-3-3'].map((p, idx) => ({
        id: `b-${idx + 1}`,
        x: p.x,
        y: p.y,
        number: p.number,
        color: '#3b82f6',
        name: p.name,
      })),
      ...FORMATIONS_RED['4-3-3'].map((p, idx) => ({
        id: `r-${idx + 1}`,
        x: p.x,
        y: p.y,
        number: p.number,
        color: '#ef4444',
        name: p.name,
      })),
    ];
    return resolveCollisions(initialPlayers);
  });

  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const selectedPlayer = players.find((p) => p.id === selectedPlayerId);

  const handleSelectAction = (team: 'blue' | 'red', value: string) => {
    const isBlue = team === 'blue';
    const currentTacticName = isBlue ? selectedBlueFormation : selectedRedFormation;

    if (value === 'action:delete') {
      setTactiqueToDelete(currentTacticName);
      return; 
    }

    if (value === 'action:update') {
      const prefix = isBlue ? 'b-' : 'r-';
      const teamLayout = players
        .filter((p) => p.id.startsWith(prefix))
        .map((p) => ({
          x: isBlue ? p.x : 800 - p.x,
          y: p.y,
          number: p.number,
          name: p.name,
        }));

      const updatedCustoms = {
        ...customFormations,
        [currentTacticName]: teamLayout,
      };

      setCustomFormations(updatedCustoms);
      localStorage.setItem('custom_tactical_formations', JSON.stringify(updatedCustoms));
      
      setToastMessage(`Dispositif "${currentTacticName}" mis à jour avec succès !`);
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    applyFormation(team, value);
  };

  const handleSaveCustomTactique = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTactiqueName.trim()) return;

    const name = newTactiqueName.trim();
    const blueLayout = players
      .filter((p) => p.id.startsWith('b-'))
      .map((p) => ({
        x: p.x,
        y: p.y,
        number: p.number,
        name: p.name,
      }));

    const updatedCustoms = {
      ...customFormations,
      [name]: blueLayout,
    };

    setCustomFormations(updatedCustoms);
    localStorage.setItem('custom_tactical_formations', JSON.stringify(updatedCustoms));

    setSelectedBlueFormation(name);
    setNewTactiqueName('');
    setIsCreating(false);
  };

  const handleConfirmDelete = () => {
    if (!tactiqueToDelete) return;

    const updatedCustoms = { ...customFormations };
    delete updatedCustoms[tactiqueToDelete];

    setCustomFormations(updatedCustoms);
    localStorage.setItem('custom_tactical_formations', JSON.stringify(updatedCustoms));

    if (selectedBlueFormation === tactiqueToDelete) applyFormation('blue', '4-3-3');
    if (selectedRedFormation === tactiqueToDelete) applyFormation('red', '4-3-3');

    setTactiqueToDelete(null);
  };

  const handleDragStart = (e: any, id: string) => {
    setSelectedPlayerId(id);
    e.target.moveToTop();
  };

  const handleDragEnd = (e: any, id: string) => {
    let targetX = e.target.x();
    let targetY = e.target.y();

    targetX = Math.max(30, Math.min(770, targetX));
    targetY = Math.max(30, Math.min(470, targetY));

    setPlayers((prev) => {
      const updated = prev.map((p) => (p.id === id ? { ...p, x: targetX, y: targetY } : p));
      return resolveCollisions(updated);
    });
  };

  const applyFormation = (team: 'blue' | 'red', formationKey: string) => {
    const isBlue = team === 'blue';
    const prefix = isBlue ? 'b-' : 'r-';

    if (isBlue) setSelectedBlueFormation(formationKey);
    else setSelectedRedFormation(formationKey);

    let formation: { x: number; y: number; number: string; name: string }[] | undefined;

    if (customFormations[formationKey]) {
      const base = customFormations[formationKey];
      formation = isBlue ? base : base.map((p) => ({ ...p, x: 800 - p.x }));
    } else {
      formation = isBlue ? FORMATIONS_BLUE[formationKey] : FORMATIONS_RED[formationKey];
    }

    if (!formation) return;

    setPlayers((prev) => {
      const updated = prev.map((player) => {
        if (player.id.startsWith(prefix)) {
          const index = parseInt(player.id.replace(prefix, '')) - 1;
          if (formation[index]) {
            return {
              ...player,
              x: formation[index].x,
              y: formation[index].y,
              number: formation[index].number,
              name: formation[index].name,
            };
          }
        }
        return player;
      });
      return resolveCollisions(updated);
    });
  };

  const updateSelectedPlayer = (field: 'name' | 'number', value: string) => {
    if (!selectedPlayerId) return;
    setPlayers((prev) =>
      prev.map((p) => (p.id === selectedPlayerId ? { ...p, [field]: value } : p))
    );
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-4xl relative">
      
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-5 py-2.5 rounded-full shadow-lg z-50 text-sm font-semibold animate-bounce">
          {toastMessage}
        </div>
      )}

      {tactiqueToDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-neutral-700 p-5 rounded-lg shadow-xl max-w-sm w-full text-center flex flex-col gap-4">
            <h3 className="text-base font-bold text-white">Supprimer ce dispositif ?</h3>
            <p className="text-xs text-neutral-300">
              Es-tu sûr de vouloir supprimer la tactique <span className="font-semibold text-amber-400">« {tactiqueToDelete} »</span> ? Cette action est irréversible.
            </p>
            <div className="flex justify-center gap-3 mt-2">
              <button
                onClick={() => setTactiqueToDelete(null)}
                className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs px-4 py-2 rounded transition font-medium border border-neutral-700"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmDelete}
                className="bg-red-600 hover:bg-red-500 text-white text-xs px-4 py-2 rounded transition font-medium shadow"
              >
                Confirmer la suppression
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 w-full bg-neutral-900 p-3 rounded-lg border border-neutral-800">
        
        <div className="flex items-center gap-2">
          <label htmlFor="blue-formation-select" className="text-xs font-semibold text-blue-400">
            Bleus :
          </label>
          <select
            id="blue-formation-select"
            value={selectedBlueFormation}
            onChange={(e) => handleSelectAction('blue', e.target.value)}
            className="bg-neutral-800 text-white text-xs px-3 py-1.5 rounded border border-neutral-700 outline-none focus:border-blue-500 cursor-pointer font-medium"
          >
            <optgroup label="Formations prédéfinies">
              {DEFAULT_FORMATIONS.map((f) => (
                <option key={`blue-def-${f.key}`} value={f.key}>{f.key} — {f.team}</option>
              ))}
            </optgroup>
            {Object.keys(customFormations).length > 0 && (
              <optgroup label="Formations personnalisées ⭐">
                {Object.keys(customFormations).map((name) => (
                  <option key={`blue-custom-${name}`} value={name}>⭐ {name}</option>
                ))}
              </optgroup>
            )}
            {customFormations[selectedBlueFormation] && (
              <optgroup label="⚙️ Gérer cette tactique">
                <option value="action:update">💾 Enregistrer les modifications</option>
                <option value="action:delete">❌ Supprimer la tactique</option>
              </optgroup>
            )}
          </select>
        </div>

        <div className="flex items-center justify-center">
          {!isCreating ? (
            <button
              onClick={() => setIsCreating(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1.5 rounded font-medium transition flex items-center gap-1 shadow"
            >
              <span className="text-sm font-bold">+</span> Créer une tactique
            </button>
          ) : (
            <form onSubmit={handleSaveCustomTactique} className="flex items-center gap-2 bg-neutral-800 p-1 rounded border border-neutral-700">
              <input
                type="text"
                placeholder="Nom de la tactique"
                value={newTactiqueName}
                onChange={(e) => setNewTactiqueName(e.target.value)}
                className="bg-neutral-900 text-white text-xs px-2.5 py-1 rounded border border-neutral-600 outline-none focus:border-emerald-500 w-36"
                autoFocus
              />
              <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-2.5 py-1 rounded font-medium transition">
                Sauver
              </button>
              <button type="button" onClick={() => setIsCreating(false)} className="text-neutral-400 hover:text-white text-xs px-1.5 py-1 transition">
                ✕
              </button>
            </form>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="red-formation-select" className="text-xs font-semibold text-red-400">
            Rouges :
          </label>
          <select
            id="red-formation-select"
            value={selectedRedFormation}
            onChange={(e) => handleSelectAction('red', e.target.value)}
            className="bg-neutral-800 text-white text-xs px-3 py-1.5 rounded border border-neutral-700 outline-none focus:border-red-500 cursor-pointer font-medium"
          >
            <optgroup label="Formations prédéfinies">
              {DEFAULT_FORMATIONS.map((f) => (
                <option key={`red-def-${f.key}`} value={f.key}>{f.key} — {f.team}</option>
              ))}
            </optgroup>
            {Object.keys(customFormations).length > 0 && (
              <optgroup label="Formations personnalisées ⭐">
                {Object.keys(customFormations).map((name) => (
                  <option key={`red-custom-${name}`} value={name}>⭐ {name}</option>
                ))}
              </optgroup>
            )}
            {customFormations[selectedRedFormation] && (
              <optgroup label="⚙️ Gérer cette tactique">
                <option value="action:update">💾 Enregistrer les modifications</option>
                <option value="action:delete">❌ Supprimer la tactique</option>
              </optgroup>
            )}
          </select>
        </div>

      </div>

      {/* Terrain Konva Responsive avec échelle ajustée sur mobile */}
      <div ref={containerRef} className="w-full relative border-4 border-white rounded-lg shadow-2xl bg-green-700 flex justify-center items-center overflow-hidden">
        <Stage
          width={containerWidth * mobileScaleFactor}
          height={DESIGN_HEIGHT * scale}
          scale={{ x: scale, y: scale }}
        >
          <Layer>
            <Rect x={0} y={0} width={DESIGN_WIDTH} height={DESIGN_HEIGHT} fill="#15803d" />
            <Rect x={10} y={10} width={780} height={480} stroke="#ffffff" strokeWidth={2} />
            <Rect x={399} y={10} width={2} height={480} fill="#ffffff" />
            <Circle x={400} y={250} radius={60} stroke="#ffffff" strokeWidth={2} />
            <Rect x={10} y={130} width={100} height={240} stroke="#ffffff" strokeWidth={2} />
            <Rect x={690} y={130} width={100} height={240} stroke="#ffffff" strokeWidth={2} />

            {players.map((player) => {
              const isSelected = player.id === selectedPlayerId;
              return (
                <Group
                  key={player.id}
                  x={player.x}
                  y={player.y}
                  draggable
                  onClick={() => setSelectedPlayerId(player.id)}
                  onTap={() => setSelectedPlayerId(player.id)}
                  onDragStart={(e: any) => handleDragStart(e, player.id)}
                  onDragEnd={(e: any) => handleDragEnd(e, player.id)}
                >
                  <Circle
                    radius={20}
                    fill={player.color}
                    shadowBlur={8}
                    shadowColor="black"
                    shadowOpacity={0.6}
                    stroke={isSelected ? '#facc15' : '#ffffff'}
                    strokeWidth={isSelected ? 3.5 : 2}
                  />
                  <Text text={player.number} fontSize={13} fontStyle="bold" fill="#ffffff" x={player.number.length > 1 ? -8 : -4} y={-6} />
                  <Text text={player.name} fontSize={10} fill="#ffffff" x={-25} y={22} width={50} align="center" />
                </Group>
              );
            })}
          </Layer>
        </Stage>
      </div>

      {selectedPlayer && (
        <div className="flex items-center justify-between gap-4 bg-neutral-900 border border-neutral-800 p-3 rounded-lg w-full">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border border-white" style={{ backgroundColor: selectedPlayer.color }} />
            <span className="text-sm font-semibold text-white">Édition : #{selectedPlayer.number} ({selectedPlayer.id.startsWith('b-') ? 'Bleu' : 'Rouge'})</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <label className="text-xs text-neutral-400">N° :</label>
              <input type="text" value={selectedPlayer.number} onChange={(e) => updateSelectedPlayer('number', e.target.value)} className="w-12 bg-neutral-800 border border-neutral-700 px-2 py-1 text-xs rounded text-center text-white outline-none focus:border-blue-500" />
            </div>

            <div className="flex items-center gap-1">
              <label className="text-xs text-neutral-400">Nom / Rôle :</label>
              <input type="text" value={selectedPlayer.name} onChange={(e) => updateSelectedPlayer('name', e.target.value)} className="w-36 bg-neutral-800 border border-neutral-700 px-2 py-1 text-xs rounded text-white outline-none focus:border-blue-500" />
            </div>

            <button onClick={() => setSelectedPlayerId(null)} className="text-xs text-neutral-400 hover:text-white px-2 py-1 bg-neutral-800 rounded transition">OK</button>
          </div>
        </div>
      )}
    </div>
  );
}