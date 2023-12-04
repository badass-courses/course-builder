import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'
import {Markdown} from '@react-email/markdown'

export type WeeklySignupsEmailProps = {
  user: {
    name: string
    email: string
    id: string
  }
  body: string
  previewText?: string
}

export const WeeklySignupsEmail = ({
  user = {id: '12345', name: 'Carlos', email: 'carlos@example.com'},
  body = `Hi Joel,\n\nJust catching up on your progress in the Full Stack Foundations module. Good going with the asset links management in your web applications. This lesson is fundamental for enhancing the user experience on nested routes, so it's great to see you moving along.\n\nAs a snapshot:\n- Section: Styling\n- Completed: 'Manage Asset Links in a Remix Application'\n- Module Progress: 7% \n\nRemember, every small technique you master now is adding up to a significant toolkit in full-stack web development.\n\nFor a comprehensive review or for tackling any tricky bits, all past lessons and exercises remain accessible for you.\n\nYour consistency is crucial. Every step forward counts.\n\nKeep going,\nKody the Koala 🐨`,
}: WeeklySignupsEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Build and Sell Your Developer Course</Preview>
      <Body style={main}>
        <Section style={content}>
          <Markdown>{body}</Markdown>
        </Section>
        <Section style={footer}>
          <Markdown>{``}</Markdown>
        </Section>
      </Body>
    </Html>
  )
}

export default WeeklySignupsEmail

const fontFamily = 'HelveticaNeue,Helvetica,Arial,sans-serif'

const main = {
  fontFamily,
}

const footer = {
  padding: '70px 8px',
  lineHeight: 1.5,
  fontSize: 12,
}

const content = {
  padding: '0 8px',
}
