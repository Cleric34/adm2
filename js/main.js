// Master Game Orchestrator for VYUHA: KURUKSHETRA

window.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize systems
  const simulation = new WarSimulation();
  const renderer = new BattlefieldRenderer();
  const ui = new GameUI();

  // 2. Setup 3D Container & Duel Overlay
  const canvas3DContainer = document.getElementById('battlefield-canvas-container');
  renderer.init(canvas3DContainer);


  // 3. Connect UI
  ui.init(simulation, renderer);

  // 4. Main Game Loop
  let lastTimestamp = performance.now();
  let botTacticalCheckTimer = 0;

  function gameLoop(timestamp) {
    const rawDelta = (timestamp - lastTimestamp) / 1000;
    const deltaSec = Math.min(rawDelta, 0.1); // clamp delta
    lastTimestamp = timestamp;

    if (ui.currentScreen === 'screen-battle') {
      const effectiveDelta = deltaSec * ui.simSpeed;

      // Update War Simulation
      simulation.update(effectiveDelta);

      // Bot Commander AI Tactical Evaluation (Every 1.5 seconds)
      botTacticalCheckTimer += effectiveDelta;
      if (botTacticalCheckTimer > 1.5) {
        botTacticalCheckTimer = 0;
        if (ui.botAI && !simulation.isOver) {
          const decision = ui.botAI.evaluateBattleTactics({
            botUnits: simulation.units.filter(u => u.team === 'bot'),
            playerUnits: simulation.units.filter(u => u.team === 'player'),
            phase: simulation.phase
          }, simulation.elapsedTime * 1000);

          if (decision) {
            simulation.applyBotTacticalOrder(decision);
          }
        }
      }

      // Update 3D Renderer
      renderer.update(simulation, effectiveDelta);

      // Update Battle HUD & Event Ticker
      ui.updateBattleHUD();
    }

    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
});
