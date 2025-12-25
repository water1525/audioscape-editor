import { useState, useEffect, useCallback } from "react";

export interface CustomVoice {
  id: string;
  name: string;
  createdAt: number;
}

const STORAGE_KEY = "custom_voices";

export const useCustomVoices = () => {
  const [customVoices, setCustomVoices] = useState<CustomVoice[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const voices = JSON.parse(stored);
        setCustomVoices(voices);
      } catch (e) {
        console.error("Failed to parse custom voices:", e);
      }
    }
  }, []);

  // Save voice
  const saveVoice = useCallback((name: string): CustomVoice => {
    const newVoice: CustomVoice = {
      id: `custom_${Date.now()}`,
      name,
      createdAt: Date.now(),
    };

    setCustomVoices((prev) => {
      const updated = [...prev, newVoice];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    return newVoice;
  }, []);

  // Delete voice
  const deleteVoice = useCallback((id: string) => {
    setCustomVoices((prev) => {
      const updated = prev.filter((v) => v.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Refresh from localStorage (useful when other components update)
  const refreshVoices = useCallback(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setCustomVoices(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse custom voices:", e);
      }
    }
  }, []);

  return {
    customVoices,
    saveVoice,
    deleteVoice,
    refreshVoices,
  };
};
