import { Body, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'
import type { AlertRule, Opportunity } from '../lib/types'

export function AlertEmail({ alert, opportunity }: { alert: AlertRule; opportunity: Opportunity }) {
  return (
    <Html>
      <Head />
      <Preview>
        {opportunity.name} matched {alert.name}
      </Preview>
      <Body style={{ backgroundColor: '#050a12', color: '#f4f8ff', fontFamily: 'Arial, sans-serif' }}>
        <Container style={{ maxWidth: 560, padding: 24 }}>
          <Heading style={{ color: '#38d5ff' }}>QuickYield alert matched</Heading>
          <Text>{opportunity.name} now matches your rule: {alert.name}.</Text>
          <Text>
            APY: {opportunity.apy.toFixed(1)}% | Risk: {opportunity.risk} | Safety score: {opportunity.confidence}
          </Text>
          <Text>
            QuickYield is informational only. Review fees, lockups, smart-contract risk, custody risk,
            and regional availability before using any third-party platform.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
