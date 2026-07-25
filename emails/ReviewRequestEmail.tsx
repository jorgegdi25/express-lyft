import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
  Link,
  Img,
} from '@react-email/components';
import React from 'react';

interface ReviewRequestEmailProps {
  customerName: string;
  reviewUrl: string;
}

export const ReviewRequestEmail = ({ customerName, reviewUrl }: ReviewRequestEmailProps) => (
  <Html>
    <Head />
    <Preview>How was your ride with Express Lyft?</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img src="https://booking.explyft.com/logo.png" width="200" alt="Express Lyft" style={logoImg} />
        </Section>
        <Heading style={h1}>How Was Your Ride?</Heading>
        <Text style={text}>
          Dear {customerName}, thank you for riding with Express Lyft. We&apos;d love to hear
          about your experience — it only takes 20 seconds.
        </Text>

        <Section style={{ marginTop: '24px', textAlign: 'center' }}>
          <Link
            href={reviewUrl}
            style={{
              backgroundColor: '#B8960C',
              color: '#000000',
              padding: '14px 32px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: 'bold',
              display: 'inline-block',
            }}
          >
            Leave a Review
          </Link>
        </Section>

        <Section style={footer}>
          <Hr style={hr} />
          <Text style={copyright}>
            © 2026 Express Lyft. Miami luxury transportation services.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default ReviewRequestEmail;

const main = {
  backgroundColor: '#111111',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '600px',
};

const header = {
  marginBottom: '32px',
  textAlign: 'center' as const,
};

const logoImg = {
  margin: '0 auto',
};

const h1 = {
  color: '#FFFFFF',
  fontSize: '32px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '40px 0',
};

const text = {
  color: '#CCCCCC',
  fontSize: '16px',
  lineHeight: '26px',
  textAlign: 'center' as const,
};

const footer = {
  textAlign: 'center' as const,
  marginTop: '40px',
};

const hr = {
  borderColor: '#2a2a2a',
  margin: '20px 0',
};

const copyright = {
  color: '#333333',
  fontSize: '12px',
  marginTop: '20px',
};
