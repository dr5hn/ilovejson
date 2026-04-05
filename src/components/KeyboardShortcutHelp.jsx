import { useState, useEffect } from 'react';
import { getModifierKey } from '@hooks/useKeyboardShortcuts';

const shortcuts = [
  { keys: ['mod', 'Enter'], description: 'Convert file' },
  { keys: ['Escape'], description: 'Reset / Close' },
];

const KeyboardShortcutHelp = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [modKey, setModKey] = useState('Ctrl');

  useEffect(() => {
    setModKey(getModifierKey());
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const formatKey = (key) => {
    if (key === 'mod') return modKey;
    if (key === 'Enter') return '↵';
    return key;
  };

  return (
    <>
      {/* Floating help button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 w-10 h-10 bg-gray-100 dark:bg-dark-surface hover:bg-gray-200 dark:hover:bg-dark-border text-gray-600 dark:text-dark-muted rounded-full shadow-lg flex items-center justify-center transition-colors duration-200 z-40"
        aria-label="Keyboard shortcuts"
        title="Keyboard shortcuts"
      >
        <span className="text-lg font-mono">?</span>
      </button>

      {/* Modal overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white dark:bg-dark-surface rounded-lg shadow-xl max-w-sm w-full mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-dark-border">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text">
                Keyboard Shortcuts
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-dark-text transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Shortcuts list */}
            <div className="p-4 space-y-3">
              {shortcuts.map(({ keys, description }) => (
                <div key={description} className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-dark-muted">{description}</span>
                  <div className="flex items-center gap-1">
                    {keys.map((key, i) => (
                      <span key={i}>
                        <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 dark:text-dark-text bg-gray-100 dark:bg-dark-border border border-gray-300 dark:border-dark-muted rounded">
                          {formatKey(key)}
                        </kbd>
                        {i < keys.length - 1 && <span className="text-gray-400 mx-0.5">+</span>}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-gray-50 dark:bg-dark-bg border-t border-gray-200 dark:border-dark-border">
              <p className="text-xs text-gray-500 dark:text-dark-muted text-center">
                Press <kbd className="px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-dark-border rounded">Esc</kbd> to close
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default KeyboardShortcutHelp;
