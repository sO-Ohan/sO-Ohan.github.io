/* deck.js — navigation, chapter colour, background, presenter tools */

const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const el = (t,c,h) => { const n=document.createElement(t); if(c)n.className=c; if(h!=null)n.innerHTML=h; return n; };
const svgel = (t,attrs={}) => { const n=document.createElementNS('http://www.w3.org/2000/svg',t);
  for(const k in attrs) n.setAttribute(k, attrs[k]); return n; };

const Deck = (function(){
  const slides = $$('.slide');
  let idx = 0, tight = false, booted = false;
  const enterHooks = {}, leaveHooks = {}, timers = [], rafs = [];

  const key = t => typeof t === 'number' ? t : slides.findIndex(s => s.dataset.title === t);

  const api = {
    slides,
    get index(){ return idx; },
    enter(t, fn){ const i=key(t); (enterHooks[i]=enterHooks[i]||[]).push(fn); },
    leave(t, fn){ const i=key(t); (leaveHooks[i]=leaveHooks[i]||[]).push(fn); },
    every(fn, ms){ const id=setInterval(fn, ms); timers.push(id); return id; },
    after(fn, ms){ const id=setTimeout(fn, ms); timers.push(id); return id; },
    loop(fn){                                   // animation frame loop, cleaned up on leave
      if(location.search.includes('nofx')){ fn(); fn(); return; }   // still frame, for screenshots
      let alive=true;
      const step=()=>{ if(!alive) return; fn(); requestAnimationFrame(step); };
      requestAnimationFrame(step);
      rafs.push(()=>{ alive=false; });
    },
    go, toast, accentOf
  };

  /* ---------- accents ---------- */
  const ACCENTS = {
    blue:  ['#1a73e8','#e8f0fe','#174ea6'],
    red:   ['#d93025','#fce8e6','#a50e0e'],
    green: ['#188038','#e6f4ea','#0d652d'],
    yellow:['#e37400','#fef7e0','#8a5300'],
    purple:['#8430ce','#f3e8fd','#5b1a9c'],
    teal:  ['#00897b','#e0f2f1','#00695c']
  };
  function accentOf(name){ return ACCENTS[name] || ACCENTS.blue; }
  function applyAccent(name){
    const [a,soft,deep] = accentOf(name);
    document.documentElement.style.setProperty('--accent', a);
    document.documentElement.style.setProperty('--accent-soft', soft);
    document.documentElement.style.setProperty('--accent-deep', deep);
  }

  /* ---------- background ---------- */
  const bg = $('#bg');
  function paintBg(accent, seed){
    const [a, soft] = accentOf(accent);
    const palette = [a, soft, '#f1f3f4', a];
    bg.innerHTML = '';
    const rnd = mulberry(seed*7919 + 13);
    const kinds = ['circle','square','triangle','pill','ring','arc','dots'];
    const n = 8;
    for(let i=0;i<n;i++){
      const size = 90 + rnd()*230;
      const band = rnd();
      const x = band<0.5 ? -4 + rnd()*15 : 84 + rnd()*18;   // left or right margin only
      const y = -6 + rnd()*104;
      const col = palette[i % palette.length];
      const op = i%3===0 ? .22 : .13;
      const kind = kinds[Math.floor(rnd()*kinds.length)];
      const d = el('div','sh');
      d.style.cssText = `left:${x}%;top:${y}%;width:${size}px;height:${size}px;
        animation:drift${(i%3)+1} ${26+rnd()*22}s ease-in-out ${-rnd()*20}s infinite;`;
      let inner='';
      if(kind==='circle') inner = `<div style="width:100%;height:100%;border-radius:50%;background:${col};opacity:${op}"></div>`;
      if(kind==='square') inner = `<div style="width:100%;height:100%;border-radius:${size*.22}px;background:${col};opacity:${op}"></div>`;
      if(kind==='pill')   inner = `<div style="width:100%;height:${size*.42}px;border-radius:999px;background:${col};opacity:${op}"></div>`;
      if(kind==='ring')   inner = `<div style="width:100%;height:100%;border-radius:50%;border:${Math.max(6,size*.09)}px solid ${col};opacity:${op}"></div>`;
      if(kind==='triangle') inner = `<svg viewBox="0 0 100 100" style="width:100%;height:100%;opacity:${op}"><polygon points="50,6 94,92 6,92" fill="${col}"/></svg>`;
      if(kind==='arc') inner = `<svg viewBox="0 0 100 100" style="width:100%;height:100%;opacity:${op}"><path d="M4 96 A92 92 0 0 1 96 4 L96 96 Z" fill="${col}"/></svg>`;
      if(kind==='dots') inner = `<svg viewBox="0 0 100 100" style="width:100%;height:100%;opacity:${op}">${[0,1,2,3].map(r=>[0,1,2,3].map(cc=>`<circle cx="${12+cc*25}" cy="${12+r*25}" r="5" fill="${col}"/>`).join('')).join('')}</svg>`;
      d.innerHTML = inner;
      bg.appendChild(d);
    }
    requestAnimationFrame(()=>bg.classList.add('ready'));
  }
  function mulberry(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }

  /* ---------- navigation ---------- */
  function clearTimersAndLoops(){
    while(timers.length) { const id=timers.pop(); clearInterval(id); clearTimeout(id); }
    while(rafs.length) rafs.pop()();
  }

  function go(i){
    i = Math.max(0, Math.min(slides.length-1, i));
    if(tight && slides[i].dataset.opt){
      const dir = i >= idx ? 1 : -1;
      let j=i; while(j>0 && j<slides.length-1 && slides[j].dataset.opt) j+=dir;
      i=j;
    }
    if(booted && i===idx) return;
    (leaveHooks[idx]||[]).forEach(f=>f());
    clearTimersAndLoops();
    slides[idx] && slides[idx].classList.remove('active');
    const prevCh = slides[idx] && slides[idx].dataset.ch;
    const changingChapter = booted && slides[i].dataset.ch !== prevCh;
    idx = i; booted = true;
    const s = slides[idx];
    applyAccent(s.dataset.accent);
    if(s.dataset.ch !== prevCh || !bg.children.length) paintBg(s.dataset.accent, idx);
    if(changingChapter) wipe(s.dataset.accent);
    paintDots();
    s.classList.add('active');
    $('#bar').style.width = (idx/(slides.length-1)*100)+'%';
    $('#cur').textContent = idx+1;
    $('#hudTitle').textContent = s.dataset.title || '';
    history.replaceState(null,'','#'+(idx+1));
    (enterHooks[idx]||[]).forEach(f=>f());
  }

  function wipe(accent){
    const [a] = accentOf(accent);
    const w = el('div','wipe');
    w.style.background = a;
    document.body.appendChild(w);
    w.addEventListener('animationend', ()=>w.remove());
  }

  function paintDots(){
    const host = $('#chDots'); if(!host) return;
    const chapters = [...new Set(slides.map(s=>s.dataset.ch))];
    const here = slides[idx].dataset.ch;
    host.innerHTML = chapters.map(ch=>{
      const list = slides.filter(s=>s.dataset.ch===ch);
      const done = list.every(s=>slides.indexOf(s) < idx);
      const on = ch===here;
      return `<span class="chdot${on?' on':''}${done?' done':''}" title="${ch}">
        ${on?`<b>${ch}</b>`:''}</span>`;
    }).join('');
  }

  /* ---------- chrome ---------- */
  function fit(){
    const k = Math.min((innerWidth-40)/1280, (innerHeight-72)/720);
    $('#stage').style.transform = `scale(${k})`;
  }

  let toastT;
  function toast(msg){
    let t = $('.toast');
    if(!t){ t = el('div','toast'); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('on');
    clearTimeout(toastT); toastT = setTimeout(()=>t.classList.remove('on'), 1900);
  }

  function buildOverview(){
    const g = $('#ovGrid'); let lastCh='';
    slides.forEach((s,i)=>{
      if(s.dataset.ch !== lastCh){
        lastCh = s.dataset.ch;
        const h = el('div','ov chapterhead', `<div class="i">chapter</div><div class="t">${lastCh}</div>`);
        h.style.gridColumn='1 / -1'; h.style.cursor='default';
        g.appendChild(h);
      }
      const c = el('div','ov', `<div class="i">${String(i+1).padStart(2,'0')}</div><div class="t">${s.dataset.title||''}</div>`);
      c.onclick = ()=>{ $('#overview').classList.remove('on'); go(i); };
      g.appendChild(c);
    });
  }

  function brandAndBadges(){
    slides.forEach((s,i)=>{
      if(!s.classList.contains('cover')){
        const b = el('div','brand', `<img src="assets/logo-robu.png" alt="">
          <div class="bt">BRACU RoboU<span>Basics of robotics</span></div>`);
        s.appendChild(b);
      }
      if(s.dataset.opt) s.insertBefore(el('div','optional','Optional'), s.firstChild);
    });
  }

  /* ---------- clock ---------- */
  function clock(){
    const c = $('#clock'); let start=null;
    setInterval(()=>{
      if(start===null) return;
      const t=Math.floor((Date.now()-start)/1000);
      c.textContent = String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0');
      c.classList.toggle('over', t>3600);
    }, 1000);
    c.onclick=()=>{ if(start===null){ start=Date.now(); toast('Clock started'); }
      else { start=null; c.textContent='00:00'; c.classList.remove('over'); toast('Clock reset'); } };
  }

  /* ---------- keys ---------- */
  function keys(){
    addEventListener('keydown', e=>{
      const typing = e.target.matches('input,textarea,[contenteditable="true"]');
      if(typing && e.key!=='Escape') return;
      const k = e.key.toLowerCase();
      if(['arrowright','pagedown',' '].includes(k)){ e.preventDefault(); go(idx+1); }
      else if(['arrowleft','pageup'].includes(k)) go(idx-1);
      else if(k==='home') go(0);
      else if(k==='end') go(slides.length-1);
      else if(k==='o'){ $('#overview').classList.toggle('on'); }
      else if(k==='escape'){ $('#overview').classList.remove('on'); }
      else if(k==='f'){ document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); }
      else if(k==='s'){ tight=!tight; toast(tight ? 'Short version: optional slides are skipped' : 'Full deck'); }
      else if(k==='b'){ document.body.style.visibility = document.body.style.visibility==='hidden' ? '' : 'hidden'; }
    });
    addEventListener('click', e=>{
      if(e.target.closest('button,input,select,a,.tab,.opt,.seg,svg,canvas,[contenteditable],.wb,.card')) return;
      if($('#overview').classList.contains('on')) return;
      if(e.clientX > innerWidth*0.75) go(idx+1);
      else if(e.clientX < innerWidth*0.25) go(idx-1);
    });
    $('#nextBtn').onclick = ()=>go(idx+1);
    $('#prevBtn').onclick = ()=>go(idx-1);
  }

  function boot(){
    $('#tot').textContent = slides.length;
    brandAndBadges(); buildOverview(); keys(); clock(); fit();
    addEventListener('resize', fit);
    if(window.Modules) window.Modules.forEach(fn=>{ try{ fn(api); }catch(err){ console.error('module failed', err); } });
    go(Math.max(0,(parseInt(location.hash.slice(1))||1)-1));
  }

  addEventListener('load', boot);
  return api;
})();

window.Deck = Deck;
