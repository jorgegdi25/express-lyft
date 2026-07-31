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

type PickupType = 'airport' | 'hotel' | 'cruise_port';

interface PickupReminderEmailProps {
  customerName: string;
  pickup: string;
  destination: string;
  date: string;
  time: string;
  vehicleLabel: string;
  passengers: number;
  airline?: string | null;
  flightNumber?: string | null;
  meetingType?: string | null;
  carSeatsRequested?: number | null;
  notes?: string | null;
  tripType?: string | null;
  returnDate?: string | null;
  returnTime?: string | null;
}

// Picks which of the three pickup-instructions blocks applies, based on
// where the driver actually meets the guest (the `pickup` location) — not
// the destination. Defaults to hotel instructions, the most common case.
function detectPickupType(pickup: string): PickupType {
  const p = pickup.toLowerCase();
  if (p.includes('airport')) return 'airport';
  if (p.includes('port') || p.includes('cruise')) return 'cruise_port';
  return 'hotel';
}

const PICKUP_INSTRUCTIONS: Record<PickupType, { title: string; items: string[] }> = {
  airport: {
    title: 'Airport Pickup',
    items: [
      'Please collect all luggage before meeting your driver.',
      'Keep your phone on and available for calls or texts.',
      'Your driver will contact you upon arrival with the exact pickup location.',
      'We monitor your flight and will adjust for any delays.',
    ],
  },
  hotel: {
    title: 'Hotel Pickup',
    items: [
      'Please be in the hotel lobby 10 minutes before your scheduled pickup time.',
      'Your driver will meet you at the main entrance or designated pickup area.',
    ],
  },
  cruise_port: {
    title: 'Cruise Port Pickup',
    items: [
      'After disembarking and collecting your luggage, please contact your driver.',
      'Your driver will provide the exact meeting location for pickup.',
    ],
  },
};

export const PickupReminderEmail = ({
  customerName,
  pickup,
  destination,
  date,
  time,
  vehicleLabel,
  passengers,
  airline,
  flightNumber,
  meetingType,
  carSeatsRequested,
  notes,
  tripType,
  returnDate,
  returnTime,
}: PickupReminderEmailProps) => {
  const instructions = PICKUP_INSTRUCTIONS[detectPickupType(pickup)];

  const requested: string[] = [];
  if (carSeatsRequested) requested.push(`${carSeatsRequested} child car seat${carSeatsRequested === 1 ? '' : 's'}`);
  if (meetingType === 'meet_greet') requested.push('VIP Meet & Greet (driver inside with sign)');

  return (
    <Html>
      <Head />
      <Preview>Your Express Lyft pickup is tomorrow — instructions inside</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Img src="https://booking.explyft.com/logo.png" width="200" alt="Express Lyft" style={logoImg} />
          </Section>
          <Heading style={h1}>Guest Pickup Instructions</Heading>
          <Text style={text}>
            Dear {customerName},<br />
            Thank you for booking with Express Lyft. We appreciate your business.
            Please review the pickup instructions below, which contain important
            details regarding your scheduled transportation to ensure a smooth
            and timely experience.
          </Text>

          <Section style={detailsContainer}>
            <Heading style={h2}>Trip Summary</Heading>
            <Text style={detailItem}>
              <strong>Route:</strong> Transfer from {pickup} to {destination}
            </Text>
            <Text style={detailItem}>
              <strong>Date:</strong> {date} at {time}
            </Text>
            {tripType === 'round-trip' && returnDate && returnTime && (
              <Text style={detailItem}>
                <strong>Return:</strong> {returnDate} at {returnTime}
              </Text>
            )}
            <Text style={detailItem}>{vehicleLabel}</Text>
            <Text style={detailItem}>
              <strong>Passengers:</strong> {passengers} passenger{passengers === 1 ? '' : 's'}
            </Text>
            {(airline || flightNumber) && (
              <Text style={detailItem}>
                <strong>Flight:</strong> {[airline, flightNumber].filter(Boolean).join(' ')}
              </Text>
            )}
            {requested.length > 0 && (
              <Text style={detailItem}>
                <strong>Requested:</strong> {requested.join(', ')}
              </Text>
            )}
            {notes && (
              <>
                <Hr style={hr} />
                <Text style={{ ...detailItem, color: '#B8960C', fontWeight: 'bold' as const }}>
                  Special Requests / Notes
                </Text>
                <Text style={{ ...detailItem, whiteSpace: 'pre-wrap' as const }}>{notes}</Text>
              </>
            )}
          </Section>

          <Section style={detailsContainer}>
            <Heading style={h2}>{instructions.title}</Heading>
            {instructions.items.map((item, i) => (
              <Text key={i} style={detailItem}>• {item}</Text>
            ))}
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              Need assistance? Call or text us at <Link href="tel:+18889737896" style={link}>+1 (888) 973-7896</Link>, email{' '}
              <Link href="mailto:info@explyft.com" style={link}>info@explyft.com</Link>, or WhatsApp us at{' '}
              <Link href="https://wa.me/19546236207" style={link}>954-623-6207</Link>.
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
};

export default PickupReminderEmail;

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
  fontSize: '28px',
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
  margin: '24px 0',
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
