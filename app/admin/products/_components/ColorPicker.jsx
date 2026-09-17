'use client';

import { useState, useEffect } from 'react';
import {
  generateColorShades,
  lookupFrenchColor,
  getAvailableFrenchColors,
} from '@/app/admin/utils/colorUtils';

export default function ColorPicker({
  value = '#8B7CD8',
  nameValue = '',
  onChange = () => {},
  onAdd = null,
  label = 'Couleur',
}) {
  const [colorName, setColorName] = useState(nameValue);
  const [shades, setShades] = useState([]);
  const [selectedShade, setSelectedShade] = useState(value);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Sync external nameValue if passed
  useEffect(() => {
    if (nameValue && nameValue !== colorName) {
      setColorName(nameValue);
      const hex = lookupFrenchColor(nameValue);
      if (hex) {
        const newShades = generateColorShades(hex, 8);
        setShades(newShades);
        setFallbackMode(false);
      }
    }
  }, [nameValue]);

  // Sync external value
  useEffect(() => {
    if (value) {
      setSelectedShade(value);
    }
  }, [value]);

  // Autocomplete suggestions
  useEffect(() => {
    if (colorName.trim() && showSuggestions) {
      const available = getAvailableFrenchColors();
      const normalized = colorName.toLowerCase().trim();
      const matched = available.filter((c) =>
        c.toLowerCase().includes(normalized)
      );
      setSuggestions(matched.slice(0, 6));
    } else {
      setSuggestions([]);
    }
  }, [colorName, showSuggestions]);

  const handleColorNameChange = (name) => {
    setColorName(name);
    setShowSuggestions(true);
    const hex = lookupFrenchColor(name);

    if (hex) {
      setFallbackMode(false);
      const newShades = generateColorShades(hex, 8);
      setShades(newShades);
      // Pick middle-dark shade (index 4 or 5) for balanced richness
      const defaultShade = newShades[4] || hex;
      setSelectedShade(defaultShade);
      onChange({ name: name.trim(), hex: defaultShade });
    } else if (name.trim()) {
      setFallbackMode(true);
      onChange({ name: name.trim(), hex: selectedShade });
    } else {
      setShades([]);
      setFallbackMode(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setColorName(suggestion);
    setShowSuggestions(false);
    const hex = lookupFrenchColor(suggestion);
    if (hex) {
      setFallbackMode(false);
      const newShades = generateColorShades(hex, 8);
      setShades(newShades);
      const defaultShade = newShades[4] || hex;
      setSelectedShade(defaultShade);
      onChange({ name: suggestion, hex: defaultShade });
    }
  };

  const handleShadeSelect = (shade) => {
    setSelectedShade(shade);
    onChange({ name: colorName.trim() || 'Couleur', hex: shade });
  };

  const handleFallbackColorChange = (e) => {
    const hex = e.target.value;
    setSelectedShade(hex);
    const newShades = generateColorShades(hex, 8);
    setShades(newShades);
    onChange({ name: colorName.trim() || 'Personnalisée', hex });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
          {label}
        </label>
        {selectedShade && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-mono">
            <span
              className="w-3.5 h-3.5 rounded-full border border-gray-200 shadow-2xs inline-block"
              style={{ backgroundColor: selectedShade }}
            />
            <span>{selectedShade}</span>
          </div>
        )}
      </div>

      {/* Input container with French color name and autocomplete */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={colorName}
              onChange={(e) => handleColorNameChange(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Ex: bordeaux, marine, corail, kaki, beige..."
              className="w-full px-3.5 py-2 text-sm bg-white border border-gray-200 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:border-[#8B7CD8] focus:ring-2 focus:ring-[#8B7CD8]/20 transition"
            />
            {colorName && (
              <button
                type="button"
                onClick={() => {
                  setColorName('');
                  setShades([]);
                  setFallbackMode(false);
                  setShowSuggestions(false);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs p-1"
              >
                ✕
              </button>
            )}
          </div>

          {onAdd && (
            <button
              type="button"
              onClick={() => {
                if (colorName.trim()) {
                  onAdd(colorName.trim(), selectedShade);
                  setColorName('');
                  setShades([]);
                  setFallbackMode(false);
                  setShowSuggestions(false);
                }
              }}
              disabled={!colorName.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-[#8B7CD8] hover:bg-[#7A6BC7] rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 whitespace-nowrap shadow-xs"
            >
              <span>+</span>
              <span>Ajouter</span>
            </button>
          )}
        </div>

        {/* Autocomplete suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden py-1 max-h-48 overflow-y-auto">
            <div className="px-3 py-1 text-[11px] font-medium text-gray-400 uppercase tracking-wider">
              Suggestions
            </div>
            {suggestions.map((suggestion) => {
              const hex = lookupFrenchColor(suggestion);
              return (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-[#8B7CD8]/10 hover:text-[#5B4CAE] flex items-center justify-between transition"
                >
                  <span className="capitalize">{suggestion}</span>
                  {hex && (
                    <span
                      className="w-4 h-4 rounded-full border border-gray-200 shadow-2xs"
                      style={{ backgroundColor: hex }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Shade Palette (8 HSL shades) */}
      {!fallbackMode && shades.length > 0 && (
        <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100 space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Nuances (du plus clair au plus foncé) :</span>
            <span className="text-[11px] text-gray-400">Cliquez pour choisir</span>
          </div>

          <div className="grid grid-cols-8 gap-1.5 sm:gap-2">
            {shades.map((shade, idx) => {
              const isSelected = selectedShade?.toLowerCase() === shade?.toLowerCase();
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleShadeSelect(shade)}
                  className={`group relative h-9 sm:h-10 rounded-lg border transition-all duration-150 flex items-center justify-center ${
                    isSelected
                      ? 'border-[#8B7CD8] ring-2 ring-[#8B7CD8]/30 scale-105 shadow-sm z-10'
                      : 'border-black/10 hover:border-gray-400 hover:scale-102'
                  }`}
                  style={{ backgroundColor: shade }}
                  title={`Nuance ${idx + 1}: ${shade}`}
                >
                  {isSelected && (
                    <span
                      className={`text-xs font-bold drop-shadow-sm ${
                        idx < 4 ? 'text-gray-900' : 'text-white'
                      }`}
                    >
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Fallback color input if name is not recognized */}
      {fallbackMode && colorName.trim() && (
        <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200/80 space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="text-amber-600 text-xs font-semibold">Note :</span>
            <p className="text-xs text-gray-600">
              « {colorName} » n'est pas dans le dictionnaire. Choisissez la couleur manuellement :
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-11 h-10 rounded-lg overflow-hidden border border-gray-300 shadow-2xs flex-shrink-0 cursor-pointer">
              <input
                type="color"
                value={selectedShade}
                onChange={handleFallbackColorChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div
                className="w-full h-full"
                style={{ backgroundColor: selectedShade }}
              />
            </div>

            <div className="flex-1">
              <input
                type="text"
                value={selectedShade}
                onChange={(e) => {
                  setSelectedShade(e.target.value);
                  onChange({ name: colorName, hex: e.target.value });
                }}
                placeholder="#000000"
                className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#8B7CD8]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

