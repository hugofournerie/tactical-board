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

  // État du mode dessin à la main
  const [isDrawMode, setIsDrawMode] = useState<boolean>(false);
  const [penType, setPenType] = useState<'pen' | 'highlighter' | 'dashed'>('pen');
  const [drawColor, setDrawColor] = useState<string>('#f59e0b');
  const [drawWidth, setDrawWidth] = useState<number>(4);
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

  // --- MENU CONTEXTUEL (CLIC DROIT / MAINTIEN MOBILE) ---
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    targetId: null,
    targetType: null,
  });

  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fermeture du menu contextuel au clic extérieur
  useEffect(() => {
    const handleGlobalClick = () => setContextMenu((prev) => ({ ...prev, visible: false }));
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // --- SUPPRESSION & MODIFICATION ---
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

  // --- RACCOURCIS CLAVIER GLOBAL (Ctrl+Z, Cmd+Z, Suppr, Backspace) ---
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

  // Export d'image (terrain + formes + joueurs uniquement)
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
      color: '#f59e0b',
      strokeWidth: 3,
      opacity: type === 'rect' || type === 'circle' ? 0.4 : 1,
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

  // Événements de dessin libre à la souris
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
      opacity: penType === 'highlighter' ? 0.35 : 1,
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
    if (isDrawMode) return;
    setSelectedPlayerId(id);
    setSelectedShapeId(null);
    e.target.moveToTop();
  };

  const handleDragEnd = (e: any, id: string) => {
    if (isDrawMode) return;
    let targetX = e.target.x();
    let targetY = e.target.y();

    targetX = Math.max(30, Math.min(770, targetX));
    targetY = Math.max(30, Math.min(470, targetY));

    const updatedPlayers = resolveCollisions(
      players.map((p) => (p.id === id ? { ...p, x: targetX, y: targetY } : p))
    );
    setPlayers(updatedPlayers);
    saveToHistory(updatedPlayers, shapes);
  };

  // HANDLERS TACTILE ET CLIC DROIT POUR PITCH ITEMS
  const handleItemContextMenu = (e: any, id: string, type: 'shape' | 'player') => {
    e.evt.preventDefault();
    e.evt.stopPropagation();
    const evt = e.evt;

    if (type === 'shape') {
      setSelectedShapeId(id);
      setSelectedPlayerId(null);
    } else {
      setSelectedPlayerId(id);
      setSelectedShapeId(null);
    }

    setContextMenu({
      visible: true,
      x: evt.clientX,
      y: evt.clientY,
      targetId: id,
      targetType: type,
    });
  };

  const handleItemTouchStart = (e: any, id: string, type: 'shape' | 'player') => {
    const evt = e.evt;
    if (!evt.touches || evt.touches.length !== 1) return;
    const touch = evt.touches[0];

    longPressTimerRef.current = setTimeout(() => {
      if (type === 'shape') {
        setSelectedShapeId(id);
        setSelectedPlayerId(null);
      } else {
        setSelectedPlayerId(id);
        setSelectedShapeId(null);
      }

      setContextMenu({
        visible: true,
        x: touch.clientX,
        y: touch.clientY,
        targetId: id,
        targetType: type,
      });
    }, 500);
  };

  const clearLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
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

    const updatedPlayers = resolveCollisions(
      players.map((player) => {
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
      })
    );
    setPlayers(updatedPlayers);
    saveToHistory(updatedPlayers, shapes);
  };

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-neutral-950 select-none">

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

      {/* Barre de contrôles supérieure */}
      <div className="shrink-0 flex justify-center px-2 pt-2 pb-1 z-50">
        <div className="flex flex-wrap items-center justify-center gap-3 bg-neutral-900/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-neutral-800 shadow-lg relative">

          {/* Bouton Annuler (Ctrl+Z) */}
          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${
              historyIndex > 0
                ? 'bg-neutral-800 hover:bg-neutral-700 text-white border-neutral-700 active:scale-95'
                : 'bg-neutral-900 text-neutral-600 border-neutral-800 cursor-not-allowed'
            }`}
          >
            ↶ Annuler (Ctrl+Z)
          </button>

          <div className="h-4 w-px bg-neutral-800 my-auto" />

          {/* Menu Formes & Dessin */}
          <div className="relative">
            <button
              onClick={() => setIsShapeMenuOpen(!isShapeMenuOpen)}
              className={`border px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 ${
                isDrawMode
                  ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-md shadow-amber-500/20'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-amber-400 border-neutral-700'
              }`}
            >
              <span>{isDrawMode ? '✍️ Dessin en cours' : '🔷 Formes & Dessin'}</span>
              <span className="text-[10px] text-neutral-400">▼</span>
            </button>

            {isShapeMenuOpen && (
              <div className="absolute left-0 top-full mt-2 w-52 bg-neutral-900 border border-neutral-700 rounded-lg shadow-2xl overflow-hidden text-xs py-1 z-50">
                <div className="px-3 py-1 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                  ✏️ Dessin à la main
                </div>
                <button
                  onClick={() => {
                    setIsDrawMode(true);
                    setSelectedShapeId(null);
                    setSelectedPlayerId(null);
                    setIsShapeMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 flex items-center gap-2 transition ${
                    isDrawMode ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'hover:bg-neutral-800 text-neutral-200'
                  }`}
                >
                  <span>✏️</span> Activer le dessin libre
                </button>

                <div className="border-t border-neutral-800 my-1" />

                <div className="px-3 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Lignes & Flèches
                </div>
                <button
                  onClick={() => addShape('arrow')}
                  className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 text-neutral-200 flex items-center gap-2 transition"
                >
                  <span className="text-amber-400">➔</span> Flèche continue
                </button>
                <button
                  onClick={() => addShape('dashed-arrow')}
                  className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 text-neutral-200 flex items-center gap-2 transition"
                >
                  <span className="text-amber-400">⇢</span> Flèche pointillée
                </button>

                <div className="border-t border-neutral-800 my-1" />
                <div className="px-3 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Zones & Formes
                </div>
                <button
                  onClick={() => addShape('rect')}
                  className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 text-neutral-200 flex items-center gap-2 transition"
                >
                  <span className="text-amber-400">▭</span> Zone Rectangulaire
                </button>
                <button
                  onClick={() => addShape('circle')}
                  className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 text-neutral-200 flex items-center gap-2 transition"
                >
                  <span className="text-amber-400">◯</span> Zone Circulaire
                </button>

                <div className="border-t border-neutral-800 my-1" />
                <div className="px-3 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Texte
                </div>
                <button
                  onClick={() => addShape('text')}
                  className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 text-neutral-200 flex items-center gap-2 transition"
                >
                  <span className="text-amber-400">✎</span> Annotation / Texte
                </button>
              </div>
            )}
          </div>

          <div className="h-4 w-px bg-neutral-800 my-auto" />

          {/* Choix des Bleus */}
          <div className="flex items-center gap-2">
            <label htmlFor="blue-formation-select" className="text-xs font-semibold text-blue-400">
              Bleus :
            </label>
            <select
              id="blue-formation-select"
              value={selectedBlueFormation}
              onChange={(e) => handleSelectAction('blue', e.target.value)}
              className="bg-neutral-800 text-white text-xs px-2.5 py-1 rounded border border-neutral-700 outline-none focus:border-blue-500 cursor-pointer font-medium"
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

          {/* Bouton Créer */}
          <div className="flex items-center justify-center">
            {!isCreating ? (
              <button
                onClick={() => setIsCreating(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-2.5 py-1 rounded font-medium transition flex items-center gap-1 shadow"
              >
                <span className="text-sm font-bold">+</span> Créer
              </button>
            ) : (
              <form onSubmit={handleSaveCustomTactique} className="flex items-center gap-1 bg-neutral-800 p-1 rounded border border-neutral-700">
                <input
                  type="text"
                  placeholder="Nom"
                  value={newTactiqueName}
                  onChange={(e) => setNewTactiqueName(e.target.value)}
                  className="bg-neutral-900 text-white text-xs px-2 py-0.5 rounded border border-neutral-600 outline-none focus:border-emerald-500 w-28"
                  autoFocus
                />
                <button type="submit" className="bg-emerald-600 text-white text-xs px-2 py-0.5 rounded font-medium">OK</button>
                <button type="button" onClick={() => setIsCreating(false)} className="text-neutral-400 hover:text-white text-xs px-1">✕</button>
              </form>
            )}
          </div>

          {/* Choix des Rouges */}
          <div className="flex items-center gap-2">
            <label htmlFor="red-formation-select" className="text-xs font-semibold text-red-400">
              Rouges :
            </label>
            <select
              id="red-formation-select"
              value={selectedRedFormation}
              onChange={(e) => handleSelectAction('red', e.target.value)}
              className="bg-neutral-800 text-white text-xs px-2.5 py-1 rounded border border-neutral-700 outline-none focus:border-red-500 cursor-pointer font-medium"
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

          <div className="h-4 w-px bg-neutral-800 my-auto" />

          {/* Bouton d'Exportation d'Image */}
          <button
            onClick={handleExportImage}
            className="bg-sky-600 hover:bg-sky-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition shadow"
          >
            📸 Exporter PNG
          </button>
        </div>
      </div>

      {/* Zone du terrain Canvas */}
      <div ref={fieldAreaRef} className="flex-1 flex items-center justify-center relative p-2 overflow-hidden">
        <div
          style={{
            width: DESIGN_WIDTH * scale,
            height: DESIGN_HEIGHT * scale,
          }}
          className="relative shadow-2xl rounded-lg overflow-hidden border-2 border-neutral-800"
        >
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
          >
            {/* Calque terrain de football */}
            <Layer>
              {/* Fond pelouse */}
              <Rect x={0} y={0} width={DESIGN_WIDTH} height={DESIGN_HEIGHT} fill="#15803d" />

              {/* Ligne extérieure */}
              <Rect
                x={20}
                y={20}
                width={760}
                height={460}
                stroke="#ffffff"
                strokeWidth={3}
                opacity={0.85}
              />

              {/* Ligne médiane */}
              <Line points={[400, 20, 400, 480]} stroke="#ffffff" strokeWidth={3} opacity={0.85} />

              {/* Cercle central */}
              <Circle x={400} y={250} radius={65} stroke="#ffffff" strokeWidth={3} opacity={0.85} />
              <Circle x={400} y={250} radius={4} fill="#ffffff" opacity={0.85} />

              {/* Surface gauche */}
              <Rect x={20} y={130} width={120} height={240} stroke="#ffffff" strokeWidth={3} opacity={0.85} />
              <Rect x={20} y={190} width={45} height={120} stroke="#ffffff" strokeWidth={3} opacity={0.85} />

              {/* Surface droite */}
              <Rect x={660} y={130} width={120} height={240} stroke="#ffffff" strokeWidth={3} opacity={0.85} />
              <Rect x={735} y={190} width={45} height={120} stroke="#ffffff" strokeWidth={3} opacity={0.85} />
            </Layer>

            {/* Calque des formes & dessins */}
            <Layer>
              {shapes.map((s) => {
                const isSelected = s.id === selectedShapeId;

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
                      strokeWidth={s.strokeWidth || 3}
                      dash={s.type === 'dashed-arrow' ? [8, 8] : undefined}
                      draggable={!isDrawMode}
                      onClick={() => { setSelectedShapeId(s.id); setSelectedPlayerId(null); }}
                      onTap={() => { setSelectedShapeId(s.id); setSelectedPlayerId(null); }}
                      onContextMenu={(e) => handleItemContextMenu(e, s.id, 'shape')}
                      onTouchStart={(e) => handleItemTouchStart(e, s.id, 'shape')}
                      onTouchMove={clearLongPress}
                      onTouchEnd={clearLongPress}
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
                      width={s.width || 120}
                      height={s.height || 70}
                      fill={s.color}
                      opacity={s.opacity || 0.4}
                      stroke={s.color}
                      strokeWidth={2}
                      draggable={!isDrawMode}
                      onClick={() => { setSelectedShapeId(s.id); setSelectedPlayerId(null); }}
                      onTap={() => { setSelectedShapeId(s.id); setSelectedPlayerId(null); }}
                      onContextMenu={(e) => handleItemContextMenu(e, s.id, 'shape')}
                      onTouchStart={(e) => handleItemTouchStart(e, s.id, 'shape')}
                      onTouchMove={clearLongPress}
                      onTouchEnd={clearLongPress}
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
                      radius={s.radius || 40}
                      fill={s.color}
                      opacity={s.opacity || 0.4}
                      stroke={s.color}
                      strokeWidth={2}
                      draggable={!isDrawMode}
                      onClick={() => { setSelectedShapeId(s.id); setSelectedPlayerId(null); }}
                      onTap={() => { setSelectedShapeId(s.id); setSelectedPlayerId(null); }}
                      onContextMenu={(e) => handleItemContextMenu(e, s.id, 'shape')}
                      onTouchStart={(e) => handleItemTouchStart(e, s.id, 'shape')}
                      onTouchMove={clearLongPress}
                      onTouchEnd={clearLongPress}
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
                      text={s.text || 'Texte'}
                      fontSize={16}
                      fontStyle="bold"
                      fill={s.color || '#f59e0b'}
                      draggable={!isDrawMode}
                      onClick={() => { setSelectedShapeId(s.id); setSelectedPlayerId(null); }}
                      onTap={() => { setSelectedShapeId(s.id); setSelectedPlayerId(null); }}
                      onContextMenu={(e) => handleItemContextMenu(e, s.id, 'shape')}
                      onTouchStart={(e) => handleItemTouchStart(e, s.id, 'shape')}
                      onTouchMove={clearLongPress}
                      onTouchEnd={clearLongPress}
                    />
                  );
                }

                if (s.type === 'freehand') {
                  return (
                    <Line
                      key={s.id}
                      points={s.points || []}
                      stroke={s.color}
                      strokeWidth={s.strokeWidth || 4}
                      opacity={s.opacity || 1}
                      dash={s.penType === 'dashed' ? [10, 10] : undefined}
                      lineCap="round"
                      lineJoin="round"
                    />
                  );
                }

                return null;
              })}

              {/* Transformateur de redimensionnement de forme */}
              {selectedShapeId && <Transformer ref={trRef} rotateEnabled={true} />}
            </Layer>

            {/* Calque des Joueurs */}
            <Layer>
              {players.map((p) => {
                const isSelected = p.id === selectedPlayerId;

                return (
                  <Group
                    key={p.id}
                    x={p.x}
                    y={p.y}
                    draggable={!isDrawMode}
                    onDragStart={(e) => handleDragStart(e, p.id)}
                    onDragEnd={(e) => handleDragEnd(e, p.id)}
                    onClick={() => { setSelectedPlayerId(p.id); setSelectedShapeId(null); }}
                    onTap={() => { setSelectedPlayerId(p.id); setSelectedShapeId(null); }}
                    onContextMenu={(e) => handleItemContextMenu(e, p.id, 'player')}
                    onTouchStart={(e) => handleItemTouchStart(e, p.id, 'player')}
                    onTouchMove={clearLongPress}
                    onTouchEnd={clearLongPress}
                  >
                    {/* Cercle du joueur */}
                    <Circle
                      radius={18}
                      fill={p.color}
                      stroke={isSelected ? '#ffffff' : '#000000'}
                      strokeWidth={isSelected ? 3 : 1}
                      shadowBlur={isSelected ? 10 : 2}
                      shadowColor="#000000"
                    />

                    {/* Numéro */}
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

                    {/* Nom du joueur */}
                    {p.name && (
                      <Text
                        text={p.name}
                        fontSize={11}
                        fill="#ffffff"
                        align="center"
                        y={22}
                        offsetX={30}
                        width={60}
                      />
                    )}
                  </Group>
                );
              })}
            </Layer>
          </Stage>
        </div>
      </div>

      {/* Menu Contextuel Pop-up (Clic droit / Maintien Mobile) */}
      {contextMenu.visible && contextMenu.targetId && (
        <div
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            backgroundColor: '#171717',
            border: '1px solid #404040',
            boxShadow: '0px 10px 25px rgba(0,0,0,0.5)',
            borderRadius: '8px',
            zIndex: 100,
            overflow: 'hidden',
          }}
        >
          <button
            onClick={() => modifyTarget(contextMenu.targetId!, contextMenu.targetType!)}
            className="w-full text-left px-4 py-2 text-xs font-semibold text-neutral-200 hover:bg-neutral-800 transition flex items-center gap-2"
          >
            ✏️ Modifier
          </button>
          <button
            onClick={() => deleteTarget(contextMenu.targetId!, contextMenu.targetType!)}
            className="w-full text-left px-4 py-2 text-xs font-semibold text-red-400 hover:bg-neutral-800 transition flex items-center gap-2 border-t border-neutral-800"
          >
            🗑 Supprimer (Suppr)
          </button>
        </div>
      )}
    </div>
  );
}