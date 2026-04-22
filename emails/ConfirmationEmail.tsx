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

interface ConfirmationEmailProps {
  customerName: string;
  bookingId: string;

  pickup: string;
  destination: string;
  date: string;
  time: string;
  vehicleType: string;
  amount: string;
}

export const ConfirmationEmail = ({
  customerName,
  bookingId,

  pickup,
  destination,
  date,
  time,
  vehicleType,
  amount,
}: ConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>Your Express Lyft booking is confirmed!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={logo}>EXPRESS LYFT</Text>
        </Section>
        <Heading style={h1}>Ride Confirmed</Heading>
        <Text style={text}>
          Dear {customerName}, your professional chauffeur has been reserved for your upcoming trip.
        </Text>
        
        <Section style={detailsContainer}>
          <Heading style={h2}>Trip Summary</Heading>
          <Text style={detailItem}>
            <strong>Confirmation:</strong> {bookingId.slice(0, 8).toUpperCase()}
          </Text>

          <Text style={detailItem}>
            <strong>From:</strong> {pickup}
          </Text>
          <Text style={detailItem}>
            <strong>To:</strong> {destination}
          </Text>
          <Hr style={hr} />
          <Text style={detailItem}>
            <strong>Scheduled:</strong> {date} at {time}
          </Text>
          <Text style={detailItem}>
            <strong>Vehicle:</strong> {vehicleType}
          </Text>
          <Text style={detailItem}>
            <strong>Amount Paid:</strong> ${amount} USD
          </Text>
        </Section>

        <Section style={footer}>
          <Text style={footerText}>
            Need to make changes? Call us directly at <Link href="tel:3057994420" style={link}>305-799-4420</Link>.
          </Text>
          <Hr style={hr} />
          <Text style={copyright}>
            © 2026 Express Lyft. Miami luxury transportation services.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default ConfirmationEmail;

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

const logo = {
  color: '#B8960C',
  fontSize: '24px',
  fontWeight: 'bold',
  letterSpacing: '5px',
  margin: '0',
};

const h1 = {
  color: '#FFFFFF',
  fontSize: '32px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '40px 0',
};

const h2 = {
  color: '#B8960C',
  fontSize: '18px',
  fontWeight: 'bold',
  textTransform: 'uppercase' as const,
  letterSpacing: '2px',
  marginBottom: '16px',
};

const text = {
  color: '#CCCCCC',
  fontSize: '16px',
  lineHeight: '26px',
  textAlign: 'center' as const,
};

const detailsContainer = {
  backgroundColor: '#1a1a1a',
  borderRadius: '12px',
  border: '1px solid #2a2a2a',
  padding: '32px',
  margin: '40px 0',
};

const detailItem = {
  color: '#FFFFFF',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '8px 0',
};

const hr = {
  borderColor: '#2a2a2a',
  margin: '20px 0',
};

const footer = {
  textAlign: 'center' as const,
  marginTop: '40px',
};

const footerText = {
  color: '#555555',
  fontSize: '14px',
  lineHeight: '24px',
};

const link = {
  color: '#B8960C',
  textDecoration: 'none',
};

const copyright = {
  color: '#333333',
  fontSize: '12px',
  marginTop: '20px',
};
