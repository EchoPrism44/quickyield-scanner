import { Body, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import type { Opportunity } from '../lib/types'

const bg = '#050a12'
const surface = '#0d1a2b'
const accent = '#38d5ff'
const muted = '#8baabf'
const text = '#f4f8ff'
const border = '#1a2d42'
const up = '#34d399'
const warn = '#f59e0b'

function gradeColor(grade?: string) {
  if (!grade) return muted
  if (grade === 'A') return up
  if (grade === 'B') return accent
  if (grade === 'C') return warn
  return '#f87171'
}

export function DigestEmail({
  watchlistPools,
  topPicks,
  weekLabel,
}: {
  watchlistPools: (Opportunity & { grade?: string })[]
  topPicks: (Opportunity & { grade?: string })[]
  weekLabel: string
}) {
  return (
    <Html>
      <Head />
      <Preview>Your weekly Safe Yield digest — {weekLabel}</Preview>
      <Body style={{ backgroundColor: bg, color: text, fontFamily: 'Arial, sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 560, margin: '0 auto', padding: '32px 24px' }}>

          {/* Header */}
          <Text style={{ color: accent, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', margin: '0 0 8px' }}>
            Litmus · Safe Yield Digest
          </Text>
          <Heading style={{ color: text, fontSize: 24, margin: '0 0 4px' }}>
            Weekly update
          </Heading>
          <Text style={{ color: muted, fontSize: 13, margin: '0 0 32px' }}>{weekLabel}</Text>

          {/* Watchlist section */}
          {watchlistPools.length > 0 && (
            <Section>
              <Text style={{ color: accent, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', margin: '0 0 12px' }}>
                Your watchlist
              </Text>
              {watchlistPools.map((pool) => (
                <Section
                  key={pool.id}
                  style={{ backgroundColor: surface, border: `1px solid ${border}`, borderRadius: 8, padding: '14px 16px', marginBottom: 8 }}
                >
                  <table width="100%" cellPadding={0} cellSpacing={0}>
                    <tbody>
                      <tr>
                        <td>
                          <Text style={{ color: text, fontSize: 14, fontWeight: 'bold', margin: 0 }}>{pool.platform}</Text>
                          <Text style={{ color: muted, fontSize: 12, margin: '2px 0 0' }}>{pool.asset} · {pool.chain}</Text>
                        </td>
                        <td style={{ textAlign: 'right', verticalAlign: 'top' }}>
                          <Text style={{ color: up, fontSize: 16, fontWeight: 'bold', margin: 0 }}>{pool.apy.toFixed(2)}%</Text>
                          {pool.grade && (
                            <Text style={{ color: gradeColor(pool.grade), fontSize: 11, margin: '2px 0 0' }}>
                              Grade {pool.grade}
                            </Text>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </Section>
              ))}
            </Section>
          )}

          {watchlistPools.length === 0 && (
            <Section style={{ backgroundColor: surface, border: `1px solid ${border}`, borderRadius: 8, padding: '16px', marginBottom: 24 }}>
              <Text style={{ color: muted, fontSize: 13, margin: 0 }}>
                No pools in your watchlist yet. Head to the terminal to save pools you want to track.
              </Text>
            </Section>
          )}

          {/* Top picks section */}
          {topPicks.length > 0 && (
            <Section style={{ marginTop: 24 }}>
              <Text style={{ color: accent, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', margin: '0 0 12px' }}>
                Top safe picks this week
              </Text>
              {topPicks.map((pool) => (
                <Section
                  key={pool.id}
                  style={{ backgroundColor: surface, border: `1px solid ${border}`, borderRadius: 8, padding: '14px 16px', marginBottom: 8 }}
                >
                  <table width="100%" cellPadding={0} cellSpacing={0}>
                    <tbody>
                      <tr>
                        <td>
                          <Text style={{ color: text, fontSize: 14, fontWeight: 'bold', margin: 0 }}>{pool.platform}</Text>
                          <Text style={{ color: muted, fontSize: 12, margin: '2px 0 0' }}>{pool.asset} · {pool.chain} · {pool.risk} risk</Text>
                        </td>
                        <td style={{ textAlign: 'right', verticalAlign: 'top' }}>
                          <Text style={{ color: up, fontSize: 16, fontWeight: 'bold', margin: 0 }}>{pool.apy.toFixed(2)}%</Text>
                          {pool.grade && (
                            <Text style={{ color: gradeColor(pool.grade), fontSize: 11, margin: '2px 0 0' }}>
                              Grade {pool.grade}
                            </Text>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </Section>
              ))}
            </Section>
          )}

          {/* Footer */}
          <Section style={{ marginTop: 32, borderTop: `1px solid ${border}`, paddingTop: 24 }}>
            <Text style={{ color: muted, fontSize: 11, margin: '0 0 4px' }}>
              Litmus is a research tool, not a financial adviser. Review fees, lockups, smart-contract risk,
              custody risk, and regional availability before using any third-party platform.
            </Text>
            <Text style={{ color: muted, fontSize: 11, margin: '8px 0 0' }}>
              To stop receiving this digest, turn off Weekly digest in your terminal Settings.
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}
