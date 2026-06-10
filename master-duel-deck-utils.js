export function normalizeCardKey(name) {
  return String(name || '').trim().toLowerCase();
}

export function clamp(value, min, max) {
  const num = Number(value);
  if (!Number.isFinite(num)) return min;
  return Math.max(min, Math.min(max, num));
}

export function summarizeDeck(cards, ownedCards = {}) {
  let totalNeeded = 0;
  let ownedNeeded = 0;
  let totalMissing = 0;
  let missingUR = 0;
  let missingSR = 0;

  for (const card of cards) {
    const owned = clamp(ownedCards[normalizeCardKey(card.name)] || 0, 0, 99);
    const usedOwned = Math.min(owned, card.count);
    const missing = Math.max(card.count - owned, 0);
    totalNeeded += card.count;
    ownedNeeded += usedOwned;
    totalMissing += missing;
    if (card.rarity === 'UR') missingUR += missing;
    if (card.rarity === 'SR') missingSR += missing;
  }

  const percent = totalNeeded ? Math.round((ownedNeeded / totalNeeded) * 100) : 0;
  return { totalNeeded, ownedNeeded, totalMissing, missingUR, missingSR, percent };
}

export function summarizeGlobalCollection(decks, ownedCards = {}) {
  const uniqueCards = new Map();
  for (const deck of decks) {
    for (const card of [...deck.mainDeck, ...deck.extraDeck]) {
      const key = normalizeCardKey(card.name);
      if (!uniqueCards.has(key)) uniqueCards.set(key, { ...card, key });
    }
  }

  let ownedEntries = 0;
  let missingStapleCopies = 0;
  let missingUR = 0;
  let missingSR = 0;

  for (const card of uniqueCards.values()) {
    const owned = clamp(ownedCards[card.key] || 0, 0, 99);
    if (owned > 0) ownedEntries += 1;
    const desired = card.sharedStaple ? card.count : 0;
    const missingStaple = Math.max(desired - owned, 0);
    if (card.sharedStaple) missingStapleCopies += missingStaple;
    if (card.rarity === 'UR') missingUR += Math.max(card.count - owned, 0);
    if (card.rarity === 'SR') missingSR += Math.max(card.count - owned, 0);
  }

  return {
    trackedCards: uniqueCards.size,
    ownedEntries,
    missingStapleCopies,
    missingUR,
    missingSR,
  };
}

export function filterDecks(decks, filter) {
  if (!filter || filter === 'all') return decks;
  return decks.filter(deck => (deck.vibe || []).includes(filter));
}

export function parseOwnedCardsImport(text) {
  const data = JSON.parse(text);
  if (!data || typeof data !== 'object' || typeof data.ownedCards !== 'object' || Array.isArray(data.ownedCards)) {
    throw new Error('Import file must contain an ownedCards object.');
  }
  return data.ownedCards;
}

export function buildOwnedCardsExport(ownedCards) {
  return {
    exportedAt: new Date().toISOString(),
    source: 'Nyats Master Duel Deck Builder',
    ownedCards,
  };
}
