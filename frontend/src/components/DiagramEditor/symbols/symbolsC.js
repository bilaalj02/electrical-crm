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

export const SYMBOLS_C = [

  // ══════════════════════════════════════════════════════════════════
  // CATEGORY 11 — SENSORS & DETECTORS
  // ══════════════════════════════════════════════════════════════════
  {
    id:'thermostat-heat', name:'Thermostat (Heating)', category:'sensors', subcategory:'temperature',
    svg: s(R(8,8,44,44,6)+T(30,22,'TSTAT',8)+T(30,36,'HEAT',9)),
    connectionPoints: CP_LR, tags:['thermostat','heating','hvac','temperature control','setpoint'], standards:['ANSI']
  },
  {
    id:'thermostat-cool', name:'Thermostat (Cooling)', category:'sensors', subcategory:'temperature',
    svg: s(R(8,8,44,44,6)+T(30,22,'TSTAT',8)+T(30,36,'COOL',9)),
    connectionPoints: CP_LR, tags:['thermostat','cooling','air conditioning','hvac','setpoint'], standards:['ANSI']
  },
  {
    id:'thermostat-smart', name:'Smart Thermostat', category:'sensors', subcategory:'temperature',
    svg: s(R(8,8,44,44,6)+T(30,20,'SMART',8)+T(30,30,'TSTAT',8)+P('M36,42 Q40,38 44,42')+P('M34,38 Q40,32 46,38')+C(40,44,2,'currentColor')),
    connectionPoints: CP_LR, tags:['smart thermostat','wifi','nest','ecobee','connected','learning'], standards:['ANSI']
  },
  {
    id:'pressure-sensor', name:'Pressure Sensor / Transducer', category:'sensors', subcategory:'pressure',
    svg: s(P('M30,4 L56,30 L30,56 L4,30 Z')+T(30,30,'P',14)),
    connectionPoints: CP_4, tags:['pressure sensor','transducer','psi','bar','transmitter','4-20ma'], standards:['ANSI','IEC']
  },
  {
    id:'level-float', name:'Level Sensor (Float Switch)', category:'sensors', subcategory:'level',
    svg: s(L(6,30,40,30)+L(40,30,40,12)+C(40,8,8)+P('M2,24 L6,30 L2,36')+T(40,8,'F',9)),
    connectionPoints:[{x:0,y:30},{x:60,y:30}],
    tags:['float switch','level switch','sump','tank level','water level','ls'], standards:['ANSI']
  },
  {
    id:'level-sensor', name:'Level Sensor (Ultrasonic/Probe)', category:'sensors', subcategory:'level',
    svg: s(R(16,4,28,18,3)+T(30,13,'LVL',8)+P('M16,26 Q8,32 16,38')+P('M20,28 Q10,34 20,40')+P('M44,26 Q52,32 44,38')+P('M40,28 Q50,34 40,40')),
    connectionPoints: CP_B, tags:['level sensor','ultrasonic','capacitive probe','tank','level transmitter'], standards:['IEC']
  },
  {
    id:'flow-sensor', name:'Flow Sensor / Meter', category:'sensors', subcategory:'flow',
    svg: s(L(0,30,60,30)+L(4,20,4,40)+L(56,20,56,40)+P('M22,20 L38,30 L22,40 Z','currentColor')+C(30,30,4)),
    connectionPoints: CP_LR, tags:['flow sensor','flow meter','paddlewheel','turbine','vortex','4-20ma'], standards:['ANSI','IEC']
  },
  {
    id:'motion-pir', name:'PIR Motion Sensor', category:'sensors', subcategory:'motion',
    svg: s(P('M8,42 Q8,14 30,14 Q52,14 52,42 Z')+P('M4,40 Q0,22 6,10')+P('M56,40 Q60,22 54,10')+C(30,32,6,'currentColor')),
    connectionPoints: CP_B, tags:['pir','motion sensor','passive infrared','occupancy','intruder','burglar'], standards:['ANSI']
  },
  {
    id:'occupancy-sensor', name:'Ceiling Occupancy Sensor', category:'sensors', subcategory:'motion',
    svg: s(E(30,42,24,8)+P('M6,42 Q30,14 54,42')+P('M12,40 Q30,20 48,40')+C(30,42,6,'currentColor')),
    connectionPoints: CP_T, tags:['occupancy sensor','360 degree','ceiling mount','bi-level','energy saving'], standards:['ANSI']
  },
  {
    id:'inductive-proximity', name:'Inductive Proximity Sensor', category:'sensors', subcategory:'proximity',
    svg: s(R(6,18,48,24,12)+T(30,30,'IN',10)+P('M2,30 Q-2,20 2,10')+P('M58,30 Q62,20 58,10')),
    connectionPoints: CP_LR, tags:['inductive','proximity sensor','metal detection','npn pnp','10-30v dc','barrel sensor'], standards:['IEC']
  },
  {
    id:'capacitive-proximity', name:'Capacitive Proximity Sensor', category:'sensors', subcategory:'proximity',
    svg: s(R(6,18,48,24,12)+T(30,30,'CP',10)+P('M2,30 Q-2,20 2,10')+P('M58,30 Q62,20 58,10')),
    connectionPoints: CP_LR, tags:['capacitive','proximity sensor','liquid level','non-metallic','food grade'], standards:['IEC']
  },
  {
    id:'photoelectric-sensor', name:'Photoelectric Sensor', category:'sensors', subcategory:'photoelectric',
    svg: s(R(4,20,24,20,3)+T(16,30,'PE',9)+P('M28,26 L46,26 M28,30 L46,30 M28,34 L46,34')+P('M44,22 L52,30 L44,38 Z','currentColor')),
    connectionPoints: CP_LR, tags:['photoelectric','optical','through beam','diffuse','retro reflective'], standards:['IEC']
  },
  {
    id:'temperature-sensor', name:'Temperature Sensor (RTD/TC)', category:'sensors', subcategory:'temperature',
    svg: s(R(14,16,32,28,3)+T(30,30,'TC/RTD',7)+L(0,30,14,30)+L(46,30,60,30)),
    connectionPoints: CP_LR, tags:['rtd','thermocouple','temperature transmitter','pt100','type k','type j'], standards:['ANSI','IEC']
  },
  {
    id:'humidity-sensor', name:'Humidity Sensor', category:'sensors', subcategory:'environmental',
    svg: s(P('M30,6 Q46,22 46,36 Q46,50 30,50 Q14,50 14,36 Q14,22 30,6 Z')+T(30,34,'RH',11)),
    connectionPoints: CP_B, tags:['humidity','rh','relative humidity','hvac','building automation','4-20ma'], standards:['IEC']
  },
  {
    id:'co-sensor', name:'CO / Carbon Monoxide Detector', category:'sensors', subcategory:'gas',
    svg: s(C(30,30,22)+T(30,30,'CO',13)),
    connectionPoints: CP_B, tags:['carbon monoxide','co','gas sensor','detector','life safety','poisoning'], standards:['ANSI']
  },
  {
    id:'gas-sensor-ng', name:'Natural Gas Detector', category:'sensors', subcategory:'gas',
    svg: s(C(30,30,22)+P('M30,44 Q22,36 24,24 Q20,28 20,38 Q16,30 22,16 Q25,20 27,16 Q27,26 34,20 Q36,32 30,44 Z','currentColor')+T(30,14,'NG',8)),
    connectionPoints: CP_B, tags:['natural gas','gas detector','methane','ch4','combustible gas','explosion'], standards:['ANSI']
  },
  {
    id:'light-sensor', name:'Light / Photocell Sensor', category:'sensors', subcategory:'light',
    svg: s(C(30,30,16)+P('M30,4 L30,10 M30,50 L30,56 M4,30 L10,30 M50,30 L56,30 M11,11 L15,15 M45,45 L49,49 M49,11 L45,15 M11,49 L15,45')+P('M22,30 L26,22 L34,22 L38,30','currentColor')),
    connectionPoints: CP_B, tags:['photocell','photosensor','light sensor','dusk dawn','daylight sensor','lux'], standards:['ANSI','IEC']
  },
  {
    id:'vibration-sensor', name:'Vibration Sensor', category:'sensors', subcategory:'vibration',
    svg: s(C(30,30,18)+P('M10,30 Q14,20 18,30 Q22,40 26,30')+P('M34,30 Q38,20 42,30 Q46,40 50,30')),
    connectionPoints: CP_B, tags:['vibration sensor','accelerometer','machine monitoring','bearing fault','seismic'], standards:['IEC']
  },
  {
    id:'rain-sensor', name:'Rain / Moisture Sensor', category:'sensors', subcategory:'environmental',
    svg: s(P('M12,28 Q12,16 20,14 Q22,6 32,8 Q44,4 46,18 Q54,18 54,26 Z')+L(18,36,16,46)+L(26,34,24,44)+L(34,36,32,46)+L(42,34,40,44)),
    connectionPoints: CP_B, tags:['rain sensor','moisture','weather','irrigation','rooftop','storm'], standards:['ANSI']
  },
  {
    id:'smoke-detector-sensor', name:'Smoke Detector (Standalone)', category:'sensors', subcategory:'smoke',
    svg: s(C(30,30,22)+C(30,30,14)+T(30,30,'S',12)),
    connectionPoints: CP_T, tags:['smoke detector','ionization','photoelectric','residential','nfpa 72'], standards:['ANSI']
  },

  // ══════════════════════════════════════════════════════════════════
  // CATEGORY 12 — FIRE ALARM & LIFE SAFETY
  // ══════════════════════════════════════════════════════════════════
  {
    id:'facp', name:'Fire Alarm Control Panel (FACP)', category:'fire-alarm', subcategory:'panels',
    svg: s(R(4,4,52,52,2)+T(30,16,'FIRE',11)+T(30,28,'ALARM',9)+T(30,40,'PANEL',9)+T(30,52,'FACP',7)),
    connectionPoints: CP_4, tags:['facp','fire alarm panel','fire control','nfpa 72','annunciator'], standards:['ANSI']
  },
  {
    id:'smoke-ionization', name:'Smoke Detector — Ionization', category:'fire-alarm', subcategory:'detectors',
    svg: s(C(30,30,22)+C(30,30,14)+T(30,30,'I',12)+T(30,56,'ION',8)),
    connectionPoints: CP_T, tags:['smoke detector','ionization','addressable','conventional','nfpa 72'], standards:['ANSI']
  },
  {
    id:'smoke-photoelectric', name:'Smoke Detector — Photoelectric', category:'fire-alarm', subcategory:'detectors',
    svg: s(C(30,30,22)+C(30,30,14)+T(30,30,'P',12)+T(30,56,'PHOTO',7)),
    connectionPoints: CP_T, tags:['smoke detector','photoelectric','optical','addressable','nfpa 72'], standards:['ANSI']
  },
  {
    id:'smoke-co-combo', name:'Combination Smoke / CO Detector', category:'fire-alarm', subcategory:'detectors',
    svg: s(C(30,30,22)+C(30,30,14)+T(30,24,'S',10)+T(30,36,'CO',10)),
    connectionPoints: CP_T, tags:['smoke co','combination detector','dual sensor','carbon monoxide','life safety'], standards:['ANSI']
  },
  {
    id:'heat-detector-ft', name:'Heat Detector (Fixed Temperature)', category:'fire-alarm', subcategory:'detectors',
    svg: s(C(30,30,22)+C(30,30,14)+T(30,30,'H',12)+T(30,56,'FTD',8)),
    connectionPoints: CP_T, tags:['heat detector','fixed temperature','135f','194f','rate compensated'], standards:['ANSI']
  },
  {
    id:'heat-detector-rr', name:'Heat Detector (Rate-of-Rise)', category:'fire-alarm', subcategory:'detectors',
    svg: s(C(30,30,22)+C(30,30,14)+T(30,30,'R',12)+P('M18,12 L24,8 M30,10 L36,6 M42,12 L48,8')),
    connectionPoints: CP_T, tags:['heat detector','rate of rise','ror','nfpa 72','thermal detector'], standards:['ANSI']
  },
  {
    id:'flame-detector', name:'Flame Detector', category:'fire-alarm', subcategory:'detectors',
    svg: s(C(30,30,22)+P('M30,46 Q22,38 24,26 Q20,30 20,40 Q14,30 22,16 Q24,20 26,16 Q26,26 34,22 Q36,32 30,46 Z','currentColor')),
    connectionPoints: CP_T, tags:['flame detector','ir','uv','fire detection','high hazard','industrial'], standards:['ANSI']
  },
  {
    id:'duct-smoke-detector', name:'Duct Smoke Detector', category:'fire-alarm', subcategory:'detectors',
    svg: s(R(4,16,52,28,3)+C(30,30,12)+T(30,30,'S',10)+L(22,4,22,16)+L(38,4,38,16)+L(22,44,22,56)+L(38,44,38,56)),
    connectionPoints:[{x:22,y:0},{x:38,y:0},{x:22,y:60},{x:38,y:60}],
    tags:['duct smoke','hvac smoke detector','air handler','supply return','duct sampling'], standards:['ANSI']
  },
  {
    id:'pull-station', name:'Manual Pull Station', category:'fire-alarm', subcategory:'initiating',
    svg: s(R(12,8,36,44,2)+R(18,20,24,16,2)+T(30,28,'PULL',9)+T(30,38,'↓',14)+T(30,56,'PULL',7)),
    connectionPoints: CP_B, tags:['pull station','manual initiating device','fire alarm pull','t-bar','dual action'], standards:['ANSI']
  },
  {
    id:'horn-strobe', name:'Horn / Strobe Combo', category:'fire-alarm', subcategory:'notification',
    svg: s(P('M4,16 L28,22 L28,38 L4,44 Z')+R(30,12,26,36,2)+P('M34,18 L44,30 L34,42 M40,18 L50,30 L40,42')),
    connectionPoints: CP_B, tags:['horn strobe','notification appliance','nac','speaker strobe','fire alarm'], standards:['ANSI']
  },
  {
    id:'fire-horn', name:'Fire Alarm Horn / Sounder', category:'fire-alarm', subcategory:'notification',
    svg: s(P('M6,16 L32,22 L32,38 L6,44 Z')+P('M32,20 Q46,20 52,30 Q46,40 32,40')),
    connectionPoints: CP_B, tags:['horn','sounder','fire alarm','notification','nac','audible'], standards:['ANSI']
  },
  {
    id:'strobe-light', name:'Strobe Light (Visual)', category:'fire-alarm', subcategory:'notification',
    svg: s(R(10,10,40,40,3)+P('M30,14 L24,28 L30,28 L22,46 L38,26 L30,26 L38,14 Z','currentColor')),
    connectionPoints: CP_B, tags:['strobe','visual notification','ada','hearing impaired','candela','nac'], standards:['ANSI']
  },
  {
    id:'voice-speaker', name:'Voice Evacuation Speaker', category:'fire-alarm', subcategory:'notification',
    svg: s(P('M6,20 L22,20 L40,8 L40,52 L22,40 L6,40 Z')+P('M44,16 Q54,30 44,44')),
    connectionPoints: CP_B, tags:['speaker','voice evacuation','mass notification','paging','fire alarm speaker'], standards:['ANSI']
  },
  {
    id:'fire-alarm-bell', name:'Fire Alarm Bell', category:'fire-alarm', subcategory:'notification',
    svg: s(P('M14,8 Q14,2 30,2 Q46,2 46,8 L52,44 Q52,50 30,50 Q8,50 8,44 Z')+L(22,50,22,56)+L(38,50,38,56)+L(18,56,42,56)+C(30,34,8)),
    connectionPoints: CP_B, tags:['fire bell','alarm bell','vintage','conventional','building fire alarm'], standards:['ANSI']
  },
  {
    id:'sprinkler-head', name:'Sprinkler Head', category:'fire-alarm', subcategory:'suppression',
    svg: s(C(30,30,8,'currentColor')+P('M30,22 L30,4 M14,28 L2,14 M46,28 L58,14 M14,34 L2,46 M46,34 L58,46 M30,38 L30,56')),
    connectionPoints: CP_T, tags:['sprinkler head','fire suppression','nfpa 13','pendant upright','k-factor'], standards:['ANSI']
  },
  {
    id:'sprinkler-flow-sw', name:'Sprinkler Flow Switch', category:'fire-alarm', subcategory:'suppression',
    svg: s(L(0,30,60,30)+L(4,20,4,40)+L(56,20,56,40)+C(30,30,10)+T(30,30,'F',9)),
    connectionPoints: CP_LR, tags:['flow switch','vane type','sprinkler','water flow','wet pipe','nfpa 13'], standards:['ANSI']
  },
  {
    id:'monitor-module', name:'Monitor Module (FAS)', category:'fire-alarm', subcategory:'modules',
    svg: s(R(10,10,40,40,3)+T(30,30,'MON',11)),
    connectionPoints: CP_4, tags:['monitor module','addressable','input module','conventional zone','supervisory'], standards:['ANSI']
  },
  {
    id:'control-module-fa', name:'Control Module (FAS)', category:'fire-alarm', subcategory:'modules',
    svg: s(R(10,10,40,40,3)+T(30,30,'CTRL',10)),
    connectionPoints: CP_4, tags:['control module','output module','relay module','notification circuit','addressable'], standards:['ANSI']
  },
  {
    id:'fire-telephone', name:'Fire Telephone / Handset', category:'fire-alarm', subcategory:'communication',
    svg: s(R(8,10,44,40,4)+P('M18,26 Q18,20 25,20 Q32,20 32,26 L32,30 Q32,38 25,38 Q18,38 18,34 Z')+T(30,48,'FTJ',8)),
    connectionPoints: CP_B, tags:['fire telephone','fireman telephone','two way','stairwell','building communication'], standards:['ANSI']
  },
  {
    id:'beam-smoke-detector', name:'Projected Beam Smoke Detector', category:'fire-alarm', subcategory:'detectors',
    svg: s(R(4,18,18,24,2)+T(13,30,'TX',8)+R(38,18,18,24,2)+T(47,30,'RX',8)+P('M22,27 L38,27 M22,33 L38,33')+P('M36,22 L42,30 L36,38')),
    connectionPoints: CP_B, tags:['beam smoke','projected beam','wide area','atrium','warehouse','nfpa 72'], standards:['ANSI']
  },

  // ══════════════════════════════════════════════════════════════════
  // CATEGORY 13 — SECURITY SYSTEMS
  // ══════════════════════════════════════════════════════════════════
  {
    id:'security-panel', name:'Security Control Panel', category:'security', subcategory:'panels',
    svg: s(R(6,4,48,52,3)+T(30,16,'SECURITY',7)+T(30,28,'PANEL',9)+R(14,34,32,14,2)+T(30,41,'ARM',9)),
    connectionPoints: CP_4, tags:['security panel','alarm panel','intrusion detection','burglar alarm','dsc honeywell'], standards:['ANSI']
  },
  {
    id:'motion-detector', name:'PIR Motion Detector (Security)', category:'security', subcategory:'detectors',
    svg: s(P('M10,44 Q10,16 30,16 Q50,16 50,44 Z')+P('M6,42 Q0,24 8,10')+P('M54,42 Q60,24 52,10')+C(30,36,8,'currentColor')+T(30,52,'PIR',8)),
    connectionPoints: CP_B, tags:['pir','motion','passive infrared','intruder','burglar','dual tech'], standards:['ANSI']
  },
  {
    id:'door-contact', name:'Door / Window Contact', category:'security', subcategory:'contacts',
    svg: s(R(6,22,20,16,3)+R(34,22,20,16,3)+P('M26,30 L34,30')+T(16,30,'M',10)+T(44,30,'S',10)),
    connectionPoints: CP_LR, tags:['door contact','magnetic contact','window sensor','reed switch','perimeter'], standards:['ANSI']
  },
  {
    id:'glass-break', name:'Glass Break Sensor', category:'security', subcategory:'detectors',
    svg: s(R(10,10,40,40,3)+P('M24,16 L20,22 L28,24 L20,36 M36,44 L40,38 L32,36 L40,24')+T(30,52,'GB',8)),
    connectionPoints: CP_B, tags:['glass break','acoustic sensor','shatter','safeguard','perimeter'], standards:['ANSI']
  },
  {
    id:'security-camera-fixed', name:'Fixed Security Camera', category:'security', subcategory:'cameras',
    svg: s(R(6,18,30,24,3)+P('M36,16 L54,8 L54,52 L36,44 Z')+C(22,30,6)),
    connectionPoints: CP_B, tags:['cctv','camera','ip camera','fixed','security camera','nvr','hikvision dahua'], standards:['ANSI']
  },
  {
    id:'security-camera-ptz', name:'PTZ Security Camera', category:'security', subcategory:'cameras',
    svg: s(C(30,28,12)+R(16,40,28,14,3)+L(30,40,30,52)+P('M14,24 Q8,16 14,10')+P('M46,24 Q52,16 46,10')),
    connectionPoints: CP_B, tags:['ptz','pan tilt zoom','speed dome','camera','ip camera','360'], standards:['ANSI']
  },
  {
    id:'nvr-dvr', name:'NVR / DVR Recorder', category:'security', subcategory:'recording',
    svg: s(R(6,14,48,32,3)+T(30,26,'NVR',10)+T(30,36,'DVR',9)+R(12,46,36,8,2)),
    connectionPoints: CP_4, tags:['nvr','dvr','video recorder','security','cctv','storage'], standards:['ANSI']
  },
  {
    id:'card-reader', name:'Access Control Card Reader', category:'security', subcategory:'access-control',
    svg: s(R(16,6,28,48,3)+P('M20,20 L40,20 M20,28 L40,28 M20,36 L40,36')+C(30,48,5)),
    connectionPoints: CP_B, tags:['card reader','proximity','hid','rfid','badge reader','access control'], standards:['ANSI']
  },
  {
    id:'keypad-security', name:'Security Keypad', category:'security', subcategory:'access-control',
    svg: s(R(10,6,40,48,4)+R(16,12,28,14,2)+T(30,19,'KEY',8)+L(16,30,44,30)+C(22,38,4)+C(30,38,4)+C(38,38,4)+C(22,46,4)+C(30,46,4)+C(38,46,4)),
    connectionPoints: CP_B, tags:['keypad','pin pad','access control','alarm panel','entry','code'], standards:['ANSI']
  },
  {
    id:'electric-strike', name:'Electric Door Strike', category:'security', subcategory:'door-hardware',
    svg: s(R(10,16,40,28,3)+T(30,26,'E-STRIKE',7)+P('M10,36 L50,36 M24,36 L24,44 M36,36 L36,44 L20,44 L40,44')),
    connectionPoints: CP_LR, tags:['electric strike','door strike','access control','fail secure fail safe','door control'], standards:['ANSI']
  },
  {
    id:'magnetic-lock', name:'Magnetic Lock (Magloc)', category:'security', subcategory:'door-hardware',
    svg: s(R(6,10,48,20,3)+P('M14,30 Q14,46 30,46 Q46,46 46,30')+P('M14,30 Q22,28 30,30 Q38,28 46,30')+T(30,18,'MAGLOC',7)),
    connectionPoints: CP_LR, tags:['magnetic lock','magloc','mag lock','access control','fail safe','1200lb'], standards:['ANSI']
  },
  {
    id:'indoor-siren', name:'Indoor Siren / Sounder', category:'security', subcategory:'notification',
    svg: s(P('M6,14 L30,20 L30,40 L6,46 Z')+P('M30,18 Q42,18 48,30 Q42,42 30,42')+P('M30,22 Q38,22 42,30 Q38,38 30,38')),
    connectionPoints: CP_B, tags:['siren','sounder','indoor alarm','audible','piezo','warning'], standards:['ANSI']
  },
  {
    id:'outdoor-siren-strobe', name:'Outdoor Siren/Strobe', category:'security', subcategory:'notification',
    svg: s(P('M6,18 L26,22 L26,38 L6,42 Z')+R(28,10,26,40,3)+P('M32,14 L44,30 L32,46 M38,14 L50,30 L38,46')),
    connectionPoints: CP_B, tags:['outdoor siren','strobe','weather resistant','visible audible','security bell box'], standards:['ANSI']
  },
  {
    id:'access-control-panel', name:'Access Control Panel', category:'security', subcategory:'panels',
    svg: s(R(8,8,44,44,3)+T(30,22,'ACCESS',8)+T(30,32,'CTRL',10)+T(30,44,'PANEL',8)),
    connectionPoints: CP_4, tags:['access control','panel','controller','2 door 4 door','lenel s2'], standards:['ANSI']
  },
  {
    id:'gate-operator', name:'Gate Operator', category:'security', subcategory:'gate',
    svg: s(R(8,16,44,28,3)+T(30,26,'GATE',10)+T(30,36,'OP.',9)+P('M8,14 L52,14 M8,10 L12,10 L12,14 M48,10 L52,10 L52,14')),
    connectionPoints: CP_LR, tags:['gate operator','gate opener','slide swing','driveway gate','liftmaster'], standards:['ANSI']
  },

  // ══════════════════════════════════════════════════════════════════
  // CATEGORY 14 — COMMUNICATION & DATA
  // ══════════════════════════════════════════════════════════════════
  {
    id:'rj45-outlet', name:'RJ45 Data Outlet (Cat6)', category:'communication', subcategory:'data',
    svg: s(R(14,14,32,32,3)+T(30,28,'CAT6',9)+R(20,44,20,8,2)+T(30,48,'RJ45',8)),
    connectionPoints: CP_B, tags:['rj45','cat6','cat5e','data outlet','ethernet','network jack'], standards:['ANSI']
  },
  {
    id:'rj11-outlet', name:'Telephone Outlet (RJ11)', category:'communication', subcategory:'telephone',
    svg: s(R(14,14,32,32,3)+T(30,28,'TEL',10)+R(22,44,16,8,2)+T(30,48,'RJ11',8)),
    connectionPoints: CP_B, tags:['telephone','rj11','phone jack','landline','analog','voice'], standards:['ANSI']
  },
  {
    id:'coax-tv-outlet', name:'Cable TV / Coax Outlet', category:'communication', subcategory:'coax',
    svg: s(C(30,24,16)+T(30,24,'TV',10)+C(30,24,8)+T(30,48,'COAX',8)),
    connectionPoints: CP_B, tags:['coax','cable tv','catv','f connector','75 ohm','coaxial outlet'], standards:['ANSI']
  },
  {
    id:'fiber-outlet', name:'Fiber Optic Outlet', category:'communication', subcategory:'fiber',
    svg: s(R(14,14,32,32,3)+T(30,24,'FO',10)+P('M22,32 Q30,28 38,32 Q30,36 22,32')+T(30,48,'FIBER',7)),
    connectionPoints: CP_B, tags:['fiber optic','fo','lc sc st','single mode multimode','high speed'], standards:['ANSI']
  },
  {
    id:'wifi-access-point', name:'WiFi Access Point', category:'communication', subcategory:'wireless',
    svg: s(C(30,38,6,'currentColor')+P('M22,34 Q14,26 22,18')+P('M38,34 Q46,26 38,18')+P('M18,30 Q8,20 18,10')+P('M42,30 Q52,20 42,10')+L(30,44,30,56)),
    connectionPoints: CP_B, tags:['wifi','access point','wireless','802.11','ap','ubiquiti cisco aruba'], standards:['ANSI']
  },
  {
    id:'network-switch', name:'Network Switch', category:'communication', subcategory:'networking',
    svg: s(R(4,14,52,32,3)+T(30,24,'SWITCH',8)+P('M10,46 L10,56 M20,46 L20,56 M30,46 L30,56 M40,46 L40,56 M50,46 L50,56')+P('M10,36 L50,26 M10,26 L50,36')),
    connectionPoints:[{x:10,y:60},{x:20,y:60},{x:30,y:60},{x:40,y:60},{x:50,y:60},{x:30,y:0}],
    tags:['network switch','ethernet switch','managed unmanaged','cisco juniper','poe','lan'], standards:['ANSI']
  },
  {
    id:'patch-panel', name:'Data Patch Panel', category:'communication', subcategory:'termination',
    svg: s(R(4,16,52,28,2)+L(4,30,56,30)+C(12,23,4)+C(22,23,4)+C(32,23,4)+C(42,23,4)+C(52,23,4)+C(12,37,4)+C(22,37,4)+C(32,37,4)+C(42,37,4)+C(52,37,4)),
    connectionPoints:[{x:12,y:8},{x:22,y:8},{x:32,y:8},{x:42,y:8},{x:52,y:8},{x:12,y:52},{x:22,y:52},{x:32,y:52}],
    tags:['patch panel','110 punch','cat6','cable management','rack mount','cross connect'], standards:['ANSI']
  },
  {
    id:'router', name:'Router', category:'communication', subcategory:'networking',
    svg: s(R(6,16,48,28,3)+T(30,26,'ROUTER',8)+P('M20,8 L20,16 M30,4 L30,16 M40,8 L40,16')+P('M18,6 L22,6 M28,2 L32,2 M38,6 L42,6')),
    connectionPoints:[{x:20,y:0},{x:30,y:0},{x:40,y:0},{x:30,y:60}],
    tags:['router','gateway','wan','lan','cisco','firewall','internet'], standards:['ANSI']
  },
  {
    id:'modem', name:'Modem', category:'communication', subcategory:'networking',
    svg: s(R(8,16,44,28,3)+T(30,26,'MODEM',8)+P('M14,44 Q22,38 30,44 Q38,50 46,44')),
    connectionPoints: CP_4, tags:['modem','dsl','cable modem','isp','broadband','docsis'], standards:['ANSI']
  },
  {
    id:'intercom-panel', name:'Intercom / Video Doorbell', category:'communication', subcategory:'intercom',
    svg: s(R(10,4,40,52,4)+P('M18,16 Q18,10 25,10 Q32,10 32,16 L32,20 Q32,28 25,28 Q18,28 18,24 Z')+T(30,38,'IC',10)+R(16,34,28,12,2)),
    connectionPoints: CP_B, tags:['intercom','video doorbell','ring','two way audio','entry station'], standards:['ANSI']
  },
  {
    id:'speaker-overhead', name:'Overhead Speaker (PA/Paging)', category:'communication', subcategory:'audio',
    svg: s(P('M8,20 L24,20 L42,8 L42,52 L24,40 L8,40 Z')+P('M46,16 Q56,30 46,44')),
    connectionPoints: CP_B, tags:['speaker','paging','pa system','overhead','ceiling speaker','background music'], standards:['ANSI']
  },
  {
    id:'server-rack', name:'Server / Equipment Rack', category:'communication', subcategory:'infrastructure',
    svg: s(R(10,4,40,52,2)+L(10,14,50,14)+L(10,28,50,28)+L(10,42,50,42)+R(14,16,32,10,1)+R(14,30,32,10,1)+R(14,44,32,10,1)),
    connectionPoints: CP_4, tags:['server rack','rack','19 inch','42u','data center','network cabinet'], standards:['ANSI']
  },
  {
    id:'cable-tv-splitter', name:'CATV Splitter', category:'communication', subcategory:'coax',
    svg: s(L(0,30,24,30)+P('M24,30 L44,16 M24,30 L44,30 M24,30 L44,44')+DOT(24,30)+L(44,16,60,16)+L(44,30,60,30)+L(44,44,60,44)),
    connectionPoints:[{x:0,y:30},{x:60,y:16},{x:60,y:30},{x:60,y:44}],
    tags:['splitter','catv','cable splitter','coax','distribution','signal split'], standards:['ANSI']
  },

  // ══════════════════════════════════════════════════════════════════
  // CATEGORY 15 — HVAC & MECHANICAL
  // ══════════════════════════════════════════════════════════════════
  {
    id:'hvac-split-system', name:'Split System HVAC', category:'hvac', subcategory:'systems',
    svg: s(R(4,6,24,24,3)+T(16,18,'AHU',8)+R(32,6,24,24,3)+T(44,18,'CDU',8)+P('M28,12 L32,12 M28,20 L32,20')),
    connectionPoints: CP_B, tags:['split system','air handler','condenser','hvac','ac','heat pump'], standards:['ANSI']
  },
  {
    id:'air-handler', name:'Air Handler Unit (AHU)', category:'hvac', subcategory:'units',
    svg: s(R(6,10,48,40,3)+T(30,22,'AHU',10)+P('M14,32 Q22,28 30,32 Q38,36 46,32')+L(0,20,6,20)+L(54,20,60,20)),
    connectionPoints: CP_LR, tags:['air handler','ahu','fan coil','hvac','air handling unit'], standards:['ANSI']
  },
  {
    id:'condenser-unit', name:'Condenser Unit (Outdoor)', category:'hvac', subcategory:'units',
    svg: s(R(6,10,48,40,3)+C(30,30,14)+P('M30,24 Q34,22 38,24 Q36,28 30,24')+P('M36,32 Q38,36 36,40 Q32,38 36,32')+P('M24,36 Q20,34 20,30 Q24,32 24,36')+T(30,16,'CDU',8)),
    connectionPoints: CP_B, tags:['condenser','outdoor unit','condensing unit','compressor','hvac','ac unit'], standards:['ANSI']
  },
  {
    id:'rtu', name:'Rooftop Unit (RTU)', category:'hvac', subcategory:'units',
    svg: s(R(6,4,48,52,3)+T(30,18,'RTU',12)+P('M14,28 Q22,24 30,28 Q38,32 46,28')+T(30,42,'ROOF TOP',7)),
    connectionPoints: CP_B, tags:['rtu','rooftop unit','packaged unit','hvac','commercial','ductwork'], standards:['ANSI']
  },
  {
    id:'exhaust-fan-ceiling', name:'Ceiling Exhaust Fan', category:'hvac', subcategory:'fans',
    svg: s(C(30,30,20)+C(30,30,5,'currentColor')+P('M30,25 Q36,22 38,14 Q32,18 30,25')+P('M35,35 Q38,41 46,42 Q44,36 35,35')+P('M30,35 Q24,38 22,46 Q28,44 30,35')+P('M25,30 Q22,24 14,22 Q16,28 25,30')),
    connectionPoints: CP_T, tags:['exhaust fan','bathroom fan','ceiling fan','ventilation','cfm','broan'], standards:['ANSI']
  },
  {
    id:'exhaust-fan-wall', name:'Wall Exhaust Fan', category:'hvac', subcategory:'fans',
    svg: s(L(4,4,4,56)+C(30,30,20)+C(30,30,5,'currentColor')+P('M30,25 Q36,22 38,14 Q32,18 30,25')+P('M35,35 Q38,41 46,42 Q44,36 35,35')+P('M30,35 Q24,38 22,46 Q28,44 30,35')+P('M25,30 Q22,24 14,22 Q16,28 25,30')),
    connectionPoints:[{x:4,y:0},{x:4,y:60}],
    tags:['wall fan','exhaust fan','through wall','kitchen hood','industrial'], standards:['ANSI']
  },
  {
    id:'electric-heater', name:'Electric Baseboard Heater', category:'hvac', subcategory:'heating',
    svg: s(R(4,20,52,20,3)+P('M10,28 L16,32 L22,28 L28,32 L34,28 L40,32 L46,28 L52,32')+T(30,50,'BBH',9)),
    connectionPoints: CP_LR, tags:['baseboard heater','electric heat','240v','convection','cadet','marley'], standards:['ANSI']
  },
  {
    id:'unit-heater', name:'Unit Heater', category:'hvac', subcategory:'heating',
    svg: s(R(8,8,44,30,3)+T(30,18,'UNIT',9)+T(30,28,'HTR',9)+P('M14,38 L14,48 M22,38 L22,52 M30,38 L30,54 M38,38 L38,52 M46,38 L46,48')),
    connectionPoints: CP_LR, tags:['unit heater','gas electric','ceiling suspended','hydronic','blower'], standards:['ANSI']
  },
  {
    id:'electric-furnace', name:'Electric Furnace', category:'hvac', subcategory:'heating',
    svg: s(R(8,4,44,52,3)+T(30,18,'ELEC',9)+T(30,30,'FURNACE',7)+P('M14,40 Q22,36 30,40 Q38,44 46,40')),
    connectionPoints: CP_4, tags:['electric furnace','heat strips','forced air','240v','hvac','ahu'], standards:['ANSI']
  },
  {
    id:'heat-pump', name:'Heat Pump', category:'hvac', subcategory:'systems',
    svg: s(R(8,8,44,44,3)+T(30,22,'HEAT',9)+T(30,32,'PUMP',9)+P('M14,42 L22,42 M20,38 L26,44 L20,50 M38,42 L46,42 M44,38 L38,44 L44,50')),
    connectionPoints: CP_4, tags:['heat pump','hvac','heating cooling','coefficient of performance','cop','minisplit'], standards:['ANSI']
  },
  {
    id:'humidifier', name:'Humidifier', category:'hvac', subcategory:'air-quality',
    svg: s(R(10,10,40,36,3)+T(30,24,'HUM',9)+P('M14,50 Q18,44 22,50')+P('M26,46 Q30,40 34,46')+P('M38,50 Q42,44 46,50')),
    connectionPoints: CP_LR, tags:['humidifier','whole house','duct','aprilaire','honeywell','rh'], standards:['ANSI']
  },
  {
    id:'dehumidifier', name:'Dehumidifier', category:'hvac', subcategory:'air-quality',
    svg: s(R(10,10,40,36,3)+T(30,24,'DHUM',9)+P('M14,46 L18,54 M22,44 L26,52 M30,46 L34,54 M38,44 L42,52')),
    connectionPoints: CP_LR, tags:['dehumidifier','moisture removal','basement','crawlspace','santa fe'], standards:['ANSI']
  },
  {
    id:'damper-motorized', name:'Motorized Damper', category:'hvac', subcategory:'airflow',
    svg: s(R(4,16,52,28,2)+L(30,4,30,16)+R(24,4,12,12,2)+T(30,10,'M',9)+L(4,30,56,16)+L(14,44,46,44)),
    connectionPoints: CP_LR, tags:['damper','zone damper','motorized','24v actuator','vav','duct damper'], standards:['ANSI']
  },
  {
    id:'damper-manual', name:'Manual Damper', category:'hvac', subcategory:'airflow',
    svg: s(R(4,16,52,28,2)+L(30,4,30,16)+L(4,28,56,16)+L(14,44,46,44)+P('M26,4 L34,4')),
    connectionPoints: CP_LR, tags:['manual damper','balancing damper','volume control','duct','airflow'], standards:['ANSI']
  },

  // ══════════════════════════════════════════════════════════════════
  // CATEGORY 16 — GROUNDING & BONDING
  // ══════════════════════════════════════════════════════════════════
  {
    id:'ground-earth', name:'Earth / Safety Ground', category:'grounding', subcategory:'ground-symbols',
    svg: s(L(30,4,30,30)+L(16,30,44,30)+L(20,36,40,36)+L(24,42,36,42)+L(27,48,33,48)),
    connectionPoints: CP_T, tags:['ground','earth','safety','protective earth','pe','green wire','nec'], standards:['ANSI','IEC']
  },
  {
    id:'ground-chassis', name:'Chassis / Frame Ground', category:'grounding', subcategory:'ground-symbols',
    svg: s(L(30,4,30,24)+L(18,24,42,24)+L(22,30,38,30)+L(26,36,34,36)),
    connectionPoints: CP_T, tags:['chassis ground','frame ground','equipment ground','metal chassis','bonding'], standards:['ANSI','IEC']
  },
  {
    id:'ground-signal', name:'Signal / Digital Ground', category:'grounding', subcategory:'ground-symbols',
    svg: s(L(30,4,30,24)+P('M18,24 L42,24 L30,42 Z','currentColor')),
    connectionPoints: CP_T, tags:['signal ground','digital ground','common','0v reference','circuit ground'], standards:['ANSI','IEC']
  },
  {
    id:'ground-rod', name:'Ground Rod (Driven)', category:'grounding', subcategory:'electrodes',
    svg: s(L(30,4,30,52)+L(22,52,38,52)+L(22,48,30,52)+L(38,48,30,52)+T(30,58,'GND ROD',7)),
    connectionPoints: CP_T, tags:['ground rod','8 foot rod','driven ground','ufer ground','electrode','copper clad'], standards:['ANSI']
  },
  {
    id:'bonding-jumper', name:'Bonding Jumper', category:'grounding', subcategory:'bonding',
    svg: s(L(6,20,6,40)+L(54,20,54,40)+P('M6,30 Q20,16 30,16 Q40,16 54,30')+DOT(6,30)+DOT(54,30)),
    connectionPoints:[{x:6,y:20},{x:6,y:40},{x:54,y:20},{x:54,y:40}],
    tags:['bonding jumper','main bonding','equipment bonding','mbj','ebj','nec 250'], standards:['ANSI']
  },
  {
    id:'ground-bus', name:'Ground / Bonding Bus Bar', category:'grounding', subcategory:'bus',
    svg: s(R(4,22,52,16,2)+T(30,30,'GND BUS',8)+L(14,14,14,22)+L(24,14,24,22)+L(36,14,36,22)+L(46,14,46,22)+L(14,38,14,46)+L(24,38,24,46)),
    connectionPoints:[{x:14,y:8},{x:24,y:8},{x:36,y:8},{x:46,y:8},{x:14,y:52},{x:24,y:52}],
    tags:['ground bus','bonding bus','panel ground bar','green bar','nec 250'], standards:['ANSI']
  },
  {
    id:'egc', name:'Equipment Grounding Conductor (EGC)', category:'grounding', subcategory:'conductors',
    svg: s(L(0,30,18,30)+L(18,20,42,40)+L(42,20,18,40)+L(42,30,60,30)+T(30,52,'EGC',9)),
    connectionPoints: CP_LR, tags:['egc','equipment ground','green wire','bare copper','grounding conductor'], standards:['ANSI']
  },
  {
    id:'lightning-protection', name:'Lightning Protection Rod / Finial', category:'grounding', subcategory:'lightning',
    svg: s(L(30,4,30,10)+P('M24,10 L36,10 L34,14 L38,14 L26,34 L30,24 L22,24 Z','currentColor')+L(30,34,30,52)+L(22,52,38,52)),
    connectionPoints:[{x:30,y:0},{x:30,y:60}],
    tags:['lightning protection','air terminal','lightning rod','nfpa 780','franklin rod','strike termination'], standards:['ANSI']
  },
  {
    id:'ground-electrode-plate', name:'Ground Plate Electrode', category:'grounding', subcategory:'electrodes',
    svg: s(L(30,4,30,20)+R(10,20,40,8,2)+L(14,28,46,28)+L(18,32,42,32)+L(22,36,38,36)+T(30,48,'PLATE',8)),
    connectionPoints: CP_T, tags:['ground plate','buried plate','electrode','ufer ground','foundation'], standards:['ANSI']
  },
  {
    id:'static-ground', name:'Static Dissipative Ground', category:'grounding', subcategory:'specialty',
    svg: s(L(30,4,30,20)+P('M20,20 Q24,26 20,32 Q16,38 20,44')+P('M30,20 Q34,26 30,32 Q26,38 30,44')+P('M40,20 Q44,26 40,32 Q36,38 40,44')+T(30,54,'STATIC',7)),
    connectionPoints: CP_T, tags:['static ground','esd','electrostatic discharge','anti-static','sensitive electronics'], standards:['IEC']
  },
  {
    id:'down-conductor', name:'Lightning Down Conductor', category:'grounding', subcategory:'lightning',
    svg: s(L(30,4,30,56)+P('M22,14 Q30,4 38,14')+P('M22,34 Q30,44 38,34')+T(30,58,'DC',8)),
    connectionPoints: CP_TB, tags:['down conductor','lightning protection','nfpa 780','dispatch cable','bonding'], standards:['ANSI']
  },

  // ══════════════════════════════════════════════════════════════════
  // CATEGORY 17 — ELECTRONIC COMPONENTS
  // ══════════════════════════════════════════════════════════════════
  {
    id:'resistor', name:'Resistor (Fixed) — ANSI', category:'electronic', subcategory:'passive',
    svg: s(L(0,30,12,30)+P('M12,30 L16,22 L20,38 L24,22 L28,38 L32,22 L36,38 L40,22 L44,30')+L(44,30,60,30)),
    connectionPoints: CP_LR, tags:['resistor','fixed','ohm','r','ansi','zigzag'], standards:['ANSI']
  },
  {
    id:'resistor-iec', name:'Resistor (Fixed) — IEC', category:'electronic', subcategory:'passive',
    svg: s(L(0,30,14,30)+R(14,22,32,16)+L(46,30,60,30)),
    connectionPoints: CP_LR, tags:['resistor','fixed','ohm','r','iec','rectangle'], standards:['IEC']
  },
  {
    id:'resistor-variable', name:'Variable Resistor / Potentiometer', category:'electronic', subcategory:'passive',
    svg: s(L(0,30,12,30)+P('M12,30 L16,22 L20,38 L24,22 L28,38 L32,22 L36,38 L40,22 L44,30')+L(44,30,60,30)+P('M28,18 L28,10 M24,10 L32,10')+P('M24,14 L28,10 L32,14')),
    connectionPoints:[{x:0,y:30},{x:60,y:30},{x:28,y:4}],
    tags:['potentiometer','variable resistor','rheostat','trim pot','vr','adjustable'], standards:['ANSI','IEC']
  },
  {
    id:'capacitor', name:'Capacitor (Non-Polarized)', category:'electronic', subcategory:'passive',
    svg: s(L(0,30,26,30)+L(26,16,26,44)+L(34,16,34,44)+L(34,30,60,30)),
    connectionPoints: CP_LR, tags:['capacitor','cap','ceramic','mylar','film','non-polar','c'], standards:['ANSI','IEC']
  },
  {
    id:'capacitor-electrolytic', name:'Capacitor (Electrolytic / Polarized)', category:'electronic', subcategory:'passive',
    svg: s(L(0,30,26,30)+L(26,16,26,44)+P('M34,16 Q40,30 34,44')+L(34,30,60,30)+T(26,12,'+',10)),
    connectionPoints: CP_LR, tags:['electrolytic capacitor','polarized','aluminum','tantalum','bulk capacitor'], standards:['ANSI','IEC']
  },
  {
    id:'inductor', name:'Inductor (Air Core)', category:'electronic', subcategory:'passive',
    svg: s(L(0,30,8,30)+P('M8,30 Q8,18 16,18 Q24,18 24,30 Q24,18 32,18 Q40,18 40,30 Q40,18 48,18 Q56,18 56,30')+L(56,30,60,30)),
    connectionPoints: CP_LR, tags:['inductor','coil','choke','l','air core','henry','rf inductor'], standards:['ANSI','IEC']
  },
  {
    id:'inductor-iron', name:'Inductor (Iron Core)', category:'electronic', subcategory:'passive',
    svg: s(L(0,30,8,30)+P('M8,30 Q8,18 16,18 Q24,18 24,30 Q24,18 32,18 Q40,18 40,30 Q40,18 48,18 Q56,18 56,30')+L(56,30,60,30)+L(8,14,56,14)+L(8,10,56,10)),
    connectionPoints: CP_LR, tags:['iron core inductor','ferrite','power supply choke','emi filter'], standards:['ANSI','IEC']
  },
  {
    id:'diode', name:'Diode (Rectifier)', category:'electronic', subcategory:'semiconductor',
    svg: s(L(0,30,20,30)+P('M20,16 L40,30 L20,44 Z','currentColor')+L(40,16,40,44)+L(40,30,60,30)),
    connectionPoints: CP_LR, tags:['diode','rectifier','1n4007','1n4001','signal diode','p-n junction'], standards:['ANSI','IEC']
  },
  {
    id:'led', name:'LED (Light Emitting Diode)', category:'electronic', subcategory:'semiconductor',
    svg: s(L(0,30,16,30)+P('M16,16 L36,30 L16,44 Z','currentColor')+L(36,16,36,44)+L(36,30,60,30)+P('M40,16 L48,10 M40,22 L48,16')+P('M44,10 L48,10 L48,14')+P('M44,16 L48,16 L48,20')),
    connectionPoints: CP_LR, tags:['led','light emitting diode','indicator','status light','rgb'], standards:['ANSI','IEC']
  },
  {
    id:'zener-diode', name:'Zener Diode', category:'electronic', subcategory:'semiconductor',
    svg: s(L(0,30,20,30)+P('M20,16 L40,30 L20,44 Z','currentColor')+P('M36,16 L40,16 L40,44 L44,44')+L(40,30,60,30)),
    connectionPoints: CP_LR, tags:['zener','voltage reference','regulator','breakdown','vz','clamp'], standards:['ANSI','IEC']
  },
  {
    id:'transistor-npn', name:'Transistor (NPN BJT)', category:'electronic', subcategory:'semiconductor',
    svg: s(L(0,30,20,30)+L(20,12,20,48)+L(20,22,40,12)+L(20,38,40,48)+P('M36,44 L40,48 L36,48','currentColor')+L(40,12,60,12)+L(40,48,60,48)),
    connectionPoints:[{x:0,y:30},{x:60,y:12},{x:60,y:48}],
    tags:['npn transistor','bjt','2n2222','bc547','switching amplifier','q'], standards:['ANSI','IEC']
  },
  {
    id:'transistor-pnp', name:'Transistor (PNP BJT)', category:'electronic', subcategory:'semiconductor',
    svg: s(L(0,30,20,30)+L(20,12,20,48)+L(20,22,40,12)+L(20,38,40,48)+P('M20,22 L24,18 L24,24','currentColor')+L(40,12,60,12)+L(40,48,60,48)),
    connectionPoints:[{x:0,y:30},{x:60,y:12},{x:60,y:48}],
    tags:['pnp transistor','bjt','bc557','switching','complementary','q'], standards:['ANSI','IEC']
  },
  {
    id:'mosfet-n', name:'N-Channel MOSFET', category:'electronic', subcategory:'semiconductor',
    svg: s(L(0,30,16,30)+L(16,14,16,46)+L(20,14,20,46)+L(20,22,36,22)+L(36,22,36,14)+L(36,14,60,14)+L(20,38,36,38)+L(36,38,36,46)+L(36,46,60,46)+P('M32,34 L36,38 L32,42','currentColor')+L(36,30,50,30)+L(50,30,50,10)),
    connectionPoints:[{x:0,y:30},{x:60,y:14},{x:60,y:46},{x:50,y:4}],
    tags:['mosfet','n-channel','enhancement','irf540','power switch','gate drive'], standards:['ANSI','IEC']
  },
  {
    id:'op-amp', name:'Operational Amplifier', category:'electronic', subcategory:'active',
    svg: s(P('M8,8 L8,52 L52,30 Z')+T(20,20,'−',12)+T(20,40,'+',12)+T(40,30,'≥1',9)+L(0,20,8,20)+L(0,40,8,40)+L(52,30,60,30)),
    connectionPoints:[{x:0,y:20,type:'inv-input'},{x:0,y:40,type:'non-inv-input'},{x:60,y:30,type:'output'}],
    tags:['op amp','operational amplifier','lm741','tl071','comparator','amplifier','ua741'], standards:['ANSI','IEC']
  },
  {
    id:'comparator', name:'Comparator', category:'electronic', subcategory:'active',
    svg: s(P('M8,8 L8,52 L52,30 Z')+T(20,20,'−',12)+T(20,40,'+',12)+L(0,20,8,20)+L(0,40,8,40)+L(52,30,60,30)),
    connectionPoints:[{x:0,y:20},{x:0,y:40},{x:60,y:30}],
    tags:['comparator','lm393','voltage compare','digital output','schmitt trigger'], standards:['IEC']
  },
  {
    id:'ic-chip', name:'Integrated Circuit (IC)', category:'electronic', subcategory:'active',
    svg: s(R(12,8,36,44,2)+L(12,20,0,20)+L(12,30,0,30)+L(12,40,0,40)+L(48,20,60,20)+L(48,30,60,30)+L(48,40,60,40)+T(30,28,'IC',10)),
    connectionPoints:[{x:0,y:20},{x:0,y:30},{x:0,y:40},{x:60,y:20},{x:60,y:30},{x:60,y:40}],
    tags:['ic','integrated circuit','chip','microcontroller','logic','dip smd'], standards:['ANSI','IEC']
  },
  {
    id:'crystal-oscillator', name:'Crystal Oscillator', category:'electronic', subcategory:'passive',
    svg: s(L(0,30,14,30)+R(14,18,14,24)+L(28,18,28,42)+L(32,18,32,42)+R(32,18,14,24)+L(46,30,60,30)),
    connectionPoints: CP_LR, tags:['crystal','oscillator','xtal','quartz','clock source','mhz'], standards:['IEC']
  },
  {
    id:'speaker-sym', name:'Speaker', category:'electronic', subcategory:'transducers',
    svg: s(P('M8,18 L24,18 L40,6 L40,54 L24,42 L8,42 Z')+P('M44,16 Q54,30 44,44')),
    connectionPoints: CP_LR, tags:['speaker','loudspeaker','audio','transducer','driver','ohm'], standards:['ANSI','IEC']
  },
  {
    id:'microphone-sym', name:'Microphone', category:'electronic', subcategory:'transducers',
    svg: s(C(30,22,12)+L(22,22,38,22)+L(30,34,30,44)+L(20,44,40,44)+P('M16,28 Q12,36 16,40')+P('M44,28 Q48,36 44,40')),
    connectionPoints: CP_B, tags:['microphone','mic','condenser','dynamic','capsule','recording'], standards:['IEC']
  },

  // ══════════════════════════════════════════════════════════════════
  // CATEGORY 18 — WIRING, CONDUIT & RACEWAYS
  // ══════════════════════════════════════════════════════════════════
  {
    id:'wire-crossing', name:'Wire Crossing (No Connection)', category:'wiring', subcategory:'conductors',
    svg: s(L(0,30,28,30)+L(32,30,60,30)+L(30,0,30,28)+L(30,32,30,60)),
    connectionPoints:[{x:0,y:30},{x:60,y:30},{x:30,y:0},{x:30,y:60}],
    tags:['wire crossing','no connection','bridge','over-under','jump'], standards:['ANSI','IEC']
  },
  {
    id:'wire-junction', name:'Wire Junction (Connected)', category:'wiring', subcategory:'conductors',
    svg: s(L(0,30,60,30)+L(30,0,30,60)+DOT(30,30)),
    connectionPoints:[{x:0,y:30},{x:60,y:30},{x:30,y:0},{x:30,y:60}],
    tags:['junction','tee','node','connection point','dot','splice'], standards:['ANSI','IEC']
  },
  {
    id:'wire-bundle', name:'Wire Bundle / Cable', category:'wiring', subcategory:'conductors',
    svg: s(L(0,30,60,30)+P('M26,24 L30,18 L34,24')+P('M26,36 L30,42 L34,36')+T(30,30,'3',9)),
    connectionPoints: CP_LR, tags:['cable','wire bundle','multiconductor','harness','loom','sheathed'], standards:['ANSI','IEC']
  },
  {
    id:'terminal-block', name:'Terminal Block', category:'wiring', subcategory:'terminations',
    svg: s(R(4,16,52,28,2)+L(4,30,56,30)+L(14,16,14,44)+L(28,16,28,44)+L(42,16,42,44)+L(10,8,10,16)+L(24,8,24,16)+L(38,8,38,16)+L(52,8,52,16)+L(10,44,10,52)+L(24,44,24,52)+L(38,44,38,52)+L(52,44,52,52)),
    connectionPoints:[{x:10,y:2},{x:24,y:2},{x:38,y:2},{x:52,y:2},{x:10,y:58},{x:24,y:58},{x:38,y:58},{x:52,y:58}],
    tags:['terminal block','din rail','tb','weidmuller','phoenix','wiring terminal','screw terminal'], standards:['IEC']
  },
  {
    id:'junction-box', name:'Junction Box', category:'wiring', subcategory:'boxes',
    svg: s(R(8,8,44,44,2)+L(8,30,52,30)+L(30,8,30,52)),
    connectionPoints: CP_4, tags:['junction box','j-box','4x4','octagon','electrical box','splice box'], standards:['ANSI']
  },
  {
    id:'pull-box', name:'Pull Box / Wire Gutter', category:'wiring', subcategory:'boxes',
    svg: s(R(6,6,48,48,2)+T(30,30,'PULL\nBOX',9)),
    connectionPoints: CP_4, tags:['pull box','pulling point','wire gutter','transition box','large junction'], standards:['ANSI']
  },
  {
    id:'conduit-emt', name:'Conduit (EMT)', category:'wiring', subcategory:'conduit',
    svg: s(L(0,26,60,26)+L(0,34,60,34)+P('M0,26 Q4,30 0,34')+P('M60,26 Q56,30 60,34')),
    connectionPoints:[{x:0,y:30},{x:60,y:30}],
    tags:['emt','electrical metallic tubing','conduit','thin wall','1/2 3/4 1 inch'], standards:['ANSI']
  },
  {
    id:'conduit-pvc', name:'Conduit (PVC Schedule 40)', category:'wiring', subcategory:'conduit',
    svg: s(P('M0,26 L60,26','none')+L(0,26,60,26)+L(0,34,60,34)+P('M10,26 L10,34 M20,26 L20,34 M30,26 L30,34 M40,26 L40,34 M50,26 L50,34','none')+P('M0,26 Q0,30 0,34','none')),
    connectionPoints: CP_LR, tags:['pvc conduit','schedule 40','direct burial','plastic conduit','nonmetallic'], standards:['ANSI']
  },
  {
    id:'conduit-flex', name:'Flexible Conduit (FMC)', category:'wiring', subcategory:'conduit',
    svg: s(P('M0,30 Q6,24 12,30 Q18,36 24,30 Q30,24 36,30 Q42,36 48,30 Q54,24 60,30')+P('M0,30 Q6,36 12,30 Q18,24 24,30 Q30,36 36,30 Q42,24 48,30 Q54,36 60,30')),
    connectionPoints: CP_LR, tags:['flexible conduit','fmc','liquid tight','lfmc','motor connection','equipment whip'], standards:['ANSI']
  },
  {
    id:'cable-tray', name:'Cable Tray', category:'wiring', subcategory:'raceways',
    svg: s(L(0,18,60,18)+L(0,42,60,42)+L(10,18,10,42)+L(20,18,20,42)+L(30,18,30,42)+L(40,18,40,42)+L(50,18,50,42)),
    connectionPoints: CP_LR, tags:['cable tray','ladder tray','wire management','tray cable','tc cable','data center'], standards:['ANSI']
  },
  {
    id:'wire-nut', name:'Wire Nut / Marrette', category:'wiring', subcategory:'connectors',
    svg: s(P('M18,10 L42,10 L48,40 Q30,52 12,40 Z')+C(30,10,12)+T(30,28,'W.N.',8)),
    connectionPoints:[{x:20,y:4},{x:30,y:4},{x:40,y:4}],
    tags:['wire nut','marrette','twist connector','scotchlok','splice','3M'], standards:['ANSI']
  },
  {
    id:'shielded-cable', name:'Shielded Cable', category:'wiring', subcategory:'conductors',
    svg: s(L(0,30,10,30)+C(30,30,16)+L(14,30,46,30)+L(50,30,60,30)+P('M14,26 L16,22 L44,22 L46,26 M14,34 L16,38 L44,38 L46,34')+T(30,14,'SH',8)),
    connectionPoints: CP_LR, tags:['shielded cable','shield','emi','foil braid','twisted shielded pair','instrumentation'], standards:['IEC']
  },
  {
    id:'twisted-pair', name:'Twisted Pair (TP)', category:'wiring', subcategory:'conductors',
    svg: s(L(0,30,8,30)+P('M8,30 Q14,22 20,30 Q26,38 32,30 Q38,22 44,30 Q50,38 56,30')+P('M8,30 Q14,38 20,30 Q26,22 32,30 Q38,38 44,30 Q50,22 56,30')+L(56,30,60,30)),
    connectionPoints: CP_LR, tags:['twisted pair','tp','cat cable','ethernet','differential signal','emc'], standards:['IEC']
  },

  // ══════════════════════════════════════════════════════════════════
  // CATEGORY 19 — RENEWABLE ENERGY & EMERGING TECH
  // ══════════════════════════════════════════════════════════════════
  {
    id:'solar-panel-re', name:'Solar PV Panel (Schematic)', category:'renewable', subcategory:'solar',
    svg: s(R(6,10,48,40)+L(6,23,54,23)+L(6,36,54,36)+L(22,10,22,50)+L(38,10,38,50)+L(0,30,6,30)+L(54,30,60,30)),
    connectionPoints: CP_LR, tags:['solar panel','pv module','photovoltaic','polycrystalline monocrystalline','renewable'], standards:['IEC']
  },
  {
    id:'solar-inverter', name:'Solar String Inverter', category:'renewable', subcategory:'solar',
    svg: s(R(6,8,48,44,3)+T(30,22,'SOLAR',9)+T(30,32,'INVERTER',7)+P('M14,42 Q22,36 30,42 Q38,48 46,42')+L(0,30,6,30)+L(54,30,60,30)),
    connectionPoints: CP_LR, tags:['solar inverter','string inverter','grid tie','pv inverter','sma fronius','enphase'], standards:['IEC']
  },
  {
    id:'micro-inverter', name:'Micro-Inverter', category:'renewable', subcategory:'solar',
    svg: s(R(10,14,40,32,3)+T(30,26,'μINV',10)+T(30,36,'AC',9)+L(0,30,10,30)+L(50,30,60,30)),
    connectionPoints: CP_LR, tags:['micro inverter','enphase','iq8','per-panel','module level','mlpe'], standards:['IEC']
  },
  {
    id:'battery-storage', name:'Battery Energy Storage (BESS)', category:'renewable', subcategory:'storage',
    svg: s(R(6,8,48,44,3)+T(30,22,'BESS',10)+T(30,32,'BATTERY',8)+L(0,20,6,20)+L(0,40,6,40)+L(54,30,60,30)),
    connectionPoints:[{x:0,y:20},{x:0,y:40},{x:60,y:30}],
    tags:['battery storage','bess','powerwall','powerpack','tesla','enphase','lithium'], standards:['IEC']
  },
  {
    id:'ev-charger-l2', name:'EV Charger Level 2 (EVSE)', category:'renewable', subcategory:'ev',
    svg: s(R(8,4,44,52,3)+T(30,18,'EVSE',10)+T(30,28,'L2',13)+T(30,40,'240V',9)+L(30,56,30,60)),
    connectionPoints: CP_B, tags:['ev charger','level 2','evse','j1772','240v','chargepoint','clipperCreek'], standards:['ANSI']
  },
  {
    id:'ev-charger-l3-dcfc', name:'DC Fast Charger (Level 3)', category:'renewable', subcategory:'ev',
    svg: s(R(6,4,48,52,3)+T(30,18,'DCFC',11)+T(30,28,'L3',13)+T(30,38,'DC',9)+T(30,48,'480V',8)),
    connectionPoints: CP_B, tags:['dc fast charger','level 3','ccs','chademo','tesla supercharger','50kw 150kw'], standards:['ANSI']
  },
  {
    id:'ev-charger-l1', name:'EV Charger Level 1 (120V)', category:'renewable', subcategory:'ev',
    svg: s(R(10,8,40,44,3)+T(30,22,'EVSE',9)+T(30,32,'L1',12)+T(30,42,'120V',8)),
    connectionPoints: CP_B, tags:['ev charger','level 1','120v','outlet charge','slow charge','trickle'], standards:['ANSI']
  },
  {
    id:'smart-meter', name:'Smart / Net Meter', category:'renewable', subcategory:'metering',
    svg: s(R(6,8,48,44,3)+T(30,22,'SMART',9)+T(30,32,'METER',9)+P('M12,40 Q22,36 32,40 Q42,44 52,40')),
    connectionPoints: CP_4, tags:['smart meter','net meter','utility meter','ami','bidirectional','solar'], standards:['ANSI']
  },
  {
    id:'charge-controller', name:'Solar Charge Controller', category:'renewable', subcategory:'solar',
    svg: s(R(8,10,44,40,3)+T(30,24,'CHARGE',8)+T(30,34,'CTRL',9)+L(0,20,8,20)+L(0,40,8,40)+L(52,30,60,30)),
    connectionPoints:[{x:0,y:20},{x:0,y:40},{x:60,y:30}],
    tags:['charge controller','mppt','pwm','solar battery','victron','morningstar'], standards:['IEC']
  },
  {
    id:'combiner-box', name:'Solar Combiner Box', category:'renewable', subcategory:'solar',
    svg: s(R(8,8,44,44,3)+T(30,22,'PV',10)+T(30,32,'COMB.',9)+L(16,8,16,16)+L(24,8,24,16)+L(36,8,36,16)+L(44,8,44,16)+L(30,52,30,60)),
    connectionPoints:[{x:16,y:0},{x:24,y:0},{x:36,y:0},{x:44,y:0},{x:30,y:60}],
    tags:['combiner box','pv combiner','solar array','string combiner','dc disconnect'], standards:['IEC']
  },
  {
    id:'bidirectional-inverter', name:'Bidirectional Inverter', category:'renewable', subcategory:'storage',
    svg: s(R(6,8,48,44,3)+T(30,22,'BIDIR',9)+T(30,32,'INV',10)+P('M14,42 L22,38 L14,34 M46,38 L38,42 L46,34')+L(14,38,46,38)),
    connectionPoints: CP_LR, tags:['bidirectional','v2g','vehicle to grid','battery backup','hybrid inverter'], standards:['IEC']
  },
  {
    id:'wind-turbine-tower', name:'Wind Turbine (Tower)', category:'renewable', subcategory:'wind',
    svg: s(L(30,56,30,26)+L(22,56,38,56)+C(30,26,5,'currentColor')+P('M30,21 Q34,18 38,12 Q32,14 30,21')+P('M35,29 Q38,34 44,36 Q42,30 35,29')+P('M25,29 Q22,34 16,36 Q18,30 25,29')),
    connectionPoints: CP_B, tags:['wind turbine','wind power','horizontal axis','tower','renewable','wind farm'], standards:['IEC']
  },
  {
    id:'grid-tie-inverter', name:'Grid-Tie Inverter', category:'renewable', subcategory:'solar',
    svg: s(R(6,8,48,44,3)+T(30,20,'GRID',9)+T(30,30,'TIE',10)+T(30,40,'INV',9)+L(0,20,6,20)+L(0,40,6,40)+L(54,30,60,30)),
    connectionPoints:[{x:0,y:20},{x:0,y:40},{x:60,y:30}],
    tags:['grid tie','utility interconnect','anti-islanding','net metering','pv inverter'], standards:['IEC']
  },

  // ══════════════════════════════════════════════════════════════════
  // CATEGORY 20 — MEASURING INSTRUMENTS
  // ══════════════════════════════════════════════════════════════════
  {
    id:'voltmeter', name:'Voltmeter', category:'measuring', subcategory:'meters',
    svg: s(C(30,30,22)+T(30,30,'V',16)),
    connectionPoints: CP_LR, tags:['voltmeter','volt','voltage','v','measurement','meter'], standards:['ANSI','IEC']
  },
  {
    id:'ammeter', name:'Ammeter', category:'measuring', subcategory:'meters',
    svg: s(C(30,30,22)+T(30,30,'A',16)),
    connectionPoints: CP_LR, tags:['ammeter','current','ampere','amp','a','measurement','ct meter'], standards:['ANSI','IEC']
  },
  {
    id:'wattmeter', name:'Wattmeter', category:'measuring', subcategory:'meters',
    svg: s(C(30,30,22)+T(30,30,'W',14)),
    connectionPoints: CP_LR, tags:['wattmeter','power','watt','w','kw','measurement','power meter'], standards:['ANSI','IEC']
  },
  {
    id:'var-meter', name:'VAR Meter (Reactive Power)', category:'measuring', subcategory:'meters',
    svg: s(C(30,30,22)+T(30,30,'VAR',12)),
    connectionPoints: CP_LR, tags:['var meter','reactive power','kvar','power factor','reactive'], standards:['ANSI','IEC']
  },
  {
    id:'pf-meter', name:'Power Factor Meter', category:'measuring', subcategory:'meters',
    svg: s(C(30,30,22)+T(30,28,'PF',12)+T(30,40,'cos φ',9)),
    connectionPoints: CP_LR, tags:['power factor','pf','cos phi','reactive power','efficiency'], standards:['ANSI','IEC']
  },
  {
    id:'frequency-meter', name:'Frequency Meter', category:'measuring', subcategory:'meters',
    svg: s(C(30,30,22)+T(30,30,'Hz',13)),
    connectionPoints: CP_LR, tags:['frequency meter','hertz','hz','60hz 50hz','grid frequency'], standards:['ANSI','IEC']
  },
  {
    id:'ohmmeter', name:'Ohmmeter', category:'measuring', subcategory:'meters',
    svg: s(C(30,30,22)+T(30,30,'Ω',14)),
    connectionPoints: CP_LR, tags:['ohmmeter','resistance','ohm','megger','insulation test','continuity'], standards:['ANSI','IEC']
  },
  {
    id:'multimeter', name:'Multimeter (DMM)', category:'measuring', subcategory:'instruments',
    svg: s(R(8,6,44,48,4)+R(14,10,32,18,2)+T(30,19,'DMM',8)+P('M14,36 Q22,30 30,36 Q38,42 46,36')+L(22,54,22,60)+L(38,54,38,60)),
    connectionPoints:[{x:22,y:60},{x:38,y:60}],
    tags:['multimeter','dmm','fluke','volt ohm meter','vom','digital meter'], standards:['ANSI']
  },
  {
    id:'oscilloscope', name:'Oscilloscope', category:'measuring', subcategory:'instruments',
    svg: s(R(6,6,48,42,3)+R(10,10,40,28,2)+P('M12,22 Q16,14 20,22 Q24,30 28,22 Q32,14 36,22 Q40,30 44,22')+T(30,46,'SCOPE',8)),
    connectionPoints:[{x:0,y:30},{x:60,y:30}],
    tags:['oscilloscope','scope','waveform','tek agilent','signal analysis','ac dc signal'], standards:['ANSI']
  },
  {
    id:'clamp-meter', name:'Clamp Meter', category:'measuring', subcategory:'instruments',
    svg: s(R(14,28,32,26,3)+T(30,38,'CLAMP',7)+T(30,28,'A',10)+P('M24,28 Q14,18 24,8')+P('M36,28 Q46,18 36,8')+P('M24,8 L36,8')),
    connectionPoints:[{x:14,y:60},{x:46,y:60}],
    tags:['clamp meter','current clamp','clip-on ammeter','fluke 376','inrush current'], standards:['ANSI']
  },
  {
    id:'energy-meter', name:'Energy Meter (kWh)', category:'measuring', subcategory:'meters',
    svg: s(C(30,28,20)+T(30,24,'kWh',10)+C(30,28,10)+T(30,36,'M',9)+T(30,52,'ENERGY',7)),
    connectionPoints: CP_TB, tags:['energy meter','kwh','electricity meter','utility','billing','pulse output'], standards:['ANSI','IEC']
  },
  {
    id:'insulation-tester', name:'Insulation Resistance Tester (Megger)', category:'measuring', subcategory:'instruments',
    svg: s(R(8,10,44,40,3)+T(30,24,'MEGGER',7)+T(30,34,'MΩ',11)+L(22,50,22,58)+L(38,50,38,58)),
    connectionPoints:[{x:22,y:60},{x:38,y:60}],
    tags:['megger','insulation resistance','hipot','ir test','motor winding test','500v 1000v'], standards:['ANSI','IEC']
  },
  {
    id:'power-quality-analyzer', name:'Power Quality Analyzer', category:'measuring', subcategory:'instruments',
    svg: s(R(6,6,48,48,3)+R(10,10,40,26,2)+P('M12,18 L18,14 L22,22 L28,12 L34,22 L38,14 L44,18 L50,14')+T(30,44,'PQ ANLY',7)),
    connectionPoints: CP_4, tags:['power quality','harmonics','thd','flicker','sag swell','dranetz'], standards:['ANSI','IEC']
  },
  {
    id:'demand-meter', name:'Demand Meter', category:'measuring', subcategory:'meters',
    svg: s(C(30,28,20)+T(30,24,'kW',10)+T(30,36,'PEAK',8)+T(30,52,'DEMAND',7)),
    connectionPoints: CP_TB, tags:['demand meter','peak demand','kw','ratchet clause','billing demand'], standards:['ANSI']
  },

];


export default SYMBOLS_C;
