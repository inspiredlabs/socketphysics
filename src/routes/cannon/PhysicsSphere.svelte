<script>
  // ./PhysicsSphere.svelte
  import * as THREE from 'three';
  import * as CANNON from 'cannon-es';
  import { useContext } from './simpleContext.svelte.js';
  
  // Props with defaults
  let { 
    radius = 0.5,
    position = [0, 3, 0],
    color = 0x00aaff,
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
    
    console.log(`Creating physics sphere at [${position.join(', ')}]`);
    
    // Get environment texture from context if available
    const envTexture = context.renderer?.capabilities?.isWebGL2 ? null : null;
    
    // Create Three.js mesh
    const geometry = new THREE.SphereGeometry(radius, 20, 20);
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
    const shape = new CANNON.Sphere(radius);
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
  
  // Expose physics object reference
  export function getPhysicsObject() {
    return physicsObject;
  }
</script>

<!-- Component template is empty - physics object is managed through effects -->

<script context="module">
  // PhysicsBox component (similar pattern)
  export function createPhysicsBox() {
    return {
      // This would be a separate component file in practice
      // ./PhysicsBox.svelte with similar logic but Box geometry/shape
    };
  }
</script>

<!-- 
Usage Example:

<script>
  import PhysicsSphere from './PhysicsSphere.svelte';
  
  let spherePosition = [0, 5, 0];
  let sphereColor = 0xff0000;
  
  function handleSphereCollision(collision, impactStrength) {
    if (impactStrength > 2) {
      console.log('Strong collision!');
      sphereColor = 0x00ff00; // Change to green
    }
  }
</script>

<PhysicsSphere 
  radius={0.8}
  bind:position={spherePosition}
  color={sphereColor}
  mass={2}
  onCollide={handleSphereCollision}
/>
-->