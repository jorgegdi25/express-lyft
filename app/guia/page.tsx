import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Guía: Nuevo Mapa de Reservas | Express Lyft',
  description: 'Qué cambió en el mapa de reservas y cómo probarlo paso a paso.',
}

const STYLES = `
  .guia-body{
    --bg:#FAFAF6;
    --surface:#FFFFFF;
    --surface-2:#F1EFE6;
    --text:#221F18;
    --text-dim:#615C4E;
    --gold:#96721C;
    --gold-strong:#6E5314;
    --gold-fill:#F3E6C2;
    --teal:#2F6B6A;
    --teal-fill:#DCEBE9;
    --line:#DEDACB;
    --line-strong:#C7C2AE;
    --pass:#3F7D4C;
    --pass-fill:#E1F0E3;
  }
  @media (prefers-color-scheme: dark){
    .guia-body:not([data-theme="light"]){
      --bg:#161510;
      --surface:#1E1C16;
      --surface-2:#25231B;
      --text:#F1EEE2;
      --text-dim:#ACA593;
      --gold:#D9B24E;
      --gold-strong:#EFC96B;
      --gold-fill:#3A3020;
      --teal:#6FB3B0;
      --teal-fill:#1E3433;
      --line:#39362A;
      --line-strong:#4A4636;
      --pass:#6FBF7E;
      --pass-fill:#1E3324;
    }
  }
  .guia-body[data-theme="dark"]{
    --bg:#161510;
    --surface:#1E1C16;
    --surface-2:#25231B;
    --text:#F1EEE2;
    --text-dim:#ACA593;
    --gold:#D9B24E;
    --gold-strong:#EFC96B;
    --gold-fill:#3A3020;
    --teal:#6FB3B0;
    --teal-fill:#1E3433;
    --line:#39362A;
    --line-strong:#4A4636;
    --pass:#6FBF7E;
    --pass-fill:#1E3324;
  }

  .guia-body *{box-sizing:border-box;}
  .guia-body{
    margin:0;
    background:var(--bg);
    color:var(--text);
    font-family:'Work Sans', system-ui, sans-serif;
    padding-inline:20px;
    padding-block:52px 80px;
  }
  .guia-body .page{max-width:720px; margin-inline:auto; display:flex; flex-direction:column; gap:36px;}
  .guia-body h1,.guia-body h2{font-family:'Zilla Slab', Georgia, serif; text-wrap:balance; margin:0;}
  .guia-body .mono{font-family:'Space Mono', monospace;}

  .guia-body header{
    background:var(--surface);
    border:1px solid var(--line);
    border-radius:14px;
    padding:26px 28px;
    display:flex; flex-direction:column; gap:14px;
    position:relative;
  }
  .guia-body .badge{
    align-self:flex-start;
    font-family:'Space Mono', monospace;
    font-size:.7rem;
    font-weight:700;
    letter-spacing:.08em;
    text-transform:uppercase;
    color:var(--gold-strong);
    background:var(--gold-fill);
    border:1px solid var(--gold);
    border-radius:999px;
    padding:4px 12px;
  }
  .guia-body h1{font-size:clamp(1.6rem,4.4vw,2.1rem); font-weight:700; line-height:1.2;}
  .guia-body .dek{font-size:1rem; line-height:1.6; color:var(--text-dim); max-width:58ch;}
  .guia-body .link-line{
    display:flex; align-items:center; gap:10px; flex-wrap:wrap;
    font-family:'Space Mono', monospace; font-size:.85rem;
    background:var(--surface-2); border:1px solid var(--line);
    border-radius:9px; padding:10px 14px; width:fit-content;
  }
  .guia-body .link-line a{color:var(--gold-strong); font-weight:700; text-decoration:none;}
  .guia-body .link-line a:hover{text-decoration:underline;}

  .guia-body .highlights{display:grid; grid-template-columns:repeat(3,1fr); gap:12px;}
  .guia-body .highlight{
    background:var(--surface); border:1px solid var(--line); border-radius:12px;
    padding:16px 16px 18px; display:flex; flex-direction:column; gap:6px;
  }
  .guia-body .highlight .h-label{font-family:'Space Mono',monospace; font-size:.66rem; letter-spacing:.06em; text-transform:uppercase; color:var(--teal);}
  .guia-body .highlight p{margin:0; font-size:.86rem; line-height:1.5; color:var(--text-dim);}
  .guia-body .highlight strong{color:var(--text); font-weight:600;}

  .guia-body section{display:flex; flex-direction:column; gap:16px;}
  .guia-body section > h2{font-size:1.3rem; font-weight:700;}
  .guia-body section > p.lead{font-size:.94rem; line-height:1.6; color:var(--text-dim); max-width:60ch; margin:0;}

  .guia-body .steps{list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:2px; counter-reset:step;}
  .guia-body .step{
    counter-increment:step;
    display:grid; grid-template-columns:40px 1fr; gap:14px;
    padding:16px 0;
    border-top:1px solid var(--line);
  }
  .guia-body .step:first-child{border-top:none;}
  .guia-body .step::before{
    content:counter(step);
    font-family:'Space Mono', monospace;
    font-weight:700;
    font-size:.9rem;
    width:32px; height:32px;
    display:flex; align-items:center; justify-content:center;
    border-radius:8px;
    background:var(--gold-fill);
    color:var(--gold-strong);
    border:1px solid var(--gold);
  }
  .guia-body .step-body{display:flex; flex-direction:column; gap:4px;}
  .guia-body .step-body h3{margin:0; font-size:.98rem; font-weight:600; font-family:'Work Sans', sans-serif;}
  .guia-body .step-body p{margin:0; font-size:.88rem; line-height:1.55; color:var(--text-dim);}
  .guia-body .step-body code{
    font-family:'Space Mono', monospace; font-size:.82em;
    background:var(--surface-2); border:1px solid var(--line);
    padding:1px 6px; border-radius:5px; color:var(--text);
  }

  .guia-body .formula-card{
    background:var(--surface); border:1px solid var(--line); border-radius:14px;
    padding:22px 24px; display:flex; flex-direction:column; gap:14px;
  }
  .guia-body .formula{
    font-family:'Space Mono', monospace; font-size:.94rem; font-weight:700;
    background:var(--surface-2); border-radius:9px; padding:13px 15px;
    line-height:1.7; overflow-x:auto; white-space:nowrap;
  }
  .guia-body .formula .op{color:var(--text-dim); font-weight:400;}
  .guia-body .formula .term{color:var(--gold-strong);}
  .guia-body .example{
    display:flex; flex-direction:column; gap:6px;
    background:var(--teal-fill); border:1px solid var(--teal);
    border-radius:10px; padding:14px 16px;
    font-size:.86rem; line-height:1.6; color:var(--text);
  }
  .guia-body .example .ex-label{
    font-family:'Space Mono',monospace; font-size:.68rem; letter-spacing:.06em;
    text-transform:uppercase; color:var(--teal); font-weight:700;
  }
  .guia-body .example .ex-total{font-weight:700; color:var(--text);}

  .guia-body .checklist{list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:0;}
  .guia-body .check-item{
    display:grid; grid-template-columns:24px 1fr; gap:12px; align-items:start;
    padding:12px 0; border-top:1px solid var(--line);
  }
  .guia-body .check-item:first-child{border-top:none;}
  .guia-body .check-box{
    width:20px; height:20px; border-radius:5px; margin-top:1px;
    border:1.5px solid var(--line-strong); background:var(--surface);
    display:flex; align-items:center; justify-content:center; flex:none;
  }
  .guia-body .check-box svg{width:13px; height:13px; stroke:var(--pass); stroke-width:3; fill:none; opacity:.85;}
  .guia-body .check-item p{margin:0; font-size:.9rem; line-height:1.55; color:var(--text);}
  .guia-body .check-item span.sub{display:block; font-size:.8rem; color:var(--text-dim); margin-top:2px;}

  .guia-body .callout{
    border-radius:14px; padding:20px 22px; display:flex; flex-direction:column; gap:8px;
    background:var(--surface); border:1px solid var(--line); border-left:4px solid var(--teal);
  }
  .guia-body .callout h2{font-size:1.05rem; font-weight:700;}
  .guia-body .callout p{margin:0; font-size:.9rem; line-height:1.6; color:var(--text-dim);}
  .guia-body .callout ul{margin:4px 0 0; padding-left:18px; display:flex; flex-direction:column; gap:6px;}
  .guia-body .callout li{font-size:.9rem; line-height:1.55; color:var(--text-dim);}

  .guia-body footer{border-top:1px solid var(--line); padding-top:16px; font-size:.8rem; color:var(--text-dim); line-height:1.6;}

  @media (max-width:560px){
    .guia-body .highlights{grid-template-columns:1fr;}
    .guia-body .step{grid-template-columns:32px 1fr;}
  }
`

export default function GuiaPage() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Zilla+Slab:wght@500;600;700&family=Work+Sans:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap"
        rel="stylesheet"
      />
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="guia-body">
        <div className="page">
          <header>
            <span className="badge">Guía de prueba · Express Lyft</span>
            <h1>Nuevo mapa de reservas — qué cambió y cómo probarlo</h1>
            <p className="dek">
              Reemplazamos el mapa (antes Mapbox, ahora Google Maps) porque estaba fallando,
              y de paso corregimos un error en el cálculo de precios y cambiamos cómo se
              muestra el impuesto. Esta página explica qué esperar y qué probar antes de
              pasarlo al sitio principal.
            </p>
            <div className="link-line">
              🔗 Pruébalo en: <a href="https://pruebas.explyft.com" target="_blank" rel="noopener noreferrer">pruebas.explyft.com</a>
            </div>
          </header>

          <div className="highlights">
            <div className="highlight">
              <span className="h-label">Mapa</span>
              <p><strong>Google Maps</strong> en vez de Mapbox. Autocompletado, clic para marcar, y arrastrar el pin — todo más confiable.</p>
            </div>
            <div className="highlight">
              <span className="h-label">Precio</span>
              <p>Se corrigió un error que hacía que el precio calculado por distancia saliera en <strong>$0</strong>.</p>
            </div>
            <div className="highlight">
              <span className="h-label">Impuesto</span>
              <p>El precio que ven ya <strong>incluye el impuesto</strong>, como en Uber — no se suma aparte al final.</p>
            </div>
          </div>

          <section>
            <h2>Cómo probarlo</h2>
            <p className="lead">Sigue estos pasos en <code>pruebas.explyft.com</code> con una ruta real, por ejemplo un aeropuerto a un hotel.</p>
            <ol className="steps">
              <li className="step">
                <div className="step-body">
                  <h3>Abre el sitio de pruebas y baja hasta &quot;Book Your Luxury Ride&quot;</h3>
                  <p>Es la sección con el mapa, justo debajo del video de portada.</p>
                </div>
              </li>
              <li className="step">
                <div className="step-body">
                  <h3>Escribe el punto de recogida</h3>
                  <p>En &quot;Pickup Location&quot; escribe algo como <code>Miami Airport</code> — deben aparecer sugerencias reales de Google mientras escribes. Selecciona una.</p>
                </div>
              </li>
              <li className="step">
                <div className="step-body">
                  <h3>Escribe el destino</h3>
                  <p>Igual en &quot;Destination&quot;, por ejemplo el nombre de un hotel real. Al seleccionarlo, deben aparecer un pin verde (recogida) y uno rojo (destino) en el mapa, unidos por una línea dorada — esa es la ruta calculada.</p>
                </div>
              </li>
              <li className="step">
                <div className="step-body">
                  <h3>Prueba también el mapa directamente</h3>
                  <p>Haz clic en cualquier punto del mapa para mover un pin, o arrástralo — el campo de texto se debe actualizar solo con la dirección de ese punto.</p>
                </div>
              </li>
              <li className="step">
                <div className="step-body">
                  <h3>Completa fecha, hora y pasajeros, y avanza</h3>
                  <p>Dale a <code>Choose Your Vehicle →</code>.</p>
                </div>
              </li>
              <li className="step">
                <div className="step-body">
                  <h3>Revisa el precio por vehículo</h3>
                  <p>Cada botón (Sedan, Suburban, Sprinter) debe mostrar un precio — nunca <code>$0</code>. El número de &quot;Estimated Total&quot; debe ser el mismo que en el botón del vehículo seleccionado.</p>
                </div>
              </li>
              <li className="step">
                <div className="step-body">
                  <h3>Llega hasta Checkout y confirma que el precio no cambió</h3>
                  <p>El total en el paso 3 debe ser exactamente el mismo número que viste en el paso 2 — no debe &quot;saltar&quot; al agregar el impuesto, porque ya viene incluido desde el principio.</p>
                </div>
              </li>
            </ol>
          </section>

          <section>
            <h2>Cómo se calcula el precio</h2>
            <p className="lead">Cada tipo de vehículo tiene su propia tarifa, configurable en el panel admin (Routes &amp; Pricing).</p>
            <div className="formula-card">
              <div className="formula">
                Precio <span className="op">=</span> <span className="term">Base</span>
                <span className="op"> + </span> (<span className="term">Por milla</span> <span className="op">×</span> millas)
                <span className="op"> + </span> (<span className="term">Por minuto</span> <span className="op">×</span> minutos)
              </div>
              <p style={{ margin: 0, fontSize: '.86rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
                El resultado nunca baja del <strong>&quot;Min Price&quot;</strong> configurado ni sube del{' '}
                <strong>&quot;Max Price&quot;</strong>. El total final que se muestra ya incluye el 7% de
                impuesto de Florida.
              </p>
              <div className="example">
                <span className="ex-label">Ejemplo real probado</span>
                Aeropuerto de Miami → B Ocean Resort (Fort Lauderdale), 31.6 millas / 45 min, Sedan &amp; SUV:{' '}
                <span className="ex-total">precio final mostrado al cliente, impuesto incluido.</span>
              </div>
            </div>
          </section>

          <section>
            <h2>Qué revisar</h2>
            <ul className="checklist">
              <li className="check-item">
                <span className="check-box"><svg viewBox="0 0 24 24"><path d="M4 12l5 5L20 6" /></svg></span>
                <p>El autocompletado de direcciones responde al escribir (no se queda cargando ni da error).</p>
              </li>
              <li className="check-item">
                <span className="check-box"><svg viewBox="0 0 24 24"><path d="M4 12l5 5L20 6" /></svg></span>
                <p>Los pines y la ruta se dibujan en el mapa al elegir pickup y destino.<span className="sub">Línea dorada uniendo los dos puntos.</span></p>
              </li>
              <li className="check-item">
                <span className="check-box"><svg viewBox="0 0 24 24"><path d="M4 12l5 5L20 6" /></svg></span>
                <p>Ningún vehículo muestra <code>$0</code> como precio.</p>
              </li>
              <li className="check-item">
                <span className="check-box"><svg viewBox="0 0 24 24"><path d="M4 12l5 5L20 6" /></svg></span>
                <p>El precio es el mismo del paso 2 (selección de vehículo) al paso 3 (checkout) — no cambia solo.</p>
              </li>
              <li className="check-item">
                <span className="check-box"><svg viewBox="0 0 24 24"><path d="M4 12l5 5L20 6" /></svg></span>
                <p>Probar con al menos una ruta corta (dentro de la misma ciudad) y una larga (entre ciudades) para ver ambos casos.</p>
              </li>
            </ul>
          </section>

          <div className="callout">
            <h2>Si algo no se ve bien</h2>
            <p>Manda captura de pantalla con:</p>
            <ul>
              <li>Qué escribiste en pickup y destino</li>
              <li>Qué esperabas ver vs. qué viste</li>
              <li>En qué paso pasó (1, 2 o 3)</li>
            </ul>
          </div>

          <footer>
            Este mapa nuevo solo está activo en <code className="mono">pruebas.explyft.com</code> — el sitio
            principal (<code className="mono">explyft.com</code>) sigue funcionando igual que antes hasta que
            prueben esto y decidan pasarlo a producción.
          </footer>
        </div>
      </div>
    </>
  )
}
