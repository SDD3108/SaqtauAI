// Distances in layout points, time in seconds. x marks the obstacle's center.
export const PLAYER_X = 24;
export const PLAYER_SIZE = 32;
export const OBSTACLE_SIZE = 44;
const GRAVITY = 950;
const LAUNCH = 365;

export function newRun(width) {
  return { x: width + 12, y: 0, vy: 0, score: 0, passed: false, over: false };
}
export function jump(run) {
  if (!run.over && run.y === 0 && run.vy === 0) run.vy = LAUNCH;
}
export function advance(run, width, seconds, random = Math.random) {
  if (run.over) return;
  const dt = Math.max(0, Math.min(seconds, 1 / 30));
  const speed = Math.min(282, 178 + run.score * 4);
  run.x -= speed * dt;
  run.y = Math.max(0, run.y + run.vy * dt - GRAVITY * dt * dt / 2);
  run.vy = run.y ? run.vy - GRAVITY * dt : 0;
  // Use the ink of the rotated cigarette (the square SVG has transparent padding).
  if (run.x - 3 < PLAYER_X + PLAYER_SIZE - 5 && run.x + 3 > PLAYER_X + 5 && run.y + 4 < OBSTACLE_SIZE * 0.89) {
    run.over = true;
    return;
  }
  if (!run.passed && run.x + 4 < PLAYER_X) {
    run.score += 1;
    run.passed = true;
  }
  if (run.x < -OBSTACLE_SIZE / 2) {
    run.x = Math.max(width + 12, PLAYER_X + speed * 1.15) + random() * 48;
    run.passed = false;
  }
}
