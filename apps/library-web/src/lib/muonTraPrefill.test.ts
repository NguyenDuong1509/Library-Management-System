import { describe, expect, it } from 'vitest'
import { memberMuonTraUrl, memberQueryFromCardParam } from './muonTraPrefill'

describe('muonTraPrefill', () => {
  it('builds navigate URL with encoded library card id', () => {
    expect(memberMuonTraUrl('TV-2024/01')).toBe('/thu-thu/muon-tra?card=TV-2024%2F01')
  })

  it('maps card query param to member lookup initial value', () => {
    expect(memberQueryFromCardParam('TV-123')).toBe('TV-123')
    expect(memberQueryFromCardParam(null)).toBe('')
  })
})
