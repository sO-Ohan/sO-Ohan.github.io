/* uno.js — a drawing of a real Arduino UNO with pin coordinates you can wire to.
   viewBox: 0 0 700 540 (leave room on the left for the USB and jack overhang). */

const UNO = (function(){

const PITCH = 25.4;
const TOP_L = ['SCL','SDA','AREF','GND','13','12','11','10','9','8'];
const TOP_R = ['7','6','5','4','3','2','1','0'];
const BOT_L = ['NC','IOREF','RESET','3V3','5V','GND','GND','VIN'];
const BOT_R = ['A0','A1','A2','A3','A4','A5'];
const PWM = new Set(['11','10','9','6','5','3']);

const TOP_Y = 48, BOT_Y = 498;
const topLx = 176, topRx = topLx + TOP_L.length*PITCH + 30;
const botLx = 186, botRx = 448;

const pos = {};
TOP_L.forEach((p,i)=> pos[p] = {x: topLx + i*PITCH + PITCH/2, y: TOP_Y, side:'top'});
TOP_R.forEach((p,i)=> pos[p] = {x: topRx + i*PITCH + PITCH/2, y: TOP_Y, side:'top'});
BOT_L.forEach((p,i)=>{ const key = p==='GND' ? (pos.GND_A ? 'GND_B' : 'GND_A') : p;
  pos[key] = {x: botLx + i*PITCH + PITCH/2, y: BOT_Y, side:'bottom'}; });
BOT_R.forEach((p,i)=> pos[p] = {x: botRx + i*PITCH + PITCH/2, y: BOT_Y, side:'bottom'});

function header(x, y, labels, id){
  const w = labels.length*PITCH;
  let s = `<rect x="${x}" y="${y-15}" width="${w}" height="30" rx="4" fill="#1b1b1b"/>`;
  labels.forEach((l,i)=>{
    const cx = x + i*PITCH + PITCH/2;
    s += `<rect class="uno-hole" data-pin="${l}" x="${cx-8}" y="${y-8}" width="16" height="16" rx="2.5"
            fill="#0d0d0d" stroke="#caa96a" stroke-width="1.4"/>`;
    const ly = y - 26;
    s += `<text x="${cx}" y="${ly}" text-anchor="middle" font-family="Roboto Mono,monospace"
           font-size="13" fill="#eafcfd" transform="rotate(-90 ${cx} ${ly})">${PWM.has(l)?'~':''}${l}</text>`;
  });
  return s;
}

function board(opts={}){
  const id = opts.id || 'uno';
  return `
<g id="${id}" class="uno">
  <path d="M114 6 H646 a18 18 0 0 1 18 18 V104 l20 12 v56 l-20 12 V498 a18 18 0 0 1 -18 18 H114
           a18 18 0 0 1 -18 -18 V24 A18 18 0 0 1 114 6 Z"
        fill="#0e8c93" stroke="#0a6f75" stroke-width="2"/>
  <circle cx="140" cy="132" r="9" fill="#0a6f75"/><circle cx="140" cy="132" r="5" fill="#f0f2f6"/>
  <circle cx="628" cy="162" r="9" fill="#0a6f75"/><circle cx="628" cy="162" r="5" fill="#f0f2f6"/>
  <circle cx="630" cy="462" r="9" fill="#0a6f75"/><circle cx="630" cy="462" r="5" fill="#f0f2f6"/>
  <circle cx="160" cy="470" r="9" fill="#0a6f75"/><circle cx="160" cy="470" r="5" fill="#f0f2f6"/>

  <!-- USB B, overhanging the left edge -->
  <rect x="6" y="168" width="132" height="100" rx="6" fill="#c8ccd2" stroke="#9aa0a8" stroke-width="2"/>
  <rect x="16" y="184" width="86" height="68" rx="4" fill="#8d939b"/>
  <rect x="24" y="198" width="52" height="40" rx="3" fill="#33383e"/>

  <!-- barrel jack -->
  <rect x="10" y="392" width="132" height="86" rx="10" fill="#141414"/>
  <circle cx="42" cy="435" r="19" fill="#2a2a2a"/><circle cx="42" cy="435" r="7" fill="#0a0a0a"/>

  <!-- regulator and capacitors -->
  <rect x="150" y="392" width="54" height="44" rx="4" fill="#1c1c1c"/>
  <rect x="158" y="384" width="38" height="11" rx="3" fill="#9aa0a8"/>
  <circle cx="240" cy="408" r="25" fill="#1b2b3a" stroke="#0d1b26" stroke-width="2"/>
  <circle cx="240" cy="408" r="15" fill="#24384a"/>
  <circle cx="300" cy="416" r="21" fill="#1b2b3a" stroke="#0d1b26" stroke-width="2"/>

  <!-- ATmega328P -->
  <rect x="342" y="236" width="248" height="94" rx="6" fill="#17181a"/>
  <circle cx="360" cy="283" r="9" fill="none" stroke="#3d4045" stroke-width="3"/>
  <text x="480" y="276" text-anchor="middle" font-family="Roboto Mono,monospace" font-size="18" fill="#c9ccd1">ATMEGA328P</text>
  <text x="480" y="302" text-anchor="middle" font-family="Roboto Mono,monospace" font-size="13" fill="#7c8189">16 MHz</text>
  ${[...Array(14)].map((_,i)=>`<rect x="${350+i*17.4}" y="228" width="9" height="10" rx="1.5" fill="#b9bcc2"/>
     <rect x="${350+i*17.4}" y="328" width="9" height="10" rx="1.5" fill="#b9bcc2"/>`).join('')}

  <!-- usb chip and crystal -->
  <rect x="176" y="236" width="82" height="62" rx="5" fill="#17181a"/>
  <text x="217" y="272" text-anchor="middle" font-family="Roboto Mono,monospace" font-size="11" fill="#9aa0a8">16U2</text>
  <rect x="272" y="248" width="54" height="29" rx="14" fill="#b9bcc2" stroke="#8d939b"/>
  <text x="299" y="267" text-anchor="middle" font-family="Roboto Mono,monospace" font-size="10" fill="#3d4045">16.000</text>

  <!-- reset -->
  <rect x="126" y="76" width="52" height="52" rx="6" fill="#1c1c1c"/>
  <circle id="${id}-reset" cx="152" cy="102" r="16" fill="#d8dade" stroke="#9aa0a8" stroke-width="2"/>
  <text x="152" y="150" text-anchor="middle" font-family="Roboto Mono,monospace" font-size="11" fill="#eafcfd">RESET</text>

  <!-- ICSP -->
  <rect x="600" y="360" width="44" height="64" rx="4" fill="#1b1b1b"/>
  ${[0,1,2].map(r=>[0,1].map(c=>`<rect x="${608+c*19}" y="${368+r*19}" width="12" height="12" rx="2" fill="#0d0d0d" stroke="#caa96a"/>`).join('')).join('')}
  <text x="622" y="440" text-anchor="middle" font-family="Roboto Mono,monospace" font-size="11" fill="#eafcfd">ICSP</text>

  <!-- status LEDs -->
  <rect x="196" y="168" width="24" height="15" rx="3" fill="#3a3f45"/>
  <rect x="232" y="168" width="24" height="15" rx="3" fill="#3a3f45"/>
  <text x="188" y="181" text-anchor="end" font-family="Roboto Mono,monospace" font-size="11" fill="#eafcfd">TX RX</text>
  <rect id="${id}-l13" class="uno-l13" x="196" y="196" width="24" height="15" rx="3" fill="#3a3f45"/>
  <text x="188" y="209" text-anchor="end" font-family="Roboto Mono,monospace" font-size="11" fill="#eafcfd">L</text>
  <rect id="${id}-pwr" class="uno-pwr" x="232" y="196" width="24" height="15" rx="3" fill="#2ecc71"/>
  <text x="264" y="209" font-family="Roboto Mono,monospace" font-size="11" fill="#eafcfd">ON</text>

  <!-- silkscreen -->
  <g opacity=".9" transform="translate(392,398)">
    <path d="M0 10 a11 11 0 1 1 11 0 a11 11 0 1 0 11 0" fill="none" stroke="#eafcfd" stroke-width="3"/>
  </g>
  <text x="500" y="410" text-anchor="middle" font-family="Outfit,sans-serif" font-size="30" font-weight="600" fill="#eafcfd" opacity=".92">ARDUINO</text>
  <text x="500" y="438" text-anchor="middle" font-family="Outfit,sans-serif" font-size="18" font-weight="500" letter-spacing="7" fill="#eafcfd" opacity=".68">UNO</text>
  <text x="420" y="98" text-anchor="middle" font-family="Roboto Mono,monospace" font-size="12" fill="#eafcfd" opacity=".8">DIGITAL (PWM ~)</text>

  ${header(topLx, TOP_Y, TOP_L)}
  ${header(topRx, TOP_Y, TOP_R)}
  ${header(botLx, BOT_Y, BOT_L)}
  ${header(botRx, BOT_Y, BOT_R)}
</g>`;
}

function pin(name){
  const p = pos[name] || pos['GND_A'];
  return {x:p.x, y:p.y, side:p.side};
}

return {board, pin, PITCH, TOP_L, TOP_R, BOT_L, BOT_R, pos};
})();

window.UNO = UNO;
