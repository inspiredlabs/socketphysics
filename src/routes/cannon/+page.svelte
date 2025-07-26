<script>
  // Updated +page.svelte with physics integration
  import { main } from './main.js';
  import { createContext } from './simpleContext.svelte.js';
  
  // Import UI components
  import GizmoControls from './GizmoControls.svelte';
  import FpsCounter from './FpsCounter.svelte';
  import PhysicsControls from './PhysicsControls.svelte';
  
  // Import physics object components (if using declarative approach)
  // import PhysicsSphere from './PhysicsSphere.svelte';
  // import PhysicsBox from './PhysicsBox.svelte';
  
  // Create context at the app level
  const context = createContext();
  
  // Bind current dimensions
  let width = $state(window.innerWidth);
  let height = $state(window.innerHeight);
  
  // Store dimensions in context for resize handler
  $effect(() => {
    if (context) {
      context.canvasWidth = width;
      context.canvasHeight = height;
    }
  });
  
  function handleResize() {
    width = window.innerWidth;
    height = window.innerHeight;
  }
  
  $effect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  });
  
  // Enhanced scene initialization with physics
  function init(canvas) {
    console.log("[main.js] mount ThreeJS + Cannon.js canvas");
    
    // Set up ThreeJS + Physics to run
    const cleanup = main()(canvas);
    
    // Return composite cleanup function
    return () => {
      if (cleanup) cleanup();
    };
  }
  
  // Example: Declarative physics objects (optional)
  let showDemoObjects = $state(false);
  let demoSpherePosition = $state([2, 5, 0]);
  let demoBoxPosition = $state([-2, 4, 1]);
  
  function toggleDemoObjects() {
    showDemoObjects = !showDemoObjects;
  }
</script>

<!-- Three.js + Physics canvas -->
<canvas {@attach init}>
  <!-- This space has been intentionally left blank -->
</canvas>

<!-- UI Components -->
<FpsCounter />
<GizmoControls size={2} />
<PhysicsControls />

<!-- Optional: Declarative physics objects demo -->
{#if showDemoObjects}
  <!-- These would be actual imports in practice -->
  <!-- 
  <PhysicsSphere 
    radius={0.6}
    position={demoSpherePosition}
    color={0x00ff88}
    mass={1.5}
    onCollide={(collision, strength) => {
      if (strength > 2) {
        console.log('Sphere hit hard!');
      }
    }}
  />
  
  <PhysicsBox 
    width={1.2}
    height={0.8}
    depth={1.5}
    position={demoBoxPosition}
    color={0xff4400}
    mass={2}
    onCollide={(collision, strength) => {
      console.log(`Box collision: ${strength.toFixed(2)}`);
    }}
  />
  -->
{/if}

<!-- Demo Controls -->
<div class="demo-controls">
  <button onclick={toggleDemoObjects}>
    {showDemoObjects ? 'Hide' : 'Show'} Demo Objects
  </button>
</div>

<svelte:window bind:innerHeight={height} bind:innerWidth={width} />

<style>
  :global(body) {
    margin: 0;
    overflow: hidden;
    background: #1a1a1a;
    font-family: sans-serif;
  }
  
  :global(canvas) {
    display: block;
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    outline: none;
  }
  
  .demo-controls {
    position: fixed;
    bottom: 20px;
    left: 20px;
    z-index: 1000;
  }
  
  .demo-controls button {
    padding: 10px 15px;
    background: rgba(0, 150, 255, 0.8);
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-family: inherit;
    backdrop-filter: blur(5px);
    transition: all 0.2s ease;
  }
  
  .demo-controls button:hover {
    background: rgba(0, 150, 255, 1);
    transform: translateY(-2px);
  }
  
  .demo-controls button:active {
    transform: translateY(0);
  }
  
  /* Prevent clutter */
  :global(*) {
    box-sizing: border-box;
    
    /* Disable text selection */
    -webkit-user-select: none;
    -ms-user-select: none;
    user-select: none;
    
    /* Prevent long press context menu */
    -webkit-touch-callout: none !important;
    -webkit-user-select: none !important;
    
    /* Prevent iOS tap highlight */
    -webkit-tap-highlight-color: transparent;
    
    /* Disable browser handling of gestures except scrolling */
    touch-action: pan-y;
  }
</style>