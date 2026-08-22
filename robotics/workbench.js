/* workbench.js — editor, console and live board for the coding slides */

(function(){

/* ---------- what each word means, shown on hover ---------- */
const TIPS = {
  setup:      ['void setup()', 'Runs once when the board powers up or resets. Set up your pins here.'],
  loop:       ['void loop()', 'Runs again and again, forever, as fast as the chip can go. This is where the behaviour lives.'],
  pinMode:    ['pinMode(pin, mode)', 'Tells the chip whether a pin is an OUTPUT (it drives voltage) or an INPUT (it reads voltage).'],
  digitalWrite:['digitalWrite(pin, value)', 'Puts 5 V on the pin for HIGH, or 0 V for LOW. This is how you turn things on.'],
  digitalRead:['digitalRead(pin)', 'Reads the pin and gives back HIGH or LOW. Used for buttons and switches.'],
  analogRead: ['analogRead(A0)', 'Measures the voltage on an analog pin and gives a number from 0 to 1023. 0 V is 0, 5 V is 1023.'],
  analogWrite:['analogWrite(pin, 0..255)', 'Switches the pin on and off very fast so it behaves like a voltage in between. Only pins marked with ~.'],
  delay:      ['delay(milliseconds)', 'Stops everything for this long. 1000 is one second. Nothing else happens while it waits.'],
  delayMicroseconds:['delayMicroseconds(us)', 'Same idea as delay, but a thousand times finer.'],
  millis:     ['millis()', 'How many milliseconds since the board started. Useful when you want to wait without freezing.'],
  Serial:     ['Serial', 'The USB link back to your computer. Your only way to see what the board is thinking.'],
  begin:      ['Serial.begin(9600)', 'Opens the USB link at 9600 bits per second. The monitor must be set to the same number.'],
  print:      ['Serial.print(x)', 'Sends text to the console and stays on the same line.'],
  println:    ['Serial.println(x)', 'Sends text and then moves to a new line.'],
  available:  ['Serial.available()', 'How many characters you have been sent and have not read yet.'],
  read:       ['Serial.read()', 'Takes the next character you were sent.'],
  tone:       ['tone(pin, frequency)', 'Makes the buzzer sing at that frequency in hertz.'],
  noTone:     ['noTone(pin)', 'Stops the buzzer.'],
  map:        ['map(x, a, b, c, d)', 'Rescales a number from one range to another. Great for turning 0..1023 into 0..180.'],
  constrain:  ['constrain(x, low, high)', 'Clamps a number so it never goes outside the range.'],
  attach:     ['servo.attach(pin)', 'Tells the Servo library which pin the servo signal wire is on.'],
  write:      ['servo.write(angle)', 'Commands the servo to an angle from 0 to 180 degrees, and it holds there.'],
  HIGH:       ['HIGH', 'Logic one. On an UNO that means 5 V on the pin.'],
  LOW:        ['LOW', 'Logic zero. That means 0 V on the pin.'],
  OUTPUT:     ['OUTPUT', 'The pin will push voltage out to drive something.'],
  INPUT:      ['INPUT', 'The pin will listen for voltage coming in.'],
  INPUT_PULLUP:['INPUT_PULLUP', 'Input, but with a resistor inside the chip pulling it up to 5 V. A pressed button then reads LOW.'],
  LED_BUILTIN:['LED_BUILTIN', 'Pin 13, where the small LED on the board is wired.'],
  if:         ['if (condition)', 'Runs the block only when the condition is true.'],
  else:       ['else', 'Runs when the if above was not true.'],
  for:        ['for (start; test; step)', 'Repeats a block a set number of times.'],
  while:      ['while (condition)', 'Repeats a block for as long as the condition holds.'],
  int:        ['int', 'A whole number variable, from -32768 to 32767 on this chip.'],
  long:       ['long', 'A bigger whole number, used for millis().'],
  float:      ['float', 'A number with a decimal point.'],
  void:       ['void', 'This function hands nothing back when it finishes.'],
  Servo:      ['Servo', 'A type from the Servo library. Make one for each servo you have.'],
  A0:         ['A0', 'Analog input zero. The knob is wired here.'],
  return:     ['return', 'Leaves the function, optionally handing a value back.'],
};

/* ---------- syntax highlight with hover data ---------- */
const KW = new Set(['void','int','long','float','double','bool','boolean','char','byte','unsigned','const','static',
  'if','else','for','while','do','return','break','continue','true','false','String','Servo']);
const CONST = new Set(['HIGH','LOW','INPUT','OUTPUT','INPUT_PULLUP','LED_BUILTIN','A0','A1','A2','A3','A4','A5','DEC','HEX','BIN']);

function highlight(src){
  let out='', i=0;
  const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const wrap = (cls, text, tipKey) => {
    const tip = TIPS[tipKey];
    return `<span class="tok ${cls}"${tip?` data-tip="${tipKey}"`:''}>${esc(text)}</span>`;
  };
  while(i<src.length){
    const c=src[i];
    if(c==='/'&&src[i+1]==='/'){ const s=i; while(i<src.length&&src[i]!=='\n')i++; out+=wrap('tok-c',src.slice(s,i)); continue; }
    if(c==='/'&&src[i+1]==='*'){ const s=i; i+=2; while(i<src.length&&!(src[i]==='*'&&src[i+1]==='/'))i++; i+=2; out+=wrap('tok-c',src.slice(s,i)); continue; }
    if(c==='#'){ const s=i; while(i<src.length&&src[i]!=='\n')i++; out+=wrap('tok-k',src.slice(s,i)); continue; }
    if(c==='"'||c==="'"){ const q=c, s=i; i++; while(i<src.length&&src[i]!==q){ if(src[i]==='\\')i++; i++; } i++; out+=wrap('tok-s',src.slice(s,i)); continue; }
    if(/[0-9]/.test(c)){ const s=i; while(i<src.length&&/[0-9a-fA-FxX.]/.test(src[i]))i++; out+=wrap('tok-n',src.slice(s,i)); continue; }
    if(/[A-Za-z_]/.test(c)){
      const s=i; while(i<src.length&&/[A-Za-z0-9_]/.test(src[i]))i++;
      const w=src.slice(s,i);
      let cls = KW.has(w) ? 'tok-k' : CONST.has(w) ? 'tok-n' : (src[i]==='(' ? 'tok-f' : '');
      if(w==='Serial') cls='tok-f';
      out += wrap(cls, w, TIPS[w] ? w : null);
      continue;
    }
    out += esc(c); i++;
  }
  return out;
}

/* ---------- caret helpers for the contenteditable editor ---------- */
function caretOffset(root){
  const sel=getSelection();
  if(!sel.rangeCount) return null;
  const r=sel.getRangeAt(0).cloneRange();
  r.selectNodeContents(root); r.setEnd(sel.getRangeAt(0).endContainer, sel.getRangeAt(0).endOffset);
  return r.toString().length;
}
function setCaret(root, offset){
  const walk=document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let n, seen=0;
  while((n=walk.nextNode())){
    const len=n.nodeValue.length;
    if(seen+len>=offset){
      const r=document.createRange(); r.setStart(n, Math.max(0,offset-seen)); r.collapse(true);
      const s=getSelection(); s.removeAllRanges(); s.addRange(r); return;
    }
    seen+=len;
  }
  const r=document.createRange(); r.selectNodeContents(root); r.collapse(false);
  const s=getSelection(); s.removeAllRanges(); s.addRange(r);
}

/* ---------- the simulated bench drawing ---------- */
const WIRING = {
  leds:[{pin:9,c:'#ea4335',x:452,label:'D9'},{pin:10,c:'#f9ab00',x:534,label:'D10'},
        {pin:11,c:'#188038',x:616,label:'D11'},{pin:8,c:'#1a73e8',x:698,label:'D8'}],
  button:2, pot:'A0', servo:6, buzzer:12
};

/* bench: a real UNO on the left, a breadboard on the right, coloured jumpers between */
const BB = {x:512, y:70, w:566, h:316, col0:540, colW:26, cols:20};
const ROW = {a:152, b:174, c:196, d:218, e:240, f:284, g:306, h:328, i:350, j:372};
const RAIL = {vTop:100, gTop:124, vBot:392, gBot:412};
const holeX = c => BB.col0 + c*BB.colW;

const PARTS = {
  leds:[{pin:'9',  c:'#ea4335', label:'D9'},
        {pin:'10', c:'#f9ab00', label:'D10'},
        {pin:'11', c:'#34a853', label:'D11'},
        {pin:'8',  c:'#4285f4', label:'D8'}],
  button:{}, pot:{}
};

function bbHoles(){
  let s='';
  for(let c=0;c<BB.cols;c++){
    const x=holeX(c);
    ['a','b','c','d','e','f','g','h','i','j'].forEach(r=>{
      s+=`<rect x="${x-4}" y="${ROW[r]-4}" width="8" height="8" rx="1.6" fill="#dfe3e9"/>`;
    });
    if(c%6!==5){
      s+=`<circle cx="${x}" cy="${RAIL.vTop}" r="3.2" fill="#dfe3e9"/><circle cx="${x}" cy="${RAIL.gTop}" r="3.2" fill="#dfe3e9"/>`;
      s+=`<circle cx="${x}" cy="${RAIL.vBot}" r="3.2" fill="#dfe3e9"/><circle cx="${x}" cy="${RAIL.gBot}" r="3.2" fill="#dfe3e9"/>`;
    }
  }
  return s;
}

function ledPart(p, col){
  const xa=holeX(col+2), xc=holeX(col+3);
  return `<g class="part-led" data-pin="${p.pin}">
    <path d="M${xa} ${ROW.e} V ${ROW.c-4}" stroke="#b0b6bf" stroke-width="2.6"/>
    <path d="M${xc} ${ROW.e} V ${ROW.c+2}" stroke="#b0b6bf" stroke-width="2.6"/>
    <path d="M${xa-1} ${ROW.c-2} h${xc-xa+2} v-16 a${(xc-xa+2)/2} 18 0 0 0 -${xc-xa+2} 0 Z"
          class="ledbody" data-pin="${p.pin}" fill="#d9dde3" stroke="#b0b6bf" stroke-width="1.5"/>
    <text x="${(xa+xc)/2}" y="${ROW.e+20}" text-anchor="middle" font-family="Roboto Mono,monospace"
          font-size="11" fill="#5f6368">${p.label}</text>
  </g>`;
}
/* resistor lying flat across two columns, in series with the pin */
function resistorPart(col){
  const x1=holeX(col), x2=holeX(col+2), y=ROW.c;
  return `<g>
    <path d="M${x1} ${y} H ${x2}" stroke="#b0b6bf" stroke-width="2.4"/>
    <rect x="${(x1+x2)/2-21}" y="${y-10}" width="42" height="20" rx="9" fill="#e8d5b0" stroke="#c9b48c"/>
    <rect x="${(x1+x2)/2-11}" y="${y-10}" width="5" height="20" fill="#8d6e63"/>
    <rect x="${(x1+x2)/2-2}" y="${y-10}" width="5" height="20" fill="#e53935"/>
    <rect x="${(x1+x2)/2+7}" y="${y-10}" width="5" height="20" fill="#fdd835"/>
  </g>`;
}
function buttonPart(col){
  const x=holeX(col);
  return `<g id="btnGroup" style="cursor:pointer">
    <rect x="${x-8}" y="${ROW.d-8}" width="${BB.colW*3+16}" height="${ROW.g-ROW.d+16}" rx="5" fill="#2b2f36"/>
    <circle id="btnCap" cx="${x+BB.colW*1.5}" cy="${(ROW.d+ROW.g)/2}" r="19" fill="#e34a3f" stroke="#b93a30" stroke-width="2"/>
    <text x="${x+BB.colW*1.5}" y="${ROW.j+22}" text-anchor="middle" font-family="Roboto Mono,monospace" font-size="11" fill="#5f6368">BUTTON D2</text>
  </g>`;
}
function potPart(col){
  const x=holeX(col);
  return `<g id="potGroup" style="cursor:grab">
    <rect x="${x-16}" y="${ROW.c-8}" width="62" height="56" rx="7" fill="#1f6fd0"/>
    <circle cx="${x+14}" cy="${ROW.c+20}" r="21" fill="#e8eaed" stroke="#b8bec7" stroke-width="2"/>
    <line id="potNeedle" x1="${x+14}" y1="${ROW.c+20}" x2="${x+14}" y2="${ROW.c+3}" stroke="#202124" stroke-width="3.4" stroke-linecap="round"/>
    <text x="${x+12}" y="${ROW.j+22}" text-anchor="middle" font-family="Roboto Mono,monospace" font-size="11" fill="#5f6368">KNOB A0</text>
  </g>`;
}
function servoPart(){
  return `<g id="servoGroup" transform="translate(520,478)">
    <rect x="0" y="14" width="120" height="82" rx="8" fill="#2b6fd6" stroke="#1e56ab" stroke-width="2"/>
    <rect x="14" y="0" width="92" height="20" rx="4" fill="#2b6fd6" stroke="#1e56ab" stroke-width="2"/>
    <circle cx="84" cy="18" r="20" fill="#e8eaed" stroke="#b8bec7" stroke-width="2"/>
    <g id="servoHorn" transform="rotate(0 84 18)">
      <rect x="80" y="-26" width="8" height="44" rx="4" fill="#f1f3f4" stroke="#b8bec7"/>
      <circle cx="84" cy="-24" r="6" fill="#f1f3f4" stroke="#b8bec7"/>
    </g>
    <circle cx="84" cy="18" r="5" fill="#5f6368"/>
    <text x="46" y="64" text-anchor="middle" font-family="Roboto Mono,monospace" font-size="11" fill="#fff">SG90</text>
    <text id="servoDeg" x="130" y="22" font-family="Roboto Mono,monospace" font-size="13" fill="#1a73e8">90°</text>
    <text x="60" y="118" text-anchor="middle" font-family="Roboto Mono,monospace" font-size="11" fill="#5f6368">SERVO</text>
  </g>`;
}
function buzzerPart(){
  return `<g id="bzGroup" transform="translate(760,470)">
    <ellipse cx="46" cy="52" rx="42" ry="14" fill="#15181c"/>
    <rect x="4" y="18" width="84" height="36" fill="#1b1f24"/>
    <ellipse cx="46" cy="18" rx="42" ry="14" fill="#23282f"/>
    <circle cx="46" cy="18" r="7" fill="#0d0f12"/>
    <g id="bzWaves" opacity="0">
      <path d="M100 4 a26 26 0 0 1 0 30" fill="none" stroke="#f9ab00" stroke-width="3"/>
      <path d="M112 -6 a38 38 0 0 1 0 50" fill="none" stroke="#f9ab00" stroke-width="3" opacity=".55"/>
    </g>
    <text x="46" y="88" text-anchor="middle" font-family="Roboto Mono,monospace" font-size="11" fill="#5f6368">BUZZER D12</text>
  </g>`;
}

function jumper(pinName, tx, ty, colour, dataPin){
  const p = UNO.pin(pinName);
  const sx = 10 + p.x*0.62, sy = 30 + p.y*0.62;
  const up = p.side === 'top';
  const my = up ? Math.min(sy, ty) - 38 : Math.max(sy, ty) + 30;
  return `<path class="wire" ${dataPin?`data-pin="${dataPin}"`:''}
    data-base="${colour}"
    d="M${sx} ${sy} C ${sx} ${my}, ${tx} ${my}, ${tx} ${ty}"
    fill="none" stroke="${colour}" stroke-width="3.4" stroke-linecap="round"/>`;
}

function benchSVG(){
  return `
<svg viewBox="0 0 1160 640" id="benchSvg">
  <g transform="translate(10,30) scale(0.62)">${UNO.board({id:'wbuno'})}</g>
  <rect x="${BB.x}" y="${BB.y}" width="${BB.w}" height="${BB.h+66}" rx="12" fill="#fafbfc" stroke="#d3d8df" stroke-width="2"/>
  <line x1="${BB.x+12}" y1="88" x2="${BB.x+BB.w-12}" y2="88" stroke="#e53935" stroke-width="1.8"/>
  <line x1="${BB.x+12}" y1="136" x2="${BB.x+BB.w-12}" y2="136" stroke="#1e88e5" stroke-width="1.8"/>
  <line x1="${BB.x+12}" y1="380" x2="${BB.x+BB.w-12}" y2="380" stroke="#e53935" stroke-width="1.8"/>
  <line x1="${BB.x+12}" y1="424" x2="${BB.x+BB.w-12}" y2="424" stroke="#1e88e5" stroke-width="1.8"/>
  <text x="${BB.x+4}" y="92" font-size="13" fill="#e53935" text-anchor="end">+</text>
  <text x="${BB.x+4}" y="140" font-size="13" fill="#1e88e5" text-anchor="end">&#8722;</text>
  <rect x="${BB.x+12}" y="256" width="${BB.w-24}" height="22" rx="4" fill="#e9edf3"/>
  ${bbHoles()}
  <g id="ledGroup"></g>
  <g id="bbParts"></g>
  ${servoPart()}
  ${buzzerPart()}
  <g id="wires"></g>
</svg>`;
}

/* ---------- one workbench instance ---------- */
class Workbench{
  constructor(slide, task){
    this.slide=slide; this.task=task;
    this.board=new ArduinoSim.Board();
    this.build();
    this.runner=new ArduinoSim.Runner(this.board, this.io());
    this.setCode(task.code);
    this.paintStatic();
    this.render();
  }

  build(){
    const t=this.task;
    this.slide.innerHTML=`
      <div class="chapter"><span class="cdot"></span>Writing code</div>
      <h2>${t.title}</h2>
      <div class="wb">
        <div class="wb-left">
          <div class="ide grow">
            <div class="ide-title">
              <span class="dots"><i></i><i></i><i></i></span>
              <span class="ide-name">Arduino IDE</span>
              <span class="sp"></span>
              <span class="ide-board">Arduino UNO on COM3</span>
            </div>
            <div class="ide-tools">
              <button class="itool verify" title="Verify (compile only)">&#10003;<span>Verify</span></button>
              <button class="itool upload" title="Upload and run">&#8594;<span>Upload</span></button>
              <button class="itool stop" title="Stop">&#9632;<span>Stop</span></button>
              <span class="sp"></span>
              <span class="wb-state">ready</span>
              <button class="itool ghost reset" title="Restore the starting sketch">Reset</button>
            </div>
            <div class="ide-tabs"><span class="tab-file on">sketch.ino</span><span class="tab-file">Servo.h</span></div>
            <div class="ide-edit">
              <div class="gutter"></div>
              <div class="wb-edit" contenteditable="plaintext-only" spellcheck="false"></div>
            </div>
            <div class="ide-status"><span class="mono">ATmega328P</span><span class="sp"></span><span class="mono lncol">Ln 1, Col 1</span></div>
          </div>
          <div class="ide">
            <div class="ide-tabs con">
              <span class="tab-file on">Serial Monitor</span>
              <span class="tab-file">Output</span>
              <span class="sp"></span>
              <span class="mono baud">9600 baud</span>
              <button class="itool ghost clearcon" title="Clear">Clear</button>
            </div>
            <div class="wb-console"></div>
            <div class="wb-serial">
              <input placeholder="message to the board, then press enter">
              <button class="btn sm send">Send</button>
            </div>
          </div>
        </div>
        <div class="wb-right">
          <div class="wb-panel grow"><div class="wb-sim">${benchSVG()}</div></div>
          <div class="wb-wiring">
            <div class="cap" style="margin-bottom:8px">Wiring on the bench</div>
            <div class="wire-rows">${(t.wiring||[]).map(x=>`
              <div class="wire-row">
                <span class="wire-dot" style="background:${x.c}"></span>
                <span class="wire-path"><b>${x.from}</b><i>&rarr;</i>${x.to}</span>
                <span class="wire-why">${x.why}</span>
              </div>`).join('')}</div>
          </div>
          <div class="wb-goal">
            <h4>${t.goalTitle}</h4>
            <p>${t.goal}</p>
            <div class="wb-hint">${t.hint||''}</div>
          </div>
        </div>
      </div>`;
    const q = s => this.slide.querySelector(s);
    this.ed=q('.wb-edit'); this.con=q('.wb-console'); this.state=q('.wb-state');
    this.goal=q('.wb-goal'); this.svg=q('#benchSvg'); this.input=q('.wb-serial input');

    this.gutter=q('.gutter'); this.lncol=q('.lncol');
    q('.upload').onclick=()=>this.run();
    q('.verify').onclick=()=>this.verify();
    q('.stop').onclick=()=>{ this.runner.stop(); this.log('sys','stopped'); };
    q('.reset').onclick=()=>{ this.setCode(this.task.code); this.log('sys','sketch restored'); };
    q('.clearcon').onclick=()=>{ this.con.innerHTML=''; };
    q('.send').onclick=()=>this.send();
    this.input.onkeydown=e=>{ if(e.key==='Enter'){ e.preventDefault(); e.stopPropagation(); this.send(); } };

    this.ed.addEventListener('input', ()=>this.reflow());
    this.ed.addEventListener('keyup', ()=>this.caretUpdate());
    this.ed.addEventListener('click', ()=>this.caretUpdate());
    this.ed.addEventListener('keydown', e=>{
      e.stopPropagation();
      if(e.key==='Tab'){ e.preventDefault(); document.execCommand('insertText', false, '  '); }
    });
    this.ed.addEventListener('mouseover', e=>{
      const tok=e.target.closest('.tok[data-tip]');
      if(tok) this.showTip(tok);
    });
    this.ed.addEventListener('mouseout', e=>{ if(e.target.closest('.tok[data-tip]')) this.hideTip(); });

    // knob and button
    let drag=false;
    const press=v=>{ this.board.button.pressed=v;
      const cap=this.svg.querySelector('#btnCap'); if(cap) cap.setAttribute('fill', v?'#a3271f':'#e34a3f'); };
    this.svg.addEventListener('mousedown', e=>{
      if(e.target.closest('#btnGroup')) press(true);
      if(e.target.closest('#potGroup')){ drag=true; this.potFromEvent(e); }
    });
    addEventListener('mouseup', ()=>{ press(false); drag=false; });
    addEventListener('mousemove', e=>{ if(drag) this.potFromEvent(e); });
    this.svg.addEventListener('wheel', e=>{
      if(!e.target.closest('#potGroup')) return;
      e.preventDefault();
      this.board.pot.value=Math.max(0,Math.min(1023,this.board.pot.value - Math.sign(e.deltaY)*40));
      this.render(); }, {passive:false});
  }

  potFromEvent(e){
    const m=this.svg.getScreenCTM(); if(!m) return;
    const pt=this.svg.createSVGPoint(); pt.x=e.clientX; pt.y=e.clientY;
    const q=pt.matrixTransform(m.inverse());
    const cx=holeX((this.cols&&this.cols.pot)||1)+14, cy=ROW.c+20;
    let a=Math.atan2(q.y-cy, q.x-cx)*180/Math.PI + 90;
    if(a<-180) a+=360;
    const v=Math.round((Math.max(-135,Math.min(135,a))+135)/270*1023);
    this.board.pot.value=v; this.render();
  }

  /* ---- editor ---- */
  setCode(src){ this.code=src; this.ed.innerHTML=highlight(src); this.gutterUpdate(); }
  reflow(){
    const off=caretOffset(this.ed);
    this.code=this.ed.textContent;
    this.ed.innerHTML=highlight(this.code);
    if(off!=null) setCaret(this.ed, off);
    this.gutterUpdate();
    this.caretUpdate();
  }
  gutterUpdate(){
    const n=this.code.split('\n').length;
    this.gutter.innerHTML=[...Array(n)].map((_,i)=>`<span>${i+1}</span>`).join('');
  }
  caretUpdate(){
    const off=caretOffset(this.ed); if(off==null) return;
    const upto=this.code.slice(0,off).split('\n');
    this.lncol.textContent=`Ln ${upto.length}, Col ${upto[upto.length-1].length+1}`;
  }
  verify(){
    this.state.classList.remove('err');
    try{
      ArduinoSim.parse(this.code);
      this.state.textContent='compiles';
      this.log('sys','Sketch compiles. '+(this.code.length*3+380)+' bytes of program storage.');
    }catch(e){
      this.state.textContent='error'; this.state.classList.add('err');
      this.log('err', (e.line?`line ${e.line}: `:'')+e.message);
    }
  }

  showTip(tok){
    const [sig, text]=TIPS[tok.dataset.tip]||[];
    if(!text) return;
    if(!this.tip){ this.tip=el('div','tip'); document.body.appendChild(this.tip); }
    this.tip.innerHTML=`<span class="sig">${sig}</span>${text}`;
    const r=tok.getBoundingClientRect();
    this.tip.style.left=Math.min(innerWidth-310, r.left)+'px';
    this.tip.style.top=(r.bottom+9)+'px';
    this.tip.classList.add('on');
  }
  hideTip(){ if(this.tip) this.tip.classList.remove('on'); }

  /* ---- console ---- */
  log(cls, text){
    const line=el('div',cls,String(text).replace(/</g,'&lt;'));
    this.con.appendChild(line); this.con.scrollTop=this.con.scrollHeight;
    while(this.con.children.length>300) this.con.firstChild.remove();
  }
  send(){
    const v=this.input.value; if(!v) return;
    this.board.serial.rx.push(...v.split(''));
    this.log('in','> '+v);
    this.input.value='';
  }

  io(){
    const self=this;
    let partial='';
    return {
      clear(){ self.con.innerHTML=''; },
      print(text, nl){
        partial+=text;
        if(nl){ self.log('out', partial); partial=''; }
        else if(partial.length>120){ self.log('out', partial); partial=''; }
      },
      serialOpen(baud){ self.slide.querySelector('.baud').textContent=baud+' baud'; self.log('sys','serial open at '+baud); },
      status(s){ self.state.textContent=s; },
      running(on){
        self.state.classList.toggle('run', on);
        if(!on && !self.state.classList.contains('err')) self.state.textContent='stopped';
      },
      error(msg, line){
        self.state.textContent='error'; self.state.classList.add('err'); self.state.classList.remove('run');
        self.log('err', line ? `line ${line}: ${msg}` : msg);
      },
      warn(msg, line){ self.log('warn', `heads up, line ${line}: ${msg}`); },
      tone(freq){ self.tone(freq); },
      changed(){ self.dirty=true; },
      frame(){ self.render(); self.check(); }
    };
  }

  /* ---- sound ---- */
  tone(freq){
    if(!freq){ if(this.osc){ this.osc.stop(); this.osc=null; } return; }
    try{
      this.actx=this.actx||new (window.AudioContext||window.webkitAudioContext)();
      if(!this.osc){
        this.osc=this.actx.createOscillator(); this.gain=this.actx.createGain();
        this.gain.gain.value=.06; this.osc.type='square';
        this.osc.connect(this.gain).connect(this.actx.destination); this.osc.start();
      }
      this.osc.frequency.value=freq;
    }catch(e){}
  }

  /* ---- drawing ---- */
  paintStatic(){
    if(this.task.view) this.svg.setAttribute('viewBox', this.task.view);
    const uses=this.task.parts||[], leds=this.task.leds||[];
    const g=this.svg.querySelector('#ledGroup'), bp=this.svg.querySelector('#bbParts'), wr=this.svg.querySelector('#wires');
    g.innerHTML=''; bp.innerHTML=''; wr.innerHTML='';

    this.svg.querySelector('#servoGroup').style.display = uses.includes('servo') ? '' : 'none';
    this.svg.querySelector('#bzGroup').style.display    = uses.includes('buzzer') ? '' : 'none';

    let wires='', col=1;
    this.cols={};
    if(leds.length) wires += jumper('GND_A', holeX(0), RAIL.gTop, '#3c4043');
    PARTS.leds.filter(p=>leds.includes(+p.pin)).forEach(p=>{
      const c=col; col+=5;
      this.cols['led'+p.pin]=c;
      g.insertAdjacentHTML('beforeend', ledPart(p, c));
      bp.insertAdjacentHTML('beforeend', resistorPart(c));
      wires += jumper(p.pin, holeX(c), ROW.a, '#f9ab00', p.pin);
      wires += `<path class="railwire" d="M${holeX(c+3)} ${ROW.a} V ${RAIL.gTop}"
                 stroke="#3c4043" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    });

    if(uses.includes('button')){
      const c=col; col+=6; this.cols.button=c;
      const x=holeX(c);
      bp.insertAdjacentHTML('beforeend', buttonPart(c));
      wires += jumper('5V', x, ROW.b, '#ea4335');
      wires += jumper('2',  x+BB.colW*3, ROW.b, '#4285f4', '2');
      wires += jumper('GND_A', x+BB.colW*3, ROW.i, '#5f6368');
    }
    if(uses.includes('pot')){
      const c=col; col+=6; this.cols.pot=c;
      const x=holeX(c);
      bp.insertAdjacentHTML('beforeend', potPart(c));
      wires += jumper('5V', x-6, ROW.f, '#ea4335');
      wires += jumper('A0', x+12, ROW.f, '#8430ce', 'pot');
      wires += jumper('GND_A', x+30, ROW.f, '#5f6368');
    }
    if(uses.includes('servo')){
      wires += jumper('6', 596, 470, '#f9ab00', '6');
      wires += jumper('5V', 566, 470, '#ea4335');
      wires += jumper('GND_A', 626, 470, '#5f6368');
    }
    if(uses.includes('buzzer')){
      wires += jumper('12', 786, 464, '#8430ce', '12');
      wires += jumper('GND_A', 826, 464, '#5f6368');
    }
    wr.innerHTML = wires;
  }

  render(){
    const B=this.board;
    this.svg.querySelectorAll('.ledbody').forEach(c=>{
      const pin=+c.dataset.pin, p=B.pins[pin];
      const conf=PARTS.leds.find(l=>+l.pin===pin);
      let level = p.pwm!=null ? p.pwm/255 : (p.value?1:0);
      if(p.mode!=='output') level=0;
      c.setAttribute('fill', level>0.02 ? conf.c : '#d9dde3');
      c.setAttribute('opacity', level>0.02 ? (0.4+0.6*level).toFixed(2) : 1);
      c.style.filter = level>0.02 ? `drop-shadow(0 0 ${5+11*level}px ${conf.c})` : 'none';
    });
    this.svg.querySelectorAll('.wire[data-pin]').forEach(w=>{
      const k=w.dataset.pin;
      if(k==='pot'){ return; }
      const p=B.pins[+k];
      const live = p && p.mode==='output' && (p.pwm!=null ? p.pwm>4 : p.value===1);
      w.setAttribute('stroke', w.dataset.base || '#c8ccd2');
      w.setAttribute('opacity', live ? 1 : .45);
      w.setAttribute('stroke-width', live ? 4.4 : 3.2);
      w.style.filter = live ? `drop-shadow(0 0 5px ${w.dataset.base})` : 'none';
    });
    const l13=B.pins[13], l13el=this.svg.querySelector('#wbuno-l13');
    if(l13el) l13el.setAttribute('fill', l13.mode==='output'&&l13.value ? '#f9ab00' : '#3a3f45');
    const horn=this.svg.querySelector('#servoHorn');
    if(horn) horn.setAttribute('transform', `rotate(${B.servo.angle-90} 84 18)`);
    const deg=this.svg.querySelector('#servoDeg'); if(deg) deg.textContent=B.servo.angle+'°';
    const needle=this.svg.querySelector('#potNeedle');
    if(needle && this.cols && this.cols.pot!=null)
      needle.setAttribute('transform', `rotate(${(B.pot.value/1023)*270-135} ${holeX(this.cols.pot)+14} ${ROW.c+20})`);
    const bz=this.svg.querySelector('#bzWaves'); if(bz) bz.setAttribute('opacity', B.buzzer.freq>0 ? 1 : 0);
  }

  /* ---- did they hit the goal ---- */
  check(){
    if(!this.task.pass || this.passed) return;
    this.hist=this.hist||[];
    this.hist.push(this.snapshot());
    if(this.hist.length>600) this.hist.shift();
    if(this.task.pass(this.hist, this.board)){
      this.passed=true;
      this.goal.classList.add('done');
      this.goal.querySelector('h4').textContent='Done. '+this.task.doneTitle;
      this.goal.querySelector('p').textContent=this.task.done;
      Deck.toast('That works');
    }
  }
  snapshot(){
    const B=this.board;
    return {t:performance.now(), pins:B.pins.map(p=>p.pwm!=null?p.pwm:(p.mode==='output'?p.value*255:-1)),
      servo:B.servo.angle, serial:this.con.querySelectorAll('.out').length};
  }

  run(){
    this.passed=false; this.hist=[];
    this.goal.classList.remove('done');
    this.state.classList.remove('err');
    this.goal.querySelector('h4').textContent=this.task.goalTitle;
    this.goal.querySelector('p').innerHTML=this.task.goal;
    this.runner.start(this.code);
  }
  stop(){ this.runner.stop(); this.tone(0); }
}

/* ---------- the seven exercises ---------- */
const TASKS = {
blink:{
  view:'0 20 1120 420',
  parts:[], leds:[9],
  wiring:[{c:'#f9ab00',from:'D9',to:'220 &#8486; resistor &#8594; LED long leg',why:'the resistor keeps the current near 15 mA so the LED survives'},
          {c:'#5f6368',from:'LED short leg',to:'GND',why:'current needs a way back, or nothing flows'}],
  title:'Make a light blink',
  goalTitle:'Your turn',
  goal:'Press Upload. The red LED on pin 9 should blink once a second. Then change both delays to 100 and run it again.',
  hint:'<b>Hover any word in the code</b> to see what it does.',
  doneTitle:'It blinks.',
  done:'That is the whole idea of an output pin. You set it high, you wait, you set it low.',
  code:`void setup() {
  pinMode(9, OUTPUT);
}

void loop() {
  digitalWrite(9, HIGH);
  delay(500);
  digitalWrite(9, LOW);
  delay(500);
}`,
  pass(h){ let changes=0; for(let i=1;i<h.length;i++) if((h[i].pins[9]>0)!==(h[i-1].pins[9]>0)) changes++; return changes>=4; }
},

leds:{
  view:'0 20 1120 420',
  parts:['buzzer'], leds:[9,10,11,8],
  wiring:[{c:'#f9ab00',from:'D9 D10 D11 D8',to:'220 &#8486; each &#8594; LED long leg',why:'one pin per LED, so the code can drive them separately'},
          {c:'#5f6368',from:'all LED short legs',to:'GND rail',why:'they can share one ground wire back to the board'},
          {c:'#8430ce',from:'D12',to:'buzzer +',why:'tone() switches this pin fast enough to make a note'}],
  title:'Four lights, one loop',
  goalTitle:'Your turn',
  goal:'Press Upload to see the chase. Then make it run backwards, or add the buzzer with tone(12, 1200).',
  hint:'An array holds the four pin numbers. <b>for</b> walks through them.',
  doneTitle:'All four ran.',
  done:'A for loop saves you writing the same four lines four times.',
  code:`int leds[] = {9, 10, 11, 8};

void setup() {
  for (int i = 0; i < 4; i++) {
    pinMode(leds[i], OUTPUT);
  }
}

void loop() {
  for (int i = 0; i < 4; i++) {
    digitalWrite(leds[i], HIGH);
    delay(120);
    digitalWrite(leds[i], LOW);
  }
}`,
  pass(h){ return [9,10,11,8].every(p=>h.some(s=>s.pins[p]>0)); }
},

button:{
  view:'0 20 1120 420',
  parts:['button'], leds:[11],
  wiring:[{c:'#1a73e8',from:'5V',to:'one side of the button',why:'this is the voltage the pin will see when you press'},
          {c:'#1a73e8',from:'other side',to:'D2',why:'pressing connects 5 V through to the pin'},
          {c:'#5f6368',from:'D2',to:'10k &#8486; &#8594; GND',why:'pull-down resistor: without it the pin floats and reads noise'},
          {c:'#f9ab00',from:'D11',to:'220 &#8486; &#8594; LED &#8594; GND',why:'the output you are controlling'}],
  title:'Make a decision',
  goalTitle:'Your turn',
  goal:'Press Upload, then hold the red button on the board. The green LED follows your finger. Now swap it so the light is on until you press.',
  hint:'<b>if</b> asks a question. <b>else</b> covers everything else.',
  doneTitle:'You read an input.',
  done:'Sense, decide, act. That is a robot in three lines.',
  code:`void setup() {
  pinMode(2, INPUT);
  pinMode(11, OUTPUT);
}

void loop() {
  if (digitalRead(2) == HIGH) {
    digitalWrite(11, HIGH);
  } else {
    digitalWrite(11, LOW);
  }
}`,
  pass(h){ return h.some(s=>s.pins[11]>0) && h.some(s=>s.pins[11]<=0); }
},

serial:{
  view:'0 20 1120 420',
  parts:[], leds:[9],
  wiring:[{c:'#1a73e8',from:'USB cable',to:'your computer',why:'the same cable that powers the board carries the serial text'},
          {c:'#f9ab00',from:'D9',to:'220 &#8486; &#8594; LED &#8594; GND',why:'so you can see the command take effect'}],
  title:'Make the board talk',
  goalTitle:'Your turn',
  goal:'Press Upload and watch the console. Then type <b>1</b> or <b>0</b> in the box below the console and press enter.',
  hint:'Serial is the only window into what the chip is thinking.',
  doneTitle:'Two way traffic.',
  done:'You can now print values when something goes wrong, which is most of debugging.',
  code:`void setup() {
  Serial.begin(9600);
  pinMode(9, OUTPUT);
  Serial.println("board is awake");
}

void loop() {
  if (Serial.available() > 0) {
    char c = Serial.read();
    if (c == '1') {
      digitalWrite(9, HIGH);
      Serial.println("light on");
    }
    if (c == '0') {
      digitalWrite(9, LOW);
      Serial.println("light off");
    }
  }
}`,
  pass(h){ return h.length>4 && h[h.length-1].serial>=2; }
},

pot:{
  view:'0 20 1120 420',
  parts:['pot'], leds:[],
  wiring:[{c:'#ea4335',from:'5V',to:'knob outer leg 1',why:'the top of the range'},
          {c:'#5f6368',from:'GND',to:'knob outer leg 2',why:'the bottom of the range'},
          {c:'#8430ce',from:'knob middle leg',to:'A0',why:'the wiper taps off any voltage between 0 and 5 V'}],
  title:'Read the knob',
  goalTitle:'Your turn',
  goal:'Press Upload, then drag the knob on the board. Watch the number in the console change between 0 and 1023.',
  hint:'0 V reads 0. 5 V reads 1023. Everything in between is a fraction of 5 V.',
  doneTitle:'You measured a voltage.',
  done:'Every analog sensor you ever use works exactly like this.',
  code:`void setup() {
  Serial.begin(9600);
}

void loop() {
  int value = analogRead(A0);
  Serial.print("knob = ");
  Serial.println(value);
  delay(200);
}`,
  pass(h){ return h.length>10 && h[h.length-1].serial>=6; }
},

pwm:{
  view:'0 20 1120 420',
  parts:['pot'], leds:[10],
  wiring:[{c:'#8430ce',from:'knob middle leg',to:'A0',why:'the input you are reading'},
          {c:'#f9ab00',from:'D10 (marked ~)',to:'220 &#8486; &#8594; LED &#8594; GND',why:'only a ~ pin can switch fast enough to fake a brightness'}],
  title:'Dim a light with a knob',
  goalTitle:'Your turn',
  goal:'Press Upload, then turn the knob. The yellow LED fades instead of switching. Then change map() so the LED gets brighter as you turn the other way.',
  hint:'analogRead gives 0 to 1023. analogWrite wants 0 to 255. <b>map</b> converts between them.',
  doneTitle:'You made an analog output.',
  done:'The pin is still only ever on or off. It just switches faster than you can see.',
  code:`void setup() {
  pinMode(10, OUTPUT);
}

void loop() {
  int knob = analogRead(A0);
  int level = map(knob, 0, 1023, 0, 255);
  analogWrite(10, level);
}`,
  pass(h){ const v=h.map(s=>s.pins[10]).filter(x=>x>=0); return v.length>20 && Math.max(...v)-Math.min(...v)>60; }
},

servo:{
  view:'0 20 1120 600',
  parts:['servo','pot'], leds:[],
  wiring:[{c:'#f9ab00',from:'servo orange wire',to:'D6',why:'the signal line, a pulse every 20 ms tells it the angle'},
          {c:'#ea4335',from:'servo red wire',to:'5V (or its own supply)',why:'a servo under load pulls more than the board can give'},
          {c:'#5f6368',from:'servo brown wire',to:'GND',why:'if you use a separate supply, its ground must join this one too'}],
  title:'Move something in the real world',
  goalTitle:'Your turn',
  goal:'Press Upload and the arm sweeps. Then delete the loop body and write <b>myServo.write(90);</b> so it holds still. Finally, drive it from the knob.',
  hint:'The library hides the exact microsecond pulses a servo needs. You just say the angle.',
  doneTitle:'You commanded a position.',
  done:'A servo holds that angle against a load. That is what makes arms and grippers possible.',
  code:`#include <Servo.h>

Servo myServo;

void setup() {
  myServo.attach(6);
}

void loop() {
  for (int a = 0; a <= 180; a++) {
    myServo.write(a);
    delay(12);
  }
  for (int a = 180; a >= 0; a--) {
    myServo.write(a);
    delay(12);
  }
}`,
  pass(h){ const a=h.map(s=>s.servo); return a.length>20 && Math.max(...a)-Math.min(...a)>60; }
}
};

/* ---------- register the workbench slides ---------- */
(window.Modules = window.Modules || []).push(function(Deck){
  $$('.wb-slide').forEach(slide=>{
    let wb=null;
    const i=Deck.slides.indexOf(slide);
    Deck.enter(i, ()=>{
      if(!wb) wb=new Workbench(slide, TASKS[slide.dataset.wb]);
      wb.render();
    });
    Deck.leave(i, ()=>{ if(wb){ wb.stop(); wb.hideTip(); } });
  });
});

window.Workbench = Workbench;
window.WB_TIPS = TIPS;
window.WB_TASKS = TASKS;

})();
