<script>
  // ./PhysicsBox.svelte
  import * as THREE from 'three';
  import * as CANNON from 'cannon-es';
  import { useContext } from './simpleContext.svelte.js';
  
  // Props with defaults
  let { 
    width = 1,
    height = 1,
    depth = 1,
    position = [0, 3, 0],
    color = 0xff6600,
    mass = 1,
    material: materialType = 'standard',
    onCollide = null,
    autoDispose = true
  } = $props();
  
  const context = useContext();
  let physicsObject = null;
  let isInitialized = false;
  
  // Convert position array to object
  $derived positionObj = {
    x: position[0],
    y: position[1], 
    z: position[2]
  };
  
  // Initialize when physics is ready
  $effect(() => {
    if (!context?.physicsReady || isInitialized) return;
    
    console.log(`Creating physics box at [${position.join(', ')}]`);
    
    // Create Three.js mesh
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.3,
      roughness: 0.4,
      envMapIntensity: 0.5
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.position.set(positionObj.x, positionObj.y, positionObj.z);
    
    // Create Cannon.js body
    const shape = new CANNON.Box(new CANNON.Vec3(width * 0.5, height * 0.5, depth * 0.5));
    const body = new CANNON.Body({
      mass: mass,
      position: new CANNON.Vec3(positionObj.x, positionObj.y, positionObj.z),
      shape: shape,
      material: context.getPhysicsWorld()?.defaultContactMaterial?.materials[0]
    });
    
    // Custom collision handler
    const collisionHandler = onCollide ? (collision) => {
      const impactStrength = collision.contact.getImpactVelocityAlongNormal();
      onCollide(collision, impactStrength);
    } : null;
    
    // Add to context
    context.addPhysicsObject(mesh, body, {
      playSound: collisionHandler,
      cleanup: () => {
        geometry.dispose();
        material.dispose();
      }
    });
    
    physicsObject = { mesh, body };
    isInitialized = true;
    
    // Cleanup on unmount
    return () => {
      if (autoDispose && physicsObject) {
        context.removePhysicsObject(physicsObject.mesh);
        physicsObject = null;
        isInitialized = false;
      }
    };
  });
  
  // Reactive position updates
  $effect(() => {
    if (physicsObject && isInitialized) {
      physicsObject.body.position.set(positionObj.x, positionObj.y, positionObj.z);
      physicsObject.mesh.position.set(positionObj.x, positionObj.y, positionObj.z);
    }
  });
  
  // Reactive color updates
  $effect(() => {
    if (physicsObject?.mesh?.material) {
      physicsObject.mesh.material.color.setHex(color);
    }
  });
  
  // Reactive dimension updates
  $effect(() => {
    if (physicsObject && isInitialized) {
      // For boxes, we need to recreate geometry if dimensions change
      // This is more complex - for performance, avoid changing dimensions after creation
      physicsObject.mesh.scale.set(1, 1, 1); // Reset scale first
    }
  });
  
  // Expose physics object reference
  export function getPhysicsObject() {
    return physicsObject;
  }
</script>

<!-- Component template is empty - physics object is managed through effects -->

<!-- 
Usage Example:

<script>
  import PhysicsBox from './PhysicsBox.svelte';
  
  let boxPosition = [-2, 4, 1];
  let boxColor = 0x0088ff;
  
  function handleBoxCollision(collision, impactStrength) {
    console.log(`Box collision with strength: ${impactStrength}`);
  }
</script>

<PhysicsBox 
  width={1.5}
  height={0.8}
  depth={2}
  bind:position={boxPosition}
  color={boxColor}
  mass={3}
  onCollide={handleBoxCollision}
/>
-->