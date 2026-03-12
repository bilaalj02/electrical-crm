# MES Electrical CRM — Electrical Diagramming Module
## Comprehensive Implementation Plan
### Version 2.0 — March 2026

---

## EXECUTIVE SUMMARY

This document is the complete specification and implementation plan for the **Electrical Diagramming Module** — a fully integrated, web-based diagramming tool built into the MES Electrical CRM. The goal is to give the client total creative freedom: if an electrical symbol or component exists in the real world, it is in this application. If it isn't, the client can draw it and save it themselves.

**Core Philosophy**: No limitations. The client should never reach a moment where they say "I can't find that symbol." Every standard symbol is pre-built. Every non-standard need is covered by the custom symbol creator.

---

## WHAT WE'RE REPLACING

**Wondershare EdrawMax** — a subscription-based desktop diagramming application.

| EdrawMax | Our Module |
|----------|-----------|
| $69–$198/user/year | Included in MES CRM |
| Generic tool, not electrical-specific | Purpose-built for electrical contractors |
| No CRM integration | Directly linked to Jobs, Clients, Quotes |
| No BOM generation | Auto-generates Bill of Materials |
| No NEC compliance | Built-in code compliance checker |
| Desktop app required | 100% web-based, works anywhere |
| Limited client collaboration | Client portal with view/approval workflow |

---

## TECHNOLOGY STACK

| Component | Technology | Reason |
|-----------|-----------|--------|
| Canvas Engine | **Fabric.js 6.x** | Best object model, SVG in/out, active maintenance |
| UI Framework | React 19 (existing) | Already in use throughout CRM |
| State Management | React useState + useReducer | Canvas history, tool state |
| PDF Export | **jsPDF** | Reliable, client-side, no server needed |
| Image Export | canvas.toDataURL() | Built into Fabric.js (PNG/JPG) |
| SVG Export | canvas.toSVG() | Built into Fabric.js |
| File Save | **file-saver** | Cross-browser download trigger |
| Backend Storage | MongoDB (existing) | Diagram metadata + canvas JSON |
| File Storage | Railway filesystem (local) or S3 | SVG symbol uploads |
| Real-time Collab | Socket.io (Phase 3) | Multi-user editing |

### NPM Dependencies to Install

```bash
# Frontend
npm install fabric jspdf file-saver

# Backend (already has multer from project photos)
# No new backend deps needed for Phase 1
```

---

## SYMBOL LIBRARY — THE CORNERSTONE

### Design Principle
**400+ pre-built symbols + unlimited custom symbols.** Every symbol the client will ever need is already here. For anything not covered, the Custom Symbol Creator lets them draw it in 60 seconds and save it permanently.

### Symbol Categories (20 Categories, 400+ Symbols)

#### Category 1: Power Sources (25 symbols)
AC voltage source, DC voltage source, Battery cell, Battery pack (series), Battery pack (parallel), Solar panel, Photovoltaic array, Wind generator, Generator (AC), Generator (DC), Alternator, Motor-generator set, Transformer (generic), UPS system, Power supply (regulated), Power supply (switching), Current source (AC), Current source (DC), Voltage regulator, Inverter (DC→AC), Converter (AC→DC), Rectifier (half-wave), Rectifier (full-wave), Bridge rectifier, Three-phase source

#### Category 2: Switches — Basic (30 symbols)
SPST (normally open), SPST (normally closed), SPDT, DPST, DPDT, 3PDT, 4PDT, Push button (NO), Push button (NC), Push button (momentary), Rocker switch, Toggle switch, Rotary switch (2-position), Rotary switch (multi-position), Selector switch (2-pos), Selector switch (3-pos), Drum switch (forward), Drum switch (reverse), Knife switch, Disconnect switch, Transfer switch (manual), Transfer switch (automatic), Key switch, Footswitch, Proximity switch, Float switch, Flow switch, Pressure switch, Temperature switch (bimetal), Vacuum switch

#### Category 3: Wall Devices & Controls (25 symbols)
Standard wall switch (single pole), 3-way switch, 4-way switch, Dimmer switch, Fan speed control, Timer switch (mechanical), Timer switch (digital), Occupancy sensor switch, Daylight sensor switch, Smart switch (WiFi), Smart switch (Z-Wave), Combination switch/outlet, Decorator switch, Toggle switch (standard), Switch with pilot light, Weatherproof switch, GFCI switch, 20A switch, Switch (ceiling pull), Pull chain switch, Doorbell button, Chime button, Intercom button, Emergency stop button, Remote control switch

#### Category 4: Receptacles & Outlets (30 symbols)
Duplex outlet 15A, Duplex outlet 20A, Single outlet 15A, Single outlet 20A, GFCI outlet 15A, GFCI outlet 20A, AFCI outlet, Combination AFCI/GFCI, 240V outlet (NEMA 6-20), 240V outlet (NEMA 6-30), 240V outlet (NEMA 6-50), Dryer outlet (NEMA 14-30), Range outlet (NEMA 14-50), 30A outlet (NEMA L14-30), 50A outlet (NEMA L6-50), Twist-lock outlet (NEMA L5-15), Twist-lock outlet (NEMA L5-20), Weatherproof outlet (WP), Weatherproof outlet with cover, USB outlet (Type A), USB-C outlet, USB combo outlet, Floor outlet, Ceiling outlet, Split-wired outlet, Switched outlet, Isolated ground outlet, Hospital grade outlet, Locking recep (NEMA L14-20), RV outlet (NEMA 14-50R)

#### Category 5: Lighting Fixtures (35 symbols)
Ceiling light (generic), Ceiling light (recessed), Ceiling light (surface), Ceiling fan, Ceiling fan with light, Pendant light, Chandelier, Track light, Track lighting (multi), Wall sconce, Wall bracket, Vanity light bar, Under-cabinet light, Fluorescent light (1-tube), Fluorescent light (2-tube), Fluorescent light (4-tube), LED panel, LED strip, High bay light, Low bay light, Flood light (outdoor), Spot light, Landscape light, Step/path light, Exit sign, Exit sign (arrow), Emergency light, Emergency exit combo, Battery backup light, Stairwell light, Closet light, Night light, Utility light (keyless), Parking lot light, Street light

#### Category 6: Circuit Protection (20 symbols)
Circuit breaker (1-pole), Circuit breaker (2-pole), Circuit breaker (3-pole), GFCI circuit breaker, AFCI circuit breaker, Combination AFCI/GFCI breaker, Tandem breaker, 240V breaker, Miniature circuit breaker (MCB), Molded case circuit breaker (MCCB), Fuse (generic), Fuse (cartridge), Fuse (plug), Fuse holder, Fusible disconnect, Surge protective device (SPD), Lightning arrester, Thermal overload relay, Magnetic overload relay, Ground fault relay

#### Category 7: Panels & Distribution Equipment (25 symbols)
Main service panel (100A), Main service panel (200A), Main service panel (400A), Sub-panel, Load center, Distribution board, Main lug only (MLO) panel, Meter socket (single), Meter socket (multiple), Meter base with disconnect, Meter can (CT rated), Bus bar (horizontal), Bus bar (vertical), Neutral bar, Ground bar, Main breaker, Feed-through lugs, Wireway (horizontal), Wireway (vertical), Panelboard (flush), Panelboard (surface), Distribution center, Power distribution unit (PDU), Busway section, Busway plug-in tap

#### Category 8: Transformers (15 symbols)
Transformer (2-winding), Transformer (step-up), Transformer (step-down), Isolation transformer, Auto-transformer, Control transformer, Current transformer (CT), Potential transformer (PT), 3-phase transformer (delta-delta), 3-phase transformer (delta-wye), 3-phase transformer (wye-wye), 3-phase transformer (wye-delta), Buck-boost transformer, Toroidal transformer, Pole-mounted transformer

#### Category 9: Motors & Drives (20 symbols)
AC motor (single-phase), AC motor (3-phase), DC motor (shunt), DC motor (series), DC motor (compound), Universal motor, Servo motor, Stepper motor, Variable frequency drive (VFD), Soft starter, Motor starter (manual), Motor starter (magnetic), DOL starter, Star-delta starter, Reversing starter, Motor control center (MCC), Motor disconnect, Brake (electromagnetic), Clutch (electromagnetic), Gearmotor

#### Category 10: Control Devices (25 symbols)
Relay (SPST), Relay (SPDT), Relay (DPDT), Relay (3PDT), Relay coil, Contactor (2-pole), Contactor (3-pole), Contactor coil, Latching relay, Time-delay relay (on), Time-delay relay (off), Pneumatic timer (on-delay), Pneumatic timer (off-delay), Counter (up), Counter (down), PLC (generic), PLC input module, PLC output module, HMI panel, I/O terminal block (DIN), Control panel, Pushbutton station (1-button), Pushbutton station (2-button), Pushbutton station (3-button), E-stop station

#### Category 11: Sensors & Detectors (30 symbols)
Temperature sensor (thermocouple), Temperature sensor (RTD), Temperature sensor (thermistor), Thermostat (heating), Thermostat (cooling), Pressure sensor, Pressure switch (high), Pressure switch (low), Differential pressure switch, Level sensor (float), Level sensor (ultrasonic), Flow sensor, Flow meter, Photoelectric sensor (through-beam), Photoelectric sensor (reflective), Inductive proximity sensor, Capacitive proximity sensor, Magnetic reed switch, Limit switch (generic), Limit switch (roller), Motion sensor (PIR), Occupancy sensor (ceiling), Carbon monoxide detector, Gas detector (natural gas), Gas detector (CO2), Vibration sensor, Accelerometer, Humidity sensor, Light sensor (photocell), Rain sensor

#### Category 12: Fire Alarm & Life Safety (25 symbols)
Fire alarm control panel (FACP), Smoke detector (ionization), Smoke detector (photoelectric), Combination smoke/CO detector, Heat detector (fixed temp), Heat detector (rate of rise), Flame detector, Duct smoke detector, Beam smoke detector, Manual pull station, Notification appliance (horn), Notification appliance (strobe), Horn/strobe combo, Voice evacuation speaker, Fire alarm bell, Fire telephone, Fire alarm module (monitor), Fire alarm module (control), Fire alarm relay, Sprinkler flow switch, Sprinkler head, Suppression system control, Emergency voice system, Mass notification panel, Firefighter's phone jack

#### Category 13: Security Systems (20 symbols)
Security control panel, Motion detector (PIR), Dual-tech motion detector, Door contact (magnetic), Window contact, Glass break sensor, Vibration detector, Passive infrared sensor, Microwave sensor, Ultrasonic sensor, Indoor siren, Outdoor siren/strobe, Security camera (fixed), Security camera (PTZ), Video recorder (NVR/DVR), Access control panel, Card reader, Keypad, Electric door strike, Magnetic lock (magloc)

#### Category 14: Communication & Data (20 symbols)
RJ45 outlet (Cat5e), RJ45 outlet (Cat6), RJ45 outlet (Cat6A), Telephone outlet (RJ11), Coaxial outlet (cable TV), CATV splitter, Coaxial outlet (satellite), Fiber optic outlet, Fiber optic patch panel, Data patch panel, Network switch (unmanaged), Network switch (managed), Router, Modem, WiFi access point (ceiling), WiFi access point (wall), Ethernet hub, Cable tray (data), J-hook (data), Server rack

#### Category 15: HVAC & Mechanical (20 symbols)
HVAC unit (split system), Air handler, Condenser (outdoor), Rooftop unit (RTU), Fan coil unit, Heat pump, Heat exchanger, Boiler, Electric resistance heater, Baseboard heater, Unit heater, Electric furnace, Thermostat (programmable), Thermostat (smart), Humidifier, Dehumidifier, Exhaust fan (ceiling), Exhaust fan (wall), Damper (manual), Damper (motorized)

#### Category 16: Grounding & Bonding (15 symbols)
Ground (chassis/earth), Ground (signal), Ground (power), Ground rod (driven), Ground plate, Ground electrode (water pipe), Grounding conductor, Equipment grounding conductor (EGC), Ground bus bar, Bonding jumper (main), Bonding jumper (equipment), Lightning protection rod, Lightning down conductor, Ground test well, Static dissipative ground

#### Category 17: Electronic Components (30 symbols)
Resistor (fixed), Resistor (variable / potentiometer), Resistor (light-dependent / LDR), Capacitor (non-polarized), Capacitor (electrolytic / polarized), Capacitor (variable), Inductor (air core), Inductor (iron core), Transformer (coil symbol), Diode (rectifier), Diode (Zener), Diode (Schottky), LED (generic), LED (infrared), Photodiode, Transistor (NPN BJT), Transistor (PNP BJT), MOSFET (N-channel), MOSFET (P-channel), JFET (N-channel), SCR (thyristor), TRIAC, DIAC, Operational amplifier (op-amp), Comparator, Integrated circuit (generic IC), Crystal oscillator, Speaker, Buzzer, Microphone

#### Category 18: Wiring, Conduit & Raceways (20 symbols)
Wire (single conductor), Wire crossing (no connection), Wire junction (connection dot), Wire bundle (3 conductors), Wire bundle (4 conductors), Twisted pair, Shielded cable, Coaxial cable, Terminal block (single), Terminal block (strip), Wire nut (Marrette), Butt splice connector, Ring terminal, Spade terminal, Junction box, Pull box, Conduit (EMT), Conduit (PVC), Conduit (flexible), Cable tray section

#### Category 19: Renewable Energy & Emerging Tech (20 symbols)
Solar panel (single), Solar panel array, Solar inverter (string), Solar inverter (micro), Solar combiner box, Battery storage (lithium), Battery storage (lead-acid), EV charger (Level 1), EV charger (Level 2 EVSE), EV charger (DC fast / Level 3), Smart meter, Net metering disconnect, Grid-tie inverter, Wind turbine, Charge controller, Monitoring gateway, Load controller, Energy management system, V2G charger, Bidirectional inverter

#### Category 20: Measuring Instruments (15 symbols)
Voltmeter, Ammeter, Wattmeter, VAR meter, Power factor meter, Frequency meter, Ohmmeter, Multimeter, Oscilloscope, Clamp meter, Energy meter (kWh), Demand meter, Ground fault indicator, Insulation resistance tester, Power quality analyzer

**Total Pre-Built Symbols: 440+**

---

## CUSTOM SYMBOL CREATOR

When the client cannot find a symbol, they can build one in under 60 seconds.

### Creation Tools
1. **Shape tools**: Rectangle, circle, ellipse, triangle, line, polyline, arc
2. **Text**: Add labels inside or outside the shape
3. **Draw mode**: Freehand pen for irregular shapes
4. **Import SVG**: Upload any SVG file from their computer
5. **Edit existing**: Clone and modify any pre-built symbol as a starting point

### Save Workflow
1. Draw the symbol
2. Set connection points (drag to add input/output ports)
3. Name it, assign category ("My Symbols"), add tags
4. Save to "Custom Symbols" library — persists in MongoDB forever
5. Available in every future diagram

### Custom Symbol Storage
```javascript
// MongoDB: CustomSymbol collection
{
  _id, userId, companyId,
  name: "Double-Tap Breaker",
  category: "custom",
  svgData: "<svg>...</svg>",
  connectionPoints: [{ x: 0, y: 20, type: 'left' }, { x: 60, y: 20, type: 'right' }],
  tags: ["breaker", "tandem", "double-tap"],
  createdAt, updatedAt
}
```

---

## FILE STRUCTURE

```
frontend/src/components/DiagramEditor/
├── DiagramEditor.jsx          ← Main container (toolbar + canvas + panels)
├── DiagramEditor.css          ← All styles for the editor
├── Canvas.jsx                 ← Fabric.js canvas wrapper + grid + zoom
├── Toolbar.jsx                ← Top bar: tool selection, undo, save, export
├── SymbolLibrary.jsx          ← Left panel: search, categories, drag-to-canvas
├── PropertiesPanel.jsx        ← Right panel: selected object properties
├── ExportModal.jsx            ← Export dialog (PDF/PNG/SVG)
├── CustomSymbolCreator.jsx    ← Modal for building custom symbols
└── symbols/
    └── electricalSymbols.js  ← All 440+ symbol definitions
```

```
backend/src/
├── models/
│   ├── Diagram.js             ← Diagram schema (canvas data, linked job)
│   └── CustomSymbol.js        ← User-created symbol schema
├── routes/
│   └── diagramRoutes.js       ← CRUD + export + custom symbols API
└── uploads/symbols/           ← Uploaded SVG files
```

---

## LAYOUT & UX

```
┌──────────────────────────────────────────────────────────────────────┐
│  [Select] [Wire] [Text] [Shape] | Undo Redo | Zoom | Save | Export  │ ← Toolbar
├──────────────┬───────────────────────────────────┬───────────────────┤
│  🔍 Search   │                                   │  Properties       │
│  ─────────   │         CANVAS                    │  ─────────        │
│  ▼ Power     │    (Fabric.js, grid, rulers)       │  X: 120  Y: 80    │
│    Sources   │                                   │  W: 60   H: 40    │
│  ▼ Switches  │                                   │  Rotation: 0°     │
│  ▼ Outlets   │                                   │  ─────────        │
│  ▼ Lighting  │                                   │  Stroke: ██       │
│  ▼ Breakers  │                                   │  Fill: ██         │
│  ▶ Panels    │                                   │  Stroke W: 2      │
│  ▶ Motors    │                                   │  ─────────        │
│  ▼ Custom    │                                   │  Voltage: 120V    │
│  + New Symbol│                                   │  Amperage: 20A    │
│              │                                   │  Label: ""        │
└──────────────┴───────────────────────────────────┴───────────────────┘
```

**Left Panel (Symbol Library)**: 300px wide, scrollable
**Canvas**: Flexible middle, fills remaining space
**Right Panel (Properties)**: 280px wide, context-aware
**Toolbar**: Fixed top, all tools + save/export

---

## CANVAS FEATURES

### Grid & Navigation
- Configurable grid: Off / 10px / 20px / 1/4" / 1/2" / 1"
- Snap-to-grid toggle (S key)
- Rulers showing real-world measurements
- Zoom: Ctrl+wheel, toolbar buttons, 10% → 500%
- Pan: Spacebar + drag, or middle mouse button
- Fit to window: Ctrl+Shift+F
- Zoom to selection: Ctrl+Shift+Z

### Drawing Tools
| Tool | Shortcut | Description |
|------|----------|-------------|
| Select | V / Esc | Select, move, resize, rotate objects |
| Wire (straight) | W | Click start → click end, draws line |
| Wire (orthogonal) | O | Auto-routes 90° around objects |
| Text | T | Click to place text label |
| Rectangle | R | Draw boxes for enclosures, panels |
| Circle | C | Draw circles for junction nodes |
| Line | L | Freeform straight line |
| Dimension | D | Dimension line with arrows and measurement |
| Note | N | Yellow callout box with text |

### Selection & Editing
- Click: select one object
- Shift+click: add to selection
- Drag: rubber-band multi-select
- Ctrl+A: select all
- Arrow keys: nudge 1px (Shift+arrow: 10px)
- Ctrl+D: duplicate
- Delete/Backspace: delete selected
- Ctrl+G: group selected objects
- Ctrl+U: ungroup
- Ctrl+[ / Ctrl+]: move backward/forward in layer order

### Undo / Redo
- Ctrl+Z: undo (50 levels)
- Ctrl+Y or Ctrl+Shift+Z: redo
- Full command pattern — every action is reversible

---

## EXPORT SYSTEM

### Export Formats
| Format | Quality | Use Case |
|--------|---------|----------|
| PDF | Print-ready, vector | Sending to client, printing, permits |
| PNG | 300 DPI | Attaching to emails, docs |
| JPG | 150 DPI | Quick sharing |
| SVG | Vector, infinite scale | Importing into CAD/other tools |
| JSON | Full diagram state | Backup, version control |

### Title Block (auto-filled from linked Job)
```
┌──────────────────────────────────────────────────────┐
│ MES Electrical                    PROJECT:            │
│ [Logo]    [Phone]     [Email]     CLIENT:             │
│                                   ADDRESS:            │
│                                   DRAWN BY:  DATE:    │
│                                   SHEET: 1 OF 1       │
└──────────────────────────────────────────────────────┘
```

---

## BACKEND API ROUTES

```
POST   /api/diagrams                Create new diagram
GET    /api/diagrams                List diagrams (filter by job, client, status)
GET    /api/diagrams/:id            Get diagram with canvas data
PATCH  /api/diagrams/:id            Update (auto-save every 30s)
DELETE /api/diagrams/:id            Delete
POST   /api/diagrams/:id/duplicate  Clone diagram

GET    /api/diagrams/:id/versions   Version history
POST   /api/diagrams/:id/versions   Save named version

POST   /api/symbols/custom          Save custom symbol
GET    /api/symbols/custom          Get all custom symbols for this company
DELETE /api/symbols/custom/:id      Delete custom symbol
POST   /api/symbols/upload          Upload SVG file as symbol
```

### Diagram Schema
```javascript
{
  _id, title, jobId, clientId,
  type: 'electrical-plan' | 'circuit' | 'wiring' | 'schematic' | 'panel-schedule' | 'other',
  canvasData: Object,       // Full Fabric.js JSON (serialized canvas)
  thumbnail: String,        // Base64 PNG thumbnail, 400×300
  version: Number,
  status: 'draft' | 'in-review' | 'approved' | 'archived',
  pageSize: 'letter' | 'legal' | 'tabloid' | 'a4' | 'a3',
  orientation: 'landscape' | 'portrait',
  scale: String,            // "1/4\"=1'" or "NTS"
  tags: [String],
  createdBy, modifiedBy,
  createdAt, updatedAt
}
```

---

## CRM INTEGRATION POINTS

### Job Detail Page
- "Diagrams" tab showing thumbnail grid of all diagrams for this job
- "New Diagram" button → opens editor pre-linked to this job
- Version history per diagram (Draft v1, Draft v2, Approved v3)
- "Download Approved" button for clients

### Quote / Invoice
- Diagram thumbnail embeds in PDF quote
- BOM from diagram → pre-fills quote line items
- "Based on diagram: [name] v[n]" note on quote

### Client Portal
- View-only mode (no editing, no tools)
- Can leave approval comments
- Can download approved PDFs

---

## PHASE BREAKDOWN

### Phase 1 — MVP (Weeks 1–6)
- Canvas setup (Fabric.js, grid, zoom, pan)
- 440+ pre-built symbol library
- Symbol library sidebar (search, categories, drag-drop)
- Basic drawing tools (select, wire, text, shapes)
- Properties panel (position, size, rotation, color)
- Undo/redo (50 levels)
- Save to MongoDB (auto-save 30s)
- Export: PDF + PNG
- Link to Jobs

### Phase 2 — Polish (Weeks 7–10)
- Title block on export
- Layer management (show/hide, lock, reorder)
- 5 starter templates
- SVG export
- Custom symbol creator
- Symbol upload (import SVG)
- Keyboard shortcuts (full set)

### Phase 3 — Electrical Intelligence (Weeks 11–14)
- Wire sizing calculator (NEC)
- Voltage drop calculator
- Load calculator + panel schedule
- NEC compliance checker
- Bill of Materials generator (CSV export)
- BOM → Quote integration

### Phase 4 — Collaboration (Weeks 15–18)
- Real-time cursor sharing (Socket.io)
- Live object updates (multi-user)
- Comment system on diagrams
- Client portal view/approval
- Version history viewer
- Share link (view-only URL)

---

## ESTIMATED TIMELINE

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| Phase 1 — MVP | 6 weeks | Working diagram editor, full symbol library, save/export |
| Phase 2 — Polish | 4 weeks | Custom symbols, templates, layers, all exports |
| Phase 3 — Intelligence | 4 weeks | Calculations, NEC compliance, BOM, quote integration |
| Phase 4 — Collaboration | 4 weeks | Real-time collab, client portal, version history |
| **Total** | **18 weeks** | **Complete EdrawMax replacement** |

**MVP available in 6 weeks** — ready for real-world use.

---

## COMPETITIVE ADVANTAGE

| Feature | EdrawMax | Our Module |
|---------|----------|------------|
| Price | $69–$198/user/year | Included in CRM |
| Electrical symbols | ~500 (all industries) | **440+ electrical-only + unlimited custom** |
| CRM integration | None | Full (jobs, clients, quotes, invoices) |
| BOM generation | None | Auto-generates from diagram |
| NEC compliance | None | Built-in checker |
| Custom symbol creation | Limited | Full creator with SVG import |
| Client approval workflow | None | Built-in portal |
| Wire sizing calculator | None | NEC Table 310.15(B)(16) |
| Works on tablet in field | Poor | Optimized |
| Internet required | No (desktop) | Yes (web) |

---

## DEVELOPMENT STARTING POINT

```bash
# Install dependencies
cd /Users/elvis/electrical-crm/frontend
npm install fabric jspdf file-saver

# Files to create (in order):
# 1. symbols/electricalSymbols.js  ← Symbol database (most critical)
# 2. DiagramEditor.css             ← Full styling
# 3. Canvas.jsx                    ← Fabric.js canvas
# 4. Toolbar.jsx                   ← Tool buttons
# 5. SymbolLibrary.jsx             ← Left sidebar
# 6. PropertiesPanel.jsx           ← Right sidebar
# 7. ExportModal.jsx               ← Export dialog
# 8. CustomSymbolCreator.jsx       ← Custom symbol tool
# 9. DiagramEditor.jsx             ← Main container
# 10. App.jsx update               ← Wire into nav
```

---

**Document Version**: 2.0
**Created**: March 11, 2026
**Author**: Claude Code for MES Electrical CRM
**Status**: Approved — Begin Phase 1 Implementation
