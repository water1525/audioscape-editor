import { useRef, useEffect, useCallback } from "react";

// Global audio reference shared across all components
let globalAudioRef: HTMLAudioElement | null = null;
let globalStopCallback: (() => void) | null = null;

export const useGlobalAudio = () => {
  const localAudioRef = useRef<HTMLAudioElement | null>(null);

  // Stop any currently playing audio
  const stopGlobalAudio = useCallback(() => {
    if (globalAudioRef) {
      globalAudioRef.pause();
      globalAudioRef = null;
    }
    if (globalStopCallback) {
      globalStopCallback();
      globalStopCallback = null;
    }
  }, []);

  // Play audio and register it as the global audio
  const playAudio = useCallback((audio: HTMLAudioElement, onStop?: () => void) => {
    // Stop any currently playing audio first
    stopGlobalAudio();

    // Set the new audio as global
    globalAudioRef = audio;
    localAudioRef.current = audio;
    globalStopCallback = onStop || null;

    return audio;
  }, [stopGlobalAudio]);

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      if (localAudioRef.current === globalAudioRef) {
        stopGlobalAudio();
      }
    };
  }, [stopGlobalAudio]);

  return {
    playAudio,
    stopGlobalAudio,
    getCurrentAudio: () => globalAudioRef,
  };
};
