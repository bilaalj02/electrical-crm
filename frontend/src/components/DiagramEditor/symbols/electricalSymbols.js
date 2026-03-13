import SYMBOLS_A from './symbolsA.js';
import SYMBOLS_B from './symbolsB.js';
import SYMBOLS_C from './symbolsC.js';

export const SYMBOLS = [...SYMBOLS_A, ...SYMBOLS_B, ...SYMBOLS_C];

export const CATEGORIES = [
  { id: 'power-sources',    label: 'Power Sources',            icon: '⏻' },
  { id: 'basic-switches',   label: 'Switches',                 icon: '⎘' },
  { id: 'wall-devices',     label: 'Wall Devices',             icon: '⊞' },
  { id: 'receptacles',      label: 'Receptacles & Outlets',    icon: '⊡' },
  { id: 'lighting',         label: 'Lighting',                 icon: '◉' },
  { id: 'protection',       label: 'Circuit Protection',       icon: '⊠' },
  { id: 'panels',           label: 'Panels & Distribution',    icon: '▦' },
  { id: 'transformers',     label: 'Transformers',             icon: '⊗' },
  { id: 'motors-drives',    label: 'Motors & Drives',          icon: '↻' },
  { id: 'control',          label: 'Control Devices',          icon: '⊛' },
  { id: 'sensors',          label: 'Sensors & Detectors',      icon: '◎' },
  { id: 'fire-alarm',       label: 'Fire Alarm & Life Safety', icon: '△' },
  { id: 'security',         label: 'Security Systems',         icon: '◈' },
  { id: 'communication',    label: 'Communication & Data',     icon: '≋' },
  { id: 'hvac',             label: 'HVAC & Mechanical',        icon: '※' },
  { id: 'grounding',        label: 'Grounding & Bonding',      icon: '⏚' },
  { id: 'electronic',       label: 'Electronic Components',    icon: '⊕' },
  { id: 'wiring',           label: 'Wiring & Conduit',         icon: '≡' },
  { id: 'renewable',        label: 'Renewable Energy',         icon: '⌾' },
  { id: 'measuring',        label: 'Measuring Instruments',    icon: '⊟' },
  { id: 'custom',           label: 'My Custom Symbols',        icon: '⊹' },
];

// Runtime-populated custom symbols (loaded from MongoDB)
export let CUSTOM_SYMBOLS = [];
export const setCustomSymbols = (arr) => { CUSTOM_SYMBOLS = arr; };

export const getSymbolsByCategory = (categoryId) => {
  if (categoryId === 'custom') return CUSTOM_SYMBOLS;
  if (categoryId === 'all') return SYMBOLS;
  return SYMBOLS.filter(s => s.category === categoryId);
};

export const searchSymbols = (query, includeCustom = true) => {
  if (!query || query.trim() === '') return [];
  const q = query.toLowerCase().trim();
  const pool = includeCustom ? [...SYMBOLS, ...CUSTOM_SYMBOLS] : SYMBOLS;
  return pool.filter(sym => {
    if (sym.name.toLowerCase().includes(q)) return true;
    if (sym.category.toLowerCase().includes(q)) return true;
    if (sym.subcategory && sym.subcategory.toLowerCase().includes(q)) return true;
    if (sym.tags && sym.tags.some(t => t.toLowerCase().includes(q))) return true;
    return false;
  });
};

export const getSymbolById = (id) => {
  const all = [...SYMBOLS, ...CUSTOM_SYMBOLS];
  return all.find(s => s.id === id) || null;
};

export default SYMBOLS;
