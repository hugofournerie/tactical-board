"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const standaloneQuery = "(display-mode: standalone)";

function subscribeStandalone(onChange: () => void) {
  const mq = window.matchMedia(standaloneQuery);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getStandalone() {
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return window.matchMedia(standaloneQuery).matches || iosStandalone;
}

function getIsIOS() {
  // iPadOS se présente comme un Mac : on teste aussi le tactile.
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

const noopSubscribe = () => () => {};

export default function InstallHint() {
  const standalone = useSyncExternalStore(subscribeStandalone, getStandalone, () => true);
  const isIOS = useSyncExternalStore(noopSubscribe, getIsIOS, () => false);
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (standalone || dismissed) return null;
  if (!promptEvent && !isIOS) return null;

  const install = async () => {
    if (!promptEvent) return;
    await promptEvent.prompt();
    await promptEvent.userChoice;
    setPromptEvent(null);
  };

  return (
    <div className="flex shrink-0 items-center justify-between gap-3 border-t border-line bg-surface px-4 py-2.5 text-[13px]">
      {promptEvent ? (
        <>
          <span className="text-muted">Installe l&apos;app pour l&apos;ouvrir en plein écran.</span>
          <span className="flex gap-2">
            <button onClick={() => setDismissed(true)} className="px-2 py-1 text-muted">
              Plus tard
            </button>
            <button onClick={install} className="rounded-full bg-ink px-3.5 py-1.5 font-medium text-paper">
              Installer
            </button>
          </span>
        </>
      ) : (
        <>
          <span className="text-muted">
            Pour installer : touche Partager, puis « Sur l&apos;écran d&apos;accueil ».
          </span>
          <button onClick={() => setDismissed(true)} className="px-2 py-1 text-muted">
            OK
          </button>
        </>
      )}
    </div>
  );
}
