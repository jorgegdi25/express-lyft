/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ESLint sigue sin bloquear el build (evita ruido de advertencias de estilo).
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Los errores de TypeScript AHORA SÍ rompen el build a propósito: así un bug
    // como el de la variable `amountPaid` (que dejó de enviar correos de reservas)
    // se detecta antes de desplegar y nunca llega a un cliente real.
    ignoreBuildErrors: false,
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/',
          has: [
            {
              type: 'host',
              value: 'bo.explyft.com',
            },
          ],
          destination: '/hotel/bocean-resort',
        },

      ]
    };
  },
};

export default nextConfig;
