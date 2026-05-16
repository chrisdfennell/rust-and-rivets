export const COLORS = {
  bg: 0x14110f,
  bgPanel: 0x1f1a16,
  rust: 0x8a3b1f,
  brass: 0xb88a3e,
  brassDim: 0x6b4f23,
  steel: 0x4a4640,
  steelDark: 0x2a2724,
  bone: 0xd9c9a3,
  boneDim: 0x8a7d5e,
  hull: 0xc44a2a,
  plating: 0x4f7a9b,
  steam: 0xd9ae4a,
  enemy: 0x8a3b3b,
  danger: 0xc44a2a,
  shield: 0x4f7a9b,
  buff: 0x6b9b4f,
  ok: 0x8a9b6b,
  cardBg: 0x2a201a,
  cardBgPlayable: 0x3a2a1f,
  cardBgUnplayable: 0x1f1814,
  cardBorder: 0xb88a3e,
  cardBorderDim: 0x6b4f23
};

// Card-border tint by rarity, exposed as its own map so CardView can swap
// colors without hardcoding constants. Unplayable cards still fall back to
// `cardBorderDim` regardless of rarity (the playable signal trumps the
// rarity signal — players need to know if a card is playable at a glance).
export const RARITY_COLORS: Record<'common' | 'uncommon' | 'rare' | 'epic' | 'legendary', number> = {
  common:    0xb88a3e, // brass-ish (matches default cardBorder)
  uncommon:  0x6b9b4f, // muted green
  rare:      0x4f7a9b, // shield-blue
  epic:      0x9b4fa6, // purple
  legendary: 0xd97a2a  // amber / orange
};

export const FONTS = {
  body: 'Courier New, monospace',
  display: 'Courier New, monospace'
};

export function hex(c: number): string {
  return '#' + c.toString(16).padStart(6, '0');
}
