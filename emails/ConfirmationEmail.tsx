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
  paymentType?: 'full' | 'deposit';
  amountRemaining?: string;
  airline?: string | null;
  flightNumber?: string | null;
  meetingType?: string | null;
  carSeatsRequested?: number | null;
  receiptUrl?: string | null;
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
  paymentType = 'full',
  amountRemaining,
  airline,
  flightNumber,
  meetingType,
  carSeatsRequested,
  receiptUrl,
}: ConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>{paymentType === 'deposit' ? 'Your Express Lyft ride is reserved with a deposit!' : 'Your Express Lyft booking is confirmed!'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img src="https://booking.explyft.com/logo.png" width="200" alt="Express Lyft" style={logoImg} />
        </Section>
        <Heading style={h1}>{paymentType === 'deposit' ? 'Ride Reserved' : 'Ride Confirmed'}</Heading>
        <Text style={text}>
          Dear {customerName}, {paymentType === 'deposit' 
            ? 'your ride has been reserved with a deposit. Details below.'
            : 'your professional chauffeur has been reserved for your upcoming trip.'
          }
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
          {airline && flightNumber && (
            <Text style={detailItem}>
              <strong>Flight Info:</strong> {airline} - {flightNumber}
            </Text>
          )}
          {meetingType && (
            <Text style={detailItem}>
              <strong>Meeting Type:</strong> {meetingType === 'meet_greet' ? 'VIP Meet & Greet (Driver inside with sign)' : 'Curbside Pickup (Outside at arrivals)'}
            </Text>
          )}
          {carSeatsRequested ? (
            <Text style={detailItem}>
              <strong>Car Seats Requested:</strong> {carSeatsRequested}
            </Text>
          ) : null}
          <Text style={detailItem}>
            <strong>Vehicle:</strong> {vehicleType}
          </Text>
          <Text style={detailItem}>
            <strong>{paymentType === 'deposit' ? 'Deposit Paid:' : 'Amount Paid:'}</strong> ${amount} USD
          </Text>
          {paymentType === 'deposit' && amountRemaining && (
            <>
              <Text style={detailItem}>
                <strong>Remaining Balance:</strong> ${amountRemaining} USD
              </Text>
              <Text style={{...detailItem, color: '#D4AF37', fontSize: '13px', marginTop: '12px'}}>
                ⓘ Remaining balance is due before your trip — payable via secure payment link.
              </Text>
            </>
          )}
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
            Need to make changes? Call us directly at <Link href="tel:+18889737896" style={link}>+1 (888) 973-7896</Link> or WhatsApp us at <Link href="https://wa.me/19546236207" style={link}>954-623-6207</Link>.
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
