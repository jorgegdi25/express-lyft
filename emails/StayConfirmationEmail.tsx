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

interface StayConfirmationEmailProps {
  guestName: string;
  bookingId: string;
  hotelName: string;
  roomType: string;
  roomQty: number;
  nights: number;
  checkInDate: string;
  pickupTime: string;
  airline?: string | null;
  flightNumber?: string | null;
  subtotal: number;
  taxAmount?: number;
  totalCharged: number;
  receiptUrl?: string | null;
}

export const StayConfirmationEmail = ({
  guestName,
  bookingId,
  hotelName,
  roomType,
  roomQty,
  nights,
  checkInDate,
  pickupTime,
  airline,
  flightNumber,
  subtotal,
  taxAmount,
  totalCharged,
  receiptUrl,
}: StayConfirmationEmailProps) => {
  const roomLabel = roomType === '2_beds' ? '2 Beds' : '1 Bed';

  return (
    <Html>
      <Head />
      <Preview>Your hotel room and airport transportation are confirmed.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Img src="https://booking.explyft.com/logo.png" width="200" alt="Express Lyft" style={logoImg} />
          </Section>
          <Heading style={h1}>Room & Ride Confirmed</Heading>
          <Text style={text}>
            Dear {guestName}, your hotel room and airport transportation have been booked and paid.
          </Text>

          <Section style={detailsContainer}>
            <Heading style={h2}>Booking Summary</Heading>
            <Text style={detailItem}><strong>Confirmation:</strong> {bookingId.slice(0, 8).toUpperCase()}</Text>
            <Text style={detailItem}><strong>Hotel:</strong> {hotelName}</Text>
            <Text style={detailItem}><strong>Room:</strong> {roomQty}x {roomLabel}</Text>
            <Text style={detailItem}><strong>Nights:</strong> {nights}</Text>
            <Text style={detailItem}><strong>Check-in:</strong> {checkInDate}</Text>

            <Hr style={hr} />
            <Text style={detailItem}><strong>Airport pickup time:</strong> {pickupTime}</Text>
            <Text style={detailItem}><strong>Fort Lauderdale Airport (FLL) → {hotelName}</strong> — transportation included</Text>
            {airline && flightNumber && (
              <Text style={detailItem}><strong>Flight Info:</strong> {airline} - {flightNumber}</Text>
            )}

            <Hr style={hr} />
            <Text style={detailItem}><strong>Subtotal:</strong> ${subtotal.toFixed(2)} USD</Text>
            {taxAmount && taxAmount > 0 && (
              <Text style={detailItem}><strong>Taxes:</strong> ${taxAmount.toFixed(2)} USD</Text>
            )}
            <Text style={detailItem}><strong>Total Charged:</strong> ${totalCharged.toFixed(2)} USD</Text>

            {receiptUrl && (
              <Section style={{ marginTop: '24px', textAlign: 'center' }}>
                <Link
                  href={receiptUrl}
                  style={{
                    backgroundColor: '#B8960C',
                    color: '#000000',
                    padding: '12px 24px',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontWeight: 'bold',
                    display: 'inline-block',
                  }}
                >
                  Download Receipt / Invoice
                </Link>
              </Section>
            )}
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              Questions or need to make changes? Call us directly at <Link href="tel:+18889737896" style={link}>+1 (888) 973-7896</Link> or WhatsApp us at <Link href="https://wa.me/19546236207" style={link}>954-623-6207</Link>.
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

export default StayConfirmationEmail;

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
