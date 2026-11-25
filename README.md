# 🧱 Brick Breaker

Mouse-controlled Brick Breaker for the office. **No `npm install` needed**, just Node.js 16+.

```bash
node server.js
```

Open `http://localhost:3000`. The terminal also prints a "Share with team" link
(your local IP). Anyone on the same Wi-Fi / office network can open it and play.
Scores go to a shared **Today** and **All time** leaderboard, saved in `scores.json`.

## How to play

- Move the **mouse** (or finger on a phone, or the `←` `→` keys) to move the paddle.
- **Click** (or press `Space`) to launch the ball.
- Where the ball hits the paddle decides its angle. Hit with the edge for sharp angles.
- Hit bricks without touching the paddle to build a **combo** (up to x5 points).
- Falling power-ups: **W** wide paddle, **M** multi-ball, **S** slow ball, **♥** extra life.
- Tougher bricks (white border) take 2 to 3 hits and appear in later levels.
- `P` or `Esc` pauses, `M` mutes. The game also pauses when you switch tabs.

## Files

```
server.js     Tiny web server + leaderboard API (GET/POST /api/scores)
index.html    The whole game (canvas, no libraries)
scores.json   Created automatically after the first score
```

## Tweak it

Everything is in `index.html`:

- Ball speed: `ballSpeed()`
- Paddle size: `paddle` object and the `110` / `170` widths in `update()`
- Power-up chance: `Math.random() < 0.17` in `damage()`
- Level layouts: `buildLevel()`

Change the port with `PORT=8080 node server.js`. Delete `scores.json` to reset the leaderboard.
