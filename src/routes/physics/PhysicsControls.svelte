<script>
  import { useContext } from './simpleContext.svelte.js';
  
  let { socket, roomId } = $props(); // Now receiving roomId
  const context = useContext();
  
  let totalObjects = $state(0);

  $effect(() => {
    if (context) {
      totalObjects = context.getPhysicsObjects()?.size ?? 0;
    }
  });
  

  // --- Debugger checkbox ---
  let showDebugger = $state(false);

  $effect(() => {
    if (context && context.toggleDebugger) {
        context.toggleDebugger(showDebugger);
    }
  });
  
  function createRandomSphere() {
    console.log(`[Client] Button clicked: Add Sphere in room ${roomId}`);  // ADDED: Log button click
    const objectData = {
      type: 'sphere',
      radius: Math.random() * 0.1 + 0.2,
      position: {
        x: (Math.random() - 0.1) * 5,
        y: 5,
        z: (Math.random() - 0.1) * 5
      }
    };
    console.log(`[Client] Emitting createObject for sphere:`, objectData);  // ADDED: Log physics usage (emit)
    socket.emit('createObject', { roomId, objectData });
  }
  
  function createRandomBox() {
    console.log(`[Client] Button clicked: Add Box in room ${roomId}`);  // ADDED: Log button click
    const objectData = {
      type: 'box',
      width: Math.random() * 0.1 + 0.2,
      height: Math.random() * 0.1 + 0.2,
      depth: Math.random() * 0.1 + 0.2,
      position: {
        x: (Math.random() - 0.1) * 5,
        y: 5,
        z: (Math.random() - 0.1) * 5
      }
    };
    console.log(`[Client] Emitting createObject for box:`, objectData);  // ADDED: Log physics usage (emit)
    socket.emit('createObject', { roomId, objectData });
  }
  
  function resetScene() {
      // MODIFIED: Send roomId
      socket.emit('resetScene', { roomId });
  }
</script>

<div class="physics-controls">
  <h3>Physics Controls</h3>
  <div class="stats">
    <p>Total Objects: <strong>{totalObjects}</strong></p>
  </div>
  <div class="controls">
    <button onclick={createRandomSphere}>Add Sphere</button>
    <button onclick={createRandomBox}>Add Box</button>
    <button onclick={resetScene} class="danger">Reset All</button>
  </div>
  <div class="debugger-toggle">
    <label>
        <input type="checkbox" bind:checked={showDebugger} />
        Show Physics Debugger
    </label>
  </div>
</div>

<style>
  .physics-controls {
    position: fixed;
    top: 20px;
    left: 20px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 10px 15px;
    border-radius: 8px;
    font-family: 'Courier New', monospace;
    z-index: 1000;
    backdrop-filter: blur(5px);
  }
  h3 { margin: 0 0 10px 0; color: #00ff88; font-size: 1.1em; }
  .stats p { margin: 5px 0; }
  .controls { display: flex; flex-direction: column; gap: 8px; }
  button { padding: 8px; border: none; border-radius: 4px; background: #333; color: white; cursor: pointer; }
  button:hover { background: #555; }
  button.danger { background: #c44; }
  button.danger:hover { background: #e55; }
</style>