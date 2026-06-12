import React, { useState, useMemo } from 'react';
import { CATEGORIES, getSymbolsByCategory, searchSymbols, CUSTOM_SYMBOLS } from './symbols/electricalSymbols.js';

function SymbolTile({ symbol, onDragStart, onDoubleClick }) {
  return (
    <div
      className="de-symbol-tile"
      draggable
      onDragStart={e => {
        e.dataTransfer.setData('symbol-id', symbol.id);
        e.dataTransfer.effectAllowed = 'copy';
        onDragStart && onDragStart(symbol);
      }}
      onDoubleClick={() => onDoubleClick && onDoubleClick(symbol)}
      title={symbol.name}
    >
      <div dangerouslySetInnerHTML={{ __html: symbol.svg }} />
      <span className="de-symbol-tile-name">{symbol.name}</span>
    </div>
  );
}

function CategorySection({ category, onDragStart, onDoubleClick }) {
  const [open, setOpen] = useState(false);
  const symbols = useMemo(() => getSymbolsByCategory(category.id), [category.id]);

  if (symbols.length === 0) return null;

  return (
    <div>
      <div
        className={`de-cat-header${open ? ' open' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <span className="de-cat-icon">{category.icon}</span>
        <span className="de-cat-label">{category.label}</span>
        <span className="de-cat-count">{symbols.length}</span>
        <span className={`de-cat-chevron${open ? ' open' : ''}`}>▶</span>
      </div>
      {open && (
        <div className="de-symbol-grid">
          {symbols.map(sym => (
            <SymbolTile
              key={sym.id}
              symbol={sym}
              onDragStart={onDragStart}
              onDoubleClick={onDoubleClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SymbolLibrary({ onDragStart, onSymbolDrop, onAddCustom }) {
  const [query, setQuery] = useState('');

  const searchResults = useMemo(() => {
    if (!query.trim()) return null;
    return searchSymbols(query, true);
  }, [query]);

  return (
    <div className="de-library">
      <div className="de-library-header">
        <h3>Symbol Library</h3>
        <div className="de-search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search 400+ symbols…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button
              style={{ background: 'none', border: 'none', color: 'var(--de-text-muted)', cursor: 'pointer', padding: 0 }}
              onClick={() => setQuery('')}
            >✕</button>
          )}
        </div>
      </div>

      <div className="de-library-scroll">
        {searchResults ? (
          <div className="de-search-results">
            <div className="de-search-results-count">
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{query}"
            </div>
            {searchResults.length > 0 ? (
              <div className="de-symbol-grid">
                {searchResults.map(sym => (
                  <SymbolTile
                    key={sym.id}
                    symbol={sym}
                    onDragStart={onDragStart}
                    onDoubleClick={sym => onSymbolDrop && onSymbolDrop(sym, null)}
                  />
                ))}
              </div>
            ) : (
              <div style={{ padding: '16px', color: 'var(--de-text-muted)', fontSize: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔍</div>
                No symbols found.<br />
                <button
                  className="de-add-custom-btn"
                  style={{ marginTop: '8px', width: '100%' }}
                  onClick={onAddCustom}
                >
                  + Create Custom Symbol
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {CATEGORIES.map(cat => (
              <CategorySection
                key={cat.id}
                category={cat}
                onDragStart={onDragStart}
                onDoubleClick={sym => onSymbolDrop && onSymbolDrop(sym, null)}
              />
            ))}
          </>
        )}
      </div>

      <button className="de-add-custom-btn" onClick={onAddCustom}>
        ✏️ Create Custom Symbol
      </button>
    </div>
  );
}
