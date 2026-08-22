/* modules.js — the interactive content for every non-coding slide */

(window.Modules = window.Modules || []).push(function(Deck){

const A = ['#1a73e8','#ea4335','#f9ab00','#188038','#8430ce','#00897b'];
function countTo(node, target, ms){
  if(location.search.includes('nofx')){ node.textContent=target.toLocaleString(); return; }
  const t0=performance.now();
  (function step(now){
    const k=Math.min(1,(now-t0)/ms);
    const e=1-Math.pow(1-k,3);
    node.textContent = Math.round(target*e).toLocaleString();
    if(k<1) requestAnimationFrame(step);
  })(t0);
}
const card = (cap, html, cls='') => `<div class="card ${cls}">${cap?`<div class="cap">${cap}</div>`:''}${html}</div>`;
const kv = (k,v) => `<div class="kv"><span>${k}</span><b>${v}</b></div>`;
function tabs(host, items, onPick){
  host.innerHTML='';
  items.forEach((label,i)=>{
    const t=el('div','tab'+(i?'':' on'),label);
    t.onclick=()=>{ $$('.tab',host).forEach(x=>x.classList.remove('on')); t.classList.add('on'); onPick(i); };
    host.appendChild(t);
  });
  onPick(0);
}
function pickList(host, items, onPick){
  host.innerHTML='';
  items.forEach((it,i)=>{
    const r=el('div','pickrow'+(i?'':' on'),
      `<span class="pickdot" style="background:${it.c||A[i%6]}"></span><span>${it.label}</span>`);
    r.onmouseenter=r.onclick=()=>{ $$('.pickrow',host).forEach(x=>x.classList.remove('on')); r.classList.add('on'); onPick(i); };
    host.appendChild(r);
  });
  onPick(0);
}

/* ================= 1 · cover hero ================= */
(function(){
  const host=$('#coverHero'); if(!host) return;
  // isometric board: corners left(60,214) top(210,128) right(360,214) bottom(210,300)
  const pin=(x0,y0,dx,dy,ox,oy,n)=>[...Array(n)].map((_,i)=>{
    const t=0.14+i*(0.72/(n-1));
    return `<circle cx="${(x0+dx*t+ox).toFixed(1)}" cy="${(y0+dy*t+oy).toFixed(1)}" r="2.6" fill="#9bb8e4"/>`;
  }).join('');
  host.innerHTML=`
  <svg viewBox="0 0 420 420" class="hero">
    <g class="hero-float">
      <path d="M60 232 L210 318 L360 232 L360 214 L210 300 L60 214 Z" fill="#c7d6ee"/>
      <path d="M60 214 L210 128 L360 214 L210 300 Z" fill="#e8f0fe" stroke="#1a73e8" stroke-width="2"/>
      ${pin(210,128,150,86,-14,10,10)}
      ${pin(60,214,150,86,14,-10,10)}
      <path d="M168 196 L210 172 L252 196 L210 220 Z" fill="#fff" stroke="#bcd0ee"/>
      <text x="210" y="200" text-anchor="middle" font-family="Roboto Mono" font-size="9.5" fill="#5f6368">MCU</text>
      <circle class="hero-led" cx="290" cy="212" r="8" fill="#ea4335"/>
      <circle cx="290" cy="212" r="15" fill="none" stroke="#ea4335" stroke-width="2" class="hero-ring"/>
      <g class="hero-servo" transform="translate(132,216)">
        <path d="M-22 0 L0 -13 L22 0 L0 13 Z" fill="#fff" stroke="#bcd0ee"/>
        <g class="hero-arm"><rect x="-2.5" y="-30" width="5" height="24" rx="2.5" fill="#188038"/></g>
        <circle r="4" fill="#188038"/>
      </g>
      <g class="hero-wave" transform="translate(258,96)">
        <path d="M0 20 H14 V0 H28 V20 H42 V0 H56" fill="none" stroke="#f9ab00" stroke-width="3" stroke-linecap="round"/>
      </g>
      <path d="M290 202 V132" stroke="#f9ab00" stroke-width="1.5" stroke-dasharray="3 5" opacity=".55"/>
    </g>
    <circle cx="72" cy="96" r="9" fill="#8430ce" opacity=".7" class="hero-dot d1"/>
    <circle cx="372" cy="330" r="7" fill="#00897b" opacity=".7" class="hero-dot d2"/>
    <rect x="344" y="86" width="15" height="15" rx="4" fill="#f9ab00" opacity=".6" class="hero-dot d3"/>
  </svg>`;
})();

/* ================= 3 · warm-up: hand count + the hosted vote ================= */
(function(){
  const VOTE='https://claude.ai/code/artifact/faab7a33-15e6-4666-809f-e66d1ffb0b53';
  const host=$('#handPoll'); if(!host) return;

  const opts=['Never touched a board','Seen one','Built something'];
  const votes=[0,0,0];
  host.innerHTML=`<div class="handpoll">${opts.map((o,i)=>`
    <button class="hp" data-i="${i}"><span class="hpn">0</span><span class="hpl">${o}</span></button>`).join('')}</div>`;
  $$('.hp',host).forEach(b=>b.onclick=()=>{ votes[+b.dataset.i]++; $('.hpn',b).textContent=votes[+b.dataset.i]; });

  let win=null;
  $('#openVote').onclick=()=>{
    win = window.open(VOTE, 'robouvote', 'width=1200,height=850');
    if(win) win.focus();
  };
  $('#voteUrl').textContent='opens in a second window';
})();

/* ================= 4 · roadmap ================= */
(function(){
  const host=$('#roadmap'); if(!host) return;
  const items=[
    ['What a robot is made of','Sense, think, act, power, talk',4,A[4]],
    ['The brain','What a microcontroller is and which ones you will meet',8,A[0]],
    ['The board','Every part of an Arduino UNO and what each pin does',13,A[5]],
    ['Writing code','Seven exercises. You type, it runs, the board reacts',16,A[1]],
    ['Signals','Digital, analog, logic levels and PWM',24,A[2]],
    ['Motors','Why a driver, how an H-bridge works, four motor types',28,A[1]],
    ['Chips talking','UART, I2C, SPI, and which one to pick',31,A[5]],
  ];
  host.innerHTML=`<div class="road">${items.map((r,i)=>`
    <button class="road-card" data-go="${r[2]}" style="--ac:${r[3]}">
      <span class="rn">${String(i+1).padStart(2,'0')}</span>
      <h3>${r[0]}</h3><p class="sub">${r[1]}</p></button>`).join('')}</div>`;
  $$('.road-card',host).forEach(b=>b.onclick=()=>Deck.go(+b.dataset.go));
})();

/* ================= 5 · robot anatomy ================= */
(function(){
  const host=$('#anatomy'), info=$('#anatomyInfo'); if(!host) return;
  const P=[
    ['Sense','#8430ce','Sensors turn something physical into a voltage the chip can measure. Light, distance, heat, tilt, current.',
     'A line follower uses two reflectance sensors. A rover uses a camera, a GPS and an IMU.'],
    ['Think','#1a73e8','The microcontroller reads those numbers and decides what to do. This is the code you write.',
     'Most of that decision making is if statements. Very little of it is clever.'],
    ['Act','#ea4335','Actuators turn the decision back into movement, light or sound. Motors, servos, LEDs, buzzers.',
     'The chip cannot move anything by itself. It can only switch pins. Drivers do the muscle work.'],
    ['Power','#f9ab00','Everything above needs a supply that holds steady. Battery, regulator, and a shared ground.',
     'More projects die from bad power than from bad code. A motor browning out the board looks like a software bug.'],
    ['Talk','#00897b','Parts have to exchange numbers. Sensor to chip, chip to driver, robot to laptop.',
     'That is what UART, I2C, SPI and CAN are for. We cover them at the end.'],
  ];
  host.innerHTML=`<svg viewBox="0 0 460 380" id="anaSvg" style="width:100%;max-height:400px"></svg>`;
  const svg=$('#anaSvg');
  const cx=230, cy=180, R=118;
  P.forEach((p,i)=>{
    const a=-Math.PI/2 + i*2*Math.PI/5;
    const x=cx+Math.cos(a)*R, y=cy+Math.sin(a)*R;
    svg.insertAdjacentHTML('beforeend',
      `<g class="anode" data-i="${i}" style="cursor:pointer">
        <circle cx="${x}" cy="${y}" r="46" fill="${p[1]}" opacity=".10"/>
        <circle cx="${x}" cy="${y}" r="46" fill="none" stroke="${p[1]}" stroke-width="2"/>
        <text x="${x}" y="${y+5}" text-anchor="middle" font-family="Outfit" font-size="16" font-weight="600" fill="${p[1]}">${p[0]}</text>
      </g>`);
  });
  svg.insertAdjacentHTML('afterbegin',
    `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#e3e6ea" stroke-width="2" stroke-dasharray="5 7"/>
     <text x="${cx}" y="${cy-4}" text-anchor="middle" font-family="Outfit" font-size="15" font-weight="600" fill="#5f6368">a robot</text>
     <text x="${cx}" y="${cy+16}" text-anchor="middle" font-size="12" fill="#80868b">all five, working together</text>`);

  let k=0;
  function show(i){
    k=i;
    $$('.anode',svg).forEach((g,j)=>g.setAttribute('opacity', j===i?1:.42));
    info.innerHTML=`<div class="cap">${P[i][0]}</div><p>${P[i][2]}</p>
      <div class="note b" style="margin-top:14px">${P[i][3]}</div>`;
  }
  $$('.anode',svg).forEach(g=>g.onclick=()=>show(+g.dataset.i));
  show(0);
  Deck.enter('What a robot is', ()=>{ show(0); Deck.every(()=>show((k+1)%5), 3600); });
})();

/* ================= 6 · sensors ================= */
(function(){
  const host=$('#sensorBench'), info=$('#sensorInfo'); if(!host) return;
  const S=[
    ['Button','#1a73e8','digitalRead','Pressed or not. One bit of information.','0 or 1',
     'The simplest sensor there is. A switch either completes the circuit or it does not.'],
    ['Light sensor (LDR)','#f9ab00','analogRead','Its resistance falls as light rises.','0 to 1023',
     'Point a torch at it and the number climbs. This is how a line follower sees a black line.'],
    ['Distance (ultrasonic)','#00897b','pulseIn','Sends a chirp, times the echo.','2 cm to 400 cm',
     'Sound takes about 58 microseconds per centimetre, there and back. The chip just measures time.'],
    ['Temperature','#ea4335','analogRead or I2C','A voltage that tracks the temperature.','-40 to 125 C',
     'Cheap ones give you a voltage. Better ones talk over I2C and give you a number directly.'],
  ];
  host.innerHTML=`<div class="cap">Pick a sensor. Then move the world and watch the number.</div>
    <div class="tabs" id="senTabs" style="margin-bottom:14px"></div>
    <div id="senVis"></div>
    <div class="field" style="margin-top:16px"><span class="lbl" id="senLbl">world</span>
      <input type="range" id="senVal" min="0" max="100" value="40"><span class="val" id="senOut"></span></div>`;
  let cur=0;
  function draw(){
    const v=+$('#senVal').value, s=S[cur];
    let reading, extra;
    if(cur===0){ reading = v>50?'HIGH (1)':'LOW (0)'; extra='pressed'; }
    if(cur===1){ reading = Math.round(v/100*1023); extra='brighter'; }
    if(cur===2){ reading = Math.round(2+v/100*298)+' cm'; extra='further'; }
    if(cur===3){ reading = (v/100*60-10).toFixed(1)+' C'; extra='hotter'; }
    $('#senOut').textContent=reading;
    $('#senLbl').textContent=extra;
    $('#senVis').innerHTML=`
      <svg viewBox="0 0 460 170" style="width:100%">
        <rect x="16" y="46" width="120" height="80" rx="12" fill="${s[1]}" opacity=".10"/>
        <rect x="16" y="46" width="120" height="80" rx="12" fill="none" stroke="${s[1]}" stroke-width="2"/>
        <text x="76" y="82" text-anchor="middle" font-family="Outfit" font-size="13" font-weight="600" fill="${s[1]}">${s[0].split(' ')[0]}</text>
        <text x="76" y="102" text-anchor="middle" font-size="11" fill="#5f6368">sensor</text>
        <path d="M136 86 H 300" stroke="${s[1]}" stroke-width="2.5"/>
        <circle cx="${150+v*1.4}" cy="86" r="5" fill="${s[1]}"/>
        <text x="218" y="74" text-anchor="middle" font-size="11" fill="#80868b">a voltage on a wire</text>
        <rect x="300" y="46" width="140" height="80" rx="12" fill="#e8f0fe"/>
        <text x="370" y="80" text-anchor="middle" font-family="Roboto Mono" font-size="14" fill="#174ea6">${reading}</text>
        <text x="370" y="102" text-anchor="middle" font-size="11" fill="#5f6368">what your code sees</text>
      </svg>`;
    info.innerHTML=`<div class="cap">${s[0]}</div><p>${s[3]}</p>
      ${kv('You call','<span class="mono">'+s[2]+'()</span>')}
      ${kv('You get back', s[4])}
      <div class="note b" style="margin-top:12px">${s[5]}</div>`;
  }
  tabs($('#senTabs'), S.map(s=>s[0]), i=>{ cur=i; draw(); });
  $('#senVal').oninput=draw;
  draw();
})();

/* ================= 7 · actuators ================= */
(function(){
  const host=$('#actBench'), info=$('#actInfo'); if(!host) return;
  const AC=[
    ['LED','#ea4335','digitalWrite(pin, HIGH)','On or off. With a ~ pin, any brightness.'],
    ['Buzzer','#f9ab00','tone(pin, 1200)','A square wave at a frequency. Your ear hears a note.'],
    ['Servo','#1a73e8','myServo.write(90)','Goes to an angle and holds it there against a load.'],
    ['DC motor','#188038','analogWrite(pin, 200)','Spins as fast as the duty cycle tells it to.'],
  ];
  host.innerHTML=`<div class="cap">Click each one</div><div class="actgrid">${AC.map((a,i)=>`
    <button class="actcell" data-i="${i}" style="--ac:${a[1]}">
      <div class="actart" id="art${i}"></div>
      <h4>${a[0]}</h4><span class="mono tiny">${a[2]}</span></button>`).join('')}</div>`;
  const art=[
    `<div class="led" id="demoLed" style="--c:#ea4335;width:44px;height:44px"></div>`,
    `<div class="bzicon" id="demoBz">))</div>`,
    `<svg viewBox="0 0 80 80" width="66" height="66"><circle cx="40" cy="48" r="18" fill="#e8f0fe"/><rect id="demoHorn" x="37" y="16" width="6" height="34" rx="3" fill="#1a73e8" style="transform-origin:40px 48px;transition:.4s"/><circle cx="40" cy="48" r="5" fill="#1a73e8"/></svg>`,
    `<svg viewBox="0 0 80 80" width="66" height="66"><circle cx="40" cy="40" r="24" fill="none" stroke="#188038" stroke-width="3"/><g id="demoFan" style="transform-origin:40px 40px"><rect x="37" y="18" width="6" height="44" rx="3" fill="#188038"/><rect x="18" y="37" width="44" height="6" rx="3" fill="#188038"/></g></svg>`
  ];
  AC.forEach((a,i)=>$('#art'+i).innerHTML=art[i]);
  let t=null, spin=0;
  function pick(i){
    $$('.actcell',host).forEach((c,j)=>c.classList.toggle('on', i===j));
    info.innerHTML=`<div class="cap">${AC[i][0]}</div><p>${AC[i][3]}</p>
      <div class="codebox mono" style="margin-top:12px">${AC[i][2]}</div>`;
    clearInterval(t);
    if(i===0){ t=Deck.every(()=>$('#demoLed').classList.toggle('on'), 420); }
    if(i===1){ t=Deck.every(()=>{ const b=$('#demoBz'); b.classList.toggle('ring'); beep(); }, 700); }
    if(i===2){ let a2=0; t=Deck.every(()=>{ a2=a2?0:120; $('#demoHorn').style.transform=`rotate(${a2-60}deg)`; }, 900); }
    if(i===3){ t=Deck.every(()=>{ spin+=22; $('#demoFan').style.transform=`rotate(${spin}deg)`; }, 40); }
  }
  let actx;
  function beep(){ try{ actx=actx||new AudioContext(); const o=actx.createOscillator(), g=actx.createGain();
    o.type='square'; o.frequency.value=1200; g.gain.value=.04; o.connect(g).connect(actx.destination);
    o.start(); o.stop(actx.currentTime+.09);}catch(e){} }
  $$('.actcell',host).forEach(c=>c.onclick=()=>pick(+c.dataset.i));
  Deck.enter('Acting', ()=>pick(0));
})();

/* ================= 8 · the loop ================= */
(function(){
  const host=$('#loopVis'); if(!host) return;
  const steps=[['Read the left sensor','sense'],['Read the right sensor','sense'],
    ['Is the line under the left one?','think'],['Slow the left motor','act'],['Start again','loop']];
  $('#loopSteps').innerHTML=steps.map((s,i)=>
    `<div class="lstep" data-i="${i}"><span class="ldot ${s[1]}"></span><span>${s[0]}</span></div>`).join('');
  $('#loopCode').innerHTML=
`<span class="tok-k">void</span> <span class="tok-f">loop</span>() {
  <span class="tok-k">int</span> left  = <span class="tok-f">analogRead</span>(A0);
  <span class="tok-k">int</span> right = <span class="tok-f">analogRead</span>(A1);

  <span class="tok-k">if</span> (left &lt; <span class="tok-n">400</span>) {
    <span class="tok-f">analogWrite</span>(LEFT_MOTOR, <span class="tok-n">120</span>);
  } <span class="tok-k">else</span> {
    <span class="tok-f">analogWrite</span>(LEFT_MOTOR, <span class="tok-n">220</span>);
  }
}`;
  host.innerHTML=`<svg viewBox="0 0 420 300" id="loopSvg" style="width:100%;max-height:330px">
    <path d="M110 60 A100 100 0 0 1 310 60" fill="none" stroke="#dadce0" stroke-width="2"/>
    <path d="M330 110 A100 100 0 0 1 240 240" fill="none" stroke="#dadce0" stroke-width="2"/>
    <path d="M180 240 A100 100 0 0 1 92 112" fill="none" stroke="#dadce0" stroke-width="2"/>
    <g class="lnode" data-k="sense"><circle cx="90" cy="86" r="44" fill="#f3e8fd"/><text x="90" y="92" text-anchor="middle" font-family="Outfit" font-size="15" font-weight="600" fill="#8430ce">sense</text></g>
    <g class="lnode" data-k="think"><circle cx="330" cy="86" r="44" fill="#e8f0fe"/><text x="330" y="92" text-anchor="middle" font-family="Outfit" font-size="15" font-weight="600" fill="#1a73e8">think</text></g>
    <g class="lnode" data-k="act"><circle cx="210" cy="250" r="44" fill="#fce8e6"/><text x="210" y="256" text-anchor="middle" font-family="Outfit" font-size="15" font-weight="600" fill="#d93025">act</text></g>
    <circle id="runner" r="7" fill="#f9ab00" cx="90" cy="86"/>
  </svg>`;
  let i=0;
  function step(){
    const s=steps[i%steps.length];
    $$('.lstep').forEach((n,j)=>n.classList.toggle('on', j===i%steps.length));
    const pos={sense:[90,86], think:[330,86], act:[210,250], loop:[90,86]}[s[1]];
    const r=$('#runner'); r.setAttribute('cx',pos[0]); r.setAttribute('cy',pos[1]);
    $$('.lnode').forEach(n=>n.setAttribute('opacity', n.dataset.k===s[1]?1:.45));
    i++;
  }
  Deck.enter('The loop', ()=>{ i=0; step(); Deck.every(step, 1100); });
})();

/* ================= 9 · three kinds of computer ================= */
(function(){
  const host=$('#threeWays'); if(!host) return;
  const C=[
    {n:'Laptop CPU', c:'#5f6368', art:'laptop', line:'Runs anything. Needs an operating system, a fan and a disk.',
     speed:3000, mem:16000000, boot:30, pins:0, watt:65,
     note:'Great at Chrome. Cannot wiggle a wire at an exact microsecond.'},
    {n:'Raspberry Pi', c:'#8430ce', art:'pi', line:'A real computer that also has pins.',
     speed:1500, mem:4000000, boot:20, pins:40, watt:5,
     note:'Reach for it when you need a camera, a network and Python at once.'},
    {n:'Microcontroller', c:'#1a73e8', art:'mcu', line:'One program, forever, starting the instant it gets power.',
     speed:16, mem:2, boot:0.001, pins:20, watt:0.2,
     note:'It never crashes to a desktop, because there is no desktop.'}
  ];
  const art={
    laptop:`<svg viewBox="0 0 90 64"><rect x="10" y="6" width="70" height="44" rx="4" fill="#dfe3e9"/>
      <rect x="16" y="12" width="58" height="32" rx="2" fill="#9aa0a8"/>
      <path d="M2 56 h86 l-6 -6 H8 Z" fill="#c3c8d0"/></svg>`,
    pi:`<svg viewBox="0 0 90 64"><rect x="8" y="10" width="74" height="44" rx="4" fill="#8430ce" opacity=".18"/>
      <rect x="8" y="10" width="74" height="44" rx="4" fill="none" stroke="#8430ce" stroke-width="2"/>
      <rect x="14" y="14" width="46" height="7" rx="2" fill="#8430ce"/>
      <rect x="30" y="28" width="26" height="18" rx="3" fill="#8430ce"/></svg>`,
    mcu:`<svg viewBox="0 0 90 64"><rect x="22" y="14" width="46" height="36" rx="4" fill="#1a73e8"/>
      ${[0,1,2,3,4].map(i=>`<rect x="${14}" y="${18+i*7}" width="8" height="4" rx="1" fill="#9aa0a8"/>
        <rect x="${68}" y="${18+i*7}" width="8" height="4" rx="1" fill="#9aa0a8"/>`).join('')}
      <circle cx="30" cy="22" r="3" fill="#fff" opacity=".6"/></svg>`
  };
  const rows=[
    ['Clock speed', c=>c.speed>=1000?(c.speed/1000)+' GHz':c.speed+' MHz', c=>Math.log10(c.speed+1)/3.6],
    ['Memory', c=>c.mem>=1000000?(c.mem/1000000)+' GB':c.mem+' KB', c=>Math.log10(c.mem+1)/7.3],
    ['Time to boot', c=>c.boot<1?'a millisecond':c.boot+' s', c=>Math.min(1,c.boot/30)],
    ['Pins to the world', c=>c.pins||'none', c=>c.pins/40],
    ['Power draw', c=>c.watt+' W', c=>Math.log10(c.watt*10+1)/2.9]
  ];
  host.innerHTML=C.map((c,i)=>`
    <div class="card grow ways" style="--c:${c.c}${i===2?';border:2px solid #1a73e8':''}">
      <div class="ways-head"><span class="ways-art">${art[c.art]}</span>
        <div><h3 style="color:${c.c}">${c.n}</h3><p class="sub">${c.line}</p></div></div>
      <div class="ways-rows">${rows.map(r=>`
        <div class="wrow"><span class="wlab">${r[0]}</span>
          <span class="wtrack"><span class="wfill" data-w="${Math.min(1,r[2](c))*100}" style="background:${c.c}"></span></span>
          <b class="wval">${r[1](c)}</b></div>`).join('')}</div>
      <div class="note ${i===2?'b':'y'}" style="margin-top:auto">${c.note}</div>
    </div>`).join('');
  Deck.enter('What an MCU is', ()=>{
    const instant=location.search.includes('nofx');
    $$('.wfill',host).forEach((f,i)=>{
      if(instant){ f.style.transition='none'; f.style.width=f.dataset.w+'%'; return; }
      f.style.width='0'; setTimeout(()=>f.style.width=f.dataset.w+'%', 60+i*40);
    });
  });
})();

/* ================= 10 · inside the chip ================= */
(function(){
  const host=$('#chipMap'), info=$('#chipInfo'); if(!host) return;
  const B=[
    ['CPU core','#1a73e8',[40,40,150,70],'The part that actually runs your instructions, one at a time, 16 million times a second.',
     'It is an 8 bit core. It adds two numbers up to 255 in one step, bigger numbers take more steps.'],
    ['Flash, 32 KB','#8430ce',[210,40,170,70],'Where your compiled sketch lives. It survives power off, which is why the board runs your code the moment it gets power.',
     'Blink uses about 1 KB. You have room for a lot more than you think.'],
    ['SRAM, 2 KB','#ea4335',[40,130,150,60],'The scratch pad. Every variable you make lives here while the program runs.',
     'This is the one you run out of first. A long String can eat it in one line.'],
    ['EEPROM, 1 KB','#f9ab00',[210,130,170,60],'A small area you can write to from code and read after a power cut. Settings, calibration, high scores.',
     'It wears out after about 100000 writes per cell, so do not write it inside loop().'],
    ['GPIO','#188038',[40,210,150,60],'The pin drivers. Each one can be an input or an output, and can source about 20 mA.',
     'This is the only part of the chip that touches the outside world.'],
    ['ADC','#00897b',[210,210,80,60],'The analog to digital converter. Turns a voltage into a number from 0 to 1023.',
     'One converter shared by six pins, so it measures them one after another.'],
    ['Timers','#5f6368',[300,210,80,60],'Counters that tick along with the clock. They give you PWM, tone() and millis().',
     'analogWrite does not run code in a loop. A timer does it in hardware while your program moves on.'],
  ];
  host.innerHTML=`<svg viewBox="0 0 420 300" id="chipSvg" style="width:100%;max-height:400px">
    <rect x="20" y="20" width="380" height="266" rx="16" fill="#f8f9fa" stroke="#dadce0"/>
    <text x="210" y="14" text-anchor="middle" font-size="11" fill="#80868b">one chip, about 4 mm across</text>
    ${B.map((b,i)=>`<g class="blk" data-i="${i}" style="cursor:pointer">
      <rect x="${b[2][0]}" y="${b[2][1]}" width="${b[2][2]}" height="${b[2][3]}" rx="10" fill="${b[1]}" opacity=".10"/>
      <rect x="${b[2][0]}" y="${b[2][1]}" width="${b[2][2]}" height="${b[2][3]}" rx="10" fill="none" stroke="${b[1]}" stroke-width="1.6"/>
      <text x="${b[2][0]+b[2][2]/2}" y="${b[2][1]+b[2][3]/2+5}" text-anchor="middle" font-family="Outfit" font-size="13" font-weight="600" fill="${b[1]}">${b[0]}</text>
    </g>`).join('')}
  </svg>`;
  function show(i){
    $$('.blk').forEach((g,j)=>g.setAttribute('opacity', j===i?1:.45));
    info.innerHTML=`<div class="cap">${B[i][0]}</div><p>${B[i][3]}</p>
      <div class="note b" style="margin-top:14px">${B[i][4]}</div>`;
  }
  $$('.blk',host).forEach(g=>g.onmouseenter=g.onclick=()=>show(+g.dataset.i));
  show(0);
})();

/* ================= 11 · what 16 MHz means ================= */
(function(){
  const host=$('#scaleSlide'); if(!host) return;
  host.innerHTML=`
    <div class="col grow" style="gap:16px">
      ${card('16 million times a second', `
        <p>One tick is 62.5 nanoseconds. In the time you blink, the chip runs about two million instructions.</p>
        <div id="tickVis" style="margin-top:14px"></div>
        <div class="field" style="margin-top:14px"><span class="lbl">slow it down</span>
          <input type="range" id="tickSpeed" min="0" max="100" value="30"><span class="val" id="tickOut">1 Hz</span></div>`)}
      ${card('Why that is still slow', `
        ${kv('Arduino UNO','16 MHz, 8 bit')}
        ${kv('ESP32','240 MHz, 32 bit, two cores')}
        ${kv('Your laptop','about 3000 MHz, 64 bit, eight cores')}
        <p class="sub" style="margin-top:8px">Fast enough to blink a light and drive a motor thousands of times a second. Not fast enough to decode video.</p>`)}
    </div>
    <div class="col grow" style="gap:16px">
      ${card('32 KB of program space', `<div id="memVis"></div>`)}
      ${card('2 KB of RAM', `
        <p>Every variable lives here. 2048 bytes in total.</p>
        <div id="ramVis" style="margin-top:12px"></div>
        <div class="note y" style="margin-top:12px">One line like <span class="mono">String s = "hello";</span> can quietly cost you 30 bytes. This is why embedded people count bytes.</div>`)}
    </div>`;
  const tick=$('#tickVis');
  tick.innerHTML=`<div class="ticker"><div class="tickdot" id="td"></div><span class="mono tiny" id="tickCount">0</span></div>`;
  let n=0, t=null;
  function speed(){
    const v=+$('#tickSpeed').value;
    const hz=Math.pow(10, v/25);
    $('#tickOut').textContent = hz<1000 ? hz.toFixed(hz<10?1:0)+' Hz' : (hz/1000).toFixed(1)+' kHz';
    clearInterval(t);
    t=Deck.every(()=>{ n++; $('#td').classList.toggle('on'); $('#tickCount').textContent=n; }, Math.max(16,1000/hz));
  }
  $('#tickSpeed').oninput=speed;
  const bytes=(host2, total, used, label)=>{
    const cells=[...Array(100)].map((_,i)=>`<span class="mcell${i<used?' u':''}"></span>`).join('');
    $(host2).innerHTML=`<div class="mgrid">${cells}</div><div class="sub" style="margin-top:8px">${label}</div>`;
  };
  Deck.enter('16 MHz, 32 KB', ()=>{
    speed();
    bytes('#memVis', 32, 3, 'Blink uses about 1 KB. A servo sketch with Serial uses about 3 KB. Each square is 320 bytes.');
    bytes('#ramVis', 2, 12, 'A typical beginner sketch uses about 250 bytes. Each square is 20 bytes.');
  });
})();

/* ================= 12 · the MCU family ================= */
(function(){
  const host=$('#mcuTabs'); if(!host) return;
  const M=[
    ['Arduino UNO','ATmega328P','16 MHz','2 KB RAM','32 KB flash','20','5 V','about 800 taka',
     'The teaching board. Survives wiring mistakes that would kill a 3.3 V chip.','#1a73e8'],
    ['Arduino Nano','ATmega328P','16 MHz','2 KB RAM','32 KB flash','22','5 V','about 400 taka',
     'The same chip on a board that fits a breadboard. Use it once the project leaves the desk.','#1a73e8'],
    ['Arduino Mega','ATmega2560','16 MHz','8 KB RAM','256 KB flash','70','5 V','about 1800 taka',
     'When you run out of pins. 3D printers use these.','#1a73e8'],
    ['ESP32','Xtensa dual core','240 MHz','520 KB RAM','4 MB flash','34','3.3 V','about 500 taka',
     'Wifi and Bluetooth built in, and far more power than an UNO for less money. This is what we use in Mongol Tori and at Tivoniq.','#ea4335'],
    ['Raspberry Pi Pico','RP2040 dual core','133 MHz','264 KB RAM','2 MB flash','26','3.3 V','about 500 taka',
     'Cheap, fast, and it has programmable IO blocks that can generate signals no other chip can.','#188038'],
    ['STM32 Blue Pill','STM32F103','72 MHz','20 KB RAM','64 KB flash','37','3.3 V','about 400 taka',
     'What industry actually ships. Steeper learning curve, far more control.','#8430ce'],
  ];
  const fields=['Chip','Clock','RAM','Flash','IO pins','Logic level','Street price'];
  function show(i){
    const m=M[i];
    $('#mcuCard').innerHTML=`
      <div class="row between center"><h3 style="font-size:26px">${m[0]}</h3>
        <span class="chip" style="background:${m[9]}18;color:${m[9]};border-color:transparent">${m[6]} logic</span></div>
      <p style="margin-top:10px">${m[8]}</p>
      <div style="margin-top:14px">${fields.map((f,j)=>kv(f, m[j+1])).join('')}</div>`;
    $$('#mcuCompare .mrow').forEach((r,j)=>r.classList.toggle('on', j===i));
  }
  $('#mcuCompare').innerHTML=M.map((m,i)=>`
    <div class="mrow" data-i="${i}">
      <span class="mname">${m[0]}</span>
      <span class="mbar"><span style="width:${Math.min(100,Math.log10(parseFloat(m[2]))*33)}%;background:${m[9]}"></span></span>
      <span class="mval mono">${m[2]}</span>
    </div>`).join('');
  $$('#mcuCompare .mrow').forEach(r=>r.onclick=()=>{ tabsHost.querySelectorAll('.tab').forEach((t,j)=>t.classList.toggle('on', j===+r.dataset.i)); show(+r.dataset.i); });
  const tabsHost=host;
  tabs(host, M.map(m=>m[0]), show);
})();

/* ================= 13 · why Arduino ================= */
(function(){
  const host=$('#whyArduino'); if(!host) return;
  host.innerHTML=`
    <div class="col grow" style="gap:14px">
      ${card('Without Arduino', `
        <p>To run code on a bare ATmega328P you would need to:</p>
        <ul class="list" style="margin-top:10px">
          <li>Buy a hardware programmer</li>
          <li>Set fuse bits by hand, and brick the chip if you get them wrong</li>
          <li>Write to registers directly: <span class="mono">DDRB |= (1 &lt;&lt; PB1);</span></li>
          <li>Build your own clock and power circuit on a breadboard</li>
        </ul>`)}
      ${card('With Arduino', `
        <ul class="list">
          <li>A <b>bootloader</b> already in the chip, so plain USB is enough to upload</li>
          <li>A <b>board</b> with the clock, the regulator and the USB chip already wired</li>
          <li>A <b>library</b> where that register line becomes <span class="mono">pinMode(9, OUTPUT);</span></li>
          <li>Thousands of libraries and twenty years of forum answers</li>
        </ul>`)}
    </div>
    <div class="col grow" style="gap:14px">
      ${card('The same job, two ways', `
        <div class="sub" style="margin-bottom:6px">Bare registers</div>
        <div class="codebox mono" style="font-size:12.5px">DDRB |= (1 &lt;&lt; PB1);<br>PORTB |= (1 &lt;&lt; PB1);<br>_delay_ms(500);<br>PORTB &amp;= ~(1 &lt;&lt; PB1);</div>
        <div class="sub" style="margin:12px 0 6px">Arduino</div>
        <div class="codebox mono" style="font-size:12.5px">pinMode(9, OUTPUT);<br>digitalWrite(9, HIGH);<br>delay(500);<br>digitalWrite(9, LOW);</div>
        <p class="sub" style="margin-top:12px">Both compile to nearly the same machine code. One of them you can read.</p>`)}
      <div class="note y">Arduino is a starting point, not a ceiling. When you need speed you can still write registers inside an Arduino sketch.</div>
    </div>`;
})();

/* ================= 14 · board anatomy ================= */
(function(){
  const host=$('#boardMap'), info=$('#boardInfo'); if(!host) return;
  const P=[
    ['USB port','#1a73e8',[2,164,140,108],'Power in, your sketch in, and Serial text back out. One cable does all three. Use a data cable, not a charge-only one.'],
    ['USB to serial chip','#8430ce',[172,232,90,70],'An ATmega16U2 that turns USB into the plain serial the main chip understands. This is what your computer sees as a COM port.'],
    ['The microcontroller','#ea4335',[338,232,256,102],'The ATmega328P. Your code runs here and nowhere else on the board. Everything else exists to serve it.'],
    ['16 MHz crystal','#f9ab00',[268,244,62,37],'A quartz crystal that gives the chip a steady beat, 16 million times a second. Without it, delay(1000) would not be a second.'],
    ['Voltage regulator','#188038',[146,380,62,60],'Turns 7 to 12 V from the jack into a clean 5 V. It gets hot, and it cannot feed motors.'],
    ['Barrel jack','#00897b',[6,388,140,94],'For a wall adapter or a battery pack when there is no USB around.'],
    ['Reset button','#5f6368',[122,72,60,60],'Restarts your sketch from the first line of setup(). The board does this by itself every time you upload.'],
    ['Digital header','#1a73e8',[172,28,494,40],'Pins 0 to 13. The six marked with a ~ can also fake an analog output with PWM. Pins 0 and 1 are shared with USB serial.'],
    ['Power and analog','#f9ab00',[182,478,420,42],'5 V, 3.3 V, GND and VIN on the left. A0 to A5 on the right, for reading voltages.'],
    ['Status LEDs','#d93025',[190,162,72,54],'TX and RX flicker when serial data moves. L is wired to pin 13, so Blink works with no wiring at all. ON means the board has power.'],
    ['ICSP header','#8430ce',[596,356,52,72],'How you would burn a fresh bootloader onto a bare chip. You will not need it for a long time.']
  ];
  host.innerHTML=`<svg viewBox="-6 -6 712 552" id="brdSvg" style="width:100%;max-height:100%">
    ${UNO.board({id:'anat'})}
    <g id="brdHot">${P.map((p,i)=>`
      <rect class="bhot" data-i="${i}" x="${p[2][0]}" y="${p[2][1]}" width="${p[2][2]}" height="${p[2][3]}"
        rx="8" fill="${p[1]}" fill-opacity="0" stroke="${p[1]}" stroke-width="0" style="cursor:pointer"/>`).join('')}
    </g>
  </svg>`;
  const list=$('#boardList');
  list.className='card';
  list.innerHTML=`<div class="cap">Parts of the board</div><div id="bpList"></div>`;
  function show(i){
    $$('.bhot',host).forEach((r,j)=>{
      r.setAttribute('fill-opacity', j===i?0.3:0);
      r.setAttribute('stroke-width', j===i?3:0);
    });
    $$('#bpList .pickrow').forEach((r,j)=>r.classList.toggle('on', j===i));
    info.innerHTML=`<div class="cap">${P[i][0]}</div><p>${P[i][3]}</p>`;
  }
  pickList($('#bpList'), P.map(p=>({label:p[0], c:p[1]})), show);
  $$('.bhot',host).forEach(r=>r.onmouseenter=r.onclick=()=>show(+r.dataset.i));
  Deck.enter('The UNO board', ()=>{ show(0); });
})();

/* ================= 15 · pin map ================= */
(function(){
  const host=$('#pinMap'); if(!host) return;
  const G=[
    ['Digital 2 to 13','#1a73e8',['13','12','11','10','9','8','7','6','5','4','3','2'],
     'On or off, nothing between. <span class="mono">digitalWrite()</span> drives an LED, <span class="mono">digitalRead()</span> reads a button.',
     'Pins 0 and 1 also carry USB serial. Wire something to them and your Serial monitor stops working.'],
    ['The six PWM pins','#8430ce',['11','10','9','6','5','3'],
     'Marked with a ~ on the board. <span class="mono">analogWrite(pin, 0 to 255)</span> switches them fast enough to act like a voltage in between.',
     'Six of them, no more. A project that needs seven dimmable things needs a bigger board.'],
    ['Analog in, A0 to A5','#ea4335',['A0','A1','A2','A3','A4','A5'],
     '<span class="mono">analogRead()</span> measures 0 to 5 V and hands back 0 to 1023.',
     'They work as ordinary digital pins too. A4 and A5 double as the I2C bus.'],
    ['Power out','#f9ab00',['5V','3V3','VIN'],
     '5 V and 3.3 V feed your sensors. VIN is the raw input voltage, before the regulator.',
     'About 500 mA total from 5 V when running on USB. One small motor can ask for more than that.'],
    ['Ground','#5f6368',['GND','GND_A','GND_B'],
     'Zero volts, the reference everything else is measured against. Three pins, all the same.',
     'Every part of your circuit shares this. Two supplies with separate grounds is the most common wiring bug there is.'],
    ['Serial, 0 and 1','#00897b',['1','0'],
     'TX and RX. The same wires the USB chip uses to talk to the microcontroller.',
     'This is how one board talks to another. We come back to it in the UART slide.']
  ];
  host.innerHTML=`<svg viewBox="-6 -6 712 552" id="pinSvg" style="width:100%;max-height:100%">
    ${UNO.board({id:'pins'})}
    <g id="pinHi"></g>
  </svg>`;
  function show(i){
    const g=G[i], hi=$('#pinHi',host);
    hi.innerHTML = g[2].map(name=>{
      const p=UNO.pin(name);
      return `<circle cx="${p.x}" cy="${p.y}" r="15" fill="${g[1]}" fill-opacity=".35" stroke="${g[1]}" stroke-width="3">
        <animate attributeName="r" values="13;17;13" dur="1.8s" repeatCount="indefinite"/></circle>`;
    }).join('');
    $('#pinInfo').innerHTML=`<div class="cap">${g[0]}</div><p>${g[3]}</p>
      <div class="note y" style="margin-top:12px">${g[4]}</div>`;
  }
  pickList($('#pinList'), G.map(g=>({label:g[0], c:g[1]})), show);
  Deck.enter('Pin map', ()=>show(0));
})();

/* ================= 16 · power ================= */
(function(){
  const host=$('#powerSlide'); if(!host) return;
  host.innerHTML=`
    <div class="col grow" style="gap:14px">
      ${card('Three ways to feed the board',`
        ${kv('USB','5 V, about 500 mA. Fine for the board, LEDs and a couple of sensors.')}
        ${kv('Barrel jack','7 to 12 V. The regulator makes 5 V from it and burns off the rest as heat.')}
        ${kv('VIN pin','Same as the barrel jack, just a pin instead of a socket.')}
        <div class="note r" style="margin-top:12px">Do not feed 9 V into the 5 V pin. That pin is after the regulator, so it goes straight to the chip.</div>`)}
      ${card('How much a thing wants',`
        ${kv('One LED','15 mA')}
        ${kv('Arduino UNO itself','45 mA')}
        ${kv('Small servo, moving','300 to 700 mA')}
        ${kv('Small DC motor','300 to 1000 mA')}
        ${kv('Motor stalled against something','2000 mA or more')}`)}
    </div>
    <div class="col grow" style="gap:14px">
      ${card('The failure everybody hits once',`
        <p>You power a servo from the 5 V pin. It moves, the voltage dips, the chip resets, the servo stops, the voltage recovers, the chip boots, the servo moves again.</p>
        <p style="margin-top:10px">It looks exactly like a bug in your code. It is not.</p>
        <div id="brownout" style="margin-top:14px"></div>
        <button class="btn tonal sm" id="boRun" style="margin-top:12px">Show me</button>`)}
      ${card('The fix',`
        <ul class="list">
          <li>Give motors their own battery or supply</li>
          <li>Join the grounds, always</li>
          <li>Put a big capacitor across the motor supply</li>
        </ul>`)}
    </div>`;
  const bo=$('#brownout');
  function draw(v, resetting){
    bo.innerHTML=`<svg viewBox="0 0 380 90" style="width:100%">
      <line x1="0" y1="70" x2="380" y2="70" stroke="#e3e6ea"/>
      <polyline points="${[...Array(76)].map((_,i)=>{
        const x=i*5; const dip=(v && i>20 && i<44)? (1-Math.exp(-(i-20)/4))*2.6 : 0;
        const y=70-(5-dip)*11; return x+','+y.toFixed(1); }).join(' ')}"
        fill="none" stroke="${resetting?'#d93025':'#1a73e8'}" stroke-width="2.5"/>
      <line x1="0" y1="${70-4.2*11}" x2="380" y2="${70-4.2*11}" stroke="#d93025" stroke-dasharray="4 4" stroke-width="1.4"/>
      <text x="6" y="${70-4.2*11-5}" font-size="10" fill="#d93025">below here the chip resets</text>
      <text x="6" y="86" font-size="10" fill="#80868b">5 V rail while the servo pulls current</text>
    </svg>`;
  }
  draw(false,false);
  $('#boRun').onclick=()=>{ draw(true,true); Deck.after(()=>draw(false,false), 2200); };
})();

/* ================= 17 · workbench tour ================= */
(function(){
  const host=$('#wbTour'); if(!host) return;
  host.innerHTML=`
    <div class="col grow" style="gap:14px">
      ${card('What you get on the next seven slides',`
        <div class="tourrow"><span class="tnum" style="background:#1a73e8">1</span><div><h4>An editor</h4><p class="sub">Type real Arduino code. Hover any word and it tells you what it does.</p></div></div>
        <div class="tourrow"><span class="tnum" style="background:#188038">2</span><div><h4>A console</h4><p class="sub">Serial output, warnings and errors, with the line number.</p></div></div>
        <div class="tourrow"><span class="tnum" style="background:#f9ab00">3</span><div><h4>A board</h4><p class="sub">LEDs, a button, a knob, a buzzer and a servo, wired and labelled.</p></div></div>
        <div class="tourrow"><span class="tnum" style="background:#8430ce">4</span><div><h4>A wiring list</h4><p class="sub">Every connection and the reason it is there.</p></div></div>`)}
      <div class="note b">Everything runs here in the browser. When you get a real UNO, the same code compiles and uploads with no changes.</div>
    </div>
    <div class="col grow" style="gap:14px">
      ${card('The three buttons',`
        ${kv('<b>Run</b>','Compiles what you typed and starts it, the way Upload would on a real board.')}
        ${kv('<b>Stop</b>','Halts the sketch. The board keeps whatever state it was in.')}
        ${kv('<b>Reset code</b>','Puts the starting example back if you get lost.')}`)}
      ${card('If something goes wrong',`
        <p>The console tells you the line and what it did not understand. Real compiler errors are less friendly, so read this one carefully while you can.</p>
        <div class="codebox mono" style="margin-top:12px;font-size:12.5px;color:#d93025">line 6: expected ';' but found 'delay'</div>
        <p class="sub" style="margin-top:10px">Nine times out of ten it is a missing semicolon or a missing brace.</p>`)}
      ${card('One rule',`<p>Do not read the code. Type it, break it, and see what happens. You cannot damage anything here.</p>`)}
    </div>`;
})();

/* ================= 25 · digital vs analog ================= */
(function(){
  const cv=$('#sigCanvas'); if(!cv) return;
  const ctx=cv.getContext('2d');
  let mode=0, level=62, t=0;
  const seg=$('#sigSeg');
  ['Digital','Analog','Both'].forEach((l,i)=>{
    const b=el('button',i?'':'on',l);
    b.onclick=()=>{ $$('button',seg).forEach(x=>x.classList.remove('on')); b.classList.add('on'); mode=i; };
    seg.appendChild(b);
  });
  $('#sigInfo').innerHTML=
    card('Digital', `<p>Two states only. On an UNO, HIGH means 5 V and LOW means 0 V. Anything in between is a mistake or a moment in transition.</p>
      <div class="row wrap" style="gap:8px;margin-top:10px"><span class="chip b">digitalRead</span><span class="chip b">digitalWrite</span><span class="chip b">pins 0 to 13</span></div>`)+
    card('Analog', `<p>Any voltage between 0 and 5 V. The chip measures it in 1024 steps, so one step is about 4.9 mV.</p>
      <div class="row wrap" style="gap:8px;margin-top:10px"><span class="chip r">analogRead</span><span class="chip r">A0 to A5</span><span class="chip r">0 to 1023</span></div>`)+
    `<div class="note y">The world is analog. The chip is digital. The ADC translates one way, PWM translates the other.</div>`;
  function draw(){
    const w=cv.width=cv.clientWidth, h=cv.height;
    ctx.clearRect(0,0,w,h);
    ctx.strokeStyle='#eceff1'; ctx.lineWidth=1;
    for(let i=0;i<=4;i++){ const y=14+i*(h-34)/4; ctx.beginPath(); ctx.moveTo(28,y); ctx.lineTo(w,y); ctx.stroke(); }
    ctx.fillStyle='#80868b'; ctx.font='11px Roboto Mono';
    ctx.fillText('5V',2,18); ctx.fillText('0V',2,h-16);
    const y=v=>14+(1-v)*(h-34);
    if(mode===0||mode===2){
      ctx.beginPath(); ctx.strokeStyle='#1a73e8'; ctx.lineWidth=3;
      for(let x=28;x<w;x++){ const v=Math.sin((x+t)*0.032)>0?1:0; x===28?ctx.moveTo(x,y(v)):ctx.lineTo(x,y(v)); }
      ctx.stroke();
    }
    if(mode===1||mode===2){
      ctx.beginPath(); ctx.strokeStyle='#ea4335'; ctx.lineWidth=3;
      for(let x=28;x<w;x++){ const v=.5+.42*Math.sin((x+t)*0.021)*Math.sin((x+t)*0.006); x===28?ctx.moveTo(x,y(v)):ctx.lineTo(x,y(v)); }
      ctx.stroke();
    }
    ctx.setLineDash([5,5]); ctx.strokeStyle='#f9ab00'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(28,y(level/100)); ctx.lineTo(w,y(level/100)); ctx.stroke(); ctx.setLineDash([]);
    t+=1.5;
  }
  $('#sigLevel').oninput=e=>{
    level=+e.target.value;
    $('#sigOut').textContent=(level/100*5).toFixed(1)+' V';
    $('#sigReadout').innerHTML=`<div class="row" style="gap:18px;margin-top:8px">
      <span class="chip b mono">digitalRead → ${level/100*5>=3?'HIGH':'LOW'}</span>
      <span class="chip r mono">analogRead → ${Math.round(level/100*1023)}</span></div>`;
  };
  $('#sigLevel').dispatchEvent(new Event('input'));
  Deck.enter('Digital and analog', ()=>Deck.loop(draw));
})();

/* ================= 26 · logic levels ================= */
(function(){
  const vis=$('#logicVis'); if(!vis) return;
  $('#lvInfo').innerHTML=
    card('The problem you will hit', `
      ${kv('Arduino UNO','5 V logic')}
      ${kv('ESP32, STM32, Pi','3.3 V logic')}
      ${kv('Most new sensors','3.3 V logic')}
      <div class="note r" style="margin-top:12px">5 V into a 3.3 V pin kills the chip. Sometimes instantly, sometimes three weeks later.</div>`)+
    card('What to do about it', `
      <ul class="list">
        <li><b>Voltage divider</b>, two resistors, works one way only</li>
        <li><b>Level shifter</b>, a small board, works both ways</li>
        <li><b>Buy the 3.3 V version</b>, easiest of all</li>
      </ul>
      <p class="sub" style="margin-top:10px">Going the other way, 3.3 V into a 5 V input, usually reads HIGH because the threshold is around 3 V. Usually.</p>`);
  function draw(v){
    const zone=v>=3?0:v>=1.5?1:2;
    const boxes=[['HIGH, logic 1','#188038','3.0 V to 5 V'],['Undefined','#f9ab00','1.5 V to 3.0 V'],['LOW, logic 0','#5f6368','0 V to 1.5 V']];
    vis.innerHTML=`<svg viewBox="0 0 460 190" style="width:100%">
      ${boxes.map((b,i)=>`
        <rect x="${20+i*148}" y="20" width="132" height="120" rx="12" fill="${b[1]}" opacity="${zone===i?.18:.07}"/>
        <rect x="${20+i*148}" y="20" width="132" height="120" rx="12" fill="none" stroke="${b[1]}" stroke-width="${zone===i?2.4:1}"/>
        <text x="${86+i*148}" y="52" text-anchor="middle" font-family="Outfit" font-size="14" font-weight="600" fill="${b[1]}">${b[0]}</text>
        <text x="${86+i*148}" y="74" text-anchor="middle" font-size="11.5" fill="#5f6368">${b[2]}</text>`).join('')}
      <text x="${86+148}" y="94" text-anchor="middle" font-size="10.5" fill="#80868b">the chip may read either</text>
      <g transform="translate(${86+zone*148},116)"><circle r="15" fill="#1a73e8"/>
        <text y="4" text-anchor="middle" font-family="Roboto Mono" font-size="11" fill="#fff">${v.toFixed(1)}</text></g>
    </svg>`;
    const words=['HIGH (1)','anyone\'s guess','LOW (0)'];
    $('#lvVerdict').innerHTML=`<div class="note ${zone===1?'y':'g'}" style="margin-top:10px">
      At <b>${v.toFixed(1)} V</b> the UNO reads <b>${words[zone]}</b>.</div>`;
  }
  $('#lvVal').oninput=e=>{ const v=e.target.value/10; $('#lvOut').textContent=v.toFixed(1)+' V'; draw(v); };
  draw(4.2);
})();

/* ================= 27 · PWM ================= */
(function(){
  const cv=$('#pwmCanvas'); if(!cv) return;
  const ctx=cv.getContext('2d');
  $('#pwmDemos').innerHTML=
    card('Fan', `<div class="row center" style="gap:20px">
      <div id="fanBox" class="fanbox"></div>
      <div class="col" style="gap:4px"><span class="mono" id="fanRpm" style="color:var(--accent)">1470 rpm</span>
      <span class="sub">the motor cannot start and stop 490 times a second, so it just spins at the average</span></div></div>`)+
    card('LED', `<div class="row center" style="gap:20px">
      <div class="led" id="pwmLed" style="--c:#f9ab00;width:58px;height:58px"></div>
      <div class="col" style="gap:4px"><span class="mono" id="ledPct" style="color:var(--accent)">50%</span>
      <span class="sub">your eye cannot follow it either, so it looks dimmer</span></div></div>`)+
    `<div class="note b"><b>analogWrite(pin, 0 to 255)</b>. 0 is off, 255 is fully on, 128 is half. Only on the six pins marked ~.</div>`;
  $('#fanBox').innerHTML=`<svg viewBox="0 0 100 100" width="92" height="92">
    <circle cx="50" cy="50" r="46" fill="none" stroke="#e3e6ea" stroke-width="3"/>
    <g id="fanBlades" style="transform-origin:50px 50px">
      <ellipse cx="50" cy="28" rx="8" ry="18" fill="#1a73e8"/><ellipse cx="50" cy="72" rx="8" ry="18" fill="#1a73e8"/>
      <ellipse cx="28" cy="50" rx="18" ry="8" fill="#1a73e8"/><ellipse cx="72" cy="50" rx="18" ry="8" fill="#1a73e8"/>
    </g><circle cx="50" cy="50" r="9" fill="#8430ce"/></svg>`;
  let spin=0, duty=.5;
  function draw(val){
    duty=val/255;
    const w=cv.width=cv.clientWidth, h=cv.height, hi=24, lo=h-28;
    ctx.clearRect(0,0,w,h);
    ctx.strokeStyle='#eceff1'; ctx.lineWidth=1;
    [hi,lo].forEach(y=>{ ctx.beginPath(); ctx.moveTo(26,y); ctx.lineTo(w,y); ctx.stroke(); });
    ctx.fillStyle='#80868b'; ctx.font='11px Roboto Mono';
    ctx.fillText('5V',2,hi+4); ctx.fillText('0V',2,lo+4);
    const per=(w-26)/4;
    ctx.beginPath(); ctx.strokeStyle='#1a73e8'; ctx.lineWidth=3;
    ctx.moveTo(26, duty>0?hi:lo);
    for(let i=0;i<4;i++){ const x0=26+i*per, xm=x0+per*duty, x1=x0+per;
      ctx.lineTo(xm,hi); ctx.lineTo(xm,lo); ctx.lineTo(x1,lo); ctx.lineTo(x1,hi); }
    ctx.stroke();
    ctx.setLineDash([6,5]); ctx.strokeStyle='#f9ab00'; ctx.lineWidth=2.5;
    const ay=lo-(lo-hi)*duty;
    ctx.beginPath(); ctx.moveTo(26,ay); ctx.lineTo(w,ay); ctx.stroke(); ctx.setLineDash([]);
    $('#pwmOut').textContent=val;
    $('#pwmStats').innerHTML=`<span class="tiny">duty <b class="mono" style="color:var(--accent)">${Math.round(duty*100)}%</b></span>
      <span class="tiny">average <b class="mono" style="color:var(--accent)">${(duty*5).toFixed(2)} V</b></span>
      <span class="tiny">frequency <b class="mono" style="color:var(--accent)">490 Hz</b></span>`;
    const led=$('#pwmLed');
    led.classList.toggle('on', duty>0.02);
    led.style.opacity=(0.25+0.75*duty).toFixed(2);
    $('#ledPct').textContent=Math.round(duty*100)+'%';
    $('#fanRpm').textContent = duty>0.03 ? Math.round(duty*2900)+' rpm' : 'not turning';
  }
  $('#pwmVal').oninput=e=>draw(+e.target.value);
  Deck.enter('PWM', ()=>{
    draw(+$('#pwmVal').value);
    Deck.loop(()=>{ spin+=duty*14; const b=$('#fanBlades'); if(b) b.style.transform=`rotate(${spin}deg)`; });
  });
})();

/* ================= 28 · other signals ================= */
(function(){
  const host=$('#otherSignals'); if(!host) return;
  host.innerHTML=`
    <div class="col grow" style="gap:14px">
      ${card('Frequency carries the value', `
        <p>A hall sensor on a wheel gives one pulse per magnet. Count pulses per second and you have speed. Nothing about the height of the pulse matters.</p>
        <canvas id="freqCv" height="90"></canvas>
        <div class="field" style="margin-top:10px"><span class="lbl">wheel speed</span>
          <input type="range" id="freqVal" min="1" max="40" value="12"><span class="val" id="freqOut">12 Hz</span></div>`)}
      ${card('Pulse width carries the value', `
        <p>A servo listens to how long the pulse stays high. 1 ms is 0 degrees, 2 ms is 180. The gap between pulses tells it nothing.</p>
        <canvas id="pulseCv" height="90"></canvas>
        <div class="field" style="margin-top:10px"><span class="lbl">pulse</span>
          <input type="range" id="pulseVal" min="1000" max="2000" value="1500"><span class="val" id="pulseOut">1500 us</span></div>`)}
    </div>
    <div class="col grow" style="gap:14px">
      ${card('Two signals together carry direction', `
        <p>A rotary encoder gives two square waves a quarter cycle apart. Which one leads tells you which way the shaft is turning. This is how a robot knows how far it has driven.</p>
        <canvas id="quadCv" height="110"></canvas>
        <div class="row" style="gap:10px;margin-top:10px">
          <button class="btn tonal sm" data-dir="-1">Turn left</button>
          <button class="btn tonal sm" data-dir="1">Turn right</button>
          <span class="mono tiny" id="quadCount" style="align-self:center">count 0</span>
        </div>`)}
      <div class="note y">Same wire, same 0 to 5 V. What changes is which property of the square wave carries the meaning: how often, how wide, or how two of them line up.</div>`;

  const line=(id,fn,h=90)=>{
    const cv=$(id), ctx=cv.getContext('2d');
    return ()=>{ const w=cv.width=cv.clientWidth; ctx.clearRect(0,0,w,h); fn(ctx,w,h); };
  };
  let ph=0;
  const dFreq=line('#freqCv',(ctx,w,h)=>{
    const f=+$('#freqVal').value;
    ctx.strokeStyle='#1a73e8'; ctx.lineWidth=2.5; ctx.beginPath();
    for(let x=0;x<w;x++){ const v=Math.sin((x*f/8+ph)*0.09)>0?1:0; const y=h-16-v*(h-34); x?ctx.lineTo(x,y):ctx.moveTo(x,y); }
    ctx.stroke();
  });
  const dPulse=line('#pulseCv',(ctx,w,h)=>{
    const us=+$('#pulseVal').value;
    const per=w/2.6, hi=(us-1000)/1000*0.35+0.06;
    ctx.strokeStyle='#8430ce'; ctx.lineWidth=2.5; ctx.beginPath();
    ctx.moveTo(0,h-16);
    for(let i=0;i<3;i++){ const x0=i*per; ctx.lineTo(x0,h-16); ctx.lineTo(x0,18); ctx.lineTo(x0+per*hi,18); ctx.lineTo(x0+per*hi,h-16); }
    ctx.lineTo(w,h-16); ctx.stroke();
    ctx.fillStyle='#80868b'; ctx.font='10px Roboto Mono'; ctx.fillText('20 ms between pulses', 6, 12);
  });
  let quad=0, dir=1;
  const dQuad=line('#quadCv',(ctx,w,h)=>{
    [[0,'#1a73e8',26],[dir>0?-6:6,'#ea4335',72]].forEach(([off,col,y0])=>{
      ctx.strokeStyle=col; ctx.lineWidth=2.5; ctx.beginPath();
      for(let x=0;x<w;x++){ const v=Math.sin((x+off*4+quad)*0.06)>0?1:0; const y=y0-v*26; x?ctx.lineTo(x,y):ctx.moveTo(x,y); }
      ctx.stroke();
    });
    ctx.fillStyle='#80868b'; ctx.font='10px Roboto Mono'; ctx.fillText('A',4,20); ctx.fillText('B',4,66);
  },110);
  $('#freqVal').oninput=e=>{ $('#freqOut').textContent=e.target.value+' Hz'; };
  $('#pulseVal').oninput=e=>{ const v=+e.target.value;
    $('#pulseOut').textContent=v+' us  ('+Math.round((v-1000)/1000*180)+'°)'; };
  $$('[data-dir]',host).forEach(b=>b.onclick=()=>{ dir=+b.dataset.dir; });
  Deck.enter('Other signals', ()=>{
    Deck.loop(()=>{ ph+=1.6; quad+=dir*2.2;
      if(Math.random()<.06){ $('#quadCount').textContent='count '+(quad=quad); }
      $('#quadCount').textContent='count '+Math.round(quad/10);
      dFreq(); dPulse(); dQuad(); });
  });
})();

/* ================= 29 · why a driver ================= */
(function(){
  const host=$('#whyDriver'); if(!host) return;
  host.innerHTML=`
    <div class="col grow" style="gap:13px">
      <div class="card grow">
        <div class="cap">How much current, side by side</div>
        <div class="amps">
          <div class="amp"><span class="amp-lab">An Arduino pin can give</span>
            <span class="amp-bar" style="--w:2%;--c:#188038"></span>
            <b class="amp-val" data-to="20">0</b><span class="amp-u">mA</span></div>
          <div class="amp"><span class="amp-lab">A small DC motor wants</span>
            <span class="amp-bar" style="--w:35%;--c:#f9ab00"></span>
            <b class="amp-val" data-to="700">0</b><span class="amp-u">mA</span></div>
          <div class="amp"><span class="amp-lab">That motor when it jams</span>
            <span class="amp-bar" style="--w:100%;--c:#d93025"></span>
            <b class="amp-val" data-to="2000">0</b><span class="amp-u">mA</span></div>
        </div>
        <div class="note r" style="margin-top:14px">Wire the motor straight to the pin and the pin dies. Often the chip goes with it.</div>
      </div>
      <div class="card">
        <div class="cap">So the pin only ever carries the signal</div>
        <div id="driverVis"></div>
      </div>
    </div>
    <div class="col grow" style="gap:13px">
      <div class="card grow">
        <div class="cap">The second job of a driver</div>
        <p>A motor is a coil. Cut the current and the coil throws the voltage back at you, often many times the supply.</p>
        <div id="spikeVis" style="margin-top:10px"></div>
        <button class="btn tonal sm" id="spikeBtn" style="margin-top:10px">Cut the power</button>
        <p class="sub" style="margin-top:8px">Drivers have diodes inside that swallow that spike.</p>
      </div>
      <div class="card">
        <div class="cap">Which driver</div>
        <div class="drvgrid">
          <div class="drv" style="--c:#5f6368"><b>L298N</b><span>old, cheap, runs hot</span></div>
          <div class="drv" style="--c:#1a73e8"><b>TB6612</b><span>small, efficient</span></div>
          <div class="drv" style="--c:#d93025"><b>BTS7960</b><span>big motors, 40 A</span></div>
          <div class="drv" style="--c:#8430ce"><b>A4988</b><span>steppers</span></div>
        </div>
      </div>
    </div>`;
  $('#driverVis').innerHTML=`<svg viewBox="0 0 420 96" style="width:100%">
    <rect x="6" y="26" width="76" height="44" rx="9" fill="#e8f0fe"/><text x="44" y="53" text-anchor="middle" font-size="13" fill="#174ea6">Arduino</text>
    <path d="M82 48 H150" stroke="#1a73e8" stroke-width="2.5"/><text x="116" y="38" text-anchor="middle" font-size="11" fill="#80868b">20 mA</text>
    <rect x="150" y="20" width="94" height="56" rx="9" fill="#f3e8fd"/><text x="197" y="46" text-anchor="middle" font-size="13" fill="#6a1bb5">Driver</text>
    <text x="197" y="62" text-anchor="middle" font-size="10.5" fill="#80868b">the switch</text>
    <path d="M244 48 H316" stroke="#d93025" stroke-width="6"/><text x="280" y="36" text-anchor="middle" font-size="11" fill="#a50e0e">2 A</text>
    <circle cx="346" cy="48" r="24" fill="#fce8e6"/><text x="346" y="54" text-anchor="middle" font-size="15" fill="#a50e0e">M</text>
    <path d="M197 76 V 90 H 60" stroke="#f9ab00" stroke-width="3" fill="none"/>
    <text x="130" y="86" font-size="10.5" fill="#8a5300">battery current, never through the pin</text></svg>`;
  const sv=$('#spikeVis');
  function spike(on){
    sv.innerHTML=`<svg viewBox="0 0 380 86" style="width:100%">
      <line x1="0" y1="64" x2="380" y2="64" stroke="#dde2ea"/>
      <polyline points="${[...Array(77)].map((_,i)=>{const x=i*5; let y=44; if(i>40) y = on&&i<46 ? 8 : 64; return x+','+y;}).join(' ')}"
        fill="none" stroke="${on?'#d93025':'#1a73e8'}" stroke-width="2.6"/>
      ${on?'<text x="212" y="20" font-size="11" fill="#d93025">60 V spike</text>':''}
      <text x="4" y="82" font-size="10.5" fill="#80868b">voltage at the pin when the motor switches off</text></svg>`;
  }
  spike(false);
  $('#spikeBtn').onclick=()=>{ spike(true); Deck.after(()=>spike(false), 1800); };
  Deck.enter('Why a driver', ()=>{
    const instant=location.search.includes('nofx');
    $$('.amp-bar',host).forEach((b,i)=>{
      if(instant){ b.style.transition='none'; b.style.transform='scaleX(1)'; return; }
      b.style.transform='scaleX(0)'; setTimeout(()=>b.style.transform='scaleX(1)', 80+i*130); });
    $$('.amp-val',host).forEach((v,i)=>countTo(v, +v.dataset.to, 900+i*120));
  });
})();

/* ================= 30 · H-bridge ================= */
(function(){
  const host=$('#hbridge'); if(!host) return;
  const btns=$('#hbBtns');
  [['Forward','fwd'],['Reverse','rev'],['Brake','stop']].forEach(([l,k],i)=>{
    const b=el('button','btn '+(i?'ghost ':'tonal ')+'sm',l);
    b.onclick=()=>draw(k); btns.appendChild(b);
  });
  $('#hbInfo').innerHTML=
    card('How it works',`<p>Four switches around the motor. Close the two on opposite corners and current runs one way. Close the other two and it runs the other way.</p>
      <p style="margin-top:10px">Close both on the same side and the motor is shorted to itself, which brakes it hard.</p>`)+
    card('In code',`<div class="codebox mono" style="font-size:13px">digitalWrite(IN1, HIGH);<br>digitalWrite(IN2, LOW);<br>analogWrite(ENA, 180);</div>
      <p class="sub" style="margin-top:10px">Two pins pick the direction, one PWM pin sets the speed. Every hobby driver works like this.</p>`)+
    `<div class="note r">Never close both switches on one side at once. That is a straight short across the battery, and it is called shoot through.</div>`;
  function draw(state){
    const fwd=state==='fwd', rev=state==='rev', run=fwd||rev;
    const sw=(x,y,on,lab)=>`
      <rect x="${x-18}" y="${y}" width="36" height="28" rx="7" fill="${on?'#e8f0fe':'#f1f3f4'}" stroke="${on?'#1a73e8':'#c9ccd1'}" stroke-width="1.8"/>
      <text x="${x}" y="${y+19}" text-anchor="middle" font-family="Roboto Mono" font-size="11" fill="${on?'#174ea6':'#80868b'}">${lab}</text>`;
    host.innerHTML=`<svg viewBox="0 0 400 210" style="width:100%;max-height:230px">
      <text x="200" y="16" text-anchor="middle" font-size="11" fill="#80868b">battery +</text>
      <path d="M60 26 H340" stroke="#ea4335" stroke-width="3"/>
      <path d="M60 186 H340" stroke="#5f6368" stroke-width="3"/>
      <text x="200" y="204" text-anchor="middle" font-size="11" fill="#80868b">ground</text>
      ${sw(60,54,fwd,'Q1')}${sw(340,54,rev,'Q2')}${sw(60,132,rev,'Q3')}${sw(340,132,fwd,'Q4')}
      <path d="M60 82 V132 M340 82 V132" stroke="#dadce0" stroke-width="2"/>
      <path d="M60 107 H150" stroke="${run?'#f9ab00':'#dadce0'}" stroke-width="3"/>
      <path d="M250 107 H340" stroke="${run?'#f9ab00':'#dadce0'}" stroke-width="3"/>
      <circle cx="200" cy="107" r="34" fill="${run?'#fef7e0':'#f8f9fa'}" stroke="${run?'#f9ab00':'#c9ccd1'}" stroke-width="2"/>
      <text x="200" y="113" text-anchor="middle" font-family="Outfit" font-size="17" font-weight="600" fill="${run?'#8a5300':'#80868b'}">M</text>
      <text x="200" y="164" text-anchor="middle" font-family="Roboto Mono" font-size="12" fill="#5f6368">${fwd?'turning forward':rev?'turning backward':'braked'}</text>
    </svg>`;
  }
  draw('stop');
})();

/* ================= 31 · motor types ================= */
(function(){
  const host=$('#motorTabs'); if(!host) return;
  const M=[
    ['DC motor','Spins as long as you feed it. Speed comes from PWM, direction from an H-bridge. It has no idea where it is.',
     [['Good for','wheels, fans, pumps'],['Driver','L298N, TB6612'],['Position feedback','none'],['Costs','200 taka and up']],
     'Cheap and strong. You cannot ask it how far it has turned unless you add an encoder.'],
    ['Servo','A DC motor, a gearbox and a position sensor in one box, with a controller that holds the angle you ask for.',
     [['Good for','arms, grippers, steering'],['Driver','none, drive the signal pin'],['Position feedback','built in'],['Costs','150 taka and up']],
     'Only turns about 180 degrees. Power it from its own supply or it will reset your board.'],
    ['Stepper','Moves in fixed steps, often 1.8 degrees each. Count the steps and you know the position, with no sensor at all.',
     [['Good for','3D printers, CNC, axes'],['Driver','A4988, DRV8825'],['Position feedback','none, but steps are exact'],['Costs','400 taka and up']],
     'If it misses a step, nothing tells you. The machine is just wrong from then on.'],
    ['Brushless (BLDC)','No brushes to wear out. An electronic speed controller energises the coils in sequence, very fast and very efficiently.',
     [['Good for','drones, e-bikes, rovers'],['Driver','ESC'],['Position feedback','sensored or sensorless'],['Costs','800 taka and up']],
     'It has to be armed before it spins. Treat a spinning propeller as a blade, because it is one.'],
  ];
  const vis=$('#motorVis');
  function show(i){
    const m=M[i];
    $('#motorCard').innerHTML=`<h3 style="font-size:24px">${m[0]}</h3><p style="margin-top:8px">${m[1]}</p>
      <div style="margin-top:14px">${m[2].map(r=>kv(r[0],r[1])).join('')}</div>
      <div class="note y" style="margin-top:14px">${m[3]}</div>`;
    vis.innerHTML=`<div class="cap">How it moves</div><div id="motorArt" class="motorart"></div>`;
    const art=$('#motorArt');
    if(i===0||i===3){
      art.innerHTML=`<svg viewBox="0 0 120 120" width="150" height="150"><circle cx="60" cy="60" r="48" fill="none" stroke="#e3e6ea" stroke-width="4"/>
        <g id="mspin" style="transform-origin:60px 60px">${[0,60,120,180,240,300].map(a=>
          `<rect x="57" y="16" width="6" height="44" rx="3" fill="${i===3?'#8430ce':'#188038'}" transform="rotate(${a} 60 60)"/>`).join('')}</g>
        <circle cx="60" cy="60" r="10" fill="#5f6368"/></svg>
        <p class="sub" style="text-align:center;margin-top:8px">continuous, speed set by duty cycle</p>`;
      let a=0; Deck.every(()=>{ a+=i===3?26:14; const n=$('#mspin'); if(n) n.style.transform=`rotate(${a}deg)`; }, 40);
    }
    if(i===1){
      art.innerHTML=`<svg viewBox="0 0 120 120" width="150" height="150"><circle cx="60" cy="76" r="30" fill="#e8f0fe"/>
        <rect id="marm" x="56" y="26" width="8" height="52" rx="4" fill="#1a73e8" style="transform-origin:60px 76px;transition:.7s cubic-bezier(.2,.8,.2,1)"/>
        <circle cx="60" cy="76" r="8" fill="#1a73e8"/></svg>
        <p class="sub" style="text-align:center;margin-top:8px">goes to an angle and holds it</p>`;
      let k=0; Deck.every(()=>{ k=(k+1)%3; const n=$('#marm'); if(n) n.style.transform=`rotate(${[-70,0,70][k]}deg)`; }, 900);
    }
    if(i===2){
      art.innerHTML=`<svg viewBox="0 0 120 120" width="150" height="150"><circle cx="60" cy="60" r="46" fill="none" stroke="#e3e6ea" stroke-width="4"/>
        ${[...Array(20)].map((_,j)=>`<rect x="59" y="16" width="2" height="9" fill="#dadce0" transform="rotate(${j*18} 60 60)"/>`).join('')}
        <rect id="mstep" x="57" y="20" width="6" height="40" rx="3" fill="#ea4335" style="transform-origin:60px 60px"/>
        <circle cx="60" cy="60" r="9" fill="#5f6368"/></svg>
        <p class="sub" style="text-align:center;margin-top:8px">one step at a time, 200 per turn</p>`;
      let s=0; Deck.every(()=>{ s+=18; const n=$('#mstep'); if(n) n.style.transform=`rotate(${s}deg)`; }, 160);
    }
  }
  tabs(host, M.map(m=>m[0]), show);
})();

/* ================= 32 · why buses ================= */
(function(){
  const host=$('#whyBus'); if(!host) return;
  host.innerHTML=`
    <div class="col grow" style="gap:14px">
      ${card('Count the wires',`
        <p>Say you want a display, a temperature sensor, a clock and an SD card on one UNO.</p>
        <div id="wireCount" style="margin-top:12px"></div>
        <div class="seg" id="busSeg" style="margin-top:14px"></div>`)}
      ${card('The idea',`<p>Instead of a wire per signal, everyone shares the same two or four wires and takes turns. Each device has an address or a select line so it knows when it is being spoken to.</p>`)}
    </div>
    <div class="col grow" style="gap:14px">
      ${card('What every bus has to solve',`
        ${kv('Who speaks first','a master, or anyone with something urgent')}
        ${kv('How fast','an agreed rate, or a shared clock line')}
        ${kv('Who is being addressed','an address byte, or a select wire')}
        ${kv('How to notice damage','a checksum, or nothing at all')}`)}
      <div class="note b">The next slide lets you send a byte over each of them and watch what the wires actually do.</div>`;
  const seg=$('#busSeg');
  ['One wire each','On I2C'].forEach((l,i)=>{
    const b=el('button', i?'':'on', l);
    b.onclick=()=>{ $$('button',seg).forEach(x=>x.classList.remove('on')); b.classList.add('on'); draw(i); };
    seg.appendChild(b);
  });
  function draw(mode){
    const dev=['Display','Temp sensor','Clock','SD card'];
    const wires=mode? 2 : 14;
    $('#wireCount').innerHTML=`<svg viewBox="0 0 400 170" style="width:100%">
      <rect x="10" y="58" width="86" height="56" rx="10" fill="#e8f0fe"/><text x="53" y="90" text-anchor="middle" font-size="12" fill="#174ea6">UNO</text>
      ${dev.map((d,i)=>`<rect x="300" y="${12+i*40}" width="90" height="30" rx="8" fill="#f1f3f4"/>
        <text x="345" y="${32+i*40}" text-anchor="middle" font-size="11" fill="#5f6368">${d}</text>`).join('')}
      ${mode
        ? `<path d="M96 78 H 200 V 27 H 300 M200 27 V 67 H300 M200 67 V 107 H300 M200 107 V 147 H300" stroke="#1a73e8" stroke-width="2.5" fill="none"/>
           <path d="M96 94 H 210 V 34 H 300 M210 34 V 74 H300 M210 74 V 114 H300 M210 114 V 154 H300" stroke="#8430ce" stroke-width="2.5" fill="none"/>
           <text x="200" y="166" text-anchor="middle" font-size="11" fill="#5f6368">2 wires, 4 devices, room for more</text>`
        : dev.map((d,i)=>[...Array(i===3?5:3)].map((_,j)=>
            `<path d="M96 ${70+j*6} H ${180+i*22} V ${27+i*40} H 300" stroke="#dadce0" stroke-width="1.6" fill="none"/>`).join('')).join('')
          + `<text x="200" y="166" text-anchor="middle" font-size="11" fill="#d93025">14 wires, and the UNO only has 20 pins</text>`}
    </svg>`;
  }
  draw(0);
})();

/* ================= 33 · the buses ================= */
(function(){
  const host=$('#busTabs'); if(!host) return;
  const BUS={
  'UART':{wires:['TX','RX'],cols:['#1a73e8','#ea4335'],speed:'up to about 1 Mbit/s',devices:'exactly two',clock:'no, both sides agree a baud rate',
    note:'The simplest link there is. Cross the wires: TX on one board goes to RX on the other. This is what your Serial monitor uses over USB.',
    meet:'GPS modules, HC-05 bluetooth, board to board',
    frame:[0,1,0,1,1,0,0,1,0,1], labels:'start · 8 data bits · stop'},
  'I2C':{wires:['SDA','SCL'],cols:['#8430ce','#f9ab00'],speed:'100 or 400 kbit/s',devices:'up to 127 on the same two wires',clock:'yes, SCL, driven by the master',
    note:'Every device has its own address. The master calls an address and only that device answers. Both lines need pull-up resistors to 5 V.',
    meet:'OLED displays, MPU6050, real time clocks',
    frame:[1,0,1,0,0,1,1,0,0,1], labels:'start · address · data · ack'},
  'SPI':{wires:['MOSI','MISO','SCK','CS'],cols:['#1a73e8','#188038','#f9ab00','#5f6368'],speed:'8 to 50 Mbit/s',devices:'many, but one CS pin each',clock:'yes, SCK',
    note:'The fast one. It sends and receives at the same time. The price is pins: every extra device needs its own chip select wire.',
    meet:'SD cards, TFT screens, nRF24 radios',
    frame:[1,1,0,1,0,0,1,0,1,0], labels:'CS low · 8 clocked bits · CS high'},
  '1-Wire':{wires:['DQ'],cols:['#00897b'],speed:'about 16 kbit/s',devices:'many, each with a unique 64 bit id',clock:'no, timing is in the pulse widths',
    note:'Data and often power on a single wire. Slow, but the wiring could not be simpler.',
    meet:'DS18B20 temperature sensors',
    frame:[0,1,1,0,1,0,0,1,1,0], labels:'reset · presence · data'},
  'RS-485':{wires:['A','B'],cols:['#1a73e8','#ea4335'],speed:'up to 10 Mbit/s',devices:'up to 32 nodes',clock:'no',
    note:'UART made tough. The signal is the difference between two wires, so noise hits both equally and cancels out. It runs over a kilometre of cable in a factory.',
    meet:'industrial sensors, Modbus, big motor drivers',
    frame:[1,0,0,1,0,1,1,0,1,0], labels:'differential pair, same data on both'},
  'CAN':{wires:['CAN-H','CAN-L'],cols:['#188038','#8430ce'],speed:'up to 1 Mbit/s',devices:'many, with no master at all',clock:'no',
    note:'Built for cars. Any node can talk, and if two start at once the more urgent message wins automatically while the other retries. It is the reason a car still runs when one module fails.',
    meet:'every car since the late 90s, our rover motor drivers',
    frame:[0,0,1,1,0,1,0,1,1,0], labels:'id · control · data · CRC'}
  };
  const names=Object.keys(BUS);
  let cur='UART', anim=0, sending=false;
  const scope=$('#busScope'), sctx=scope.getContext('2d');

  function show(i){
    cur=names[i];
    const b=BUS[cur];
    $('#busInfo').innerHTML=
      card(cur, `<p>${b.note}</p>
        <div style="margin-top:12px">
        ${kv('Wires', b.wires.join(', '))}
        ${kv('Speed', b.speed)}
        ${kv('Devices', b.devices)}
        ${kv('Clock line', b.clock)}
        ${kv('You will meet it in', b.meet)}</div>`)
      + card('Rule of thumb', `<ul class="list">
          <li>Few wires, several devices, use <b>I2C</b></li>
          <li>Speed matters, use <b>SPI</b></li>
          <li>Two boards and a cable, use <b>UART</b></li>
          <li>Noise or distance, use <b>RS-485</b> or <b>CAN</b></li></ul>`, 'grow');
    drawBus();
  }
  function drawBus(){
    const b=BUS[cur];
    $('#busVis').innerHTML=`<svg viewBox="0 0 460 200" style="width:100%;max-height:210px">
      <rect x="10" y="66" width="96" height="66" rx="11" fill="#e8f0fe"/>
      <text x="58" y="96" text-anchor="middle" font-family="Outfit" font-size="13" font-weight="600" fill="#174ea6">${cur==='CAN'?'Node A':'Arduino'}</text>
      <text x="58" y="114" text-anchor="middle" font-size="10.5" fill="#5f6368">${cur==='CAN'?'':'master'}</text>
      <rect x="354" y="66" width="96" height="66" rx="11" fill="#f3e8fd"/>
      <text x="402" y="96" text-anchor="middle" font-family="Outfit" font-size="13" font-weight="600" fill="#6a1bb5">${cur==='CAN'?'Node B':'Device'}</text>
      <text x="402" y="114" text-anchor="middle" font-size="10.5" fill="#5f6368">${cur==='CAN'?'':(cur==='I2C'?'address 0x3C':'slave')}</text>
      ${b.wires.map((wname,i)=>{
        const y=80+i*(b.wires.length>2?16:26);
        return `<path d="M106 ${y} H354" stroke="#dadce0" stroke-width="2.5"/>
          <text x="230" y="${y-6}" text-anchor="middle" font-family="Roboto Mono" font-size="10" fill="#5f6368">${wname}</text>
          <circle class="pk" data-i="${i}" cx="106" cy="${y}" r="5" fill="${b.cols[i]}" opacity="0"/>`;
      }).join('')}
      <text x="230" y="182" text-anchor="middle" font-size="10.5" fill="#80868b">${b.labels}</text>
    </svg>`;
    $('#busState').textContent=b.wires.length+' signal wire'+(b.wires.length>1?'s':'')+' plus a shared ground';
  }
  function scopeDraw(){
    const b=BUS[cur], w=scope.width=scope.clientWidth, h=scope.height;
    sctx.clearRect(0,0,w,h);
    const rows=Math.min(2,b.wires.length);
    b.wires.slice(0,rows).forEach((name,r)=>{
      const y0=22+r*((h-24)/rows), amp=(h-34)/rows-8;
      sctx.strokeStyle=b.cols[r]; sctx.lineWidth=2.2; sctx.beginPath();
      const bits=b.frame;
      const bw=(w-40)/bits.length;
      bits.forEach((bit,i)=>{
        const v=(r===1 && cur==='RS-485') ? 1-bit : (r===1 && cur==='I2C') ? (i%2) : bit;
        const x=36+i*bw, y=y0+amp-v*amp;
        const lit = sending && (anim/6|0)>=i;
        sctx.strokeStyle = lit ? b.cols[r] : (sending ? '#d7dade' : b.cols[r]+'55');
        sctx.beginPath();
        sctx.moveTo(x, y); sctx.lineTo(x+bw, y);
        sctx.stroke();
        if(i){ const pv=(r===1&&cur==='RS-485')?1-bits[i-1]:(r===1&&cur==='I2C')?((i-1)%2):bits[i-1];
          if(pv!==v){ sctx.beginPath(); sctx.moveTo(x, y0+amp-pv*amp); sctx.lineTo(x, y); sctx.stroke(); } }
      });
      sctx.fillStyle='#80868b'; sctx.font='10px Roboto Mono';
      sctx.fillText(name, 2, y0+amp/2);
    });
  }
  $('#busSend').onclick=()=>{
    sending=true; anim=0;
    const b=BUS[cur];
    $$('#busVis .pk').forEach((p,i)=>{
      p.style.opacity=1;
      p.animate([{transform:'translateX(0)'},{transform:'translateX(248px)'}],
        {duration:1000, delay:i*70, easing:'cubic-bezier(.4,0,.2,1)'}).onfinish=()=>{ p.style.opacity=0; };
    });
    Deck.after(()=>{ sending=false; }, 1400);
  };
  tabs(host, names, show);
  Deck.enter('The buses', ()=>{ drawBus(); Deck.loop(()=>{ if(sending) anim++; scopeDraw(); }); });
})();

/* ================= 34 · which bus ================= */
(function(){
  const host=$('#busChoose'); if(!host) return;
  const rows=[
    ['Two chips on the same board, a few wires to spare','I2C','#8430ce'],
    ['A screen or an SD card that needs speed','SPI','#1a73e8'],
    ['Two boards joined by a short cable','UART','#188038'],
    ['One temperature sensor and only one spare pin','1-Wire','#00897b'],
    ['A sensor 200 metres away in a noisy building','RS-485','#f9ab00'],
    ['A vehicle, where one broken module must not stop the rest','CAN','#ea4335'],
  ];
  host.innerHTML=`
    <div class="card grow">
      <div class="cap">Read the situation, pick the bus</div>
      <div class="choose">${rows.map((r,i)=>`
        <div class="crow" data-i="${i}"><span>${r[0]}</span><span class="cans" style="--c:${r[2]}">tap to reveal</span></div>`).join('')}</div>
      <p class="sub" style="margin-top:14px">There is rarely one right answer. There is usually one that saves you a week.</p>
    </div>
    <div class="col" style="width:400px;gap:14px">
      ${card('If you remember nothing else',`
        <ul class="list">
          <li><b>I2C</b> when you want few wires</li>
          <li><b>SPI</b> when you want speed</li>
          <li><b>UART</b> when it is two devices and a cable</li>
          <li><b>CAN</b> when it has to survive</li>
        </ul>`)}
      ${card('What comes next',`<p>Next session we put these together: a sensor on I2C, a motor on a driver, and a loop that closes between them.</p>`)}
    </div>`;
  $$('.crow',host).forEach(r=>r.onclick=()=>{
    const i=+r.dataset.i;
    r.querySelector('.cans').textContent=rows[i][1];
    r.classList.add('revealed');
  });
})();

/* ================= 35 · recap ================= */
(function(){
  const host=$('#recap'); if(!host) return;
  const R=[
    ['Wrote firmware','setup, loop, pinMode, digitalWrite, delay'],
    ['Made a decision in code','if and else on a live input'],
    ['Read the physical world','a button, and a knob through the ADC'],
    ['Debugged like an engineer','Serial print, baud rate, reading the console'],
    ['Used a library','Servo.h, angle in, movement out'],
    ['Understood the signals','digital, analog, logic levels, PWM'],
    ['Learned why drivers exist','current, back EMF, the H-bridge'],
    ['Met the buses','UART, I2C, SPI, CAN, and when to use each'],
  ];
  host.innerHTML=`<div class="cap">Eight things</div>`+R.map(r=>
    `<div class="kv"><span><b>${r[0]}</b></span><span class="sub">${r[1]}</span></div>`).join('');
})();

});
