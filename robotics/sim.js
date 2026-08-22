/* ============================================================
   sim.js — a small Arduino C++ interpreter plus a hardware model.
   Runs sketches typed live in the slide. No install, no upload.
   ============================================================ */

/* ---------------- lexer ---------------- */
const KEYWORDS = new Set(['void','int','long','float','double','bool','boolean','char','byte','unsigned','short',
  'if','else','for','while','do','return','break','continue','true','false','const','static','String']);

function lex(src){
  const t=[]; let i=0, line=1;
  const push=(type,value,start)=>t.push({type,value,start,end:i,line});
  while(i<src.length){
    const c=src[i];
    if(c==='\n'){ line++; i++; continue; }
    if(c===' '||c==='\t'||c==='\r'){ i++; continue; }
    if(c==='/'&&src[i+1]==='/'){ const s=i; while(i<src.length&&src[i]!=='\n')i++; push('comment',src.slice(s,i),s); continue; }
    if(c==='/'&&src[i+1]==='*'){ const s=i; i+=2; while(i<src.length&&!(src[i]==='*'&&src[i+1]==='/')){ if(src[i]==='\n')line++; i++; } i+=2; push('comment',src.slice(s,i),s); continue; }
    if(c==='#'){ const s=i; while(i<src.length&&src[i]!=='\n')i++; push('pre',src.slice(s,i),s); continue; }
    if(c==='"'){ const s=i; i++; while(i<src.length&&src[i]!=='"'){ if(src[i]==='\\')i++; i++; } i++; push('string',src.slice(s,i),s); continue; }
    if(c==="'"){ const s=i; i++; while(i<src.length&&src[i]!=="'"){ if(src[i]==='\\')i++; i++; } i++; push('char',src.slice(s,i),s); continue; }
    if(/[0-9]/.test(c)||(c==='.'&&/[0-9]/.test(src[i+1]||''))){
      const s=i; while(i<src.length&&/[0-9a-fA-FxX.]/.test(src[i]))i++; push('number',src.slice(s,i),s); continue; }
    if(/[A-Za-z_]/.test(c)){
      const s=i; while(i<src.length&&/[A-Za-z0-9_]/.test(src[i]))i++;
      const w=src.slice(s,i); push(KEYWORDS.has(w)?'keyword':'ident',w,s); continue; }
    const three=src.substr(i,3), two=src.substr(i,2);
    if(['<<=','>>='].includes(three)){ i+=3; push('op',three,i-3); continue; }
    if(['==','!=','<=','>=','&&','||','++','--','+=','-=','*=','/=','%=','<<','>>'].includes(two)){ i+=2; push('op',two,i-2); continue; }
    i++; push('op',c,i-1);
  }
  t.push({type:'eof',value:'',start:i,end:i,line});
  return t;
}

/* ---------------- parser ---------------- */
const TYPES = new Set(['void','int','long','float','double','bool','boolean','char','byte','unsigned','short','String']);

function parse(src){
  const toks = lex(src).filter(t=>t.type!=='comment'&&t.type!=='pre');
  let p=0;
  const peek=(k=0)=>toks[p+k];
  const at=(v)=>peek().value===v;
  const isType=()=>TYPES.has(peek().value);
  const next=()=>toks[p++];
  function expect(v){
    if(peek().value!==v) throw new SketchError(`expected '${v}' but found '${peek().value||'end of sketch'}'`, peek().line);
    return next();
  }
  function skipType(){
    let name='';
    while(isType()){ name=next().value; }
    while(at('*')||at('&')) next();
    return name;
  }

  function parseProgram(){
    const decls=[];
    while(peek().type!=='eof'){
      if(at(';')){ next(); continue; }
      decls.push(parseTopLevel());
    }
    return {type:'Program', decls};
  }

  function parseTopLevel(){
    const startLine = peek().line;
    if(at('const')||at('static')) next();
    if(isType()||peek().type==='ident'){
      const save=p;
      const typeName = isType()? skipType() : next().value;   // Servo / int / ...
      if(peek().type==='ident'){
        const name=next().value;
        if(at('(')){                                  // function
          next();
          const params=[];
          while(!at(')')){
            if(isType()) skipType(); else next();
            if(peek().type==='ident') params.push(next().value);
            if(at(',')) next();
          }
          expect(')');
          const body=parseBlock();
          return {type:'FuncDecl', name, params, body, line:startLine};
        }
        // variable (possibly array, possibly with init)
        let isArray=false, size=null;
        if(at('[')){ next(); isArray=true; if(!at(']')) size=parseExpr(); expect(']'); }
        let init=null;
        if(at('=')){ next(); init = at('{') ? parseInitList() : parseExpr(); }
        const extra=[];
        while(at(',')){ next(); const n2=next().value; let i2=null;
          if(at('=')){ next(); i2 = at('{') ? parseInitList() : parseExpr(); }
          extra.push({name:n2, init:i2}); }
        if(at(';')) next();
        return {type:'VarDecl', varType:typeName, name, isArray, size, init, extra, line:startLine};
      }
      p=save;
    }
    // fallback: expression statement
    const e=parseExpr(); if(at(';')) next();
    return {type:'ExprStmt', expr:e, line:startLine};
  }

  function parseInitList(){
    expect('{'); const items=[];
    while(!at('}')){ items.push(parseExpr()); if(at(',')) next(); }
    expect('}');
    return {type:'InitList', items};
  }

  function parseBlock(){
    expect('{'); const body=[];
    while(!at('}')&&peek().type!=='eof') body.push(parseStmt());
    expect('}');
    return {type:'Block', body};
  }

  function parseStmt(){
    const line=peek().line;
    if(at('{')) return parseBlock();
    if(at(';')){ next(); return {type:'Empty'}; }
    if(at('if')){
      next(); expect('('); const test=parseExpr(); expect(')');
      const cons=parseStmt();
      let alt=null;
      if(at('else')){ next(); alt=parseStmt(); }
      return {type:'If', test, cons, alt, line};
    }
    if(at('while')){ next(); expect('('); const test=parseExpr(); expect(')'); return {type:'While', test, body:parseStmt(), line}; }
    if(at('do')){ next(); const body=parseStmt(); expect('while'); expect('('); const test=parseExpr(); expect(')'); if(at(';'))next();
      return {type:'DoWhile', body, test, line}; }
    if(at('for')){
      next(); expect('(');
      let init=null;
      if(!at(';')) init = (isType()||at('const')) ? parseLocalDecl() : {type:'ExprStmt', expr:parseExpr()};
      if(at(';')) next();
      const test = at(';') ? null : parseExpr(); expect(';');
      const update = at(')') ? null : parseExpr(); expect(')');
      return {type:'For', init, test, update, body:parseStmt(), line};
    }
    if(at('return')){ next(); const arg = at(';')?null:parseExpr(); if(at(';'))next(); return {type:'Return', arg, line}; }
    if(at('break')){ next(); if(at(';'))next(); return {type:'Break', line}; }
    if(at('continue')){ next(); if(at(';'))next(); return {type:'Continue', line}; }
    if(isType()||at('const')||at('static')) return parseLocalDecl();
    // `Servo myServo;`  (user type)
    if(peek().type==='ident'&&peek(1).type==='ident'&&(peek(2).value===';'||peek(2).value==='='))
      return parseLocalDecl();
    const e=parseExpr();
    if(at(';')) next();
    else throw new SketchError('this line needs a semicolon at the end', line);
    return {type:'ExprStmt', expr:e, line};
  }

  function parseLocalDecl(){
    const line=peek().line;
    if(at('const')||at('static')) next();
    const typeName = isType()? skipType() : next().value;
    const name=next().value;
    let isArray=false, size=null;
    if(at('[')){ next(); isArray=true; if(!at(']')) size=parseExpr(); expect(']'); }
    let init=null;
    if(at('=')){ next(); init = at('{') ? parseInitList() : parseExpr(); }
    const extra=[];
    while(at(',')){ next(); const n2=next().value; let i2=null; if(at('=')){ next(); i2=parseExpr(); } extra.push({name:n2, init:i2}); }
    if(at(';')) next();
    else if(!at(')')) throw new SketchError('this line needs a semicolon at the end', line);
    return {type:'VarDecl', varType:typeName, name, isArray, size, init, extra, line};
  }

  /* expressions, precedence climbing */
  function parseExpr(){ return parseAssign(); }
  function parseAssign(){
    const left=parseTernary();
    const v=peek().value;
    if(['=','+=','-=','*=','/=','%='].includes(v)){
      const op=next().value; const right=parseAssign();
      return {type:'Assign', op, left, right, line:peek().line};
    }
    return left;
  }
  function parseTernary(){
    const test=parseBinary(0);
    if(at('?')){ next(); const cons=parseAssign(); expect(':'); const alt=parseAssign(); return {type:'Ternary', test, cons, alt}; }
    return test;
  }
  const PREC=[['||'],['&&'],['|'],['^'],['&'],['==','!='],['<','>','<=','>='],['<<','>>'],['+','-'],['*','/','%']];
  function parseBinary(level){
    if(level>=PREC.length) return parseUnary();
    let left=parseBinary(level+1);
    while(PREC[level].includes(peek().value)){
      const op=next().value;
      const right=parseBinary(level+1);
      left={type:'Binary', op, left, right};
    }
    return left;
  }
  function parseUnary(){
    const v=peek().value;
    if(v==='!'||v==='-'||v==='+'){ const op=next().value; return {type:'Unary', op, arg:parseUnary()}; }
    if(v==='++'||v==='--'){ const op=next().value; return {type:'Update', op, prefix:true, arg:parseUnary()}; }
    if(v==='('&&TYPES.has(peek(1).value)&&peek(2).value===')'){ next(); const cast=next().value; next(); return {type:'Cast', cast, arg:parseUnary()}; }
    return parsePostfix();
  }
  function parsePostfix(){
    let node=parsePrimary();
    for(;;){
      if(at('.')){ next(); const prop=next().value; node={type:'Member', obj:node, prop}; }
      else if(at('(')){
        next(); const args=[];
        while(!at(')')){
          args.push(parseExpr());
          if(at(',')) next();
          else if(!at(')')) throw new SketchError(`put a comma between the values inside ( )`, peek().line);
        }
        expect(')');
        node={type:'Call', callee:node, args, line:peek().line};
      }
      else if(at('[')){ next(); const idx=parseExpr(); expect(']'); node={type:'Index', obj:node, index:idx}; }
      else if(at('++')||at('--')){ const op=next().value; node={type:'Update', op, prefix:false, arg:node}; }
      else break;
    }
    return node;
  }
  function parsePrimary(){
    const t=peek();
    if(t.type==='number'){ next(); return {type:'Num', value:Number(t.value)}; }
    if(t.type==='string'){ next(); return {type:'Str', value:JSON.parse(t.value.replace(/\n/g,'\\n'))}; }
    if(t.type==='char'){ next(); const inner=t.value.slice(1,-1); return {type:'Num', value:(inner[0]==='\\'? {'n':10,'t':9,'0':0,'\\':92,"'":39}[inner[1]] : inner.charCodeAt(0)), isChar:true}; }
    if(t.value==='true'){ next(); return {type:'Num', value:1}; }
    if(t.value==='false'){ next(); return {type:'Num', value:0}; }
    if(t.value==='('){ next(); const e=parseExpr(); expect(')'); return e; }
    if(t.type==='ident'||t.type==='keyword'){ next(); return {type:'Ident', name:t.value, line:t.line}; }
    throw new SketchError(`unexpected '${t.value||'end of sketch'}'`, t.line);
  }

  return parseProgram();
}

class SketchError extends Error{
  constructor(msg, line){ super(msg); this.line=line; }
}

/* ---------------- hardware model ---------------- */
const PIN_COUNT = 20;                       // 0..13 digital, 14..19 = A0..A5
const A0_PIN = 14;

class Board{
  constructor(){ this.reset(); }
  reset(){
    this.pins = Array.from({length:PIN_COUNT}, ()=>({mode:'input', value:0, pwm:null, pullup:false}));
    this.analog = Array(6).fill(0);         // 0..1023 from the outside world
    this.button = {pin:2, pressed:false};
    this.pot = {pin:A0_PIN, value:512};
    this.servo = {pin:null, angle:90, attached:false};
    this.buzzer = {pin:8, freq:0};
    this.motor = {pinA:5, pinB:4, pinPwm:3, speed:0, dir:0};
    this.serial = {open:false, baud:0, rx:[], lines:[]};
    this.millis0 = 0;
    this.log = [];
  }
  digitalRead(p){
    if(p===this.button.pin){
      const pu = this.pins[p] && this.pins[p].pullup;
      return pu ? (this.button.pressed?0:1) : (this.button.pressed?1:0);
    }
    const pin=this.pins[p]; if(!pin) return 0;
    if(pin.mode==='input') return pin.pullup?1:0;
    return pin.value;
  }
  analogRead(ch){
    const idx = ch>=A0_PIN ? ch-A0_PIN : ch;
    if(idx===0) return this.pot.value|0;
    return this.analog[idx]|0;
  }
}

/* ---------------- interpreter ---------------- */
const CONSTS = {HIGH:1, LOW:0, INPUT:0, OUTPUT:1, INPUT_PULLUP:2, LED_BUILTIN:13, true:1, false:0,
  A0:14, A1:15, A2:16, A3:17, A4:18, A5:19, DEC:10, HEX:16, BIN:2};

class Sketch{
  constructor(src, board, io){
    this.board = board;
    this.io = io;                          // {print(line), status(s), error(msg,line), onPinChange()}
    this.globals = Object.create(null);
    this.functions = Object.create(null);
    this.time = 0;                          // virtual ms since start
    this.waitUntil = 0;
    this.steps = 0;
    this.done = false;
    this.ast = parse(src);
    this.servos = [];
  }

  /* --- setup phase: hoist functions, run global declarations --- */
  *init(){
    for(const d of this.ast.decls){
      if(d.type==='FuncDecl') this.functions[d.name]=d;
    }
    for(const d of this.ast.decls){
      if(d.type==='VarDecl') yield* this.execStmt(d, this.globals);
    }
    if(!this.functions.setup && !this.functions.loop)
      throw new SketchError('this sketch has no setup() or loop() function', 1);
  }

  *run(){
    yield* this.init();
    if(this.functions.setup){ this.io.status('setup'); yield* this.callUser('setup', []); }
    this.io.status('loop');
    if(!this.functions.loop){ this.done=true; return; }
    for(;;){
      yield* this.callUser('loop', []);
      yield {tick:true};
    }
  }

  *callUser(name, args){
    const fn=this.functions[name];
    if(!fn) throw new SketchError(`there is no function called ${name}()`, 0);
    const env=Object.create(this.globals);
    fn.params.forEach((p,i)=>env[p]={v:args[i]!==undefined?args[i]:0});
    try{ yield* this.execStmt(fn.body, env); }
    catch(e){ if(e&&e.__return!==undefined) return e.__return; throw e; }
    return 0;
  }

  budget(line){
    if(++this.steps>400000) throw new SketchError('this sketch ran too long without a delay', line||0);
  }

  /* --- statements --- */
  *execStmt(node, env){
    if(!node) return;
    this.budget(node.line);
    switch(node.type){
      case 'Block':{
        const inner=Object.create(env);
        for(const s of node.body) yield* this.execStmt(s, inner);
        return;
      }
      case 'VarDecl':{
        const define = (name, init, isArray)=>{
          let val=0;
          if(init && init.type==='InitList'){
            val=[]; for(const it of init.items) val.push(yield_(this.evalSync(it, env)));
          } else if(init){ val=null; }
          env[name]={v: Array.isArray(val)?val:(isArray?[]:0), type:node.varType};
        };
        // evaluate initialisers properly (they may call functions)
        const setOne=function*(self,name,init,isArray){
          let val = isArray?[]:0;
          if(init){
            if(init.type==='InitList'){ val=[]; for(const it of init.items) val.push(yield* self.eval(it, env)); }
            else val = yield* self.eval(init, env);
          }
          if(node.varType==='Servo'){ val={__servo:true, pin:null}; self.servos.push(val); }
          env[name]={v:val, type:node.varType};
        };
        yield* setOne(this, node.name, node.init, node.isArray);
        for(const ex of (node.extra||[])) yield* setOne(this, ex.name, ex.init, false);
        return;
      }
      case 'ExprStmt': yield* this.eval(node.expr, env); return;
      case 'If':{
        if(truthy(yield* this.eval(node.test, env))) yield* this.execStmt(node.cons, env);
        else if(node.alt) yield* this.execStmt(node.alt, env);
        return;
      }
      case 'While':{
        while(truthy(yield* this.eval(node.test, env))){
          this.budget(node.line);
          try{ yield* this.execStmt(node.body, env); }
          catch(e){ if(e&&e.__break) break; if(e&&e.__continue) continue; throw e; }
          yield {tick:true};
        }
        return;
      }
      case 'DoWhile':{
        do{
          this.budget(node.line);
          try{ yield* this.execStmt(node.body, env); }
          catch(e){ if(e&&e.__break) break; if(e&&e.__continue) continue; throw e; }
          yield {tick:true};
        } while(truthy(yield* this.eval(node.test, env)));
        return;
      }
      case 'For':{
        const inner=Object.create(env);
        if(node.init) yield* this.execStmt(node.init, inner);
        for(;;){
          if(node.test && !truthy(yield* this.eval(node.test, inner))) break;
          this.budget(node.line);
          try{ yield* this.execStmt(node.body, inner); }
          catch(e){
            if(e&&e.__break) break;
            if(!(e&&e.__continue)) throw e;
          }
          if(node.update) yield* this.eval(node.update, inner);
          yield {tick:true};
        }
        return;
      }
      case 'Return':{
        const v = node.arg ? yield* this.eval(node.arg, env) : 0;
        throw {__return:v};
      }
      case 'Break': throw {__break:true};
      case 'Continue': throw {__continue:true};
      case 'Empty': return;
      default: yield* this.eval(node, env);
    }
  }

  /* --- expressions --- */
  *eval(node, env){
    this.budget(node.line);
    switch(node.type){
      case 'Num': return node.value;
      case 'Str': return node.value;
      case 'Ident':{
        const slot=lookup(env, node.name);
        if(slot) return slot.v;
        if(node.name in CONSTS) return CONSTS[node.name];
        if(node.name==='Serial') return {__serial:true};
        throw new SketchError(`'${node.name}' is not declared yet`, node.line);
      }
      case 'Index':{
        const arr = yield* this.eval(node.obj, env);
        const i = yield* this.eval(node.index, env);
        if(!Array.isArray(arr)) throw new SketchError('that variable is not an array', node.line);
        return arr[i|0] ?? 0;
      }
      case 'Member': return {__member:true, obj: yield* this.eval(node.obj, env), prop:node.prop};
      case 'Unary':{
        const v = yield* this.eval(node.arg, env);
        return node.op==='!' ? (truthy(v)?0:1) : node.op==='-' ? -v : +v;
      }
      case 'Cast':{
        const v = yield* this.eval(node.arg, env);
        return ['int','long','byte','char','short'].includes(node.cast) ? Math.trunc(v) : v;
      }
      case 'Binary':{
        const a = yield* this.eval(node.left, env);
        if(node.op==='&&') return truthy(a) ? (truthy(yield* this.eval(node.right, env))?1:0) : 0;
        if(node.op==='||') return truthy(a) ? 1 : (truthy(yield* this.eval(node.right, env))?1:0);
        const b = yield* this.eval(node.right, env);
        switch(node.op){
          case '+': return (typeof a==='string'||typeof b==='string') ? String(a)+String(b) : a+b;
          case '-': return a-b; case '*': return a*b;
          case '/': return (Number.isInteger(a)&&Number.isInteger(b)&&b!==0) ? Math.trunc(a/b) : a/b;
          case '%': return a%b;
          case '==': return a==b?1:0; case '!=': return a!=b?1:0;
          case '<': return a<b?1:0; case '>': return a>b?1:0;
          case '<=': return a<=b?1:0; case '>=': return a>=b?1:0;
          case '&': return a&b; case '|': return a|b; case '^': return a^b;
          case '<<': return a<<b; case '>>': return a>>b;
        }
        throw new SketchError(`operator ${node.op} is not supported here`, node.line);
      }
      case 'Ternary': return truthy(yield* this.eval(node.test, env)) ? yield* this.eval(node.cons, env) : yield* this.eval(node.alt, env);
      case 'Assign':{
        let val = yield* this.eval(node.right, env);
        if(node.op!=='='){
          const cur = yield* this.eval(node.left, env);
          val = node.op==='+='?cur+val : node.op==='-='?cur-val : node.op==='*='?cur*val : node.op==='/='?cur/val : cur%val;
        }
        yield* this.assign(node.left, val, env);
        return val;
      }
      case 'Update':{
        const cur = yield* this.eval(node.arg, env);
        const nv = node.op==='++' ? cur+1 : cur-1;
        yield* this.assign(node.arg, nv, env);
        return node.prefix ? nv : cur;
      }
      case 'Call': return yield* this.call(node, env);
      case 'InitList':{ const out=[]; for(const it of node.items) out.push(yield* this.eval(it, env)); return out; }
    }
    throw new SketchError('this expression is not supported', node.line);
  }

  *assign(target, value, env){
    if(target.type==='Ident'){
      const slot=lookup(env, target.name);
      if(!slot) throw new SketchError(`'${target.name}' is not declared yet`, target.line);
      slot.v=value; return;
    }
    if(target.type==='Index'){
      const arr = yield* this.eval(target.obj, env);
      const i = yield* this.eval(target.index, env);
      arr[i|0]=value; return;
    }
    throw new SketchError('cannot assign to that', target.line);
  }

  /* --- function calls, including the Arduino library --- */
  *call(node, env){
    const B=this.board, io=this.io;
    const args=[];
    for(const a of node.args) args.push(yield* this.eval(a, env));
    const line = node.line;

    // member call:  Serial.println(...)  /  myServo.write(...)
    if(node.callee.type==='Member'){
      const objNode=node.callee.obj, prop=node.callee.prop;
      let objVal;
      if(objNode.type==='Ident' && objNode.name==='Serial') objVal={__serial:true};
      else objVal = yield* this.eval(objNode, env);

      if(objVal && objVal.__serial){
        switch(prop){
          case 'begin': B.serial.open=true; B.serial.baud=args[0]|0; io.serialOpen(args[0]|0); return 0;
          case 'print': io.print(fmt(args[0], args[1]), false); return 1;
          case 'println': io.print(fmt(args[0], args[1]), true); return 1;
          case 'write': io.print(String.fromCharCode(args[0]|0), false); return 1;
          case 'available': return B.serial.rx.length;
          case 'read': return B.serial.rx.length ? B.serial.rx.shift().charCodeAt(0) : -1;
          case 'parseInt':{ let s=''; while(B.serial.rx.length && /[0-9-]/.test(B.serial.rx[0])) s+=B.serial.rx.shift();
                            while(B.serial.rx.length && !/[0-9-]/.test(B.serial.rx[0])) B.serial.rx.shift(); return parseInt(s||'0',10); }
          case 'flush': return 0;
          case 'end': B.serial.open=false; return 0;
        }
        throw new SketchError(`Serial.${prop}() is not available in this simulator`, line);
      }
      if(objVal && objVal.__servo){
        switch(prop){
          case 'attach': objVal.pin=args[0]|0; B.servo.pin=args[0]|0; B.servo.attached=true; io.changed(); return 0;
          case 'write': B.servo.angle=clamp(args[0],0,180); io.changed(); return 0;
          case 'writeMicroseconds': B.servo.angle=clamp(Math.round((args[0]-1000)/1000*180),0,180); io.changed(); return 0;
          case 'read': return B.servo.angle;
          case 'detach': B.servo.attached=false; io.changed(); return 0;
        }
        throw new SketchError(`Servo.${prop}() is not available in this simulator`, line);
      }
      throw new SketchError(`cannot call .${prop}() on that`, line);
    }

    const name = node.callee.name;
    switch(name){
      case 'pinMode':{
        const p=args[0]|0, m=args[1]|0;
        if(!B.pins[p]) throw new SketchError(`pin ${p} does not exist on an UNO`, line);
        B.pins[p].mode = m===0 ? 'input' : m===1 ? 'output' : 'input';
        B.pins[p].pullup = (m===2);
        io.changed(); return 0;
      }
      case 'digitalWrite':{
        const p=args[0]|0;
        if(!B.pins[p]) throw new SketchError(`pin ${p} does not exist on an UNO`, line);
        if(B.pins[p].mode!=='output') io.warn(`pin ${p} was written to but never set as OUTPUT`, line);
        B.pins[p].value = truthy(args[1])?1:0; B.pins[p].pwm=null;
        io.changed(); return 0;
      }
      case 'digitalRead': return B.digitalRead(args[0]|0);
      case 'analogRead': return B.analogRead(args[0]|0);
      case 'analogWrite':{
        const p=args[0]|0, v=clamp(args[1]|0,0,255);
        if(!B.pins[p]) throw new SketchError(`pin ${p} does not exist on an UNO`, line);
        if(![3,5,6,9,10,11].includes(p)) io.warn(`pin ${p} has no ~ so analogWrite() cannot dim it`, line);
        B.pins[p].pwm=v; B.pins[p].value = v>127?1:0;
        io.changed(); return 0;
      }
      case 'delay':{
        const ms=Math.max(0,args[0]||0);
        this.waitUntil = this.time + ms;
        yield {wait:this.waitUntil};
        return 0;
      }
      case 'delayMicroseconds':{
        this.waitUntil = this.time + (args[0]||0)/1000;
        yield {wait:this.waitUntil};
        return 0;
      }
      case 'millis': return Math.floor(this.time);
      case 'micros': return Math.floor(this.time*1000);
      case 'tone':{
        B.buzzer.pin=args[0]|0; B.buzzer.freq=args[1]|0; io.tone(B.buzzer.freq); io.changed();
        if(args[2]){ /* duration handled by the caller's own delay */ }
        return 0;
      }
      case 'noTone': B.buzzer.freq=0; io.tone(0); io.changed(); return 0;
      case 'map':{ const [x,i1,i2,o1,o2]=args; return Math.trunc((x-i1)*(o2-o1)/((i2-i1)||1)+o1); }
      case 'constrain': return clamp(args[0],args[1],args[2]);
      case 'random': return args.length>1 ? Math.floor(Math.random()*(args[1]-args[0]))+args[0] : Math.floor(Math.random()*args[0]);
      case 'randomSeed': return 0;
      case 'abs': return Math.abs(args[0]);
      case 'min': return Math.min(args[0],args[1]);
      case 'max': return Math.max(args[0],args[1]);
      case 'pow': return Math.pow(args[0],args[1]);
      case 'sqrt': return Math.sqrt(args[0]);
      case 'sin': return Math.sin(args[0]);
      case 'cos': return Math.cos(args[0]);
      case 'floor': return Math.floor(args[0]);
      case 'round': return Math.round(args[0]);
      case 'String': return String(args[0]);
    }
    if(this.functions[name]) return yield* this.callUser(name, args);
    throw new SketchError(`there is no function called ${name}() in this simulator`, line);
  }
}

function lookup(env, name){
  let e=env;
  while(e){ if(Object.prototype.hasOwnProperty.call(e,name)) return e[name]; e=Object.getPrototypeOf(e); }
  return null;
}
function truthy(v){ return !(v===0||v===false||v===undefined||v===null||v===''); }
function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }
function fmt(v, base){
  if(typeof v==='string') return v;
  if(base===2) return (v>>>0).toString(2);
  if(base===16) return (v>>>0).toString(16).toUpperCase();
  if(typeof base==='number' && base>=0 && !Number.isInteger(v)) return Number(v).toFixed(base);
  if(Number.isInteger(v)) return String(v);
  return Number(v).toFixed(2);
}
function yield_(x){ return x; }

/* ---------------- runner: drives the generator against real time ---------------- */
class Runner{
  constructor(board, io){ this.board=board; this.io=io; this.raf=null; this.sketch=null; this.running=false; }

  start(src){
    this.stop();
    this.board.reset();
    this.io.clear();
    try{ this.sketch = new Sketch(src, this.board, this.io); }
    catch(e){ this.fail(e); return false; }
    this.gen = this.sketch.run();
    this.running = true;
    this.startedAt = performance.now();
    this.pending = null;
    this.io.running(true);
    this.tick();
    return true;
  }

  stop(){
    this.running=false;
    if(this.raf) cancelAnimationFrame(this.raf);
    this.raf=null;
    this.io.tone(0);
    this.io.running(false);
  }

  fail(e){
    this.running=false;
    if(e instanceof SketchError) this.io.error(e.message, e.line);
    else this.io.error(e.message||String(e), 0);
    this.io.running(false);
  }

  tick(){
    if(!this.running) return;
    const now = performance.now();
    const s = this.sketch;
    s.time = now - this.startedAt;
    s.steps = 0;
    try{
      let guard=0;
      for(;;){
        if(this.pending && s.time < this.pending) break;      // still inside a delay()
        this.pending=null;
        const r = this.gen.next();
        if(r.done){ this.io.status('finished'); this.stop(); break; }
        const v = r.value;
        if(v && v.wait !== undefined){
          if(s.time < v.wait){ this.pending = v.wait; break; }
        } else if(v && v.tick){
          if(++guard > 900) break;                            // keep the frame responsive
        }
        if(s.steps > 200000) break;
      }
    }catch(e){ this.fail(e); return; }
    this.io.frame();
    this.raf = requestAnimationFrame(()=>this.tick());
  }
}

window.ArduinoSim = {Board, Runner, Sketch, SketchError, lex, parse, CONSTS};
