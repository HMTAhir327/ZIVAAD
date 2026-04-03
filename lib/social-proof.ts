export function getSocialProofSeed(id: string): { viewing: number; soldToday: number } {
  const hash = id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return {
    viewing: 8 + (hash % 12),
    soldToday: 3 + (hash % 7)
  };
}
