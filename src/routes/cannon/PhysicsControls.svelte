<script>
  // ./PhysicsControls.svelte
  import { useContext } from './simpleContext.svelte.js';
  
  // Access physics context
  const context = useContext();
  
  // Control state
  let sphereCount = $state(0);
  let boxCount = $state(0);
  let totalObjects = $state(0);
  
  // Update totals when objects change
  $effect(() => {
    if (context) {
      totalObjects = context.getPhysicsObjects().size;
    }
  });
  
  // Functions for creating objects
  function createRandomSphere() {
    if (!context?.physicsReady) {
      console.warn('Physics not ready yet');
      return;
    }
    
    const radius = Math.random() * 0.5 + 0.1; // 0.1 to 0.6
    const position = {
      x: (Math.random() - 0.5) * 3,
      y: 3,
      z: (Math.random() - 0.5) * 3
    };
    
    context.createPhysicsSphere(radius, position);
    sphereCount++;
  }
  
  function createRandomBox() {
    if (!context?.physicsReady) {
      console.warn('Physics not ready yet');
      return;
    }
    
    const width = Math.random() * 0.8 + 0.2;
    const height = Math.random() * 0.8 + 0.2;
    const depth = Math.random() * 0.8 + 0.2;
    const position = {
      x: (Math.random() - 0.5) * 3,
      y: 3,
      z: (Math.random() - 0.5) * 3
    };
    
    context.createPhysicsBox(width, height, depth, position);
    boxCount++;
  }
  
  function resetScene() {
    if (!context) return;
    
    context.removeAllPhysicsObjects();
    sphereCount = 0;
    boxCount = 0;
    totalObjects = 0;
  }
  
  // Auto-spawn demo (optional)
  let autoSpawn = $state(false);
  let autoSpawnInterval = null;
  
  $effect(() => {
    if (autoSpawn && context?.physicsReady) {
      autoSpawnInterval = setInterval(() => {
        if (Math.random() > 0.5) {
          createRandomSphere();
        } else {
          createRandomBox();
        }
      }, 1000);
    } else {
      if (autoSpawnInterval) {
        clearInterval(autoSpawnInterval);
        autoSpawnInterval = null;
      }
    }
    
    // Cleanup on unmount
    return () => {
      if (autoSpawnInterval) {
        clearInterval(autoSpawnInterval);
      }
    };
  });
</script>

<div class="physics-controls">
  <h3>Physics Controls</h3>
  
  <div class="stats">
    <p>Total Objects: <strong>{totalObjects}</strong></p>
    <p>Spheres: <strong>{sphereCount}</strong></p>
    <p>Boxes: <strong>{boxCount}</strong></p>
  </div>
  
  <div class="controls">
    <button 
      onclick={createRandomSphere}
      disabled={!context?.physicsReady}
    >
      Add Sphere
    </button>
    
    <button 
      onclick={createRandomBox}
      disabled={!context?.physicsReady}
    >
      Add Box
    </button>
    
    <button 
      onclick={resetScene}
      disabled={!context?.physicsReady}
      class="danger"
    >
      Reset All
    </button>
  </div>
  
  <div class="auto-controls">
    <label>
      <input 
        type="checkbox" 
        bind:checked={autoSpawn}
        disabled={!context?.physicsReady}
      />
      Auto-spawn objects
    </label>
  </div>
  
  <div class="status">
    <p class="status-indicator {context?.physicsReady ? 'ready' : 'loading'}">
      Physics: {context?.physicsReady ? 'Ready' : 'Loading...'}
    </p>
  </div>
</div>

<style>
  .physics-controls {
    position: fixed;
    top: 20px;
    left: 20px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 20px;
    border-radius: 8px;
    font-family: 'Courier New', monospace;
    font-size: 0.9em;
    z-index: 1000;
    min-width: 200px;
    backdrop-filter: blur(5px);
  }
  
  .physics-controls h3 {
    margin: 0 0 15px 0;
    color: #00ff88;
    font-size: 1.1em;
  }
  
  .stats {
    margin-bottom: 15px;
    padding: 10px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }
  
  .stats p {
    margin: 5px 0;
    font-size: 0.85em;
  }
  
  .stats strong {
    color: #00ff88;
  }
  
  .controls {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 15px;
  }
  
  button {
    padding: 8px 12px;
    border: none;
    border-radius: 4px;
    background: #333;
    color: white;
    cursor: pointer;
    font-family: inherit;
    font-size: 0.85em;
    transition: all 0.2s ease;
  }
  
  button:hover:not(:disabled) {
    background: #555;
    transform: translateY(-1px);
  }
  
  button:active:not(:disabled) {
    transform: translateY(0);
  }
  
  button:disabled {
    background: #222;
    color: #666;
    cursor: not-allowed;
  }
  
  button.danger {
    background: #c44;
  }
  
  button.danger:hover:not(:disabled) {
    background: #e55;
  }
  
  .auto-controls {
    margin-bottom: 15px;
  }
  
  .auto-controls label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.85em;
    cursor: pointer;
  }
  
  input[type="checkbox"] {
    margin: 0;
  }
  
  .status {
    border-top: 1px solid rgba(255, 255, 255, 0.2);
    padding-top: 10px;
  }
  
  .status-indicator {
    margin: 0;
    font-size: 0.8em;
    font-weight: bold;
  }
  
  .status-indicator.ready {
    color: #00ff88;
  }
  
  .status-indicator.loading {
    color: #ffaa00;
  }
</style>