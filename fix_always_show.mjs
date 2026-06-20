import fs from 'fs';
let code = fs.readFileSync('app/page.tsx', 'utf8');
code = code.replace("const isPruebas = host.includes('pruebas') || xForwardedHost.includes('pruebas') || host.includes('localhost')", "const isPruebas = true; // FORCE FOR LOCAL TESTING");
fs.writeFileSync('app/page.tsx', code);
