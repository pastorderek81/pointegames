// Guitar-inspired stage: gunmetal side panels + cream pickguard frame around
// the screen with pickup on top and bridge on bottom. Switch left, knobs right.
const { app, BrowserWindow } = require('electron');
const fs = require('fs');

const W = 1920, H = 1080;
const OUT = process.argv[2] || '/tmp/guitar-stage.png';

const pageHtml = `<!DOCTYPE html><html><head><style>body{margin:0;padding:0;background:#000}canvas{display:block}</style></head><body>
<canvas id="c" width="${W}" height="${H}"></canvas>
<script>
const c = document.getElementById('c');
const ctx = c.getContext('2d');

const BCX = ${W/2};
const BCY = ${H/2};

// ── STAGE BACKDROP ───────────────────────────────────────────────────────────
const bg = ctx.createRadialGradient(BCX, BCY, 100, BCX, BCY, 1100);
bg.addColorStop(0, '#0f1524');
bg.addColorStop(0.5, '#070a14');
bg.addColorStop(1, '#020308');
ctx.fillStyle = bg;
ctx.fillRect(0, 0, ${W}, ${H});

function spotlight(x, y, r, color){
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'transparent');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, ${W}, ${H});
}
spotlight(120, 120,          700, 'rgba(0, 220, 255, 0.22)');
spotlight(${W}-120, 120,     700, 'rgba(0, 220, 255, 0.22)');
spotlight(120, ${H}-120,     700, 'rgba(255, 40, 140, 0.2)');
spotlight(${W}-120, ${H}-120,700, 'rgba(255, 40, 140, 0.2)');

// Helper
function roundRect(x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y,     x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x,     y + h, r);
  ctx.arcTo(x,     y + h, x,     y,     r);
  ctx.arcTo(x,     y,     x + w, y,     r);
  ctx.closePath();
}

// ── SIDE PANELS (gunmetal guitar-body strips) ────────────────────────────────
const PANEL_W = 280;

function sidePanel(xStart, xEnd){
  const innerX = (xStart < BCX) ? xEnd : xStart;
  const outerX = (xStart < BCX) ? xStart : xEnd;
  const g = ctx.createLinearGradient(innerX, 0, outerX, 0);
  g.addColorStop(0,    '#4a5466');
  g.addColorStop(0.3,  '#333946');
  g.addColorStop(0.7,  '#1f2535');
  g.addColorStop(1,    '#10141f');
  ctx.fillStyle = g;
  ctx.fillRect(xStart, 0, xEnd - xStart, ${H});

  ctx.save();
  ctx.globalAlpha = 0.12;
  for (let i = 0; i < 30; i++) {
    const sx = xStart + Math.random() * (xEnd - xStart);
    const sy1 = Math.random() * ${H};
    const sy2 = sy1 + 40 + Math.random() * 200;
    const shade = 120 + Math.random() * 80 | 0;
    ctx.strokeStyle = 'rgb(' + shade + ',' + (shade+8) + ',' + (shade+16) + ')';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx, sy1);
    ctx.lineTo(sx, sy2);
    ctx.stroke();
  }
  ctx.restore();
}

sidePanel(0, PANEL_W);
sidePanel(${W} - PANEL_W, ${W});

// Inner cyan LED strip along panel edges
ctx.strokeStyle = 'rgba(0, 220, 255, 0.55)';
ctx.lineWidth = 2;
ctx.shadowColor = 'rgba(0, 220, 255, 0.6)';
ctx.shadowBlur = 12;
ctx.beginPath();
ctx.moveTo(PANEL_W, 0); ctx.lineTo(PANEL_W, ${H});
ctx.moveTo(${W} - PANEL_W, 0); ctx.lineTo(${W} - PANEL_W, ${H});
ctx.stroke();
ctx.shadowBlur = 0;

// Outer edge shadow
ctx.strokeStyle = 'rgba(0,0,0,0.6)';
ctx.lineWidth = 4;
ctx.beginPath();
ctx.moveTo(0, 0); ctx.lineTo(0, ${H});
ctx.moveTo(${W}, 0); ctx.lineTo(${W}, ${H});
ctx.stroke();

// ── PICKGUARD FRAME (extends top to bottom of canvas, wider horizontally) ────
// Pickguard spans the full canvas height, extends slightly past the panels.
const PG_X = PANEL_W - 90;
const PG_Y = 0;
const PG_W = ${W} - (PANEL_W - 90) * 2;
const PG_H = ${H};

// Screen sits inside the pickguard with room above for pickup, below for bridge
const PK_ZONE_H = 120;  // vertical space reserved for pickup at top
const BR_ZONE_H = 120;  // vertical space reserved for bridge at bottom
const SCREEN_X = PG_X + 80;
const SCREEN_Y = PG_Y + PK_ZONE_H;
const SCREEN_W = PG_W - 160;
const SCREEN_H = PG_H - PK_ZONE_H - BR_ZONE_H;

// Drop shadow
ctx.save();
ctx.shadowColor = 'rgba(0,0,0,0.7)';
ctx.shadowBlur = 25;
ctx.shadowOffsetY = 4;
ctx.fillStyle = '#0a0a0e';
roundRect(PG_X, PG_Y, PG_W, PG_H, 0);
ctx.fill();
ctx.restore();

// 3-ply pickguard look: fill with cream, then dark borders on top/bottom
roundRect(PG_X, PG_Y, PG_W, PG_H, 0);
ctx.fillStyle = '#f4efdf';
ctx.fill();

// Subtle sheen on pickguard
ctx.save();
roundRect(PG_X, PG_Y, PG_W, PG_H, 0);
ctx.clip();
const pgSheen = ctx.createLinearGradient(0, PG_Y, 0, PG_Y + PG_H);
pgSheen.addColorStop(0, 'rgba(255,255,255,0.35)');
pgSheen.addColorStop(0.3, 'rgba(255,255,255,0.08)');
pgSheen.addColorStop(1, 'rgba(0,0,0,0.08)');
ctx.fillStyle = pgSheen;
ctx.fillRect(PG_X, PG_Y, PG_W, PG_H);
ctx.restore();

// 3-ply edge stripes
ctx.strokeStyle = '#0a0a0e';
ctx.lineWidth = 3;
roundRect(PG_X, PG_Y, PG_W, PG_H, 0);
ctx.stroke();
ctx.strokeStyle = '#f4efdf';
ctx.lineWidth = 1;
roundRect(PG_X + 4, PG_Y + 4, PG_W - 8, PG_H - 8, 0);
ctx.stroke();
ctx.strokeStyle = '#0a0a0e';
ctx.lineWidth = 1;
roundRect(PG_X + 5, PG_Y + 5, PG_W - 10, PG_H - 10, 0);
ctx.stroke();

// Pickguard mounting screws (around the edge)
function pgScrew(x, y){
  const g = ctx.createRadialGradient(x - 1, y - 1, 0, x, y, 5);
  g.addColorStop(0, '#e0e4ea');
  g.addColorStop(0.5, '#a8acb2');
  g.addColorStop(1, '#50555c');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#2a2f38';
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.strokeStyle = '#2a2f38';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - 3, y - 0.5);
  ctx.lineTo(x + 3, y - 0.5);
  ctx.stroke();
}
// Screws along top and bottom edges of the pickguard, plus midpoints of sides
const scrX = 28;
const scrY = 28;
pgScrew(PG_X + scrX, PG_Y + scrY);
pgScrew(PG_X + PG_W - scrX, PG_Y + scrY);
pgScrew(PG_X + scrX, PG_Y + PG_H - scrY);
pgScrew(PG_X + PG_W - scrX, PG_Y + PG_H - scrY);
pgScrew(PG_X + PG_W / 2, PG_Y + scrY);
pgScrew(PG_X + PG_W / 2, PG_Y + PG_H - scrY);
pgScrew(PG_X + scrX, PG_Y + PG_H / 2);
pgScrew(PG_X + PG_W - scrX, PG_Y + PG_H / 2);

// ── CENTRAL SCREEN ───────────────────────────────────────────────────────────
// Drop shadow
ctx.save();
ctx.shadowColor = 'rgba(0,0,0,0.85)';
ctx.shadowBlur = 25;
ctx.fillStyle = '#03040a';
roundRect(SCREEN_X, SCREEN_Y, SCREEN_W, SCREEN_H, 16);
ctx.fill();
ctx.restore();

// Interior fill
roundRect(SCREEN_X, SCREEN_Y, SCREEN_W, SCREEN_H, 16);
const scrGrad = ctx.createRadialGradient(BCX, BCY, 150, BCX, BCY, 800);
scrGrad.addColorStop(0, '#080b14');
scrGrad.addColorStop(1, '#02030a');
ctx.fillStyle = scrGrad;
ctx.fill();

// Chrome bezel
roundRect(SCREEN_X, SCREEN_Y, SCREEN_W, SCREEN_H, 16);
const bezel = ctx.createLinearGradient(0, SCREEN_Y, 0, SCREEN_Y + SCREEN_H);
bezel.addColorStop(0, '#d4d8dc');
bezel.addColorStop(0.5, '#4a4f56');
bezel.addColorStop(1, '#c4c8cc');
ctx.strokeStyle = bezel;
ctx.lineWidth = 7;
ctx.stroke();

// Cyan LED accent
roundRect(SCREEN_X, SCREEN_Y, SCREEN_W, SCREEN_H, 16);
ctx.strokeStyle = 'rgba(0, 220, 255, 0.65)';
ctx.lineWidth = 2;
ctx.stroke();
roundRect(SCREEN_X, SCREEN_Y, SCREEN_W, SCREEN_H, 16);
ctx.strokeStyle = 'rgba(0, 220, 255, 0.18)';
ctx.lineWidth = 6;
ctx.stroke();

// ── HUMBUCKER PICKUP (centered on pickguard above the screen) ────────────────
// Classic humbucker = two adjacent coils in a black frame, 12 pole pieces total
// (6 screws on one coil, 6 slugs on the other), plus two mounting ears with screws.
const HB_W = Math.min(560, SCREEN_W * 0.42);
const HB_H = 74;
const PK_CX = BCX;
const PK_CY = PG_Y + PK_ZONE_H / 2;

// Outer black humbucker frame
ctx.fillStyle = '#0a0a0a';
roundRect(PK_CX - HB_W/2, PK_CY - HB_H/2, HB_W, HB_H, 6);
ctx.fill();
ctx.strokeStyle = '#2a2a2a';
ctx.lineWidth = 1.5;
ctx.stroke();

// Subtle center ridge between the two coils
ctx.strokeStyle = 'rgba(255,255,255,0.07)';
ctx.lineWidth = 1;
ctx.beginPath();
ctx.moveTo(PK_CX - HB_W/2 + 14, PK_CY);
ctx.lineTo(PK_CX + HB_W/2 - 14, PK_CY);
ctx.stroke();

// Coil 1 (top row): screw-style pole pieces (slotted flat-head screws)
const coil1Y = PK_CY - HB_H/4;
for (let i = 0; i < 6; i++) {
  const px = PK_CX - HB_W/2 + 32 + i * (HB_W - 64) / 5;
  // Screw head
  ctx.fillStyle = '#d0d4da';
  ctx.beginPath(); ctx.arc(px, coil1Y, 6.5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#4a4f56';
  ctx.lineWidth = 0.8;
  ctx.stroke();
  // Screw slot
  ctx.strokeStyle = '#2a2f38';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(px - 4.5, coil1Y);
  ctx.lineTo(px + 4.5, coil1Y);
  ctx.stroke();
  // Highlight
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath(); ctx.arc(px - 2, coil1Y - 2, 1.8, 0, Math.PI * 2); ctx.fill();
}

// Coil 2 (bottom row): slug-style pole pieces (smooth cylindrical tops)
const coil2Y = PK_CY + HB_H/4;
for (let i = 0; i < 6; i++) {
  const px = PK_CX - HB_W/2 + 32 + i * (HB_W - 64) / 5;
  const g = ctx.createRadialGradient(px - 1.5, coil2Y - 1.5, 0, px, coil2Y, 6);
  g.addColorStop(0, '#f0f4f8');
  g.addColorStop(0.6, '#b0b4ba');
  g.addColorStop(1, '#60656c');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(px, coil2Y, 5.5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#3a3f48';
  ctx.lineWidth = 0.8;
  ctx.stroke();
}

// Mounting ears (extending left and right of the body)
const earW = 18, earH = 26;
ctx.fillStyle = '#0a0a0a';
roundRect(PK_CX - HB_W/2 - earW, PK_CY - earH/2, earW + 8, earH, 3);
ctx.fill();
roundRect(PK_CX + HB_W/2 - 8, PK_CY - earH/2, earW + 8, earH, 3);
ctx.fill();
ctx.strokeStyle = '#2a2a2a';
ctx.lineWidth = 1;
roundRect(PK_CX - HB_W/2 - earW, PK_CY - earH/2, earW + 8, earH, 3);
ctx.stroke();
roundRect(PK_CX + HB_W/2 - 8, PK_CY - earH/2, earW + 8, earH, 3);
ctx.stroke();

// Mounting screws in the ears
function mountScrew(cx, cy){
  const g = ctx.createRadialGradient(cx - 1, cy - 1, 0, cx, cy, 5);
  g.addColorStop(0, '#e8ecf0');
  g.addColorStop(0.6, '#a8acb2');
  g.addColorStop(1, '#50555c');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(cx, cy, 4.5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#2a2f38';
  ctx.lineWidth = 0.8; ctx.stroke();
  ctx.strokeStyle = '#2a2f38';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(cx - 3, cy);
  ctx.lineTo(cx + 3, cy);
  ctx.stroke();
}
mountScrew(PK_CX - HB_W/2 - earW/2 + 2, PK_CY);
mountScrew(PK_CX + HB_W/2 + earW/2 - 2, PK_CY);

// ── BRIDGE (centered on pickguard below the screen) ──────────────────────────
const BR_W = Math.min(560, SCREEN_W * 0.6);
const BR_H = 40;
const BR_CX = BCX;
const BR_CY = PG_Y + PG_H - BR_ZONE_H / 2;

// Bridge base plate
ctx.fillStyle = '#d4d8dc';
roundRect(BR_CX - BR_W/2, BR_CY - BR_H/2, BR_W, BR_H, 5);
ctx.fill();
ctx.strokeStyle = '#3a3f48';
ctx.lineWidth = 1.5;
ctx.stroke();

// 6 saddles
for (let i = 0; i < 6; i++) {
  const sx = BR_CX - BR_W/2 + 30 + i * (BR_W - 60) / 5 - 16;
  ctx.fillStyle = '#7a7f88';
  roundRect(sx, BR_CY - BR_H/2 + 4, 32, BR_H - 8, 3); ctx.fill();
  ctx.fillStyle = '#e4e8ec';
  ctx.fillRect(sx + 4, BR_CY - 2, 24, 3);
}

// Mounting screws at ends of bridge
ctx.fillStyle = '#8a8f98';
ctx.beginPath(); ctx.arc(BR_CX - BR_W/2 + 10, BR_CY, 4, 0, Math.PI * 2); ctx.fill();
ctx.beginPath(); ctx.arc(BR_CX + BR_W/2 - 10, BR_CY, 4, 0, Math.PI * 2); ctx.fill();

// ── TOGGLE SWITCH (on LEFT panel, middle vertically) ─────────────────────────
const SW_CX = PANEL_W / 2;
const SW_CY = 380;

// Recessed cutout
ctx.save();
ctx.shadowColor = 'rgba(0,0,0,0.9)';
ctx.shadowBlur = 10;
ctx.shadowOffsetY = 3;
ctx.fillStyle = '#020308';
roundRect(SW_CX - 30, SW_CY - 56, 60, 112, 10);
ctx.fill();
ctx.restore();
roundRect(SW_CX - 30, SW_CY - 56, 60, 112, 10);
const cutBev = ctx.createLinearGradient(SW_CX - 30, SW_CY - 56, SW_CX + 30, SW_CY + 56);
cutBev.addColorStop(0, 'rgba(0,0,0,0.8)');
cutBev.addColorStop(0.5, 'rgba(40,45,55,0.7)');
cutBev.addColorStop(1, 'rgba(20,25,35,0.8)');
ctx.strokeStyle = cutBev;
ctx.lineWidth = 2.5;
ctx.stroke();

// Chrome plate
ctx.fillStyle = '#c8ccd4';
roundRect(SW_CX - 11, SW_CY - 38, 22, 76, 3);
ctx.fill();
ctx.strokeStyle = '#4a4f56';
ctx.lineWidth = 1;
ctx.stroke();

// Slots
ctx.fillStyle = '#2a2f38';
for (let i = 0; i < 3; i++) {
  ctx.fillRect(SW_CX - 8, SW_CY - 30 + i * 26, 16, 2.5);
}

// Lever
ctx.strokeStyle = '#d4d8dc';
ctx.lineWidth = 5;
ctx.lineCap = 'round';
ctx.beginPath();
ctx.moveTo(SW_CX, SW_CY);
ctx.lineTo(SW_CX - 5, SW_CY - 28);
ctx.stroke();
// Cyan tip
ctx.save();
ctx.shadowColor = '#00d4e8';
ctx.shadowBlur = 14;
ctx.fillStyle = '#00d4e8';
ctx.beginPath(); ctx.arc(SW_CX - 5, SW_CY - 30, 6.5, 0, Math.PI * 2); ctx.fill();
ctx.restore();
ctx.fillStyle = 'rgba(255,255,255,0.6)';
ctx.beginPath(); ctx.arc(SW_CX - 7, SW_CY - 32, 2.5, 0, Math.PI * 2); ctx.fill();

ctx.fillStyle = '#7a7f88';
ctx.beginPath(); ctx.arc(SW_CX, SW_CY - 42, 2, 0, Math.PI * 2); ctx.fill();
ctx.beginPath(); ctx.arc(SW_CX, SW_CY + 42, 2, 0, Math.PI * 2); ctx.fill();

// ── KNOBS (on RIGHT panel, bottom area) ──────────────────────────────────────
function knob(cx, cy, r, label){
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = '#05060a';
  ctx.beginPath(); ctx.arc(cx, cy, r + 6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  const g = ctx.createRadialGradient(cx - r/3, cy - r/3, 0, cx, cy, r);
  g.addColorStop(0, '#f0f4f8');
  g.addColorStop(0.4, '#a8acb2');
  g.addColorStop(0.8, '#40454c');
  g.addColorStop(1, '#1a1d24');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#0a0b10';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 1;
  for (let a = 0; a < 24; a++) {
    const ang = (a / 24) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(ang) * (r - 5), cy + Math.sin(ang) * (r - 5));
    ctx.lineTo(cx + Math.cos(ang) * (r - 1), cy + Math.sin(ang) * (r - 1));
    ctx.stroke();
  }
  ctx.strokeStyle = '#050608';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + r * 0.7, cy - r * 0.3);
  ctx.stroke();
  ctx.fillStyle = '#00d4e8';
  ctx.beginPath();
  ctx.arc(cx + r * 0.7, cy - r * 0.3, 3, 0, Math.PI * 2);
  ctx.fill();
  if (label) {
    ctx.fillStyle = '#e0e4ea';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(label, cx, cy + r + 22);
  }
}

const KX = ${W} - PANEL_W / 2;
knob(KX, ${H} - 240, 28, 'VOL');
knob(KX, ${H} - 140, 28, 'TONE');

// ── LEFT PANEL: branding + LEDs + jack ───────────────────────────────────────
// Brand at top
ctx.save();
ctx.fillStyle = 'rgba(0, 220, 255, 0.7)';
ctx.font = 'bold 18px Arial';
ctx.textAlign = 'center';
ctx.fillText('⚡ LIVE', PANEL_W / 2, 120);
ctx.font = 'bold 14px Arial';
ctx.fillStyle = 'rgba(255,255,255,0.3)';
ctx.fillText('FRENZY', PANEL_W / 2, 145);
ctx.restore();

// Power LEDs (above the switch)
for (let i = 0; i < 5; i++) {
  const ledY = 220 + i * 14;
  const isOn = i < 3;
  ctx.fillStyle = isOn ? '#00d4e8' : '#1a2230';
  if (isOn) {
    ctx.save();
    ctx.shadowColor = '#00d4e8';
    ctx.shadowBlur = 8;
  }
  ctx.beginPath();
  ctx.arc(PANEL_W / 2, ledY, 3, 0, Math.PI * 2);
  ctx.fill();
  if (isOn) ctx.restore();
}

// Jack at bottom
ctx.save();
ctx.shadowColor = 'rgba(0,0,0,0.7)';
ctx.shadowBlur = 8;
ctx.fillStyle = '#020308';
ctx.beginPath();
ctx.arc(PANEL_W / 2, ${H} - 180, 30, 0, Math.PI * 2);
ctx.fill();
ctx.restore();
ctx.strokeStyle = '#c0c4cc';
ctx.lineWidth = 3;
ctx.beginPath(); ctx.arc(PANEL_W / 2, ${H} - 180, 22, 0, Math.PI * 2); ctx.stroke();
ctx.fillStyle = '#050608';
ctx.beginPath(); ctx.arc(PANEL_W / 2, ${H} - 180, 10, 0, Math.PI * 2); ctx.fill();
ctx.fillStyle = '#d4d8dc';
ctx.beginPath(); ctx.arc(PANEL_W / 2, ${H} - 180, 5, 0, Math.PI * 2); ctx.fill();

// Panel corner screws
function screw(x, y) {
  ctx.fillStyle = '#6a6e76';
  ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#2a2f38';
  ctx.lineWidth = 1; ctx.stroke();
  ctx.strokeStyle = '#2a2f38';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x - 3, y);
  ctx.lineTo(x + 3, y);
  ctx.stroke();
}
screw(30, 30); screw(${W} - 30, 30);
screw(30, ${H} - 30); screw(${W} - 30, ${H} - 30);
screw(PANEL_W - 30, 30); screw(${W} - PANEL_W + 30, 30);
screw(PANEL_W - 30, ${H} - 30); screw(${W} - PANEL_W + 30, ${H} - 30);

document.title = 'READY';
</script></body></html>`;

app.whenReady().then(async () => {
  fs.writeFileSync('/tmp/guitar-page.html', pageHtml);
  const win = new BrowserWindow({
    width: W, height: H, show: false, useContentSize: true,
    webPreferences: { nodeIntegration: true, contextIsolation: false }
  });
  await win.loadFile('/tmp/guitar-page.html');
  await new Promise(r => setTimeout(r, 800));
  const img = await win.webContents.capturePage();
  fs.writeFileSync(OUT, img.toPNG());
  console.log('Wrote', OUT, '(' + (fs.statSync(OUT).size/1024|0) + ' KB)');
  win.destroy();
  app.quit();
});
