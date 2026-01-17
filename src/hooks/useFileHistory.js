import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'ilovejson_file_history';
const MAX_HISTORY_ITEMS = 20;

export function useFileHistory() {
  const [history, setHistory] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setHistory(Array.isArray(parsed) ? parsed : []);
        }
      } catch (e) {
        console.error('Failed to load file history:', e);
        setHistory([]);
      }
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
      } catch (e) {
        console.error('Failed to save file history:', e);
      }
    }
  }, [history, isLoaded]);

  const addToHistory = useCallback((entry) => {
    const newEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      fileName: entry.fileName,
      fromFormat: entry.fromFormat,
      toFormat: entry.toFormat,
      downloadLink: entry.downloadLink,
      fileSize: entry.fileSize || 0,
    };

    setHistory((prev) => {
      const updated = [newEntry, ...prev].slice(0, MAX_HISTORY_ITEMS);
      return updated;
    });
  }, []);

  const removeFromHistory = useCallback((id) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const getHistoryByFormat = useCallback(
    (format) => {
      const lowerFormat = format.toLowerCase();
      return history.filter(
        (item) =>
          item.fromFormat.toLowerCase() === lowerFormat ||
          item.toFormat.toLowerCase() === lowerFormat
      );
    },
    [history]
  );

  return {
    history,
    isLoaded,
    addToHistory,
    removeFromHistory,
    clearHistory,
    getHistoryByFormat,
  };
}

export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatTimestamp(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}
