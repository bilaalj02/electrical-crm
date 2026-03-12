const s  = (c) => `<svg viewBox="0 0 60 60" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">${c}</svg>`;
const L  = (x1,y1,x2,y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
const C  = (cx,cy,r,f='none') => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${f}"/>`;
const R  = (x,y,w,h,rx=0) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"/>`;
const P  = (d,f='none') => `<path d="${d}" fill="${f}"/>`;
const T  = (x,y,t,sz=9) => `<text x="${x}" y="${y}" font-size="${sz}" fill="currentColor" stroke="none" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif">${t}</text>`;
const E  = (cx,cy,rx,ry) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>`;
const DOT= (x,y) => C(x,y,3,'currentColor');
const CP_LR  = [{x:0,y:30,type:'left'},{x:60,y:30,type:'right'}];
const CP_TB  = [{x:30,y:0,type:'top'},{x:30,y:60,type:'bottom'}];
const CP_T   = [{x:30,y:0,type:'top'}];
const CP_B   = [{x:30,y:60,type:'bottom'}];
const CP_4   = [{x:0,y:30,type:'left'},{x:60,y:30,type:'right'},{x:30,y:0,type:'top'},{x:30,y:60,type:'bottom'}];

export const SYMBOLS_B = [

  // ══════════════════════════════════════════════════════════════════
  // CATEGORY 6 — CIRCUIT PROTECTION
  // ══════════════════════════════════════════════════════════════════
  {
    id:'breaker-1p', name:'Circuit Breaker (1-Pole)', category:'protection', subcategory:'breakers',
    svg: s(L(0,30,12,30)+R(12,12,36,36,2)+L(12,48,48,12)+L(48,30,60,30)),
    connectionPoints: CP_LR, tags:['circuit breaker','1 pole','single pole','breaker','15a','20a','overcurrent'], standards:['ANSI','IEC']
  },
  {
    id:'breaker-2p', name:'Circuit Breaker (2-Pole)', category:'protection', subcategory:'breakers',
    svg: s(L(0,20,12,20)+L(0,40,12,40)+R(12,8,36,44,2)+L(12,52,48,8)+L(48,20,60,20)+L(48,40,60,40)+L(24,8,24,52)),
    connectionPoints:[{x:0,y:20},{x:0,y:40},{x:60,y:20},{x:60,y:40}],
    tags:['circuit breaker','2 pole','double pole','240v','breaker','50a','30a'], standards:['ANSI','IEC']
  },
  {
    id:'breaker-3p', name:'Circuit Breaker (3-Pole)', category:'protection', subcategory:'breakers',
    svg: s(L(0,15,10,15)+L(0,30,10,30)+L(0,45,10,45)+R(10,6,40,48,2)+L(10,54,50,6)+L(50,15,60,15)+L(50,30,60,30)+L(50,45,60,45)+L(24,6,24,54)+L(37,6,37,54)),
    connectionPoints:[{x:0,y:15},{x:0,y:30},{x:0,y:45},{x:60,y:15},{x:60,y:30},{x:60,y:45}],
    tags:['circuit breaker','3 pole','three pole','three phase','motor protection'], standards:['ANSI','IEC']
  },
  {
    id:'breaker-gfci', name:'GFCI Circuit Breaker', category:'protection', subcategory:'breakers',
    svg: s(L(0,30,12,30)+R(12,12,36,36,2)+L(12,48,48,12)+L(48,30,60,30)+T(30,30,'G',11)),
    connectionPoints: CP_LR, tags:['gfci breaker','ground fault breaker','wet location','pool','spa'], standards:['ANSI']
  },
  {
    id:'breaker-afci', name:'AFCI Circuit Breaker', category:'protection', subcategory:'breakers',
    svg: s(L(0,30,12,30)+R(12,12,36,36,2)+L(12,48,48,12)+L(48,30,60,30)+T(30,30,'A',11)),
    connectionPoints: CP_LR, tags:['afci breaker','arc fault breaker','bedroom','living room','nec 2014'], standards:['ANSI']
  },
  {
    id:'breaker-afci-gfci', name:'AFCI/GFCI Combination Breaker', category:'protection', subcategory:'breakers',
    svg: s(L(0,30,12,30)+R(12,12,36,36,2)+L(12,48,48,12)+L(48,30,60,30)+T(30,24,'AF',8)+T(30,36,'GF',8)),
    connectionPoints: CP_LR, tags:['afci gfci breaker','combination breaker','dual protection'], standards:['ANSI']
  },
  {
    id:'breaker-tandem', name:'Tandem / Twin Breaker', category:'protection', subcategory:'breakers',
    svg: s(L(0,20,12,20)+L(0,40,12,40)+R(12,8,18,44,2)+L(12,52,30,8)+R(30,8,18,44,2)+L(30,52,48,8)+L(48,20,60,20)+L(48,40,60,40)),
    connectionPoints:[{x:0,y:20},{x:0,y:40},{x:60,y:20},{x:60,y:40}],
    tags:['tandem breaker','twin','cheater','double','space saver','piggyback'], standards:['ANSI']
  },
  {
    id:'fuse', name:'Fuse (Generic)', category:'protection', subcategory:'fuses',
    svg: s(L(0,30,10,30)+R(10,20,40,20,4)+L(10,40,50,20)+L(50,30,60,30)),
    connectionPoints: CP_LR, tags:['fuse','overcurrent','protection','slow blow','fast acting','cartridge'], standards:['ANSI','IEC']
  },
  {
    id:'fuse-cartridge', name:'Cartridge Fuse', category:'protection', subcategory:'fuses',
    svg: s(L(0,30,10,30)+E(18,30,8,12)+L(18,18,42,18)+L(18,42,42,42)+E(42,30,8,12)+L(50,30,60,30)),
    connectionPoints: CP_LR, tags:['cartridge fuse','class J','class RK','buss','littelfuse'], standards:['ANSI']
  },
  {
    id:'fuse-holder', name:'Fuse Holder', category:'protection', subcategory:'fuses',
    svg: s(R(6,14,48,32,3)+L(6,30,54,30)+E(18,30,6,8)+E(42,30,6,8)+L(0,20,6,20)+L(0,40,6,40)+L(54,20,60,20)+L(54,40,60,40)),
    connectionPoints:[{x:0,y:20},{x:0,y:40},{x:60,y:20},{x:60,y:40}],
    tags:['fuse holder','fuse block','panel mount','disconnect'], standards:['ANSI']
  },
  {
    id:'spd', name:'Surge Protective Device (SPD)', category:'protection', subcategory:'surge',
    svg: s(R(10,10,40,40,3)+T(30,24,'SPD',10)+P('M20,34 L28,42 L36,34 M30,42 L30,50')),
    connectionPoints: CP_4, tags:['spd','surge protector','tvss','lightning','transient','arrestor'], standards:['ANSI','IEC']
  },
  {
    id:'lightning-arrester', name:'Lightning Arrester', category:'protection', subcategory:'surge',
    svg: s(L(30,4,30,20)+P('M20,20 L40,20 L30,34 Z','currentColor')+L(30,34,30,44)+L(22,44,38,44)+L(24,48,36,48)+L(26,52,34,52)),
    connectionPoints: CP_T, tags:['lightning arrester','surge','mog','station class','riser pole'], standards:['ANSI','IEC']
  },
  {
    id:'thermal-overload', name:'Thermal Overload Relay', category:'protection', subcategory:'motor-protection',
    svg: s(R(10,8,40,22,2)+P('M10,20 Q16,28 22,20 Q28,28 34,20 Q40,28 46,20 Q52,28 58,20')+L(20,30,20,52)+DOT(20,30)+DOT(20,52)+L(40,30,40,52)+DOT(40,30)+DOT(40,52)),
    connectionPoints:[{x:0,y:14},{x:60,y:14},{x:20,y:60},{x:40,y:60}],
    tags:['thermal overload','overload relay','motor protection','heater','bimetal'], standards:['ANSI','IEC']
  },
  {
    id:'magnetic-overload', name:'Magnetic Overload Relay', category:'protection', subcategory:'motor-protection',
    svg: s(R(10,6,40,24,3)+P('M16,30 Q22,24 28,30 Q34,24 40,30 Q46,24 52,30')+L(20,36,20,54)+DOT(20,36)+DOT(20,54)+L(40,36,40,54)+DOT(40,36)+DOT(40,54)),
    connectionPoints:[{x:0,y:18},{x:60,y:18},{x:20,y:60},{x:40,y:60}],
    tags:['magnetic overload','instantaneous','motor protection','current trip'], standards:['ANSI','IEC']
  },
  {
    id:'ground-fault-relay', name:'Ground Fault Relay', category:'protection', subcategory:'relays',
    svg: s(R(10,10,40,40,3)+T(30,24,'GF',11)+T(30,38,'RLY',9)),
    connectionPoints: CP_4, tags:['ground fault relay','gfi','leakage current','residual current','rcd'], standards:['ANSI','IEC']
  },
  {
    id:'mccb', name:'Molded Case Circuit Breaker (MCCB)', category:'protection', subcategory:'breakers',
    svg: s(R(8,6,44,48,3)+L(30,6,30,20)+R(22,20,16,8,2)+L(30,28,30,54)+T(30,16,'MCCB',8)),
    connectionPoints: CP_TB, tags:['mccb','molded case','large breaker','industrial','main breaker'], standards:['ANSI','IEC']
  },
  {
    id:'fusible-disconnect', name:'Fusible Disconnect Switch', category:'protection', subcategory:'disconnect',
    svg: s(R(8,8,44,44,3)+E(22,26,8,10)+E(38,26,8,10)+L(8,38,52,38)+L(18,38,34,26)+T(30,50,'FD',9)),
    connectionPoints: CP_LR, tags:['fusible disconnect','fused switch','safety switch','nema 3r','service entrance'], standards:['ANSI']
  },
  {
    id:'rcd', name:'Residual Current Device (RCD)', category:'protection', subcategory:'rcd',
    svg: s(R(10,10,40,40,3)+T(30,24,'RCD',10)+T(30,38,'30mA',8)),
    connectionPoints: CP_4, tags:['rcd','residual current','elcb','gfci','leakage','iec standard'], standards:['IEC']
  },
  {
    id:'overload-relay', name:'Overload Relay (Generic)', category:'protection', subcategory:'motor-protection',
    svg: s(R(12,14,36,32,3)+T(30,30,'OLR',11)+L(0,22,12,22)+L(0,38,12,38)+L(48,22,60,22)+L(48,38,60,38)),
    connectionPoints:[{x:0,y:22},{x:0,y:38},{x:60,y:22},{x:60,y:38}],
    tags:['overload relay','motor protection','olr','thermal magnetic'], standards:['ANSI','IEC']
  },

  // ══════════════════════════════════════════════════════════════════
  // CATEGORY 7 — PANELS & DISTRIBUTION
  // ══════════════════════════════════════════════════════════════════
  {
    id:'panel-main-200a', name:'Main Service Panel 200A', category:'panels', subcategory:'service',
    svg: s(R(6,4,48,52,2)+L(6,18,54,18)+L(6,34,54,34)+L(6,46,54,46)+T(30,11,'MAIN PANEL',7)+T(30,26,'200A',10)+T(30,40,'120/240V',7)),
    connectionPoints:[{x:30,y:0,type:'top'},{x:0,y:30,type:'left'},{x:60,y:30,type:'right'},{x:30,y:60,type:'bottom'}],
    tags:['main panel','200 amp','service entrance','load center','circuit breaker panel'], standards:['ANSI']
  },
  {
    id:'panel-main-100a', name:'Main Service Panel 100A', category:'panels', subcategory:'service',
    svg: s(R(6,4,48,52,2)+L(6,18,54,18)+L(6,34,54,34)+T(30,11,'MAIN PANEL',7)+T(30,26,'100A',10)+T(30,42,'120/240V',7)),
    connectionPoints: CP_4, tags:['main panel','100 amp','service','residential','small service'], standards:['ANSI']
  },
  {
    id:'panel-main-400a', name:'Main Service Panel 400A', category:'panels', subcategory:'service',
    svg: s(R(6,4,48,52,2)+L(6,18,54,18)+L(6,34,54,34)+L(6,46,54,46)+T(30,11,'MAIN PANEL',7)+T(30,26,'400A',10)+T(30,40,'120/240V',7)),
    connectionPoints: CP_4, tags:['main panel','400 amp','large service','commercial','industrial'], standards:['ANSI']
  },
  {
    id:'sub-panel', name:'Sub-Panel / Load Center', category:'panels', subcategory:'sub-panels',
    svg: s(R(8,4,44,52,2)+L(8,20,52,20)+L(8,40,52,40)+T(30,12,'SUB-PANEL',7)+R(14,24,14,12,1)+R(32,24,14,12,1)+R(14,44,14,10,1)+R(32,44,14,10,1)),
    connectionPoints: CP_4, tags:['sub panel','subpanel','load center','branch panel','distribution'], standards:['ANSI']
  },
  {
    id:'meter-socket', name:'Meter Socket', category:'panels', subcategory:'metering',
    svg: s(C(30,30,20)+T(30,26,'kWh',10)+C(30,30,10)+T(30,38,'M',10)),
    connectionPoints: CP_TB, tags:['meter socket','electric meter','utility meter','kwh','service meter'], standards:['ANSI']
  },
  {
    id:'meter-ct', name:'CT-Rated Meter', category:'panels', subcategory:'metering',
    svg: s(C(30,30,20)+T(30,24,'CT',11)+T(30,36,'MTR',9)+C(30,30,8)),
    connectionPoints: CP_TB, tags:['ct rated meter','current transformer meter','large service','commercial meter'], standards:['ANSI']
  },
  {
    id:'bus-bar-h', name:'Bus Bar (Horizontal)', category:'panels', subcategory:'bus',
    svg: s(R(4,22,52,16,2)+L(14,14,14,22)+L(24,14,24,22)+L(36,14,36,22)+L(46,14,46,22)+L(14,38,14,46)+L(24,38,24,46)+L(36,38,36,46)+L(46,38,46,46)),
    connectionPoints:[{x:14,y:8},{x:24,y:8},{x:36,y:8},{x:46,y:8},{x:14,y:52},{x:24,y:52},{x:36,y:52},{x:46,y:52}],
    tags:['bus bar','busbar','neutral','distribution','panel','copper bar'], standards:['ANSI','IEC']
  },
  {
    id:'neutral-bar', name:'Neutral Bar', category:'panels', subcategory:'bus',
    svg: s(R(4,22,52,16,2)+T(30,30,'N',12)+L(14,14,14,22)+L(24,14,24,22)+L(36,14,36,22)+L(46,14,46,22)),
    connectionPoints:[{x:14,y:8},{x:24,y:8},{x:36,y:8},{x:46,y:8},{x:0,y:30},{x:60,y:30}],
    tags:['neutral bar','neutral','white wire','return','neutral bus'], standards:['ANSI']
  },
  {
    id:'ground-bar-panel', name:'Ground Bar', category:'panels', subcategory:'bus',
    svg: s(R(4,22,52,16,2)+T(30,30,'G',12)+L(14,38,14,46)+L(24,38,24,46)+L(36,38,36,46)+L(46,38,46,46)),
    connectionPoints:[{x:14,y:52},{x:24,y:52},{x:36,y:52},{x:46,y:52},{x:0,y:30},{x:60,y:30}],
    tags:['ground bar','ground bus','equipment ground','green wire','bonding'], standards:['ANSI']
  },
  {
    id:'wireway', name:'Wireway / Gutter', category:'panels', subcategory:'raceways',
    svg: s(L(4,16,56,16)+L(4,44,56,44)+L(4,16,4,44)+L(56,16,56,44)+L(4,30,56,30)),
    connectionPoints:[{x:0,y:16},{x:0,y:44},{x:60,y:16},{x:60,y:44}],
    tags:['wireway','gutter','pull section','wiring duct','hinged cover'], standards:['ANSI']
  },
  {
    id:'panelboard', name:'Panelboard (Flush)', category:'panels', subcategory:'panels',
    svg: s(R(6,4,48,52,2)+R(10,8,40,44)+T(30,30,'PANEL',9)),
    connectionPoints: CP_4, tags:['panelboard','flush mount','breaker box','circuit panel','distribution panel'], standards:['ANSI']
  },
  {
    id:'dist-board', name:'Distribution Board', category:'panels', subcategory:'panels',
    svg: s(R(8,4,44,52,2)+L(8,18,52,18)+L(18,18,18,56)+L(30,18,30,56)+L(42,18,42,56)+T(30,11,'DB',10)),
    connectionPoints:[{x:30,y:0},{x:0,y:30},{x:60,y:30}],
    tags:['distribution board','db','mcc','power center','feeder distribution'], standards:['ANSI','IEC']
  },
  {
    id:'mlo-panel', name:'Main Lug Only (MLO) Panel', category:'panels', subcategory:'panels',
    svg: s(R(6,4,48,52,2)+T(30,18,'MLO',11)+T(30,30,'PANEL',9)+T(30,44,'NO MAIN',7)),
    connectionPoints: CP_4, tags:['mlo','main lug only','no main breaker','feeder tap','sub panel'], standards:['ANSI']
  },
  {
    id:'pdu', name:'Power Distribution Unit (PDU)', category:'panels', subcategory:'specialty',
    svg: s(R(6,4,48,52,2)+T(30,18,'PDU',11)+R(12,26,36,10,2)+R(12,40,36,10,2)+T(30,58,'RACK',8)),
    connectionPoints: CP_4, tags:['pdu','power strip','rack mount','data center','server room'], standards:['ANSI']
  },
  {
    id:'busway', name:'Busway Section', category:'panels', subcategory:'bus',
    svg: s(L(4,18,56,18)+L(4,28,56,28)+L(4,32,56,32)+L(4,42,56,42)+L(4,18,4,42)+L(56,18,56,42)+L(10,18,10,42)+L(50,18,50,42)),
    connectionPoints: CP_LR, tags:['busway','bus duct','plug-in bus','feeder bus','distribution duct'], standards:['ANSI']
  },
  {
    id:'meter-base-disconnect', name:'Meter Base with Disconnect', category:'panels', subcategory:'metering',
    svg: s(C(24,22,14)+T(24,22,'M',11)+R(38,14,16,20,2)+L(38,24,54,24)+L(44,24,36,14)+T(46,30,'SW',7)),
    connectionPoints: CP_TB, tags:['meter base','disconnect','rural','pedestal','mobile home'], standards:['ANSI']
  },
  {
    id:'feed-thru-lugs', name:'Feed-Through Lugs', category:'panels', subcategory:'specialty',
    svg: s(R(14,14,32,32,2)+L(30,4,30,14)+L(30,46,30,56)+T(30,30,'LUG',9)),
    connectionPoints: CP_TB, tags:['feed through lugs','tandem','series panels','daisy chain','downstream panel'], standards:['ANSI']
  },

  // ══════════════════════════════════════════════════════════════════
  // CATEGORY 8 — TRANSFORMERS
  // ══════════════════════════════════════════════════════════════════
  {
    id:'xfmr-2winding', name:'Transformer (2-Winding)', category:'transformers', subcategory:'power',
    svg: s(C(18,30,14)+C(42,30,14)+L(0,30,4,30)+L(56,30,60,30)),
    connectionPoints: CP_LR, tags:['transformer','2 winding','isolation','step up','step down','xfmr'], standards:['ANSI','IEC']
  },
  {
    id:'xfmr-isolation', name:'Isolation Transformer', category:'transformers', subcategory:'isolation',
    svg: s(C(18,30,14)+C(42,30,14)+L(30,16,30,44)+L(0,30,4,30)+L(56,30,60,30)),
    connectionPoints: CP_LR, tags:['isolation transformer','medical','audio','noise rejection','1:1'], standards:['ANSI','IEC']
  },
  {
    id:'xfmr-auto', name:'Auto-Transformer', category:'transformers', subcategory:'auto',
    svg: s(C(30,30,20)+P('M30,10 L30,30')+DOT(30,30)+L(0,30,10,30)+L(30,30,60,30)+L(30,50,30,60)),
    connectionPoints:[{x:0,y:30},{x:60,y:30},{x:30,y:60}],
    tags:['auto transformer','autotransformer','variac','buck boost','tap'], standards:['ANSI','IEC']
  },
  {
    id:'xfmr-control', name:'Control Transformer', category:'transformers', subcategory:'control',
    svg: s(C(18,30,14)+C(42,30,14)+L(0,30,4,30)+L(56,30,60,30)+T(10,16,'480',7)+T(50,16,'120',7)),
    connectionPoints: CP_LR, tags:['control transformer','480v 120v','panel transformer','cpt','control power'], standards:['ANSI']
  },
  {
    id:'ct-sym', name:'Current Transformer (CT)', category:'transformers', subcategory:'instrument',
    svg: s(C(30,30,20)+L(0,30,60,30)+T(30,16,'CT',11)),
    connectionPoints: CP_LR, tags:['current transformer','ct','metering','protection relay','ratio'], standards:['ANSI','IEC']
  },
  {
    id:'pt-sym', name:'Potential Transformer (PT)', category:'transformers', subcategory:'instrument',
    svg: s(C(18,30,14)+C(42,30,14)+T(30,14,'PT',9)+L(0,30,4,30)+L(56,30,60,30)),
    connectionPoints: CP_LR, tags:['potential transformer','pt','vt','voltage transformer','metering'], standards:['ANSI','IEC']
  },
  {
    id:'xfmr-3ph-dy', name:'3-Phase Delta-Wye Transformer', category:'transformers', subcategory:'three-phase',
    svg: s(P('M4,44 L18,16 L32,44 Z')+P('M36,16 L36,36 M30,28 L42,28 M36,36 L30,44 M36,36 L42,44')+T(10,52,'Δ',11)+T(40,52,'Y',11)),
    connectionPoints:[{x:0,y:30},{x:60,y:30}],
    tags:['delta wye','3 phase transformer','dy','distribution','utility transformer'], standards:['ANSI','IEC']
  },
  {
    id:'xfmr-3ph-dd', name:'3-Phase Delta-Delta Transformer', category:'transformers', subcategory:'three-phase',
    svg: s(P('M4,44 L16,16 L28,44 Z')+P('M32,44 L44,16 L56,44 Z')+T(14,54,'Δ',11)+T(44,54,'Δ',11)),
    connectionPoints:[{x:0,y:30},{x:60,y:30}],
    tags:['delta delta','3 phase','dd','industrial','ungrounded'], standards:['ANSI','IEC']
  },
  {
    id:'xfmr-3ph-yy', name:'3-Phase Wye-Wye Transformer', category:'transformers', subcategory:'three-phase',
    svg: s(P('M12,16 L12,36 M6,28 L18,28 M12,36 L8,44 M12,36 L16,44')+P('M44,16 L44,36 M38,28 L50,28 M44,36 L40,44 M44,36 L48,44')+T(12,54,'Y',11)+T(44,54,'Y',11)),
    connectionPoints:[{x:0,y:30},{x:60,y:30}],
    tags:['wye wye','3 phase','yy','commercial','4-wire'], standards:['ANSI','IEC']
  },
  {
    id:'buck-boost-xfmr', name:'Buck-Boost Transformer', category:'transformers', subcategory:'auto',
    svg: s(C(18,30,14)+C(42,30,14)+L(0,30,4,30)+L(56,30,60,30)+T(12,18,'−',12)+T(48,18,'+',12)),
    connectionPoints: CP_LR, tags:['buck boost','voltage correction','208v 240v','drop boost'], standards:['ANSI']
  },
  {
    id:'toroidal-xfmr', name:'Toroidal Transformer', category:'transformers', subcategory:'specialty',
    svg: s(C(30,30,22)+C(30,30,12)+T(30,30,'T',11)),
    connectionPoints: CP_LR, tags:['toroidal','ring core','low EMI','audio','medical','low noise'], standards:['IEC']
  },
  {
    id:'pole-xfmr', name:'Pole-Mounted Transformer', category:'transformers', subcategory:'utility',
    svg: s(C(30,18,16)+T(30,18,'kVA',9)+L(30,34,30,56)+L(20,56,40,56)+T(30,50,'POLE',8)),
    connectionPoints:[{x:30,y:0},{x:20,y:60},{x:40,y:60}],
    tags:['pole transformer','overhead','utility','distribution','pad mount'], standards:['ANSI']
  },
  {
    id:'xfmr-step-up', name:'Step-Up Transformer', category:'transformers', subcategory:'power',
    svg: s(C(18,30,14)+C(42,30,14)+L(0,30,4,30)+L(56,30,60,30)+P('M46,20 L50,14 L54,20')+T(10,16,'LV',8)+T(50,38,'HV',8)),
    connectionPoints: CP_LR, tags:['step up','high voltage','hvac','generator','transmission'], standards:['ANSI','IEC']
  },
  {
    id:'xfmr-step-down', name:'Step-Down Transformer', category:'transformers', subcategory:'power',
    svg: s(C(18,30,14)+C(42,30,14)+L(0,30,4,30)+L(56,30,60,30)+P('M46,40 L50,46 L54,40')+T(10,16,'HV',8)+T(50,16,'LV',8)),
    connectionPoints: CP_LR, tags:['step down','distribution','120v 240v','residential','commercial'], standards:['ANSI','IEC']
  },

  // ══════════════════════════════════════════════════════════════════
  // CATEGORY 9 — MOTORS & DRIVES
  // ══════════════════════════════════════════════════════════════════
  {
    id:'motor-1ph', name:'AC Motor (Single Phase)', category:'motors-drives', subcategory:'ac-motors',
    svg: s(C(30,30,22)+T(30,24,'M',16)+T(30,38,'1~',10)+L(0,30,8,30)+L(52,30,60,30)),
    connectionPoints: CP_LR, tags:['motor','ac motor','single phase','1 phase','induction','fractional hp'], standards:['ANSI','IEC']
  },
  {
    id:'motor-3ph', name:'AC Motor (Three Phase)', category:'motors-drives', subcategory:'ac-motors',
    svg: s(C(30,30,22)+T(30,24,'M',16)+T(30,38,'3~',10)+L(0,18,8,22)+L(0,30,8,30)+L(0,42,8,38)),
    connectionPoints:[{x:0,y:18},{x:0,y:30},{x:0,y:42},{x:60,y:30}],
    tags:['motor','3 phase','three phase','ac motor','induction','squirrel cage'], standards:['ANSI','IEC']
  },
  {
    id:'motor-dc', name:'DC Motor', category:'motors-drives', subcategory:'dc-motors',
    svg: s(C(30,30,22)+T(30,24,'M',16)+T(30,38,'DC',10)+L(0,30,8,30)+L(52,30,60,30)),
    connectionPoints: CP_LR, tags:['dc motor','direct current','servo drive','brush','brushless'], standards:['ANSI','IEC']
  },
  {
    id:'servo-motor', name:'Servo Motor', category:'motors-drives', subcategory:'servo',
    svg: s(C(30,30,22)+T(30,24,'SRV',10)+T(30,38,'M',12)+L(0,30,8,30)+L(52,30,60,30)),
    connectionPoints: CP_LR, tags:['servo motor','servo','closed loop','encoder','cnc','robot'], standards:['IEC']
  },
  {
    id:'stepper-motor', name:'Stepper Motor', category:'motors-drives', subcategory:'stepper',
    svg: s(C(30,30,22)+T(30,24,'STP',10)+T(30,38,'M',12)+L(0,24,8,26)+L(0,30,8,30)+L(0,36,8,34)),
    connectionPoints:[{x:0,y:24},{x:0,y:30},{x:0,y:36},{x:60,y:30}],
    tags:['stepper motor','step motor','cnc','3d printer','positioning'], standards:['IEC']
  },
  {
    id:'vfd', name:'Variable Frequency Drive (VFD)', category:'motors-drives', subcategory:'drives',
    svg: s(R(4,8,52,44,3)+T(30,22,'VFD',11)+P('M10,34 Q20,28 30,34 Q40,40 50,34')+L(0,18,4,18)+L(0,30,4,30)+L(56,30,60,30)),
    connectionPoints:[{x:0,y:18},{x:0,y:30},{x:60,y:30}],
    tags:['vfd','variable frequency drive','inverter','adjustable speed','acs','powerflex'], standards:['ANSI','IEC']
  },
  {
    id:'soft-starter', name:'Soft Starter', category:'motors-drives', subcategory:'drives',
    svg: s(R(6,10,48,40,3)+T(30,22,'SOFT',9)+T(30,32,'START',8)+P('M10,42 Q20,30 50,18')),
    connectionPoints: CP_LR, tags:['soft starter','reduced voltage','rv','rvss','starting current','altistart'], standards:['ANSI','IEC']
  },
  {
    id:'motor-starter-mag', name:'Magnetic Motor Starter', category:'motors-drives', subcategory:'starters',
    svg: s(R(8,6,44,48,3)+R(16,12,28,14,2)+T(30,19,'M',10)+L(8,32,52,32)+L(20,32,40,20)+T(30,46,'MAG',9)),
    connectionPoints: CP_LR, tags:['magnetic starter','motor starter','dol','full voltage','contactor'], standards:['ANSI']
  },
  {
    id:'star-delta-starter', name:'Star-Delta (Y-Δ) Starter', category:'motors-drives', subcategory:'starters',
    svg: s(R(6,8,48,44,3)+T(22,30,'Y',14)+T(38,30,'Δ',15)+L(30,8,30,52)),
    connectionPoints: CP_LR, tags:['star delta','wye delta','y delta','reduced voltage','large motor'], standards:['ANSI','IEC']
  },
  {
    id:'mcc', name:'Motor Control Center (MCC)', category:'motors-drives', subcategory:'mcc',
    svg: s(R(6,4,48,52,2)+T(30,16,'MCC',11)+L(6,22,54,22)+L(6,36,54,36)+L(6,48,54,48)+R(12,26,16,8,1)+R(32,26,16,8,1)+R(12,40,16,6,1)+R(32,40,16,6,1)),
    connectionPoints: CP_4, tags:['mcc','motor control center','bucket','starter module','industrial'], standards:['ANSI']
  },
  {
    id:'gearmotor', name:'Gearmotor', category:'motors-drives', subcategory:'specialty',
    svg: s(C(18,30,14)+T(18,30,'M',11)+C(38,30,12)+T(38,30,'G',10)+L(0,30,4,30)+L(50,30,60,30)),
    connectionPoints: CP_LR, tags:['gearmotor','gear motor','reducted speed','torque','conveyor'], standards:['ANSI']
  },
  {
    id:'motor-disconnect-sw', name:'Motor Disconnect Switch', category:'motors-drives', subcategory:'disconnect',
    svg: s(R(8,8,44,44,2)+T(30,24,'DISC',9)+L(14,30,46,30)+L(18,30,42,20)+T(30,44,'M',10)),
    connectionPoints: CP_LR, tags:['motor disconnect','nec required','lockable','safety switch','local disconnect'], standards:['ANSI']
  },
  {
    id:'brake-electromagnetic', name:'Electromagnetic Brake', category:'motors-drives', subcategory:'accessories',
    svg: s(C(30,26,16)+T(30,26,'B',12)+R(10,42,40,12,2)+L(30,42,30,36)+L(14,44,46,44)),
    connectionPoints: CP_LR, tags:['brake','electromagnetic brake','holding brake','motor brake','fail safe'], standards:['ANSI','IEC']
  },
  {
    id:'dol-starter', name:'Direct On-Line (DOL) Starter', category:'motors-drives', subcategory:'starters',
    svg: s(R(6,8,48,44,3)+T(30,24,'DOL',11)+T(30,38,'START',8)),
    connectionPoints: CP_LR, tags:['dol','direct on line','full voltage','starter','across the line'], standards:['ANSI','IEC']
  },
  {
    id:'reversing-starter', name:'Reversing Motor Starter', category:'motors-drives', subcategory:'starters',
    svg: s(R(6,8,48,44,3)+P('M14,22 L26,22 M20,16 L26,22 L20,28')+P('M46,38 L34,38 M40,32 L34,38 L40,44')+T(30,30,'REV',9)),
    connectionPoints: CP_LR, tags:['reversing starter','forward reverse','cw ccw','conveyor','motor control'], standards:['ANSI']
  },

  // ══════════════════════════════════════════════════════════════════
  // CATEGORY 10 — CONTROL DEVICES
  // ══════════════════════════════════════════════════════════════════
  {
    id:'relay-coil', name:'Relay Coil', category:'control', subcategory:'relays',
    svg: s(L(0,30,12,30)+R(12,18,36,24,2)+L(48,30,60,30)+L(20,18,20,42)+L(28,18,28,42)+L(36,18,36,42)+L(44,18,44,42)),
    connectionPoints: CP_LR, tags:['relay coil','coil','contactor coil','electromagnet','relay solenoid'], standards:['ANSI','IEC']
  },
  {
    id:'relay-spst-contacts', name:'Relay Contacts (SPST-NO)', category:'control', subcategory:'relay-contacts',
    svg: s(L(0,30,20,30)+DOT(20,30)+DOT(40,30)+L(22,30,38,18)+L(40,30,60,30)+P('M30,14 Q30,8 30,4')),
    connectionPoints: CP_LR, tags:['relay contact','normally open','no contact','auxiliary','output'], standards:['ANSI','IEC']
  },
  {
    id:'contactor-3p', name:'Contactor (3-Pole)', category:'control', subcategory:'contactors',
    svg: s(R(22,40,16,16,2)+L(30,56,30,60)+L(30,40,30,32)+L(14,14,14,32)+DOT(14,32)+DOT(14,14)+P('M15,14 L13,8')+L(30,14,30,32)+DOT(30,32)+DOT(30,14)+P('M31,14 L29,8')+L(46,14,46,32)+DOT(46,32)+DOT(46,14)+P('M47,14 L45,8')),
    connectionPoints:[{x:14,y:4},{x:30,y:4},{x:46,y:4},{x:14,y:56},{x:30,y:56},{x:46,y:56}],
    tags:['contactor','3 pole','motor contactor','power contactor','line contactor'], standards:['ANSI','IEC']
  },
  {
    id:'contactor-2p', name:'Contactor (2-Pole)', category:'control', subcategory:'contactors',
    svg: s(R(22,40,16,16,2)+L(30,56,30,60)+L(30,40,30,32)+L(18,14,18,32)+DOT(18,32)+DOT(18,14)+P('M19,14 L17,8')+L(42,14,42,32)+DOT(42,32)+DOT(42,14)+P('M43,14 L41,8')),
    connectionPoints:[{x:18,y:4},{x:42,y:4},{x:18,y:56},{x:42,y:56}],
    tags:['contactor','2 pole','capacitor switching','lighting contactor'], standards:['ANSI','IEC']
  },
  {
    id:'tdr-on-delay', name:'Timer Relay (On-Delay)', category:'control', subcategory:'timers',
    svg: s(R(10,10,40,40,3)+C(30,30,12)+L(30,18,30,30)+L(30,30,38,30)+P('M20,6 L28,12 L36,6')),
    connectionPoints: CP_4, tags:['timer relay','on delay','tdr','tod','time delay','interval'], standards:['ANSI','IEC']
  },
  {
    id:'tdr-off-delay', name:'Timer Relay (Off-Delay)', category:'control', subcategory:'timers',
    svg: s(R(10,10,40,40,3)+C(30,30,12)+L(30,18,30,30)+L(30,30,38,30)+P('M20,54 L28,48 L36,54')),
    connectionPoints: CP_4, tags:['timer relay','off delay','tof','time delay','hvac control'], standards:['ANSI','IEC']
  },
  {
    id:'plc', name:'PLC (Programmable Logic Controller)', category:'control', subcategory:'plc',
    svg: s(R(4,4,52,52,3)+T(30,18,'PLC',12)+L(4,26,56,26)+T(16,38,'IN',9)+T(44,38,'OUT',9)+L(32,26,32,56)),
    connectionPoints: CP_4, tags:['plc','programmable logic controller','automation','siemens','allen bradley','ladder logic'], standards:['IEC']
  },
  {
    id:'plc-input', name:'PLC Input Module', category:'control', subcategory:'plc',
    svg: s(R(8,4,44,52,3)+T(30,18,'INPUT',8)+T(30,28,'MODULE',7)+L(8,34,52,34)+L(14,4,14,12)+L(22,4,22,12)+L(30,4,30,12)+L(38,4,38,12)+L(46,4,46,12)),
    connectionPoints:[{x:14,y:0},{x:22,y:0},{x:30,y:0},{x:38,y:0},{x:46,y:0},{x:30,y:60}],
    tags:['plc input','digital input','di module','field devices'], standards:['IEC']
  },
  {
    id:'plc-output', name:'PLC Output Module', category:'control', subcategory:'plc',
    svg: s(R(8,4,44,52,3)+T(30,22,'OUTPUT',8)+T(30,32,'MODULE',7)+L(8,42,52,42)+L(14,48,14,56)+L(22,48,22,56)+L(30,48,30,56)+L(38,48,38,56)+L(46,48,46,56)),
    connectionPoints:[{x:30,y:0},{x:14,y:60},{x:22,y:60},{x:30,y:60},{x:38,y:60},{x:46,y:60}],
    tags:['plc output','digital output','do module','relay output','transistor output'], standards:['IEC']
  },
  {
    id:'hmi', name:'HMI / Operator Panel', category:'control', subcategory:'hmi',
    svg: s(R(4,4,52,52,3)+R(10,10,40,30,2)+T(30,25,'HMI',11)+L(18,56,42,56)+L(30,40,30,56)),
    connectionPoints: CP_4, tags:['hmi','touchscreen','operator panel','scada','plc display','weinview'], standards:['IEC']
  },
  {
    id:'estop-station', name:'E-Stop Station', category:'control', subcategory:'safety',
    svg: s(R(6,6,48,48,4)+C(30,28,16)+T(30,24,'E',14)+T(30,36,'STOP',8)+L(30,44,30,54)),
    connectionPoints: CP_B, tags:['emergency stop','estop','e-stop','mushroom','safety relay','machine safety'], standards:['ANSI','IEC']
  },
  {
    id:'pushbtn-start-stop', name:'Start/Stop Push Button Station', category:'control', subcategory:'stations',
    svg: s(R(6,6,48,48,5)+C(20,26,10)+T(20,26,'G',9)+C(40,26,10)+T(40,26,'R',9)+T(20,42,'START',6)+T(40,42,'STOP',6)),
    connectionPoints: CP_4, tags:['push button','start stop','2 button','station','green red'], standards:['ANSI']
  },
  {
    id:'control-relay', name:'Control Relay (CR)', category:'control', subcategory:'relays',
    svg: s(R(14,18,32,24,2)+T(30,30,'CR',11)+L(0,30,14,30)+L(46,30,60,30)),
    connectionPoints: CP_LR, tags:['control relay','cr','aux relay','ice cube relay','11 pin'], standards:['ANSI','IEC']
  },
  {
    id:'latching-relay', name:'Latching / Bistable Relay', category:'control', subcategory:'relays',
    svg: s(R(14,18,32,24,2)+T(30,30,'L',13)+L(0,26,14,26)+L(0,34,14,34)+L(46,30,60,30)),
    connectionPoints:[{x:0,y:26},{x:0,y:34},{x:60,y:30}],
    tags:['latching relay','bistable','set reset','memory relay','maintained'], standards:['ANSI','IEC']
  },
  {
    id:'counter', name:'Electronic Counter', category:'control', subcategory:'counters',
    svg: s(R(8,10,44,40,3)+T(30,24,'CNT',9)+R(14,30,32,12,2)+T(30,36,'000',9)),
    connectionPoints: CP_4, tags:['counter','totalizer','batch counter','preset counter','production count'], standards:['IEC']
  },
  {
    id:'din-terminal', name:'DIN Rail Terminal Block', category:'control', subcategory:'terminals',
    svg: s(R(4,18,52,24,2)+L(4,30,56,30)+L(14,18,14,42)+L(28,18,28,42)+L(42,18,42,42)+L(10,10,10,18)+L(24,10,24,18)+L(38,10,38,18)+L(52,10,52,18)+L(10,42,10,50)+L(24,42,24,50)+L(38,42,38,50)+L(52,42,52,50)),
    connectionPoints:[{x:10,y:4},{x:24,y:4},{x:38,y:4},{x:52,y:4},{x:10,y:56},{x:24,y:56},{x:38,y:56},{x:52,y:56}],
    tags:['terminal block','din rail','weidmuller','phoenix','wiring terminal','tb'], standards:['IEC']
  },

];


export default SYMBOLS_B;
