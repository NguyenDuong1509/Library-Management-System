/** URL and query helpers for global-search → Mượn/Trả prefill (spec: frontend-api-integration). */

export function memberMuonTraUrl(libraryCardId: string): string {
  return `/thu-thu/muon-tra?card=${encodeURIComponent(libraryCardId)}`
}

export function memberQueryFromCardParam(card: string | null): string {
  return card ?? ''
}
