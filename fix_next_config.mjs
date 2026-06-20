import fs from 'fs';

let code = fs.readFileSync('next.config.mjs', 'utf8');

const rewriteBlock = `        {
          source: '/',
          has: [
            {
              type: 'host',
              value: 'pruebas.explyft.com',
            },
          ],
          destination: '/hotel/bocean-resort',
        },`;

code = code.replace(rewriteBlock, "");

fs.writeFileSync('next.config.mjs', code);
