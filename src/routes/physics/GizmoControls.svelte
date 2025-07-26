<script>
	// ./GizmoControls.svelte
  import * as THREE from 'three';
  import { useContext } from './simpleContext.svelte.js';
  
  // Component props with defaults
  let { size = 2 } = $props();
  
  // Access context
  const context = useContext();
  
  // Local state for the controls - use $state for reactive UI bindings
  let gizmoX = $state(context?.getGizmoPosition().x || 0);
  let gizmoY = $state(context?.getGizmoPosition().y || 0.5);
  let gizmoZ = $state(context?.getGizmoPosition().z || 0);
  
  // Internal state - NOT reactive to prevent infinite loops
  let gizmoInstance = null;
  let checkIntervalId = null;
  let initialized = false;
  
  // Initialize once on mount
  $effect(() => {
    if (!initialized) {
      console.log("GizmoControls component mounted");
      initializeGizmo();
      initialized = true;
    }
    
    // Return cleanup function
    return () => {
      console.log("GizmoControls component unmounting");
      cleanupResources();
    };
  });
  
  // Direct position updates
  // Update both context AND gizmo when slider values change
  $effect(() => {
    if (context) {
      context.updateGizmoAxis('x', gizmoX);
      if (gizmoInstance) gizmoInstance.position.x = gizmoX;
    }
  });
  
  $effect(() => {
    if (context) {
      context.updateGizmoAxis('y', gizmoY);
      if (gizmoInstance) gizmoInstance.position.y = gizmoY;
    }
  });
  
  $effect(() => {
    if (context) {
      context.updateGizmoAxis('z', gizmoZ);
      if (gizmoInstance) gizmoInstance.position.z = gizmoZ;
    }
  });
  
  function initializeGizmo() {
    // Start checking for scene
    checkForScene();
  }
  
  function checkForScene() {
    // Clear any existing interval first
    if (checkIntervalId) {
      clearInterval(checkIntervalId);
      checkIntervalId = null;
    }
    
    // Try to get the scene from context
    const scene = context?.getScene();
    
    if (!scene) {
      // Scene not available yet, set up polling
      console.log("Scene not ready, starting polling");
      checkIntervalId = setInterval(() => {
        const scene = context?.getScene();
        if (scene) {
          console.log("Scene is now available");
          clearInterval(checkIntervalId);
          checkIntervalId = null;
          createGizmo(scene);
        }
      }, 500);
    } else {
      // Scene is available, create gizmo
      createGizmo(scene);
    }
  }
  
  function createGizmo(scene) {
    // Don't recreate if we already have an instance
    if (gizmoInstance) {
      // Just make sure it's in the scene
      if (scene && !scene.children.includes(gizmoInstance)) {
        scene.add(gizmoInstance);
      }
      return;
    }
    
    console.log("Creating new gizmo");
    gizmoInstance = new THREE.Group();
    
    // Add axes helper
    const axesHelper = new THREE.AxesHelper(size);
    gizmoInstance.add(axesHelper);
    
    // Set initial position
    gizmoInstance.position.set(gizmoX, gizmoY, gizmoZ);
    
    // Add to scene
    scene.add(gizmoInstance);
  }
  
  // Only cleanup resources, don't destroy the gizmo
  function cleanupResources() {
    // Stop polling if needed
    if (checkIntervalId) {
      clearInterval(checkIntervalId);
      checkIntervalId = null;
    }
  }
  
  // Full cleanup - only called when explicitly needed
  function destroyGizmo() {
    cleanupResources();
    
    if (!gizmoInstance) return;
    
    try {
      const scene = context?.getScene();
      
      if (scene) {
        // Remove from scene
        scene.remove(gizmoInstance);
        
        // Dispose resources
        gizmoInstance.traverse((object) => {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(m => m.dispose());
            } else {
              object.material.dispose();
            }
          }
        });
      }
      
      gizmoInstance = null;
    } catch (error) {
      console.error("Error cleaning up gizmo:", error);
    }
  }
</script>

<small>
  <h2>Gizmo Controls</h2>
  
  <div class="control-group">
    <label>
      X Position:
      <input type="range" min="-5" max="5" step="0.1" bind:value={gizmoX} />
      <span>{gizmoX.toFixed(1)}</span>
    </label>
  </div>
  <div class="control-group">
    <label>
      Y Position:
      <input type="range" min="0" max="5" step="0.1" bind:value={gizmoY} />
      <span>{gizmoY.toFixed(1)}</span>
    </label>
  </div>
  
  <div class="control-group">
    <label>
      Z Position:
      <input type="range" min="-5" max="5" step="0.1" bind:value={gizmoZ} />
      <span>{gizmoZ.toFixed(1)}</span>
    </label>
  </div>
</small>

<style>
  small {
    position: absolute;
    bottom: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.3);
    color: lime;
    padding: 15px;
    border-radius: 8px;
    font-family: monospace;
    font-size: 0.7em;
    z-index: 1;
    width: 108px;
    /* height: 77%; */
    overflow-y: scroll;
    overflow-x: hidden;
  }
small input {
	width: 100%
}
</style>