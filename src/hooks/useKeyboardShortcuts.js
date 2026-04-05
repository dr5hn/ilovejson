import { useEffect, useCallback } from 'react';

/**
 * Hook for handling keyboard shortcuts
 * @param {Object} shortcuts - Object mapping shortcut keys to handlers
 * @param {Object} options - Options for the hook
 * @param {boolean} options.enabled - Whether shortcuts are enabled (default: true)
 *
 * Shortcut format:
 * - 'mod+Enter': Cmd+Enter on Mac, Ctrl+Enter on Windows
 * - 'Escape': Escape key
 * - 'mod+c': Cmd+C on Mac, Ctrl+C on Windows
 */
export function useKeyboardShortcuts(shortcuts, options = {}) {
  const { enabled = true } = options;

  const handleKeyDown = useCallback((event) => {
    if (!enabled) return;

    // Don't trigger shortcuts when typing in inputs
    const target = event.target;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      // Allow Escape in inputs
      if (event.key !== 'Escape') {
        return;
      }
    }

    const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modKey = isMac ? event.metaKey : event.ctrlKey;

    for (const [shortcut, handler] of Object.entries(shortcuts)) {
      const parts = shortcut.toLowerCase().split('+');
      const key = parts[parts.length - 1];
      const requiresMod = parts.includes('mod');
      const requiresShift = parts.includes('shift');
      const requiresAlt = parts.includes('alt');

      const keyMatches = event.key.toLowerCase() === key ||
                        event.code.toLowerCase() === key ||
                        event.code.toLowerCase() === `key${key}`;

      const modMatches = requiresMod ? modKey : !modKey;
      const shiftMatches = requiresShift ? event.shiftKey : !event.shiftKey;
      const altMatches = requiresAlt ? event.altKey : !event.altKey;

      if (keyMatches && modMatches && shiftMatches && altMatches) {
        event.preventDefault();
        handler(event);
        return;
      }
    }
  }, [shortcuts, enabled]);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);
}

/**
 * Get the modifier key symbol for the current platform
 */
export function getModifierKey() {
  if (typeof navigator === 'undefined') return 'Ctrl';
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  return isMac ? '⌘' : 'Ctrl';
}
