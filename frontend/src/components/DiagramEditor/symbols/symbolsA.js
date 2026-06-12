// ─── SVG Helpers ──────────────────────────────────────────────────────────────
const s  = (c) => `<svg viewBox="0 0 60 60" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">${c}</svg>`;
const L  = (x1,y1,x2,y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
const C  = (cx,cy,r,f='none') => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${f}"/>`;
const R  = (x,y,w,h,rx=0) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"/>`;
const P  = (d,f='none') => `<path d="${d}" fill="${f}"/>`;
const T  = (x,y,t,sz=9) => `<text x="${x}" y="${y}" font-size="${sz}" fill="currentColor" stroke="none" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif">${t}</text>`;
const E  = (cx,cy,rx,ry) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>`;
const HL = L(0,30,12,30)+L(48,30,60,30);
const VL = L(30,0,30,12)+L(30,48,30,60);
const DOT= (x,y) => C(x,y,3,'currentColor');

const CP_LR  = [{x:0,y:30,type:'left'},{x:60,y:30,type:'right'}];
const CP_TB  = [{x:30,y:0,type:'top'},{x:30,y:60,type:'bottom'}];
const CP_L   = [{x:0,y:30,type:'left'}];
const CP_R   = [{x:60,y:30,type:'right'}];
const CP_T   = [{x:30,y:0,type:'top'}];
const CP_B   = [{x:30,y:60,type:'bottom'}];
const CP_4   = [{x:0,y:30,type:'left'},{x:60,y:30,type:'right'},{x:30,y:0,type:'top'},{x:30,y:60,type:'bottom'}];
const CP_3PH = [{x:0,y:20,type:'left'},{x:0,y:30,type:'left'},{x:0,y:40,type:'left'},{x:60,y:30,type:'right'}];

export const SYMBOLS_A = [

  // ══════════════════════════════════════════════════════════════════
  // CATEGORY 1 — POWER SOURCES
  // ══════════════════════════════════════════════════════════════════
  {
    id:'ac-source', name:'AC Voltage Source', category:'power-sources', subcategory:'voltage-sources',
    svg: s(C(30,30,18)+P('M14,30 Q18,20 22,30 Q26,40 30,30 Q34,20 38,30 Q42,40 46,30')+L(0,30,12,30)+L(48,30,60,30)),
    connectionPoints: CP_LR, tags:['ac','voltage','source','alternating','power','generator'], standards:['ANSI','IEC']
  },
  {
    id:'dc-source', name:'DC Voltage Source', category:'power-sources', subcategory:'voltage-sources',
    svg: s(C(30,30,18)+L(21,24,39,24)+L(25,36,35,36)+L(0,30,12,30)+L(48,30,60,30)),
    connectionPoints: CP_LR, tags:['dc','voltage','source','direct','battery','power'], standards:['ANSI','IEC']
  },
  {
    id:'battery-cell', name:'Battery Single Cell', category:'power-sources', subcategory:'batteries',
    svg: s(L(0,30,24,30)+L(24,14,24,46)+L(36,22,36,38)+L(36,30,60,30)),
    connectionPoints: CP_LR, tags:['battery','cell','1.5v','single','dc'], standards:['ANSI','IEC']
  },
  {
    id:'battery-pack', name:'Battery Pack (Multi-Cell)', category:'power-sources', subcategory:'batteries',
    svg: s(L(0,30,8,30)+L(8,14,8,46)+L(16,22,16,38)+L(24,14,24,46)+L(32,22,32,38)+L(40,14,40,46)+L(48,22,48,38)+L(52,30,60,30)),
    connectionPoints: CP_LR, tags:['battery','pack','multi','cell','dc','energy storage'], standards:['ANSI','IEC']
  },
  {
    id:'battery-parallel', name:'Battery Pack (Parallel)', category:'power-sources', subcategory:'batteries',
    svg: s(L(0,30,10,30)+L(10,14,10,46)+L(18,22,18,38)+L(36,14,36,46)+L(44,22,44,38)+L(10,14,36,14)+L(10,46,36,46)+L(18,30,36,30)+L(50,30,60,30)),
    connectionPoints: CP_LR, tags:['battery','parallel','pack','capacity'], standards:['ANSI']
  },
  {
    id:'solar-panel', name:'Solar Panel', category:'power-sources', subcategory:'renewable',
    svg: s(R(8,10,44,40)+L(8,23,52,23)+L(8,36,52,36)+L(26,10,26,50)+L(42,10,42,50)+VL),
    connectionPoints: CP_TB, tags:['solar','panel','pv','photovoltaic','renewable','sun'], standards:['IEC']
  },
  {
    id:'solar-array', name:'Solar Array', category:'power-sources', subcategory:'renewable',
    svg: s(R(4,4,24,24)+L(4,16,28,16)+L(16,4,16,28)+R(32,4,24,24)+L(32,16,56,16)+L(44,4,44,28)+R(4,32,24,24)+L(4,44,28,44)+L(16,32,16,56)+R(32,32,24,24)+L(32,44,56,44)+L(44,32,44,56)),
    connectionPoints: [{x:30,y:60,type:'bottom'},{x:30,y:0,type:'top'}], tags:['solar','array','pv','photovoltaic','panels'], standards:['IEC']
  },
  {
    id:'generator-ac', name:'AC Generator', category:'power-sources', subcategory:'generators',
    svg: s(C(30,30,18)+T(30,27,'G',13)+T(30,39,'~',11)+L(0,30,12,30)+L(48,30,60,30)),
    connectionPoints: CP_LR, tags:['generator','ac','alternating','genset','backup power'], standards:['ANSI']
  },
  {
    id:'generator-dc', name:'DC Generator', category:'power-sources', subcategory:'generators',
    svg: s(C(30,30,18)+T(30,27,'G',13)+T(30,39,'=',12)+L(0,30,12,30)+L(48,30,60,30)),
    connectionPoints: CP_LR, tags:['generator','dc','direct','dynamo'], standards:['ANSI']
  },
  {
    id:'alternator', name:'Alternator', category:'power-sources', subcategory:'generators',
    svg: s(C(30,30,18)+T(30,27,'ALT',9)+T(30,39,'~',11)+L(0,30,12,30)+L(48,30,60,30)),
    connectionPoints: CP_LR, tags:['alternator','ac','vehicle','generator'], standards:['ANSI']
  },
  {
    id:'ups', name:'UPS System', category:'power-sources', subcategory:'power-conditioning',
    svg: s(R(8,10,44,40,3)+T(30,26,'UPS',12)+T(30,40,'~',10)+L(0,30,8,30)+L(52,30,60,30)),
    connectionPoints: CP_LR, tags:['ups','uninterruptible','power supply','battery backup'], standards:['ANSI']
  },
  {
    id:'inverter', name:'Inverter (DC→AC)', category:'power-sources', subcategory:'power-conditioning',
    svg: s(R(8,12,44,36,3)+T(30,24,'DC',9)+P('M24,30 L28,30 M28,30 L36,30 M36,30 L40,30')+P('M34,26 Q38,30 34,34')+T(30,42,'AC',9)+L(0,30,8,30)+L(52,30,60,30)),
    connectionPoints: CP_LR, tags:['inverter','dc to ac','solar inverter','power conversion'], standards:['ANSI','IEC']
  },
  {
    id:'converter', name:'Converter (AC→DC)', category:'power-sources', subcategory:'power-conditioning',
    svg: s(R(8,12,44,36,3)+T(30,24,'AC',9)+P('M24,30 L36,30 M33,26 L36,30 L33,34')+T(30,42,'DC',9)+L(0,30,8,30)+L(52,30,60,30)),
    connectionPoints: CP_LR, tags:['converter','ac to dc','rectifier','power supply'], standards:['ANSI','IEC']
  },
  {
    id:'power-supply', name:'Regulated Power Supply', category:'power-sources', subcategory:'power-conditioning',
    svg: s(R(10,10,40,40,3)+T(30,24,'PS',11)+T(30,38,'+5V',9)+L(0,20,10,20)+L(0,40,10,40)+L(50,30,60,30)),
    connectionPoints:[{x:0,y:20,type:'left'},{x:0,y:40,type:'left'},{x:60,y:30,type:'right'}],
    tags:['power supply','regulated','psu','5v','12v','24v'], standards:['ANSI']
  },
  {
    id:'current-source-dc', name:'DC Current Source', category:'power-sources', subcategory:'current-sources',
    svg: s(C(30,30,18)+P('M30,42 L30,18 M24,24 L30,18 L36,24')+L(0,30,12,30)+L(48,30,60,30)),
    connectionPoints: CP_LR, tags:['current source','dc','controlled','constant current'], standards:['ANSI','IEC']
  },
  {
    id:'current-source-ac', name:'AC Current Source', category:'power-sources', subcategory:'current-sources',
    svg: s(C(30,30,18)+P('M18,30 Q22,22 26,30 Q30,38 34,30 Q38,22 42,30')+P('M30,42 L30,36 M26,38 L30,42 L34,38')+L(0,30,12,30)+L(48,30,60,30)),
    connectionPoints: CP_LR, tags:['current source','ac','sinusoidal'], standards:['ANSI','IEC']
  },
  {
    id:'voltage-regulator', name:'Voltage Regulator', category:'power-sources', subcategory:'power-conditioning',
    svg: s(R(10,18,40,24,3)+T(30,30,'VREG',9)+L(0,30,10,30)+L(50,30,60,30)),
    connectionPoints: CP_LR, tags:['voltage regulator','vreg','ldo','78xx','linear'], standards:['ANSI']
  },
  {
    id:'rectifier-hw', name:'Half-Wave Rectifier', category:'power-sources', subcategory:'rectifiers',
    svg: s(P('M16,16 L44,30 L16,44 Z')+L(44,16,44,44)+L(0,30,16,30)+L(44,30,60,30)),
    connectionPoints: CP_LR, tags:['rectifier','half wave','diode','ac to dc'], standards:['ANSI','IEC']
  },
  {
    id:'rectifier-fw', name:'Full-Wave Bridge Rectifier', category:'power-sources', subcategory:'rectifiers',
    svg: s(P('M30,6 L54,30 L30,54 L6,30 Z')+P('M28,6 L32,14 M24,10 L30,6 L34,12')+P('M52,28 L44,32 M50,24 L54,30 L48,34')+P('M32,52 L28,46 M36,50 L30,54 L26,48')+P('M8,32 L16,28 M10,36 L6,30 L12,26')+L(30,0,30,6)+L(54,30,60,30)+L(30,54,30,60)+L(0,30,6,30)),
    connectionPoints: CP_4, tags:['bridge rectifier','full wave','4 diode','ac to dc'], standards:['ANSI','IEC']
  },
  {
    id:'wind-generator', name:'Wind Generator', category:'power-sources', subcategory:'renewable',
    svg: s(C(30,30,5,'currentColor')+P('M30,25 Q34,20 38,12 Q32,16 30,25')+P('M35,33 Q40,36 48,34 Q44,28 35,33')+P('M25,33 Q20,38 16,44 Q22,44 25,33')+L(30,35,30,58)+L(22,58,38,58)),
    connectionPoints: CP_B, tags:['wind','turbine','generator','renewable','wind power'], standards:['IEC']
  },
  {
    id:'motor-generator-set', name:'Motor-Generator Set', category:'power-sources', subcategory:'generators',
    svg: s(C(16,30,14)+T(16,30,'M',13)+C(44,30,14)+T(44,30,'G',13)+L(0,30,2,30)+L(58,30,60,30)),
    connectionPoints: CP_LR, tags:['motor generator','mg set','converter','rotary converter'], standards:['ANSI']
  },
  {
    id:'three-phase-source', name:'Three-Phase Source', category:'power-sources', subcategory:'voltage-sources',
    svg: s(C(36,30,18)+T(36,30,'3φ',11)+L(0,20,18,24)+L(0,30,18,30)+L(0,40,18,36)),
    connectionPoints:[{x:0,y:20,type:'left'},{x:0,y:30,type:'left'},{x:0,y:40,type:'left'}],
    tags:['three phase','3 phase','3ph','ac','wye','delta'], standards:['ANSI','IEC']
  },
  {
    id:'fuel-cell', name:'Fuel Cell', category:'power-sources', subcategory:'renewable',
    svg: s(R(8,14,44,32,3)+T(20,30,'H₂',10)+T(40,30,'O₂',10)+L(0,22,8,22)+L(0,38,8,38)+L(52,30,60,30)),
    connectionPoints:[{x:0,y:22,type:'left'},{x:0,y:38,type:'left'},{x:60,y:30,type:'right'}],
    tags:['fuel cell','hydrogen','h2','green energy','electrochemical'], standards:['IEC']
  },
  {
    id:'switching-psu', name:'Switching Power Supply', category:'power-sources', subcategory:'power-conditioning',
    svg: s(R(8,10,44,40,3)+T(30,24,'SMPS',9)+P('M14,36 L20,30 L26,36 L32,30 L38,36 L44,30')+L(0,30,8,30)+L(52,30,60,30)),
    connectionPoints: CP_LR, tags:['switching power supply','smps','switch mode','psu','atx'], standards:['ANSI']
  },

  // ══════════════════════════════════════════════════════════════════
  // CATEGORY 2 — BASIC SWITCHES
  // ══════════════════════════════════════════════════════════════════
  {
    id:'spst-no', name:'SPST Switch (Normally Open)', category:'basic-switches', subcategory:'spst',
    svg: s(L(0,30,20,30)+DOT(20,30)+DOT(40,30)+L(22,30,38,18)+L(40,30,60,30)),
    connectionPoints: CP_LR, tags:['switch','spst','normally open','no','single pole single throw','toggle'], standards:['ANSI','IEC']
  },
  {
    id:'spst-nc', name:'SPST Switch (Normally Closed)', category:'basic-switches', subcategory:'spst',
    svg: s(L(0,30,20,30)+DOT(20,30)+DOT(40,30)+L(22,30,39,22)+L(40,30,60,30)),
    connectionPoints: CP_LR, tags:['switch','spst','normally closed','nc','single pole single throw'], standards:['ANSI','IEC']
  },
  {
    id:'spdt', name:'SPDT Switch', category:'basic-switches', subcategory:'spdt',
    svg: s(L(0,30,20,30)+DOT(20,30)+DOT(40,18)+DOT(40,42)+L(22,30,38,20)+L(40,18,60,18)+L(40,42,60,42)),
    connectionPoints:[{x:0,y:30,type:'left'},{x:60,y:18,type:'right'},{x:60,y:42,type:'right'}],
    tags:['switch','spdt','single pole double throw','changeover','selector'], standards:['ANSI','IEC']
  },
  {
    id:'dpst', name:'DPST Switch', category:'basic-switches', subcategory:'dpst',
    svg: s(L(0,20,18,20)+DOT(18,20)+DOT(34,20)+L(20,20,33,12)+L(34,20,54,20)+L(0,40,18,40)+DOT(18,40)+DOT(34,40)+L(20,40,33,32)+L(34,40,54,40)+L(26,12,26,32)),
    connectionPoints:[{x:0,y:20,type:'left'},{x:54,y:20,type:'right'},{x:0,y:40,type:'left'},{x:54,y:40,type:'right'}],
    tags:['switch','dpst','double pole single throw','ganged'], standards:['ANSI','IEC']
  },
  {
    id:'dpdt', name:'DPDT Switch', category:'basic-switches', subcategory:'dpdt',
    svg: s(L(0,18,16,18)+DOT(16,18)+DOT(28,12)+DOT(28,24)+L(18,18,27,12)+L(28,12,54,12)+L(28,24,54,24)+L(0,42,16,42)+DOT(16,42)+DOT(28,36)+DOT(28,48)+L(18,42,27,36)+L(28,36,54,36)+L(28,48,54,48)+L(22,12,22,36)),
    connectionPoints:[{x:0,y:18},{x:0,y:42},{x:54,y:12},{x:54,y:24},{x:54,y:36},{x:54,y:48}],
    tags:['switch','dpdt','double pole double throw','h-bridge','reversing'], standards:['ANSI','IEC']
  },
  {
    id:'push-btn-no', name:'Push Button (Normally Open)', category:'basic-switches', subcategory:'push-buttons',
    svg: s(L(0,36,20,36)+DOT(20,36)+DOT(40,36)+L(30,20,30,28)+L(22,28,38,28)+L(40,36,60,36)),
    connectionPoints:[{x:0,y:36,type:'left'},{x:60,y:36,type:'right'}],
    tags:['push button','normally open','no','momentary','pb','start button'], standards:['ANSI','IEC']
  },
  {
    id:'push-btn-nc', name:'Push Button (Normally Closed)', category:'basic-switches', subcategory:'push-buttons',
    svg: s(L(0,36,20,36)+DOT(20,36)+DOT(40,36)+L(30,20,30,28)+L(22,28,38,28)+L(22,32,38,32)+L(40,36,60,36)),
    connectionPoints:[{x:0,y:36,type:'left'},{x:60,y:36,type:'right'}],
    tags:['push button','normally closed','nc','momentary','pb','stop button'], standards:['ANSI','IEC']
  },
  {
    id:'selector-2pos', name:'Selector Switch (2-Position)', category:'basic-switches', subcategory:'selector',
    svg: s(C(30,30,16)+L(30,30,30,14)+DOT(30,14)+DOT(46,30)+L(30,30,46,30)+T(22,44,'1',8)+T(38,44,'2',8)),
    connectionPoints:[{x:0,y:30,type:'left'},{x:30,y:60,type:'bottom'},{x:60,y:30,type:'right'}],
    tags:['selector','2 position','rotary','hand off auto','hoa'], standards:['ANSI']
  },
  {
    id:'selector-3pos', name:'Selector Switch (3-Position)', category:'basic-switches', subcategory:'selector',
    svg: s(C(30,30,16)+L(30,30,30,14)+DOT(30,14)+DOT(44,38)+DOT(16,38)+L(30,30,44,38)+T(18,12,'1',8)+T(46,44,'2',8)+T(14,46,'3',8)),
    connectionPoints:[{x:30,y:60,type:'bottom'}],
    tags:['selector','3 position','rotary','hand off auto','hoa','3-way'], standards:['ANSI']
  },
  {
    id:'knife-switch', name:'Knife Switch', category:'basic-switches', subcategory:'disconnect',
    svg: s(R(12,24,10,12,1)+L(0,30,12,30)+L(22,30,40,16)+R(38,24,10,12,1)+L(48,30,60,30)),
    connectionPoints: CP_LR, tags:['knife switch','disconnect','isolation','service entrance','visible blade'], standards:['ANSI']
  },
  {
    id:'disconnect-sw', name:'Disconnect Switch', category:'basic-switches', subcategory:'disconnect',
    svg: s(R(8,8,44,44,2)+T(30,24,'DISC',9)+L(14,30,46,30)+L(18,30,42,18)+T(30,42,'SW',9)),
    connectionPoints:[{x:0,y:30,type:'left'},{x:60,y:30,type:'right'}],
    tags:['disconnect','isolation switch','lockable','service disconnect','main'], standards:['ANSI','IEC']
  },
  {
    id:'float-sw', name:'Float Switch', category:'basic-switches', subcategory:'process',
    svg: s(L(0,42,18,42)+DOT(18,42)+DOT(34,42)+L(20,42,32,32)+L(34,42,54,42)+L(42,32,42,18)+C(42,12,8)),
    connectionPoints:[{x:0,y:42,type:'left'},{x:54,y:42,type:'right'}],
    tags:['float switch','level','sump pump','tank','water level'], standards:['ANSI']
  },
  {
    id:'flow-sw', name:'Flow Switch', category:'basic-switches', subcategory:'process',
    svg: s(L(0,30,18,30)+DOT(18,30)+DOT(34,30)+L(20,30,32,22)+L(34,30,46,30)+P('M46,22 L56,30 L46,38','none')),
    connectionPoints: CP_LR, tags:['flow switch','flow detector','pipe','hvac','sprinkler'], standards:['ANSI']
  },
  {
    id:'pressure-sw', name:'Pressure Switch', category:'basic-switches', subcategory:'process',
    svg: s(L(0,36,18,36)+DOT(18,36)+DOT(34,36)+L(20,36,32,26)+L(34,36,60,36)+P('M28,10 Q31,13 28,16 Q25,19 28,22 Q31,25 28,28')),
    connectionPoints:[{x:0,y:36,type:'left'},{x:60,y:36,type:'right'}],
    tags:['pressure switch','psi','bar','compressor','pump','air pressure'], standards:['ANSI']
  },
  {
    id:'limit-sw', name:'Limit Switch', category:'basic-switches', subcategory:'actuated',
    svg: s(L(0,38,18,38)+DOT(18,38)+DOT(34,38)+L(20,38,32,28)+L(34,38,60,38)+L(24,28,24,10)+C(24,8,6)+P('M18,8 L30,8')),
    connectionPoints:[{x:0,y:38,type:'left'},{x:60,y:38,type:'right'}],
    tags:['limit switch','ls','roller','actuator','position','end of travel'], standards:['ANSI','IEC']
  },
  {
    id:'proximity-sw', name:'Proximity Switch (Inductive)', category:'basic-switches', subcategory:'proximity',
    svg: s(R(6,12,48,20,10)+T(30,22,'PRX',9)+L(0,38,18,38)+DOT(18,38)+DOT(34,38)+L(20,38,32,30)+L(34,38,60,38)),
    connectionPoints:[{x:0,y:38,type:'left'},{x:60,y:38,type:'right'}],
    tags:['proximity','inductive','sensor','detection','npn pnp','px'], standards:['IEC']
  },
  {
    id:'transfer-sw-manual', name:'Manual Transfer Switch (MTS)', category:'basic-switches', subcategory:'transfer',
    svg: s(R(10,8,40,44,2)+T(30,24,'MTS',10)+T(30,36,'MANUAL',7)+L(0,20,10,20)+L(0,40,10,40)+L(50,20,60,20)+L(50,40,60,40)),
    connectionPoints:[{x:0,y:20},{x:0,y:40},{x:60,y:20},{x:60,y:40}],
    tags:['transfer switch','manual','mts','generator','normal standby'], standards:['ANSI']
  },
  {
    id:'transfer-sw-auto', name:'Automatic Transfer Switch (ATS)', category:'basic-switches', subcategory:'transfer',
    svg: s(R(10,8,40,44,2)+T(30,24,'ATS',10)+T(30,36,'AUTO',8)+L(0,20,10,20)+L(0,40,10,40)+L(50,20,60,20)+L(50,40,60,40)),
    connectionPoints:[{x:0,y:20},{x:0,y:40},{x:60,y:20},{x:60,y:40}],
    tags:['transfer switch','automatic','ats','generator','failover','standby'], standards:['ANSI']
  },
  {
    id:'key-sw', name:'Key Switch', category:'basic-switches', subcategory:'security',
    svg: s(L(0,30,18,30)+DOT(18,30)+DOT(36,30)+L(20,30,35,22)+L(36,30,54,30)+C(50,12,8)+L(50,20,50,26)+L(44,26,56,26)),
    connectionPoints: CP_LR, tags:['key switch','security','access control','lock','lockout'], standards:['ANSI']
  },
  {
    id:'footswitch', name:'Foot Switch', category:'basic-switches', subcategory:'actuated',
    svg: s(L(0,32,18,32)+DOT(18,32)+DOT(34,32)+L(20,32,32,22)+L(34,32,60,32)+R(14,42,32,12,3)+L(30,32,30,42)),
    connectionPoints:[{x:0,y:32,type:'left'},{x:60,y:32,type:'right'}],
    tags:['foot switch','pedal','press','hands free','machine control'], standards:['ANSI']
  },
  {
    id:'rocker-sw', name:'Rocker Switch', category:'basic-switches', subcategory:'spst',
    svg: s(R(14,16,32,28,8)+L(30,16,30,44)+T(21,30,'ON',8)+T(39,30,'OFF',7)),
    connectionPoints: CP_LR, tags:['rocker','switch','on off','toggle','appliance'], standards:['ANSI']
  },
  {
    id:'drum-sw-fwd', name:'Drum Switch (Forward)', category:'basic-switches', subcategory:'drum',
    svg: s(C(30,30,18)+T(30,24,'DRUM',8)+T(30,36,'FWD',8)+P('M16,24 L20,30 L16,36')),
    connectionPoints: CP_LR, tags:['drum switch','forward','motor reversing','manual starter'], standards:['ANSI']
  },
  {
    id:'drum-sw-rev', name:'Drum Switch (Reverse)', category:'basic-switches', subcategory:'drum',
    svg: s(C(30,30,18)+T(30,24,'DRUM',8)+T(30,36,'REV',8)+P('M44,24 L40,30 L44,36')),
    connectionPoints: CP_LR, tags:['drum switch','reverse','motor reversing','manual starter'], standards:['ANSI']
  },
  {
    id:'vacuum-sw', name:'Vacuum Switch', category:'basic-switches', subcategory:'process',
    svg: s(L(0,36,18,36)+DOT(18,36)+DOT(34,36)+L(20,36,32,26)+L(34,36,60,36)+E(46,16,10,8)+L(36,16,56,16)),
    connectionPoints:[{x:0,y:36,type:'left'},{x:60,y:36,type:'right'}],
    tags:['vacuum switch','pressure','negative pressure','hvac','industrial'], standards:['ANSI']
  },
  {
    id:'temp-bimetal-sw', name:'Temperature Switch (Bimetal)', category:'basic-switches', subcategory:'temperature',
    svg: s(L(0,36,18,36)+DOT(18,36)+DOT(34,36)+L(20,36,32,26)+L(34,36,60,36)+L(46,10,46,26)+C(46,30,6)),
    connectionPoints:[{x:0,y:36,type:'left'},{x:60,y:36,type:'right'}],
    tags:['temperature switch','thermal','thermostat','bimetal','overtemp','klixon'], standards:['ANSI']
  },

  // ══════════════════════════════════════════════════════════════════
  // CATEGORY 3 — WALL DEVICES & CONTROLS (Architectural)
  // ══════════════════════════════════════════════════════════════════
  {
    id:'wall-sw-sp', name:'Single-Pole Wall Switch', category:'wall-devices', subcategory:'switches',
    svg: s(T(28,32,'S',24)+L(20,16,40,6)),
    connectionPoints: CP_B, tags:['wall switch','single pole','sp','architectural','floor plan'], standards:['ANSI']
  },
  {
    id:'wall-sw-3way', name:'3-Way Wall Switch', category:'wall-devices', subcategory:'switches',
    svg: s(T(24,32,'S',24)+T(40,22,'3',11)+L(16,16,36,6)),
    connectionPoints: CP_B, tags:['3-way switch','three way','s3','stairway','hallway'], standards:['ANSI']
  },
  {
    id:'wall-sw-4way', name:'4-Way Wall Switch', category:'wall-devices', subcategory:'switches',
    svg: s(T(24,32,'S',24)+T(40,22,'4',11)+L(16,16,36,6)),
    connectionPoints: CP_B, tags:['4-way switch','four way','s4','long hallway','multi-location'], standards:['ANSI']
  },
  {
    id:'dimmer-sw', name:'Dimmer Switch', category:'wall-devices', subcategory:'switches',
    svg: s(T(22,30,'S',22)+T(40,20,'D',12)+L(14,14,34,4)+P('M16,42 Q22,38 28,42 Q34,46 40,42')),
    connectionPoints: CP_B, tags:['dimmer','light control','0-10v','triac','lutron','leviton'], standards:['ANSI']
  },
  {
    id:'fan-speed-ctrl', name:'Fan Speed Control', category:'wall-devices', subcategory:'switches',
    svg: s(T(22,30,'S',22)+T(40,20,'F',12)+L(14,14,34,4)),
    connectionPoints: CP_B, tags:['fan speed','control','fan switch','sf'], standards:['ANSI']
  },
  {
    id:'occupancy-sw', name:'Occupancy Sensor Switch', category:'wall-devices', subcategory:'sensors',
    svg: s(T(22,32,'S',20)+C(42,18,8)+L(42,26,42,36)+L(36,30,48,30)),
    connectionPoints: CP_B, tags:['occupancy sensor','pir','motion','auto off','vacancy sensor'], standards:['ANSI']
  },
  {
    id:'smart-sw-wifi', name:'Smart Switch (WiFi)', category:'wall-devices', subcategory:'smart',
    svg: s(T(20,32,'S',20)+P('M36,30 Q40,26 44,30')+P('M34,26 Q40,20 46,26')+P('M32,22 Q40,14 48,22')+C(40,32,2,'currentColor')),
    connectionPoints: CP_B, tags:['smart switch','wifi','wireless','z-wave','zigbee','alexa','google home'], standards:['ANSI']
  },
  {
    id:'gfci-sw', name:'GFCI Switch', category:'wall-devices', subcategory:'switches',
    svg: s(T(22,32,'S',22)+T(40,22,'GF',9)+L(14,16,34,6)),
    connectionPoints: CP_B, tags:['gfci switch','ground fault','gfi','wet location'], standards:['ANSI']
  },
  {
    id:'switch-pilot-lt', name:'Switch with Pilot Light', category:'wall-devices', subcategory:'switches',
    svg: s(T(24,32,'S',22)+L(16,16,36,6)+C(44,16,7)),
    connectionPoints: CP_B, tags:['pilot light','indicator','switch','locator','neon'], standards:['ANSI']
  },
  {
    id:'weatherproof-sw', name:'Weatherproof Switch', category:'wall-devices', subcategory:'switches',
    svg: s(T(30,30,'S',22)+R(6,6,48,48,4)),
    connectionPoints: CP_B, tags:['weatherproof','outdoor','in-use cover','rain tight','wp'], standards:['ANSI']
  },
  {
    id:'timer-sw', name:'Timer Switch', category:'wall-devices', subcategory:'switches',
    svg: s(T(20,32,'S',20)+C(42,26,12)+L(42,14,42,26)+L(42,26,50,26)+T(42,44,'T',10)),
    connectionPoints: CP_B, tags:['timer switch','time clock','astronomical','schedule','lighting control'], standards:['ANSI']
  },
  {
    id:'low-voltage-sw', name:'Low Voltage Switch', category:'wall-devices', subcategory:'switches',
    svg: s(T(24,32,'S',22)+T(40,22,'LV',9)+L(16,16,36,6)),
    connectionPoints: CP_B, tags:['low voltage','lv','24v','lighting control','relay panel'], standards:['ANSI']
  },
  {
    id:'ceiling-pull-sw', name:'Ceiling Pull-Chain Switch', category:'wall-devices', subcategory:'switches',
    svg: s(C(30,16,12)+T(30,16,'S',10)+P('M30,28 Q28,36 30,44 Q32,36 30,28')+C(30,44,4,'currentColor')),
    connectionPoints: CP_T, tags:['ceiling pull chain','closet','bath fan','cord switch'], standards:['ANSI']
  },
  {
    id:'doorbell-btn', name:'Doorbell Button', category:'wall-devices', subcategory:'signaling',
    svg: s(C(30,30,20)+P('M23,26 Q23,18 30,18 Q37,18 37,26 L37,34 L23,34 Z')+L(26,34,26,38)+L(34,34,34,38)+C(30,38,3,'currentColor')),
    connectionPoints: CP_LR, tags:['doorbell','chime','button','ring','front door'], standards:['ANSI']
  },
  {
    id:'emergency-stop-btn', name:'Emergency Stop Button', category:'wall-devices', subcategory:'safety',
    svg: s(C(30,30,22)+C(30,30,14)+T(30,26,'E',14)+T(30,38,'STOP',7)),
    connectionPoints: CP_LR, tags:['emergency stop','e-stop','estop','mushroom head','safety','red button'], standards:['ANSI','IEC']
  },
  {
    id:'intercom-btn', name:'Intercom Button', category:'wall-devices', subcategory:'signaling',
    svg: s(R(8,8,44,44,6)+P('M18,26 Q18,20 27,20 Q36,20 36,26 L36,30 Q36,38 27,38 Q18,38 18,34 Z')+T(30,48,'IC',8)),
    connectionPoints: CP_LR, tags:['intercom','talk','call button','entry phone'], standards:['ANSI']
  },
  {
    id:'combo-sw-outlet', name:'Combination Switch/Outlet', category:'wall-devices', subcategory:'combination',
    svg: s(T(18,30,'S',18)+L(10,22,26,14)+R(30,14,20,28,2)+L(34,24,46,24)+L(40,20,40,28)+L(40,28,40,36)),
    connectionPoints: CP_B, tags:['combination','switch outlet','combo','duplex','wired'], standards:['ANSI']
  },

  // ══════════════════════════════════════════════════════════════════
  // CATEGORY 4 — RECEPTACLES & OUTLETS
  // ══════════════════════════════════════════════════════════════════
  {
    id:'outlet-duplex-15a', name:'Duplex Outlet 15A', category:'receptacles', subcategory:'standard',
    svg: s(C(30,28,16)+L(22,28,38,28)+L(22,18,22,28)+L(38,18,38,28)+T(30,50,'15A',9)),
    connectionPoints: CP_B, tags:['outlet','duplex','15 amp','receptacle','standard','nema 5-15'], standards:['ANSI']
  },
  {
    id:'outlet-duplex-20a', name:'Duplex Outlet 20A', category:'receptacles', subcategory:'standard',
    svg: s(C(30,28,16)+L(22,28,38,28)+L(22,18,22,28)+L(38,18,38,28)+T(30,50,'20A',9)),
    connectionPoints: CP_B, tags:['outlet','duplex','20 amp','nema 5-20','t-slot','kitchen','bathroom'], standards:['ANSI']
  },
  {
    id:'outlet-gfci-15a', name:'GFCI Outlet 15A', category:'receptacles', subcategory:'gfci',
    svg: s(C(30,26,14)+L(22,26,38,26)+L(22,18,22,26)+L(38,18,38,26)+T(30,46,'GFI',9)+T(30,54,'15A',8)),
    connectionPoints: CP_B, tags:['gfci','ground fault','gfi','bathroom','kitchen','outdoor','garage','15 amp'], standards:['ANSI']
  },
  {
    id:'outlet-gfci-20a', name:'GFCI Outlet 20A', category:'receptacles', subcategory:'gfci',
    svg: s(C(30,26,14)+L(22,26,38,26)+L(22,18,22,26)+L(38,18,38,26)+T(30,46,'GFI',9)+T(30,54,'20A',8)),
    connectionPoints: CP_B, tags:['gfci','20 amp','ground fault','kitchen','commercial','nema 5-20'], standards:['ANSI']
  },
  {
    id:'outlet-afci', name:'AFCI Outlet', category:'receptacles', subcategory:'afci',
    svg: s(C(30,26,14)+L(22,26,38,26)+L(22,18,22,26)+L(38,18,38,26)+T(30,46,'AFC',9)+T(30,54,'15A',8)),
    connectionPoints: CP_B, tags:['afci','arc fault','bedroom','living room','hallway','fire prevention'], standards:['ANSI']
  },
  {
    id:'outlet-afci-gfci', name:'AFCI/GFCI Combo Outlet', category:'receptacles', subcategory:'combo',
    svg: s(C(30,24,12)+L(22,24,38,24)+L(22,16,22,24)+L(38,16,38,24)+T(30,42,'AF/GF',8)+T(30,50,'COMBO',7)),
    connectionPoints: CP_B, tags:['afci gfci','combination','dual protection','arc fault ground fault'], standards:['ANSI']
  },
  {
    id:'outlet-240v-dryer', name:'Dryer Outlet (NEMA 14-30)', category:'receptacles', subcategory:'240v',
    svg: s(C(30,28,18)+L(20,20,20,32)+L(40,20,40,32)+P('M24,38 L30,38 L36,38')+L(30,20,30,28)+T(30,52,'14-30',8)),
    connectionPoints: CP_B, tags:['dryer','nema 14-30','240v','30 amp','4-wire','laundry'], standards:['ANSI']
  },
  {
    id:'outlet-240v-range', name:'Range Outlet (NEMA 14-50)', category:'receptacles', subcategory:'240v',
    svg: s(C(30,28,18)+L(18,20,18,32)+L(42,20,42,32)+P('M22,38 L38,38')+L(30,20,30,26)+T(30,52,'14-50',8)),
    connectionPoints: CP_B, tags:['range','nema 14-50','240v','50 amp','4-wire','stove','electric range'], standards:['ANSI']
  },
  {
    id:'outlet-240v-6-50', name:'240V Outlet (NEMA 6-50)', category:'receptacles', subcategory:'240v',
    svg: s(C(30,28,18)+L(20,20,20,32)+P('M40,20 L40,30 L30,30')+L(22,38,38,38)+T(30,8,'240V',9)+T(30,52,'6-50',8)),
    connectionPoints: CP_B, tags:['240v','nema 6-50','welder','ev charger','50 amp','3-wire'], standards:['ANSI']
  },
  {
    id:'outlet-twist-lock', name:'Twist-Lock Outlet (NEMA L5-20)', category:'receptacles', subcategory:'locking',
    svg: s(C(30,28,16)+P('M20,22 Q30,18 40,22')+P('M20,34 Q30,38 40,34')+L(30,20,30,24)+L(30,32,30,36)+T(30,52,'L5-20',8)),
    connectionPoints: CP_B, tags:['twist lock','locking','nema l5','l5-15','l5-20','secure','temporary power'], standards:['ANSI']
  },
  {
    id:'outlet-wp', name:'Weatherproof Outlet', category:'receptacles', subcategory:'weatherproof',
    svg: s(C(30,26,14)+L(22,26,38,26)+L(22,18,22,26)+L(38,18,38,26)+P('M12,12 Q30,4 48,12')+T(30,48,'WP',10)),
    connectionPoints: CP_B, tags:['weatherproof','outdoor','wp','in-use cover','gfci','exterior'], standards:['ANSI']
  },
  {
    id:'outlet-usb', name:'USB Outlet (Type A/C)', category:'receptacles', subcategory:'usb',
    svg: s(R(12,12,36,36,4)+T(30,28,'USB',10)+P('M22,44 L30,44 L38,44 M26,44 L26,52 M34,44 L34,52')),
    connectionPoints: CP_B, tags:['usb outlet','type a','type c','charging','smart outlet','data'], standards:['ANSI']
  },
  {
    id:'outlet-floor', name:'Floor Outlet', category:'receptacles', subcategory:'floor',
    svg: s(C(30,34,16)+C(30,34,8)+T(30,34,'F',10)+P('M8,34 Q8,10 30,10 Q52,10 52,34')+T(30,56,'FLR',8)),
    connectionPoints: CP_T, tags:['floor outlet','floor box','recessed','furniture feed','poke-thru'], standards:['ANSI']
  },
  {
    id:'outlet-ceiling', name:'Ceiling Outlet', category:'receptacles', subcategory:'ceiling',
    svg: s(C(30,30,16)+L(18,18,42,42)+L(42,18,18,42)+T(30,54,'CLG',8)),
    connectionPoints: CP_T, tags:['ceiling outlet','overhead','drop cord','plug mold'], standards:['ANSI']
  },
  {
    id:'outlet-split-wired', name:'Split-Wired Duplex Outlet', category:'receptacles', subcategory:'specialty',
    svg: s(C(22,28,10)+L(16,28,28,28)+L(16,20,16,28)+L(28,20,28,28)+C(42,28,10)+L(36,28,48,28)+L(36,20,36,28)+L(48,20,48,28)+L(22,40,42,40)),
    connectionPoints: CP_B, tags:['split wired','switched outlet','half-hot','always hot','tab break'], standards:['ANSI']
  },
  {
    id:'outlet-ig', name:'Isolated Ground Outlet', category:'receptacles', subcategory:'specialty',
    svg: s(C(30,26,14)+L(22,26,38,26)+L(22,18,22,26)+L(38,18,38,26)+P('M24,38 L30,32 L36,38 Z')+T(30,52,'IG',9)),
    connectionPoints: CP_B, tags:['isolated ground','ig','orange','sensitive equipment','computer','medical'], standards:['ANSI']
  },
  {
    id:'outlet-hospital', name:'Hospital Grade Outlet', category:'receptacles', subcategory:'specialty',
    svg: s(C(30,26,14)+L(22,26,38,26)+L(22,18,22,26)+L(38,18,38,26)+C(30,44,5,'currentColor')+T(30,54,'HG',8)),
    connectionPoints: CP_B, tags:['hospital grade','green dot','medical grade','hg','extra grip','healthcare'], standards:['ANSI']
  },
  {
    id:'outlet-switched', name:'Switched Outlet', category:'receptacles', subcategory:'specialty',
    svg: s(C(30,26,14)+L(22,26,38,26)+L(22,18,22,26)+L(38,18,38,26)+T(30,46,'SW',9)),
    connectionPoints: CP_B, tags:['switched outlet','half switched','controlled','lamp control'], standards:['ANSI']
  },
  {
    id:'outlet-rv-50a', name:'RV Outlet 50A (NEMA 14-50)', category:'receptacles', subcategory:'240v',
    svg: s(C(30,28,20)+T(30,22,'RV',11)+T(30,36,'50A',10)+T(30,54,'14-50',8)),
    connectionPoints: CP_B, tags:['rv outlet','nema 14-50','rv park','50 amp','recreational vehicle'], standards:['ANSI']
  },
  {
    id:'outlet-quadruplex', name:'Quadruplex Outlet', category:'receptacles', subcategory:'multi',
    svg: s(R(6,6,48,48,4)+C(18,18,8)+C(42,18,8)+C(18,42,8)+C(42,42,8)+T(30,30,'×4',10)),
    connectionPoints: CP_B, tags:['quadruplex','4-plex','four outlets','power strip','multi outlet'], standards:['ANSI']
  },

  // ══════════════════════════════════════════════════════════════════
  // CATEGORY 5 — LIGHTING FIXTURES
  // ══════════════════════════════════════════════════════════════════
  {
    id:'light-ceiling', name:'Ceiling Light (Generic)', category:'lighting', subcategory:'ceiling',
    svg: s(C(30,30,18)+L(12,30,48,30)+L(30,12,30,48)),
    connectionPoints: CP_T, tags:['ceiling light','fixture','light','general','flush mount'], standards:['ANSI']
  },
  {
    id:'light-recessed', name:'Recessed Downlight', category:'lighting', subcategory:'ceiling',
    svg: s(C(30,30,20)+C(30,30,10)+P('M30,4 L30,10 M30,50 L30,56 M4,30 L10,30 M50,30 L56,30')),
    connectionPoints: CP_T, tags:['recessed','downlight','can light','pot light','hi-hat','ic-rated'], standards:['ANSI']
  },
  {
    id:'light-surface', name:'Surface Mount Fixture', category:'lighting', subcategory:'ceiling',
    svg: s(C(30,30,14,'currentColor')+P('M30,4 L30,12 M30,48 L30,56 M4,30 L12,30 M48,30 L56,30 M11,11 L17,17 M43,43 L49,49 M49,11 L43,17 M11,49 L17,43')),
    connectionPoints: CP_T, tags:['surface mount','ceiling fixture','utility','flush','globe'], standards:['ANSI']
  },
  {
    id:'ceiling-fan', name:'Ceiling Fan', category:'lighting', subcategory:'ceiling',
    svg: s(C(30,30,5,'currentColor')+P('M30,25 Q36,22 40,14 Q33,16 30,25')+P('M35,35 Q38,41 46,44 Q44,37 35,35')+P('M30,35 Q24,38 20,46 Q27,44 30,35')+P('M25,30 Q22,24 14,22 Q16,28 25,30')),
    connectionPoints: CP_T, tags:['ceiling fan','fan','circulation','hunter','hampton bay'], standards:['ANSI']
  },
  {
    id:'ceiling-fan-light', name:'Ceiling Fan with Light', category:'lighting', subcategory:'ceiling',
    svg: s(C(30,30,5,'currentColor')+P('M30,25 Q36,22 40,14 Q33,16 30,25')+P('M35,35 Q38,41 46,44 Q44,37 35,35')+P('M30,35 Q24,38 20,46 Q27,44 30,35')+P('M25,30 Q22,24 14,22 Q16,28 25,30')+L(30,35,30,46)+C(30,49,5)),
    connectionPoints: CP_T, tags:['ceiling fan','light kit','combo','fan light'], standards:['ANSI']
  },
  {
    id:'light-pendant', name:'Pendant Light', category:'lighting', subcategory:'pendant',
    svg: s(L(30,4,30,18)+L(26,4,34,4)+C(30,28,12)+L(22,28,38,28)+L(30,40,30,46)),
    connectionPoints: CP_T, tags:['pendant','hanging light','suspension','island light','decorative'], standards:['ANSI']
  },
  {
    id:'light-chandelier', name:'Chandelier', category:'lighting', subcategory:'pendant',
    svg: s(L(30,2,30,14)+L(12,14,48,14)+L(12,14,12,24)+L(30,14,30,24)+L(48,14,48,24)+C(12,30,8)+C(30,30,8)+C(48,30,8)),
    connectionPoints: CP_T, tags:['chandelier','hanging','crystal','multi-arm','dining room'], standards:['ANSI']
  },
  {
    id:'light-track', name:'Track Lighting', category:'lighting', subcategory:'track',
    svg: s(R(4,22,52,8,4)+C(14,38,7)+C(30,38,7)+C(46,38,7)+L(14,22,14,16)+L(30,22,30,16)+L(46,22,46,16)),
    connectionPoints: CP_T, tags:['track lighting','track','spot','adjustable','gallery','retail'], standards:['ANSI']
  },
  {
    id:'light-wall-sconce', name:'Wall Sconce', category:'lighting', subcategory:'wall',
    svg: s(L(4,8,4,52)+P('M4,30 Q4,12 20,12 Q36,12 36,30 Q36,48 4,48')),
    connectionPoints:[{x:4,y:8,type:'top'},{x:4,y:52,type:'bottom'}],
    tags:['sconce','wall light','decorative','hallway','bedroom'], standards:['ANSI']
  },
  {
    id:'light-vanity', name:'Vanity Light Bar', category:'lighting', subcategory:'wall',
    svg: s(R(4,18,52,10,3)+C(14,38,8)+C(30,38,8)+C(46,38,8)+L(14,28,14,30)+L(30,28,30,30)+L(46,28,46,30)),
    connectionPoints: CP_T, tags:['vanity','bathroom light','bar','globe','mirror light'], standards:['ANSI']
  },
  {
    id:'light-under-cabinet', name:'Under-Cabinet Light', category:'lighting', subcategory:'specialty',
    svg: s(R(4,20,52,14,3)+T(30,27,'UCL',9)+P('M12,34 L20,44 M30,34 L30,44 M48,34 L40,44')),
    connectionPoints: CP_T, tags:['under cabinet','task lighting','ucl','kitchen','puck','strip light'], standards:['ANSI']
  },
  {
    id:'light-fluorescent-2', name:'Fluorescent Fixture (2-Tube)', category:'lighting', subcategory:'fluorescent',
    svg: s(R(4,10,52,40,2)+L(4,23,56,23)+L(4,37,56,37)),
    connectionPoints: CP_T, tags:['fluorescent','2 tube','f32t8','troffer','shop light','t8'], standards:['ANSI']
  },
  {
    id:'light-fluorescent-4', name:'Fluorescent Fixture (4-Tube)', category:'lighting', subcategory:'fluorescent',
    svg: s(R(4,8,52,44,2)+L(4,18,56,18)+L(4,26,56,26)+L(4,34,56,34)+L(4,42,56,42)),
    connectionPoints: CP_T, tags:['fluorescent','4 tube','f96t12','high output','t12','industrial'], standards:['ANSI']
  },
  {
    id:'light-led-panel', name:'LED Panel / Troffer', category:'lighting', subcategory:'led',
    svg: s(R(4,12,52,36,4)+T(30,30,'LED',14)),
    connectionPoints: CP_T, tags:['led','panel','troffer','2x4','2x2','office','commercial','flat'], standards:['ANSI']
  },
  {
    id:'light-led-strip', name:'LED Strip Light', category:'lighting', subcategory:'led',
    svg: s(R(4,24,52,12,3)+P('M10,30 L16,30 M22,30 L28,30 M34,30 L40,30 M46,30 L52,30')),
    connectionPoints: CP_T, tags:['led strip','tape light','rgb','cove','accent','low voltage'], standards:['ANSI']
  },
  {
    id:'light-high-bay', name:'High Bay Light', category:'lighting', subcategory:'industrial',
    svg: s(P('M14,8 L46,8 L54,52 L6,52 Z')+L(30,4,30,8)+P('M14,8 L46,8')),
    connectionPoints: CP_T, tags:['high bay','warehouse','industrial','hid','led high bay','ufo'], standards:['ANSI']
  },
  {
    id:'light-low-bay', name:'Low Bay Light', category:'lighting', subcategory:'industrial',
    svg: s(P('M18,12 L42,12 L50,48 L10,48 Z')+L(30,4,30,12)),
    connectionPoints: CP_T, tags:['low bay','industrial','warehouse','shop','led low bay'], standards:['ANSI']
  },
  {
    id:'light-flood', name:'Flood Light (Outdoor)', category:'lighting', subcategory:'outdoor',
    svg: s(R(20,6,20,14,3)+P('M16,20 L4,52 L56,52 L44,20 Z')+L(30,2,30,6)),
    connectionPoints: CP_T, tags:['flood light','outdoor','security','par38','wide beam','area light'], standards:['ANSI']
  },
  {
    id:'light-step', name:'Step / Path Light', category:'lighting', subcategory:'outdoor',
    svg: s(L(6,54,54,54)+P('M14,54 Q14,24 30,24 Q46,24 46,54')+C(30,34,6)),
    connectionPoints: CP_T, tags:['step light','path light','landscape','stair','low voltage','outdoor'], standards:['ANSI']
  },
  {
    id:'exit-sign', name:'Exit Sign', category:'lighting', subcategory:'emergency',
    svg: s(R(4,14,52,32,2)+T(30,30,'EXIT',12)),
    connectionPoints: CP_T, tags:['exit sign','egress','code required','life safety','nfpa 101'], standards:['ANSI']
  },
  {
    id:'exit-arrow-r', name:'Exit Sign with Arrow (Right)', category:'lighting', subcategory:'emergency',
    svg: s(R(4,14,52,32,2)+T(20,30,'EXIT',10)+P('M36,24 L50,30 L36,36 M42,30 L54,30')),
    connectionPoints: CP_T, tags:['exit sign','arrow','directional','egress'], standards:['ANSI']
  },
  {
    id:'emergency-light', name:'Emergency Light', category:'lighting', subcategory:'emergency',
    svg: s(R(14,22,32,16,2)+P('M4,8 L14,26 L4,44 Z','currentColor')+P('M56,8 L46,26 L56,44 Z','currentColor')),
    connectionPoints: CP_T, tags:['emergency light','egress','bug eyes','battery backup','life safety'], standards:['ANSI']
  },
  {
    id:'emergency-exit-combo', name:'Emergency Exit Combo', category:'lighting', subcategory:'emergency',
    svg: s(R(4,10,52,40,2)+T(30,22,'EXIT',10)+P('M4,22 L14,30 L4,38 Z','currentColor')+P('M56,22 L46,30 L56,38 Z','currentColor')+T(30,42,'EMRG',8)),
    connectionPoints: CP_T, tags:['exit sign','emergency light','combo','egress','combination unit'], standards:['ANSI']
  },
  {
    id:'light-street', name:'Street Light', category:'lighting', subcategory:'outdoor',
    svg: s(L(30,58,30,20)+P('M30,20 Q30,8 46,8')+C(46,8,8,'currentColor')),
    connectionPoints: CP_B, tags:['street light','street lamp','cobra head','roadway','pole mounted'], standards:['ANSI']
  },
  {
    id:'light-parking-lot', name:'Parking Lot Light', category:'lighting', subcategory:'outdoor',
    svg: s(L(30,58,30,22)+R(10,10,40,14,3)+P('M14,16 L46,16')+C(30,16,5,'currentColor')),
    connectionPoints: CP_B, tags:['parking lot','area light','shoebox','pole mount','outdoor'], standards:['ANSI']
  },
  {
    id:'light-landscape', name:'Landscape Light', category:'lighting', subcategory:'outdoor',
    svg: s(C(30,20,12)+L(30,32,30,52)+L(22,52,38,52)+P('M18,12 L14,6 M42,12 L46,6 M30,8 L30,2')),
    connectionPoints: CP_B, tags:['landscape','garden','path light','low voltage','12v outdoor'], standards:['ANSI']
  },
  {
    id:'light-closet', name:'Closet Light (Pull-Chain)', category:'lighting', subcategory:'utility',
    svg: s(C(30,24,16)+P('M30,40 Q28,48 30,56 Q32,48 30,40')+C(30,56,4,'currentColor')),
    connectionPoints: CP_T, tags:['closet light','pull chain','utility','keyless','incandescent'], standards:['ANSI']
  },
  {
    id:'light-night', name:'Night Light', category:'lighting', subcategory:'specialty',
    svg: s(C(30,30,14)+P('M22,22 L18,16 M38,22 L42,16 M46,30 L52,30 M14,30 L8,30 M40,38 L44,44 M20,38 L16,44')+C(30,30,6,'currentColor')),
    connectionPoints: CP_B, tags:['night light','plug in','path lighting','low watt','sensor'], standards:['ANSI']
  },

];


export default SYMBOLS_A;

