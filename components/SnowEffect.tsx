import { useEffect, useState } from "react";
import '../snow-effect.css'
const SNOW_COUNT = 40;

// Get the app width (same as BottomNav, max 430px)
const APP_MAX_WIDTH = 430;

// Create a flake while avoiding placing it too close to any in `existing`
function createSnowflake(existing = []) {
  const size = Math.random() * 20 + 12;
  const duration = Math.random() * 5 + 6;
  const delay = Math.random() * 8;
  const top = -Math.random() * 400 - 20;

  // try a few times to find a left position that isn't too close to others
  let left = 0;
  const MAX_ATTEMPTS = 30;
  // Use window.innerWidth but clamp to APP_MAX_WIDTH
  const appWidth = Math.min(window.innerWidth, APP_MAX_WIDTH);
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const candidate = Math.random() * appWidth;
    // ensure candidate is not within minDist of any existing flake
    const tooClose = existing.some((e) => {
      const minDist = (size + (e.size || 16)) / 2 + 24; // buffer
      return Math.abs(candidate - e.left) < minDist;
    });
    if (!tooClose) {
      left = candidate;
      break;
    }
    // if last attempt, accept candidate anyway
    if (attempt === MAX_ATTEMPTS - 1) left = candidate;
  }

  return {
    id: Math.random().toString(36).slice(2),
    left,
    size,
    duration,
    // delay before the fall starts so they don't all drop at once
    delay,
    // start at a random negative top so some flakes are already partway down
    top,
  };
}

export default function SnowEffect() {
  const [flakes, setFlakes] = useState([]);

  useEffect(() => {
    // initial qorlar: generate sequentially so we can avoid overlaps
    const initial = [];
    for (let i = 0; i < SNOW_COUNT; i++) {
      initial.push(createSnowflake(initial));
    }
    setFlakes(initial);
  }, []);

  const handleAnimationEnd = (id) => {
    setFlakes((prev) =>
      prev.map((f) =>
        f.id === id ? createSnowflake(prev.filter((x) => x.id !== id)) : f
      )
    );
  };

  return (
    <>
      {flakes.map((flake) => (
        <span
          key={flake.id}
          onAnimationEnd={() => handleAnimationEnd(flake.id)}
          style={{
            position: "fixed",
            top: flake.top,
            left: `calc(50% - ${APP_MAX_WIDTH / 2}px + ${flake.left}px)`,
            fontSize: flake.size,
            color: "rgb(180, 208, 255)",
            fontFamily: "arial, verdana",
            userSelect: "none",
            pointerEvents: "none",
            // include a randomized delay so flakes start at different times
            animation: `snow-fall ${flake.duration}s linear ${flake.delay}s 1 forwards`,
            zIndex: 999999999999999999,
          }}
        >
          *
        </span>
      ))}
    </>
  );
}
