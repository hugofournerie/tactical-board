'use client';
// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Stage, Layer, Rect, Circle, Text, Group, Arrow, Line, Transformer } from 'react-konva';

interface Player {
  id: string;
  x: number;
  y: number;
  number: string;
  color: string;
  name: string;
}

interface CustomShape {
  id: string;
  type: 'arrow' | 'dashed-arrow' | 'rect' | 'circle' | 'text' | 'freehand';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  points?: number[];
  color: string;
  strokeWidth?: number;
  opacity?: number;
  text?: string;
  scaleX?: number;
  scaleY?: number;
  penType?: 'pen' | 'highlighter' | 'dashed';
}

interface HistorySnapshot {
  players: Player[];
  shapes: CustomShape[];
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  targetId: string | null;
  targetType: 'shape' | 'player' | null;
}

const MIN_DISTANCE = 44;
const DESIGN_WIDTH = 800;
const DESIGN_HEIGHT = 500;
const FIELD_MARGIN = 12;

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
  const [scale, setScale] = useState<number>(1);
  const fieldAreaRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);
  const shapeRef = useRef<any>(null);
  const trRef = useRef<any>(null);

  useEffect(() => {
    const el = fieldAreaRef.current;
    if (!el) return;

    const updateScale = () => {
      const availableWidth = el.clientWidth - FIELD_MARGIN;
      const availableHeight = el.clientHeight - FIELD_MARGIN;
      if (availableWidth <= 0 || availableHeight <= 0) return;
      setScale(Math.min(availableWidth / DESIGN_WIDTH, availableHeight / DESIGN_HEIGHT));
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const [selectedBlueFormation, setSelectedBlueFormation] = useState<string>('4-3-3');
  const [selectedRedFormation, setSelectedRedFormation] = useState<string>('4-3-3');

  const [customFormations, setCustomFormations] = useState<Record<string, { x: number; y: number; number: string; name: string }[]>>({});
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [newTactiqueName, setNewTactiqueName] = useState<string>('');

  const [tactiqueToDelete, setTactiqueToDelete] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Formes dessinées sur le terrain
  const [shapes, setShapes] = useState<CustomShape[]>([]);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [isShapeMenuOpen, setIsShapeMenuOpen] = useState<boolean>(false);

  // État du mode dessin & réglages du trait
  const [isDrawMode, setIsDrawMode] = useState<boolean>(false);
  const [penType, setPenType] = useState<'pen' | 'highlighter' | 'dashed'>('pen');
  const [drawColor, setDrawColor] = useState<string>('#f59e0b');
  const [drawWidth, setDrawWidth] = useState<number>(4);
  const [drawOpacity, setDrawOpacity] = useState<number>(1);
  const isDrawingRef = useRef<boolean>(false);

  // Joueurs
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

  // --- GESTION DE L'HISTORIQUE (UNDO) ---
  const [history, setHistory] = useState<HistorySnapshot[]>([
    { players: [...players], shapes: [] },
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const saveToHistory = useCallback((newPlayers: Player[], newShapes: CustomShape[]) => {
    setHistory((prev) => {
      const nextHistory = prev.slice(0, historyIndex + 1);
      return [...nextHistory, { players: newPlayers, shapes: newShapes }];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const targetState = history[prevIndex];
      setPlayers(targetState.players);
      setShapes(targetState.shapes);
      setHistoryIndex(prevIndex);
      setSelectedShapeId(null);
      setSelectedPlayerId(null);
      setContextMenu((prev) => ({ ...prev, visible: false }));
    }
  }, [history, historyIndex]);

  // --- MENU CONTEXTUEL ---
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    targetId: null,
    targetType: null,
  });

  useEffect(() => {
    const handleGlobalClick = () => setContextMenu((prev) => ({ ...prev, visible: false }));
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // --- MODIFICATION D'UNE FORME SELECTIONNEE EN DIRECT ---
  const selectedShape = shapes.find((s) => s.id === selectedShapeId);

  const updateSelectedShape = useCallback((fields: Partial<CustomShape>) => {
    if (!selectedShapeId) return;
    const updatedShapes = shapes.map((s) => (s.id === selectedShapeId ? { ...s, ...fields } : s));
    setShapes(updatedShapes);
    saveToHistory(players, updatedShapes);
  }, [selectedShapeId, shapes, players, saveToHistory]);

  const handleColorChange = (color: string) => {
    setDrawColor(color);
    if (selectedShapeId) updateSelectedShape({ color });
  };

  const handleWidthChange = (width: number) => {
    setDrawWidth(width);
    if (selectedShapeId) updateSelectedShape({ strokeWidth: width });
  };

  const handleOpacityChange = (opacity: number) => {
    setDrawOpacity(opacity);
    if (selectedShapeId) updateSelectedShape({ opacity });
  };

  const handlePenTypeChange = (type: 'pen' | 'highlighter' | 'dashed') => {
    setPenType(type);
    const newOpacity = type === 'highlighter' ? 0.35 : 1;
    setDrawOpacity(newOpacity);

    if (selectedShapeId) {
      updateSelectedShape({
        penType: type,
        opacity: newOpacity,
        type: type === 'dashed' ? 'dashed-arrow' : selectedShape?.type,
      });
    }
  };

  // --- SUPPRESSION ET MODIFICATION ---
  const deleteTarget = useCallback((id: string, type: 'shape' | 'player') => {
    if (type === 'shape') {
      const newShapes = shapes.filter((s) => s.id !== id);
      setShapes(newShapes);
      setSelectedShapeId(null);
      saveToHistory(players, newShapes);
    } else if (type === 'player') {
      const newPlayers = players.filter((p) => p.id !== id);
      setPlayers(newPlayers);
      setSelectedPlayerId(null);
      saveToHistory(newPlayers, shapes);
    }
    setContextMenu((prev) => ({ ...prev, visible: false }));
  }, [shapes, players, saveToHistory]);

  const modifyTarget = (id: string, type: 'shape' | 'player') => {
    if (type === 'shape') {
      const shape = shapes.find((s) => s.id === id);
      if (!shape) return;
      const newText = prompt('Texte ou annotation :', shape.text || '');
      const newColor = prompt('Couleur hex ou nom :', shape.color || '#f59e0b');
      if (newText !== null || newColor !== null) {
        const updatedShapes = shapes.map((s) =>
          s.id === id
            ? { ...s, text: newText !== null ? newText : s.text, color: newColor || s.color }
            : s
        );
        setShapes(updatedShapes);
        saveToHistory(players, updatedShapes);
      }
    } else if (type === 'player') {
      const player = players.find((p) => p.id === id);
      if (!player) return;
      const newNumber = prompt('Numéro du joueur :', player.number);
      const newName = prompt('Nom du joueur :', player.name);
      if (newNumber !== null || newName !== null) {
        const updatedPlayers = players.map((p) =>
          p.id === id
            ? { ...p, number: newNumber !== null ? newNumber : p.number, name: newName !== null ? newName : p.name }
            : p
        );
        setPlayers(updatedPlayers);
        saveToHistory(updatedPlayers, shapes);
      }
    }
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  // --- RACCOURCIS CLAVIER ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isEditingText = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (isEditingText) return;

      const isCmdOrCtrl = e.ctrlKey || e.metaKey;

      if (isCmdOrCtrl && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedShapeId) {
          e.preventDefault();
          deleteTarget(selectedShapeId, 'shape');
        } else if (selectedPlayerId) {
          e.preventDefault();
          deleteTarget(selectedPlayerId, 'player');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, selectedShapeId, selectedPlayerId, deleteTarget]);

  useEffect(() => {
    if (selectedShapeId && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [selectedShapeId]);

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

  // Export d'image
  const handleExportImage = () => {
    if (!stageRef.current) return;
    setSelectedShapeId(null);
    setSelectedPlayerId(null);

    setTimeout(() => {
      const dataURL = stageRef.current.toDataURL({ pixelRatio: 3 });
      const link = document.createElement('a');
      link.download = `tactique-terrain-${Date.now()}.png`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 50);
  };

  // Ajout de formes prédéfinies
  const addShape = (type: CustomShape['type']) => {
    setIsDrawMode(false);
    const id = `shape-${Date.now()}`;
    const newShape: CustomShape = {
      id,
      type,
      x: 360,
      y: 220,
      color: drawColor,
      strokeWidth: drawWidth,
      opacity: type === 'rect' || type === 'circle' ? 0.4 : drawOpacity,
      text: type === 'text' ? 'Annotation' : undefined,
      points: type.includes('arrow') ? [0, 0, 100, 0] : undefined,
      width: type === 'rect' ? 120 : undefined,
      height: type === 'rect' ? 70 : undefined,
      radius: type === 'circle' ? 40 : undefined,
      scaleX: 1,
      scaleY: 1,
    };
    const updatedShapes = [...shapes, newShape];
    setShapes(updatedShapes);
    setSelectedShapeId(id);
    setSelectedPlayerId(null);
    setIsShapeMenuOpen(false);
    saveToHistory(players, updatedShapes);
  };

  // Dessin libre au pointeur
  const handleStageMouseDown = (e: any) => {
    if (!isDrawMode) {
      if (e.target === e.target.getStage()) {
        setSelectedShapeId(null);
        setSelectedPlayerId(null);
      }
      return;
    }

    isDrawingRef.current = true;
    const stage = stageRef.current;
    if (!stage) return;

    const pos = stage.getPointerPosition();
    const pointX = pos.x / scale;
    const pointY = pos.y / scale;

    const newShape: CustomShape = {
      id: `draw-${Date.now()}`,
      type: 'freehand',
      x: 0,
      y: 0,
      points: [pointX, pointY],
      color: drawColor,
      strokeWidth: penType === 'highlighter' ? Math.max(drawWidth, 14) : drawWidth,
      opacity: penType === 'highlighter' ? 0.35 : drawOpacity,
      penType: penType,
    };

    setShapes((prev) => [...prev, newShape]);
    setSelectedShapeId(null);
    setSelectedPlayerId(null);
  };

  const handleStageMouseMove = () => {
    if (!isDrawMode || !isDrawingRef.current) return;

    const stage = stageRef.current;
    if (!stage) return;

    const pos = stage.getPointerPosition();
    const pointX = pos.x / scale;
    const pointY = pos.y / scale;

    setShapes((prev) => {
      if (prev.length === 0) return prev;
      const lastShape = prev[prev.length - 1];
      if (lastShape.type !== 'freehand') return prev;

      const newPoints = [...(lastShape.points || []), pointX, pointY];
      const updatedShape = { ...lastShape, points: newPoints };
      return [...prev.slice(0, -1), updatedShape];
    });
  };

  const handleStageMouseUp = () => {
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      saveToHistory(players, shapes);
    }
  };

  // Application des tactiques prédéfinies ou personnalisées
  const applyFormation = (team: 'blue' | 'red', formationKey: string) => {
    const isBlue = team === 'blue';
    let layout = customFormations[formationKey];

    if (!layout) {
      layout = isBlue ? FORMATIONS_BLUE[formationKey] : FORMATIONS_RED[formationKey];
    }

    if (!layout) return;

    if (isBlue) {
      setSelectedBlueFormation(formationKey);
    } else {
      setSelectedRedFormation(formationKey);
    }

    const prefix = isBlue ? 'b-' : 'r-';
    const color = isBlue ? '#3b82f6' : '#ef4444';

    const remainingPlayers = players.filter((p) => !p.id.startsWith(prefix));

    const newTeamPlayers: Player[] = layout.map((p, idx) => ({
      id: `${prefix}${idx + 1}`,
      x: isBlue ? p.x : (customFormations[formationKey] ? 800 - p.x : p.x),
      y: p.y,
      number: p.number,
      color: color,
      name: p.name,
    }));

    const finalPlayers = resolveCollisions([...remainingPlayers, ...newTeamPlayers]);
    setPlayers(finalPlayers);
    saveToHistory(finalPlayers, shapes);
  };

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

  const confirmDeleteTactique = () => {
    if (!tactiqueToDelete) return;

    const updatedCustoms = { ...customFormations };
    delete updatedCustoms[tactiqueToDelete];

    setCustomFormations(updatedCustoms);
    localStorage.setItem('custom_tactical_formations', JSON.stringify(updatedCustoms));

    if (selectedBlueFormation === tactiqueToDelete) {
      setSelectedBlueFormation('4-3-3');
      applyFormation('blue', '4-3-3');
    }
    if (selectedRedFormation === tactiqueToDelete) {
      setSelectedRedFormation('4-3-3');
      applyFormation('red', '4-3-3');
    }

    setToastMessage(`Tactique "${tactiqueToDelete}" supprimée.`);
    setTimeout(() => setToastMessage(null), 3000);
    setTactiqueToDelete(null);
  };

  // Drag End d'un joueur
  const handlePlayerDragEnd = (id: string, e: any) => {
    const newX = Math.max(30, Math.min(770, e.target.x()));
    const newY = Math.max(30, Math.min(470, e.target.y()));

    const updatedPlayers = players.map((p) => (p.id === id ? { ...p, x: newX, y: newY } : p));
    const resolved = resolveCollisions(updatedPlayers);
    setPlayers(resolved);
    saveToHistory(resolved, shapes);
  };

  // Drag End d'une forme
  const handleShapeDragEnd = (id: string, e: any) => {
    const updatedShapes = shapes.map((s) => (s.id === id ? { ...s, x: e.target.x(), y: e.target.y() } : s));
    setShapes(updatedShapes);
    saveToHistory(players, updatedShapes);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-100 select-none overflow-hidden font-sans">
      {/* Barre supérieure : Choix des tactiques & Actions */}
      <header className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-800 border-b border-slate-700 shadow-md">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-amber-400 flex items-center gap-2">
            ⚽ Tableau Tactique
          </h1>

          {/* Équipe Bleue */}
          <div className="flex items-center gap-2 bg-blue-950/60 p-1.5 rounded-lg border border-blue-700/50">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            <select
              value={selectedBlueFormation}
              onChange={(e) => handleSelectAction('blue', e.target.value)}
              className="bg-slate-900 text-slate-200 text-sm px-2 py-1 rounded border border-slate-700 focus:outline-none"
            >
              <optgroup label="Dispositifs Standard">
                {DEFAULT_FORMATIONS.map((f) => (
                  <option key={`blue-${f.key}`} value={f.key}>
                    {f.key} ({f.team})
                  </option>
                ))}
              </optgroup>
              {Object.keys(customFormations).length > 0 && (
                <optgroup label="Dispositifs Personnalisés">
                  {Object.keys(customFormations).map((name) => (
                    <option key={`blue-custom-${name}`} value={name}>
                      {name}
                    </option>
                  ))}
                </optgroup>
              )}
              {customFormations[selectedBlueFormation] && (
                <optgroup label="Actions">
                  <option value="action:update">💾 Mettre à jour la tactique</option>
                  <option value="action:delete">🗑️ Supprimer la tactique</option>
                </optgroup>
              )}
            </select>
          </div>

          {/* Équipe Rouge */}
          <div className="flex items-center gap-2 bg-red-950/60 p-1.5 rounded-lg border border-red-700/50">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <select
              value={selectedRedFormation}
              onChange={(e) => handleSelectAction('red', e.target.value)}
              className="bg-slate-900 text-slate-200 text-sm px-2 py-1 rounded border border-slate-700 focus:outline-none"
            >
              <optgroup label="Dispositifs Standard">
                {DEFAULT_FORMATIONS.map((f) => (
                  <option key={`red-${f.key}`} value={f.key}>
                    {f.key} ({f.team})
                  </option>
                ))}
              </optgroup>
              {Object.keys(customFormations).length > 0 && (
                <optgroup label="Dispositifs Personnalisés">
                  {Object.keys(customFormations).map((name) => (
                    <option key={`red-custom-${name}`} value={name}>
                      {name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
        </div>

        {/* Boutons d'action généraux */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreating(true)}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-sm font-medium transition"
          >
            + Sauvegarder Tactique
          </button>
          <button
            onClick={undo}
            disabled={historyIndex === 0}
            className={`px-3 py-1.5 rounded text-sm font-medium transition ${
              historyIndex === 0
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
            }`}
          >
            ↩ Annuler (Ctrl+Z)
          </button>
          <button
            onClick={handleExportImage}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-sm font-medium transition"
          >
            📷 Exporter PNG
          </button>
        </div>
      </header>

      {/* Barre d'outils de Dessin */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 bg-slate-800/80 border-b border-slate-700 text-sm">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-400">Mode :</span>
          <button
            onClick={() => setIsDrawMode(!isDrawMode)}
            className={`px-3 py-1 rounded font-medium transition ${
              isDrawMode ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
            }`}
          >
            {isDrawMode ? '✏️️ Dessin Actif' : '👆 Sélection / Déplacement'}
          </button>

          {/* Type de crayon */}
          <div className="flex items-center bg-slate-900 rounded p-0.5 border border-slate-700">
            <button
              onClick={() => handlePenTypeChange('pen')}
              className={`px-2 py-1 rounded text-xs ${penType === 'pen' ? 'bg-amber-500 text-slate-900 font-bold' : 'text-slate-300'}`}
            >
              Stylo
            </button>
            <button
              onClick={() => handlePenTypeChange('highlighter')}
              className={`px-2 py-1 rounded text-xs ${penType === 'highlighter' ? 'bg-amber-500 text-slate-900 font-bold' : 'text-slate-300'}`}
            >
              Surligneur
            </button>
            <button
              onClick={() => handlePenTypeChange('dashed')}
              className={`px-2 py-1 rounded text-xs ${penType === 'dashed' ? 'bg-amber-500 text-slate-900 font-bold' : 'text-slate-300'}`}
            >
              Pointillé
            </button>
          </div>

          {/* Formes préféfinies */}
          <div className="relative">
            <button
              onClick={() => setIsShapeMenuOpen(!isShapeMenuOpen)}
              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-slate-200 font-medium"
            >
              + Formes 📐
            </button>
            {isShapeMenuOpen && (
              <div className="absolute top-full left-0 mt-1 bg-slate-800 border border-slate-700 rounded shadow-xl z-20 flex flex-col py-1 min-w-[140px]">
                <button onClick={() => addShape('arrow')} className="px-3 py-1.5 hover:bg-slate-700 text-left">➡️ Flèche</button>
                <button onClick={() => addShape('dashed-arrow')} className="px-3 py-1.5 hover:bg-slate-700 text-left">↪️ Flèche Pointillée</button>
                <button onClick={() => addShape('rect')} className="px-3 py-1.5 hover:bg-slate-700 text-left">🔲 Rectangle</button>
                <button onClick={() => addShape('circle')} className="px-3 py-1.5 hover:bg-slate-700 text-left">⚪ Cercle</button>
                <button onClick={() => addShape('text')} className="px-3 py-1.5 hover:bg-slate-700 text-left">🔤 Texte</button>
              </div>
            )}
          </div>
        </div>

        {/* Style du trait */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span>Couleur :</span>
            <input
              type="color"
              value={drawColor}
              onChange={(e) => handleColorChange(e.target.value)}
              className="w-7 h-7 rounded border border-slate-600 cursor-pointer bg-transparent"
            />
          </div>

          <div className="flex items-center gap-2">
            <span>Épaisseur :</span>
            <input
              type="range"
              min="1"
              max="20"
              value={drawWidth}
              onChange={(e) => handleWidthChange(Number(e.target.value))}
              className="w-20 accent-amber-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span>Opacité :</span>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={drawOpacity}
              onChange={(e) => handleOpacityChange(Number(e.target.value))}
              className="w-20 accent-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Zone du Terrain de Football */}
      <div ref={fieldAreaRef} className="flex-1 flex items-center justify-center p-2 relative bg-slate-950 overflow-hidden">
        <Stage
          ref={stageRef}
          width={DESIGN_WIDTH * scale}
          height={DESIGN_HEIGHT * scale}
          scaleX={scale}
          scaleY={scale}
          onMouseDown={handleStageMouseDown}
          onMouseMove={handleStageMouseMove}
          onMouseUp={handleStageMouseUp}
          onTouchStart={handleStageMouseDown}
          onTouchMove={handleStageMouseMove}
          onTouchEnd={handleStageMouseUp}
          className="shadow-2xl rounded-lg overflow-hidden border-2 border-slate-700"
        >
          {/* Layer Terrain */}
          <Layer>
            {/* Pelouse de football */}
            <Rect x={0} y={0} width={800} height={500} fill="#15803d" />
            {/* Bandes de pelouse alternées */}
            {[0, 100, 200, 300, 400, 500, 600, 700].map((xPos, idx) => (
              <Rect
                key={`stripe-${xPos}`}
                x={xPos}
                y={0}
                width={100}
                height={500}
                fill={idx % 2 === 0 ? '#16a34a' : '#15803d'}
              />
            ))}

            {/* Lignes du terrain */}
            <Rect x={20} y={20} width={760} height={460} stroke="white" strokeWidth={2.5} />
            <Line points={[400, 20, 400, 480]} stroke="white" strokeWidth={2.5} />
            <Circle x={400} y={250} radius={65} stroke="white" strokeWidth={2.5} />
            <Circle x={400} y={250} radius={4} fill="white" />

            {/* Surface de réparation Gauche */}
            <Rect x={20} y={115} width={130} height={270} stroke="white" strokeWidth={2.5} />
            <Rect x={20} y={185} width={45} height={130} stroke="white" strokeWidth={2.5} />
            <Circle x={110} y={250} radius={3.5} fill="white" />

            {/* Surface de réparation Droite */}
            <Rect x={650} y={115} width={130} height={270} stroke="white" strokeWidth={2.5} />
            <Rect x={735} y={185} width={45} height={130} stroke="white" strokeWidth={2.5} />
            <Circle x={690} y={250} radius={3.5} fill="white" />

            {/* Cages de but */}
            <Rect x={8} y={210} width={12} height={80} stroke="white" fill="#ffffff33" strokeWidth={2} />
            <Rect x={780} y={210} width={12} height={80} stroke="white" fill="#ffffff33" strokeWidth={2} />
          </Layer>

          {/* Layer Formes & Dessins */}
          <Layer>
            {shapes.map((s) => {
              const isSelected = s.id === selectedShapeId;

              if (s.type === 'freehand') {
                return (
                  <Line
                    key={s.id}
                    points={s.points}
                    stroke={s.color}
                    strokeWidth={s.strokeWidth}
                    opacity={s.opacity}
                    dash={s.penType === 'dashed' ? [10, 5] : undefined}
                    lineCap="round"
                    lineJoin="round"
                    tension={0.5}
                    draggable={!isDrawMode}
                    onClick={() => {
                      if (!isDrawMode) setSelectedShapeId(s.id);
                    }}
                    onTap={() => {
                      if (!isDrawMode) setSelectedShapeId(s.id);
                    }}
                    onContextMenu={(e) => {
                      e.evt.preventDefault();
                      setContextMenu({
                        visible: true,
                        x: e.evt.clientX,
                        y: e.evt.clientY,
                        targetId: s.id,
                        targetType: 'shape',
                      });
                    }}
                  />
                );
              }

              if (s.type === 'arrow' || s.type === 'dashed-arrow') {
                return (
                  <Arrow
                    key={s.id}
                    ref={isSelected ? shapeRef : null}
                    x={s.x}
                    y={s.y}
                    points={s.points || [0, 0, 100, 0]}
                    stroke={s.color}
                    fill={s.color}
                    strokeWidth={s.strokeWidth}
                    opacity={s.opacity}
                    dash={s.type === 'dashed-arrow' ? [10, 5] : undefined}
                    draggable={!isDrawMode}
                    onDragEnd={(e) => handleShapeDragEnd(s.id, e)}
                    onClick={() => {
                      if (!isDrawMode) setSelectedShapeId(s.id);
                    }}
                    onTap={() => {
                      if (!isDrawMode) setSelectedShapeId(s.id);
                    }}
                    onContextMenu={(e) => {
                      e.evt.preventDefault();
                      setContextMenu({
                        visible: true,
                        x: e.evt.clientX,
                        y: e.evt.clientY,
                        targetId: s.id,
                        targetType: 'shape',
                      });
                    }}
                  />
                );
              }

              if (s.type === 'rect') {
                return (
                  <Rect
                    key={s.id}
                    ref={isSelected ? shapeRef : null}
                    x={s.x}
                    y={s.y}
                    width={s.width}
                    height={s.height}
                    stroke={s.color}
                    fill={`${s.color}33`}
                    strokeWidth={s.strokeWidth}
                    opacity={s.opacity}
                    draggable={!isDrawMode}
                    onDragEnd={(e) => handleShapeDragEnd(s.id, e)}
                    onClick={() => {
                      if (!isDrawMode) setSelectedShapeId(s.id);
                    }}
                    onTap={() => {
                      if (!isDrawMode) setSelectedShapeId(s.id);
                    }}
                    onContextMenu={(e) => {
                      e.evt.preventDefault();
                      setContextMenu({
                        visible: true,
                        x: e.evt.clientX,
                        y: e.evt.clientY,
                        targetId: s.id,
                        targetType: 'shape',
                      });
                    }}
                  />
                );
              }

              if (s.type === 'circle') {
                return (
                  <Circle
                    key={s.id}
                    ref={isSelected ? shapeRef : null}
                    x={s.x}
                    y={s.y}
                    radius={s.radius}
                    stroke={s.color}
                    fill={`${s.color}33`}
                    strokeWidth={s.strokeWidth}
                    opacity={s.opacity}
                    draggable={!isDrawMode}
                    onDragEnd={(e) => handleShapeDragEnd(s.id, e)}
                    onClick={() => {
                      if (!isDrawMode) setSelectedShapeId(s.id);
                    }}
                    onTap={() => {
                      if (!isDrawMode) setSelectedShapeId(s.id);
                    }}
                    onContextMenu={(e) => {
                      e.evt.preventDefault();
                      setContextMenu({
                        visible: true,
                        x: e.evt.clientX,
                        y: e.evt.clientY,
                        targetId: s.id,
                        targetType: 'shape',
                      });
                    }}
                  />
                );
              }

              if (s.type === 'text') {
                return (
                  <Text
                    key={s.id}
                    ref={isSelected ? shapeRef : null}
                    x={s.x}
                    y={s.y}
                    text={s.text || 'Annotation'}
                    fontSize={20}
                    fontStyle="bold"
                    fill={s.color}
                    opacity={s.opacity}
                    draggable={!isDrawMode}
                    onDragEnd={(e) => handleShapeDragEnd(s.id, e)}
                    onClick={() => {
                      if (!isDrawMode) setSelectedShapeId(s.id);
                    }}
                    onTap={() => {
                      if (!isDrawMode) setSelectedShapeId(s.id);
                    }}
                    onContextMenu={(e) => {
                      e.evt.preventDefault();
                      setContextMenu({
                        visible: true,
                        x: e.evt.clientX,
                        y: e.evt.clientY,
                        targetId: s.id,
                        targetType: 'shape',
                      });
                    }}
                  />
                );
              }

              return null;
            })}

            {/* Outil d'ajustement/redimensionnement Konva */}
            {selectedShapeId && <Transformer ref={trRef} rotateEnabled={true} />}
          </Layer>

          {/* Layer Joueurs */}
          <Layer>
            {players.map((p) => {
              const isSelected = p.id === selectedPlayerId;
              return (
                <Group
                  key={p.id}
                  x={p.x}
                  y={p.y}
                  draggable={!isDrawMode}
                  onDragEnd={(e) => handlePlayerDragEnd(p.id, e)}
                  onClick={() => {
                    if (!isDrawMode) {
                      setSelectedPlayerId(p.id);
                      setSelectedShapeId(null);
                    }
                  }}
                  onTap={() => {
                    if (!isDrawMode) {
                      setSelectedPlayerId(p.id);
                      setSelectedShapeId(null);
                    }
                  }}
                  onContextMenu={(e) => {
                    e.evt.preventDefault();
                    setContextMenu({
                      visible: true,
                      x: e.evt.clientX,
                      y: e.evt.clientY,
                      targetId: p.id,
                      targetType: 'player',
                    });
                  }}
                >
                  <Circle
                    radius={16}
                    fill={p.color}
                    stroke={isSelected ? '#f59e0b' : '#ffffff'}
                    strokeWidth={isSelected ? 3 : 2}
                    shadowColor="black"
                    shadowBlur={5}
                    shadowOpacity={0.4}
                  />
                  <Text
                    text={p.number}
                    fontSize={13}
                    fontStyle="bold"
                    fill="#ffffff"
                    align="center"
                    verticalAlign="middle"
                    offsetX={6}
                    offsetY={6}
                  />
                  <Text
                    text={p.name}
                    fontSize={11}
                    fill="#ffffff"
                    align="center"
                    offsetY={-20}
                    offsetX={p.name.length * 3}
                    shadowColor="black"
                    shadowBlur={3}
                  />
                </Group>
              );
            })}
          </Layer>
        </Stage>
      </div>

      {/* Menu Contextuel */}
      {contextMenu.visible && (
        <div
          className="fixed bg-slate-800 text-slate-100 border border-slate-700 rounded shadow-2xl z-50 py-1 min-w-[130px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            onClick={() => contextMenu.targetId && modifyTarget(contextMenu.targetId, contextMenu.targetType!)}
            className="w-full text-left px-4 py-2 hover:bg-slate-700 text-sm flex items-center gap-2"
          >
            ✏️ Modifier
          </button>
          <button
            onClick={() => contextMenu.targetId && deleteTarget(contextMenu.targetId, contextMenu.targetType!)}
            className="w-full text-left px-4 py-2 hover:bg-red-600/30 text-red-400 text-sm flex items-center gap-2"
          >
            🗑️ Supprimer
          </button>
        </div>
      )}

      {/* Modale Sauvegarder Tactique */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSaveCustomTactique} className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-2xl max-w-md w-full">
            <h3 className="text-lg font-bold text-slate-100 mb-4">Nouvelle Tactique Personnalisée</h3>
            <input
              type="text"
              placeholder="Nom de la tactique (ex: 4-3-3 Pressing)"
              value={newTactiqueName}
              onChange={(e) => setNewTactiqueName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-100 mb-4 focus:outline-none focus:border-amber-500"
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 font-medium text-sm"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium text-sm"
              >
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modale Confirmation Suppression */}
      {tactiqueToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-2xl max-w-sm w-full">
            <h3 className="text-lg font-bold text-slate-100 mb-2">Supprimer la tactique ?</h3>
            <p className="text-slate-400 text-sm mb-6">
              Êtes-vous sûr de vouloir supprimer le dispositif &quot;{tactiqueToDelete}&quot; ?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setTactiqueToDelete(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 font-medium text-sm"
              >
                Annuler
              </button>
              <button
                onClick={confirmDeleteTactique}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded font-medium text-sm"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-xl z-50 text-sm font-medium animate-bounce">
          {toastMessage}
        </div>
      )}
    </div>
  );
}