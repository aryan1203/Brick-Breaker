'use strict';
// Brick Breaker - zero-dependency Node server.
// Run:  node server.js     (then open http://localhost:3000)
// Serves the game page and keeps a shared leaderboard in scores.json.

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = Number(process.env.PORT) || 3000;
const INDEX = path.join(__dirname, 'index.html');
const SCORES_FILE = path.join(__dirname, 'scores.json');

// ---------------------------------------------------------------------------
// Leaderboard (kept in memory, saved to scores.json)
// ---------------------------------------------------------------------------
let scores = [];
try {
  scores = JSON.parse(fs.readFileSync(SCORES_FILE, 'utf8'));
  if (!Array.isArray(scores)) scores = [];
} catch (e) {
  scores = [];
}

function save() {
  const tmp = SCORES_FILE + '.tmp';
  fs.writeFile(tmp, JSON.stringify(scores), (err) => {
    if (!err) fs.rename(tmp, SCORES_FILE, () => {});
  });
}

const dayKey = (t) => {
  const d = new Date(t);
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
};

function top(list, n) {
  return list
    .slice()
    .sort((a, b) => b.score - a.score || a.t - b.t)
    .slice(0, n)
    .map(({ name, score, level, t }) => ({ name, score, level, t }));
}

function cleanName(raw) {
  const n = String(raw || '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 16);
  return n || 'Anonymous';
}

// ---------------------------------------------------------------------------
// HTTP
// ---------------------------------------------------------------------------
function json(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > 2048) {
        reject(new Error('too large'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString() || '{}'));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

const lastPost = new Map(); // ip -> time, tiny spam guard

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');

    if (req.method === 'GET' && url.pathname === '/api/scores') {
      const today = dayKey(Date.now());
      return json(res, {
        today: top(scores.filter((s) => dayKey(s.t) === today), 10),
        all: top(scores, 10),
      });
    }

    if (req.method === 'POST' && url.pathname === '/api/scores') {
      const ip = req.socket.remoteAddress || '';
      const now = Date.now();
      if (now - (lastPost.get(ip) || 0) < 3000) return json(res, { error: 'Slow down' }, 429);
      lastPost.set(ip, now);

      const body = await readJson(req);
      const score = Math.floor(Number(body.score));
      const level = Math.floor(Number(body.level)) || 1;
      if (!(score >= 1 && score <= 2000000)) return json(res, { error: 'Bad score' }, 400);

      scores.push({ name: cleanName(body.name), score, level: Math.min(Math.max(level, 1), 99), t: now });
      scores = top(scores, 500);
      save();
      return json(res, { ok: true });
    }

    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
      return fs.readFile(INDEX, (err, data) => {
        if (err) {
          res.writeHead(500);
          return res.end('index.html is missing');
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
        res.end(data);
      });
    }

    res.writeHead(404);
    res.end('Not found');
  } catch (e) {
    json(res, { error: 'Bad request' }, 400);
  }
});

setInterval(() => lastPost.clear(), 10 * 60 * 1000).unref();

server.listen(PORT, '0.0.0.0', () => {
  console.log('\n🧱 Brick Breaker is running!\n');
  console.log(`  Play here:         http://localhost:${PORT}`);
  for (const list of Object.values(os.networkInterfaces())) {
    for (const i of list || []) {
      if (i.family === 'IPv4' && !i.internal) {
        console.log(`  Share with team:   http://${i.address}:${PORT}   (same Wi-Fi / office network)`);
      }
    }
  }
  console.log('\nPress Ctrl+C to stop.\n');
});
