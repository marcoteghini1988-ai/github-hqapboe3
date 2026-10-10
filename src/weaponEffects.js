// ============================================================================
// WEAPON COMBAT EFFECTS ENGINE (VFX BALISTICI & INTERAZIONE CON LA BARRA HP)
// ============================================================================
import { playSound } from './audio';

// Helper per ottenere layer e barra HP avversaria
function getCombatElements() {
  const layer = document.getElementById('classic-projectiles-layer');
  const enemyHpDock = document.getElementById('classicEnemyHpDock');
  const enemyHpFill = enemyHpDock?.querySelector('.enemy-hp-fill-3d');
  return { layer, enemyHpDock, enemyHpFill };
}

// ----------------------------------------------------------------------------
// 1. ARCO-X BALISTICO (arrow_barrage)
// ----------------------------------------------------------------------------
function executeArrowBarrage({ level, targetX, targetY, startX, startY, onComplete }) {
  const { layer, enemyHpDock } = getCombatElements();
  if (!layer || !enemyHpDock) return onComplete?.();

  const arrowConfig = {
    1: { count: 3, delayMs: 110 },
    2: { count: 5, delayMs: 75 },
    3: { count: 12, delayMs: 40 }
  };
  const cfg = arrowConfig[level] || arrowConfig[1];
  let hits = 0;

  for (let i = 0; i < cfg.count; i++) {
    setTimeout(() => {
      try { playSound('arrow_launch'); } catch (_) {}

      const arrow = document.createElement('div');
      arrow.className = 'flight-arrow-screen';
      layer.appendChild(arrow);

      const spawnX = startX + (Math.random() - 0.5) * 80;
      const hitX = targetX + (Math.random() - 0.5) * 40;
      const dx = hitX - spawnX;
      const dy = targetY - startY;
      const angleRad = Math.atan2(dy, dx) + Math.PI / 2;

      arrow.animate([
        { transform: `translate(${spawnX}px, ${startY}px) rotate(${angleRad}rad) scale(1.3)`, opacity: 0.95 },
        { transform: `translate(${hitX}px, ${targetY}px) rotate(${angleRad}rad) scale(0.65)`, opacity: 1 }
      ], { duration: 250, easing: 'cubic-bezier(0.2, 0.8, 0.4, 1)', fill: 'forwards' }).onfinish = () => {
        arrow.remove();
        enemyHpDock.classList.remove('bar-hit-flash', 'bar-shiver');
        void enemyHpDock.offsetWidth;
        enemyHpDock.classList.add('bar-hit-flash', 'bar-shiver');
        try { playSound('arrow_launch'); } catch (_) {}

        hits++;
        if (hits === cfg.count) onComplete?.();
      };
    }, i * cfg.delayMs);
  }
}

// ----------------------------------------------------------------------------
// 2. LASER A SCORRIMENTO (railgun_beam & cross_laser)
// ----------------------------------------------------------------------------
function executeLaserSweep({ level, startX, targetX, targetY, startY, durationMs = 380, onComplete }) {
  const { layer, enemyHpDock, enemyHpFill } = getCombatElements();
  if (!layer || !enemyHpDock) return onComplete?.();

  try { playSound('arrow_launch'); } catch (_) {}

  const beamWidth = level === 3 ? 14 : (level === 2 ? 8 : 5);

  const beamHead = document.createElement('div');
  beamHead.style.position = 'fixed';
  beamHead.style.top = `${targetY - 12}px`;
  beamHead.style.left = `${startX - 12}px`;
  beamHead.style.width = '24px';
  beamHead.style.height = '24px';
  beamHead.style.borderRadius = '50%';
  beamHead.style.background = 'radial-gradient(circle, #ffffff 0%, #00f2fe 60%, transparent 100%)';
  beamHead.style.boxShadow = '0 0 20px #00f2fe, 0 0 35px #ffffff';
  beamHead.style.pointerEvents = 'none';
  beamHead.style.zIndex = '999999';
  layer.appendChild(beamHead);

  const verticalBeam = document.createElement('div');
  verticalBeam.style.position = 'fixed';
  verticalBeam.style.top = `${targetY}px`;
  verticalBeam.style.left = `${startX - beamWidth / 2}px`;
  verticalBeam.style.width = `${beamWidth}px`;
  verticalBeam.style.height = `${startY - targetY}px`;
  verticalBeam.style.background = 'linear-gradient(0deg, transparent 0%, #00f2fe 35%, #ffffff 100%)';
  verticalBeam.style.boxShadow = '0 0 20px #00f2fe';
  verticalBeam.style.pointerEvents = 'none';
  verticalBeam.style.zIndex = '999998';
  layer.appendChild(verticalBeam);

  enemyHpDock.classList.add('bar-hit-flash', 'bar-shiver');

  const animStart = performance.now();

  function step(now) {
    const elapsed = now - animStart;
    const progress = Math.min(1, elapsed / durationMs);
    const curX = startX - (startX - targetX) * progress;

    beamHead.style.left = `${curX - 12}px`;
    verticalBeam.style.left = `${curX - beamWidth / 2}px`;

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      beamHead.remove();
      verticalBeam.remove();
      enemyHpDock.classList.remove('bar-hit-flash', 'bar-shiver');
      onComplete?.();
    }
  }

  requestAnimationFrame(step);
}

// ----------------------------------------------------------------------------
// 3. TORRE TESLA / FULMINE (lightning_strike & tesla_arc)
// ----------------------------------------------------------------------------
function executeTeslaLightning({ level, targetX, targetY, onComplete }) {
  const { layer, enemyHpDock } = getCombatElements();
  if (!layer || !enemyHpDock) return onComplete?.();

  try { playSound('cannon_hit'); } catch (_) {}

  const boltCount = level === 3 ? 3 : (level === 2 ? 2 : 1);

  for (let b = 0; b < boltCount; b++) {
    const bolt = document.createElement('div');
    bolt.style.position = 'fixed';
    bolt.style.top = '0';
    bolt.style.left = `${targetX - 4 + (b - 1) * 12}px`;
    bolt.style.width = '8px';
    bolt.style.height = `${targetY}px`;
    bolt.style.background = 'linear-gradient(180deg, #ffffff 0%, #38bdf8 60%, transparent 100%)';
    bolt.style.boxShadow = '0 0 25px #00f2fe, 0 0 40px #ffffff';
    bolt.style.pointerEvents = 'none';
    bolt.style.zIndex = '999999';
    layer.appendChild(bolt);

    setTimeout(() => {
      bolt.remove();
    }, 180 + b * 60);
  }

  enemyHpDock.classList.add('bar-hit-flash', 'bar-shiver');
  setTimeout(() => {
    enemyHpDock.classList.remove('bar-hit-flash', 'bar-shiver');
    onComplete?.();
  }, 280);
}

// ----------------------------------------------------------------------------
// 4. MICRORAZZI / FLAK A SCALINI (micro_missiles & flak_burst)
// ----------------------------------------------------------------------------
function executeMissileSalvo({ level, startX, startY, hpLeft, hpWidth, currentHp, maxHp, damage, onComplete }) {
  const { layer, enemyHpDock } = getCombatElements();
  if (!layer || !enemyHpDock) return onComplete?.();

  const missileCount = level === 3 ? 5 : (level === 2 ? 3 : 2);
  const dmgStep = damage / missileCount;
  let hits = 0;

  for (let i = 0; i < missileCount; i++) {
    setTimeout(() => {
      try { playSound('arrow_launch'); } catch (_) {}

      const subHp = currentHp - dmgStep * i;
      const hitX = hpLeft + hpWidth * (Math.max(0, subHp) / maxHp);
      const hitY = enemyHpDock.getBoundingClientRect().top + 5;

      const missile = document.createElement('div');
      missile.style.position = 'fixed';
      missile.style.width = '10px';
      missile.style.height = '24px';
      missile.style.background = 'linear-gradient(180deg, #facc15 0%, #ef4444 100%)';
      missile.style.boxShadow = '0 0 14px #facc15';
      missile.style.borderRadius = '3px';
      missile.style.pointerEvents = 'none';
      missile.style.zIndex = '999999';
      layer.appendChild(missile);

      const spawnX = startX + (i % 2 === 0 ? -70 : 70);

      missile.animate([
        { transform: `translate(${spawnX}px, ${startY}px) rotate(${i % 2 === 0 ? -20 : 20}deg) scale(1.2)`, opacity: 1 },
        { transform: `translate(${hitX}px, ${hitY}px) rotate(0deg) scale(0.7)`, opacity: 1 }
      ], { duration: 220, easing: 'cubic-bezier(0.2, 0.7, 0.4, 1)', fill: 'forwards' }).onfinish = () => {
        missile.remove();
        enemyHpDock.classList.remove('bar-hit-flash', 'bar-shiver');
        void enemyHpDock.offsetWidth;
        enemyHpDock.classList.add('bar-hit-flash', 'bar-shiver');
        try { playSound('cannon_hit'); } catch (_) {}

        hits++;
        if (hits === missileCount) onComplete?.();
      };
    }, i * 90);
  }
}

// ----------------------------------------------------------------------------
// 5. SIFONE DI SANGUE (blood_siphon)
// ----------------------------------------------------------------------------
function executeBloodSiphon({ level, targetX, targetY, startX, startY, onComplete }) {
  const { layer, enemyHpDock } = getCombatElements();
  if (!layer || !enemyHpDock) return onComplete?.();

  const count = level === 3 ? 4 : (level === 2 ? 3 : 2);
  let finished = 0;

  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      try { playSound('card_slide'); } catch (_) {}

      const orb = document.createElement('div');
      orb.style.position = 'fixed';
      orb.style.width = '14px';
      orb.style.height = '14px';
      orb.style.borderRadius = '50%';
      orb.style.background = 'radial-gradient(circle, #ff4d6d 0%, #c9184a 100%)';
      orb.style.boxShadow = '0 0 16px #ff4d6d';
      orb.style.pointerEvents = 'none';
      orb.style.zIndex = '999999';
      layer.appendChild(orb);

      orb.animate([
        { transform: `translate(${startX + (Math.random() - 0.5) * 50}px, ${startY}px) scale(1)`, opacity: 1 },
        { transform: `translate(${targetX}px, ${targetY}px) scale(0.6)`, opacity: 1 }
      ], { duration: 260, easing: 'ease-in', fill: 'forwards' }).onfinish = () => {
        orb.remove();
        enemyHpDock.classList.add('bar-hit-flash', 'bar-shiver');
        setTimeout(() => enemyHpDock.classList.remove('bar-hit-flash', 'bar-shiver'), 140);

        // Sfera verde di ritorno verso il giocatore
        const healOrb = document.createElement('div');
        healOrb.style.position = 'fixed';
        healOrb.style.width = '12px';
        healOrb.style.height = '12px';
        healOrb.style.borderRadius = '50%';
        healOrb.style.background = 'radial-gradient(circle, #a7f3d0 0%, #10b981 100%)';
        healOrb.style.boxShadow = '0 0 16px #10b981';
        healOrb.style.pointerEvents = 'none';
        healOrb.style.zIndex = '999999';
        layer.appendChild(healOrb);

        healOrb.animate([
          { transform: `translate(${targetX}px, ${targetY}px)`, opacity: 1 },
          { transform: `translate(${startX}px, ${startY}px)`, opacity: 0 }
        ], { duration: 280, easing: 'ease-out', fill: 'forwards' }).onfinish = () => {
          healOrb.remove();
          finished++;
          if (finished === count) onComplete?.();
        };
      };
    }, i * 80);
  }
}

// ----------------------------------------------------------------------------
// 6. GATLING CINETICA (gatling)
// ----------------------------------------------------------------------------
function executeGatlingSpray({ level, targetX, targetY, startX, startY, onComplete }) {
  const { layer, enemyHpDock } = getCombatElements();
  if (!layer || !enemyHpDock) return onComplete?.();

  const bulletCount = level === 3 ? 16 : (level === 2 ? 10 : 6);
  let hits = 0;

  for (let i = 0; i < bulletCount; i++) {
    setTimeout(() => {
      const bullet = document.createElement('div');
      bullet.style.position = 'fixed';
      bullet.style.width = '3px';
      bullet.style.height = '18px';
      bullet.style.background = '#facc15';
      bullet.style.boxShadow = '0 0 8px #facc15';
      bullet.style.pointerEvents = 'none';
      bullet.style.zIndex = '999999';
      layer.appendChild(bullet);

      const spawnX = startX + (Math.random() - 0.5) * 30;
      const hitX = targetX + (Math.random() - 0.5) * 20;

      bullet.animate([
        { transform: `translate(${spawnX}px, ${startY}px) scale(1.2)`, opacity: 1 },
        { transform: `translate(${hitX}px, ${targetY}px) scale(0.6)`, opacity: 1 }
      ], { duration: 180, easing: 'linear', fill: 'forwards' }).onfinish = () => {
        bullet.remove();
        hits++;
        if (hits % 3 === 0) {
          enemyHpDock.classList.remove('bar-hit-flash', 'bar-shiver');
          void enemyHpDock.offsetWidth;
          enemyHpDock.classList.add('bar-hit-flash', 'bar-shiver');
          try { playSound('arrow_launch'); } catch (_) {}
        }
        if (hits === bulletCount) onComplete?.();
      };
    }, i * 28);
  }
}

// ----------------------------------------------------------------------------
// 7. CANNONE D'ASSEDIO / BOMBA (heavy_cannon & reactor_bomb)
// ----------------------------------------------------------------------------
function executeHeavyCannon({ level, targetX, targetY, startX, startY, onComplete }) {
  const { layer, enemyHpDock } = getCombatElements();
  if (!layer || !enemyHpDock) return onComplete?.();

  try { playSound('cannon_hit'); } catch (_) {}

  const ballSize = 22 + level * 5;
  const ball = document.createElement('div');
  ball.style.position = 'fixed';
  ball.style.width = `${ballSize}px`;
  ball.style.height = `${ballSize}px`;
  ball.style.borderRadius = '50%';
  ball.style.background = 'radial-gradient(circle at 35% 35%, #ffffff 0%, #ef4444 60%, #000 100%)';
  ball.style.boxShadow = '0 0 24px #ef4444, 0 0 35px #ffffff';
  ball.style.pointerEvents = 'none';
  ball.style.zIndex = '999999';
  layer.appendChild(ball);

  ball.animate([
    { transform: `translate(${startX - ballSize / 2}px, ${startY}px) scale(1.4)`, opacity: 1 },
    { transform: `translate(${targetX - ballSize / 2}px, ${targetY - ballSize / 2}px) scale(0.7)`, opacity: 1 }
  ], { duration: 280, easing: 'cubic-bezier(0.2, 0.7, 0.35, 1)', fill: 'forwards' }).onfinish = () => {
    ball.remove();
    enemyHpDock.classList.add('bar-hit-flash', 'bar-shiver');
    setTimeout(() => {
      enemyHpDock.classList.remove('bar-hit-flash', 'bar-shiver');
      onComplete?.();
    }, 200);
  };
}

// ============================================================================
// DISPATCHER PRINCIPALE DEI COLPI
// ============================================================================
export function fireWeaponCombatVFX(weapon, level = 1, { currentHp, maxHp, damage, onComplete }) {
  const { enemyHpDock } = getCombatElements();
  if (!enemyHpDock) return onComplete?.();

  const rect = enemyHpDock.getBoundingClientRect();
  const hpLeft = rect.left;
  const hpWidth = rect.width;
  const targetY = rect.top + rect.height / 2;
  const startX = window.innerWidth / 2;
  const startY = window.innerHeight + 20;

  // Calcolo delle estremità vive della barra HP
  const startEdgeX = hpLeft + hpWidth * (Math.max(0, currentHp) / (maxHp || 1));
  const targetEdgeX = hpLeft + hpWidth * (Math.max(0, currentHp - damage) / (maxHp || 1));
  const midPointX = (startEdgeX + targetEdgeX) / 2;

  const fx = weapon.fxType || 'gatling';

  // 1. LASER A SCORRIMENTO (Railgun o Taglio Frazionato)
  if (fx === 'railgun_beam' || fx === 'cross_laser') {
    return executeLaserSweep({
      level,
      startX: startEdgeX,
      targetX: targetEdgeX,
      targetY,
      startY,
      onComplete
    });
  }

  // 2. TORRE TESLA / FULMINE (Sovraccarico)
  if (fx === 'lightning_strike' || fx === 'tesla_arc' || fx === 'orbital_pillar') {
    return executeTeslaLightning({
      level,
      targetX: midPointX,
      targetY,
      onComplete
    });
  }

  // 3. MICRORAZZI / FLAK A SCALINI
  if (fx === 'micro_missiles' || fx === 'flak_burst') {
    return executeMissileSalvo({
      level,
      startX,
      startY,
      hpLeft,
      hpWidth,
      currentHp,
      maxHp,
      damage,
      onComplete
    });
  }

  // 4. SIFONE DI SANGUE (Cremisi in salita, verde in discesa)
  if (fx === 'blood_siphon') {
    return executeBloodSiphon({
      level,
      targetX: midPointX,
      targetY,
      startX,
      startY,
      onComplete
    });
  }

  // 5. GATLING CINETICA
  if (fx === 'gatling' || fx === 'disc_blades' || fx === 'fuse_bolts') {
    return executeGatlingSpray({
      level,
      targetX: startEdgeX,
      targetY,
      startX,
      startY,
      onComplete
    });
  }

  // 6. ARCO-X BALISTICO
  if (fx === 'arrow_barrage') {
    return executeArrowBarrage({
      level,
      targetX: midPointX,
      targetY,
      startX,
      startY,
      onComplete
    });
  }

  // 7. DEFAULT: CANNONE PESANTE / BOMBA
  return executeHeavyCannon({
    level,
    targetX: midPointX,
    targetY,
    startX,
    startY,
    onComplete
  });
}
