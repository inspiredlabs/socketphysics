// main.js - Enhanced with Cannon.js physics
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { useContext } from './simpleContext.svelte.js';

/**
 * Three.js + Cannon.js setup using shared context
 * @returns {import('svelte/attachments').Attachment}
 */
export function main() {
  return (canvas) => {
    console.log("Setting up Three.js + Cannon.js with context");
    
    // Get the shared context
    const context = useContext();

    // Get initial dimensions from context
    let currentWidth = context.canvasWidth || window.innerWidth;
    let currentHeight = context.canvasHeight || window.innerHeight;
    
    // --- Three.js setup ---
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(currentWidth, currentHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    const scene = new THREE.Scene();
    scene.background = null;
    context.setScene(scene);
    
    const camera = new THREE.PerspectiveCamera(75, currentWidth / currentHeight, 0.1, 100);
    camera.position.set(-3, 3, 3);
    context.setCamera(camera);
    
    // Store renderer and camera in context
    context.renderer = renderer;
    context.camera = camera;
    
    // --- Physics World Setup ---
    const world = new CANNON.World();
    world.broadphase = new CANNON.SAPBroadphase(world);
    world.allowSleep = true;
    world.gravity.set(0, -9.82, 0);
    
    // Default physics materials
    const defaultMaterial = new CANNON.Material('default');
    const defaultContactMaterial = new CANNON.ContactMaterial(
      defaultMaterial,
      defaultMaterial,
      {
        friction: 0.1,
        restitution: 0.7
      }
    );
    world.defaultContactMaterial = defaultContactMaterial;
    
    // Store physics world in context
    context.setPhysicsWorld(world);
    
    // --- Environment Map for materials ---
    const cubeTextureLoader = new THREE.CubeTextureLoader();
    let environmentMapTexture = null;
    
    // Create a simple fallback environment
    const generateEnvironmentTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 256;
      const ctx = canvas.getContext('2d');
      
      // Simple gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, 256);
      gradient.addColorStop(0, '#87CEEB'); // Sky blue
      gradient.addColorStop(1, '#98FB98'); // Pale green
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 256, 256);
      
      const texture = new THREE.CanvasTexture(canvas);
      texture.mapping = THREE.EquirectangularReflectionMapping;
      return texture;
    };
    
    environmentMapTexture = generateEnvironmentTexture();
    
    // --- Collision Sound ---
    const hitSound = context.loadSound('hit', '/sounds/hit.mp3');
    
    const createCollisionSound = (collision) => {
      const impactStrength = collision.contact.getImpactVelocityAlongNormal();
      if (impactStrength > 1.5) {
        context.playSound('hit', {
          volume: Math.random(),
          reset: true
        });
      }
    };
    
    // --- Physics Floor ---
    const floorShape = new CANNON.Plane();
    const floorBody = new CANNON.Body({ mass: 0 });
    floorBody.addShape(floorShape);
    floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(-1, 0, 0), Math.PI * 0.5);
    world.addBody(floorBody);
    
    // --- Scene Objects ---
    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.2);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.set(1024, 1024);
    directionalLight.shadow.camera.far = 15;
    directionalLight.shadow.camera.left = -7;
    directionalLight.shadow.camera.top = 7;
    directionalLight.shadow.camera.right = 7;
    directionalLight.shadow.camera.bottom = -7;
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);
    
    // Ground plane (visual)
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 10),
      new THREE.MeshStandardMaterial({
        color: '#777777',
        metalness: 0.3,
        roughness: 0.4,
        envMap: environmentMapTexture,
        envMapIntensity: 0.5
      })
    );
    floor.receiveShadow = true;
    floor.rotation.x = -Math.PI * 0.5;
    scene.add(floor);
    
    // Sample objects
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.7, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0x00ff00 })
    );
    sphere.position.set(-4, 0.7, -2);
    scene.add(sphere);
    
    const cylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 2, 32),
      new THREE.MeshStandardMaterial({ color: 0xff0000 })
    );
    cylinder.position.set(4, 1, 2);
    scene.add(cylinder);
    
    // Make THREE and CANNON available globally
    window.THREE = THREE;
    window.CANNON = CANNON;
    
    // --- Physics Factory Functions (store in context) ---
    context.createPhysicsSphere = (radius, position) => {
      // Three.js mesh
      const geometry = new THREE.SphereGeometry(radius, 20, 20);
      const material = new THREE.MeshStandardMaterial({
        metalness: 0.3,
        roughness: 0.4,
        envMap: environmentMapTexture,
        envMapIntensity: 0.5
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.position.copy(position);
      
      // Cannon.js body
      const shape = new CANNON.Sphere(radius);
      const body = new CANNON.Body({
        mass: 1,
        position: new CANNON.Vec3(position.x, position.y, position.z),
        shape: shape,
        material: defaultMaterial
      });
      
      // Add to context with collision sound
      context.addPhysicsObject(mesh, body, {
        playSound: createCollisionSound
      });
      
      return { mesh, body };
    };
    
    context.createPhysicsBox = (width, height, depth, position) => {
      // Three.js mesh
      const geometry = new THREE.BoxGeometry(width, height, depth);
      const material = new THREE.MeshStandardMaterial({
        metalness: 0.3,
        roughness: 0.4,
        envMap: environmentMapTexture,
        envMapIntensity: 0.5
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.position.copy(position);
      
      // Cannon.js body
      const shape = new CANNON.Box(new CANNON.Vec3(width * 0.5, height * 0.5, depth * 0.5));
      const body = new CANNON.Body({
        mass: 1,
        position: new CANNON.Vec3(position.x, position.y, position.z),
        shape: shape,
        material: defaultMaterial
      });
      
      // Add to context with collision sound
      context.addPhysicsObject(mesh, body, {
        playSound: createCollisionSound
      });
      
      return { mesh, body };
    };
    
    // Create initial box
    context.createPhysicsBox(1, 1.5, 2, { x: 0, y: 3, z: 0 });
    
    // --- Resize handling ---
    function checkResize() {
      const newWidth = context.canvasWidth;
      const newHeight = context.canvasHeight;
      
      if (renderer && camera && newWidth && newHeight && 
          (newWidth !== currentWidth || newHeight !== currentHeight)) {
        
        currentWidth = newWidth;
        currentHeight = newHeight;
        
        renderer.setSize(newWidth, newHeight);
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
      }
    }
    
    context.registerUpdatable(checkResize);
    
    // --- Animation loop ---
    let frameId;
    let lastFrameTime = 0;
    const clock = new THREE.Clock();
    let oldElapsedTime = 0;
    
    function animate(currentTime) {
      // Calculate delta time
      const elapsedTime = clock.getElapsedTime();
      const deltaTime = elapsedTime - oldElapsedTime;
      oldElapsedTime = elapsedTime;
      
      // STEP 1: Update physics (BEFORE rendering)
      world.step(1/60, deltaTime, 3);
      
      // STEP 2: Sync physics bodies with Three.js meshes
      for (const [mesh, physicsObj] of context.getPhysicsObjects()) {
        mesh.position.copy(physicsObj.body.position);
        mesh.quaternion.copy(physicsObj.body.quaternion);
      }
      
      // STEP 3: Run all updatable functions
      for (const updatable of context._getUpdatableFunctions()) {
        if (typeof updatable === 'function') {
          try {
            updatable(deltaTime, currentTime);
          } catch (e) {
            console.error("Error in updatable function:", e);
          }
        }
      }
      
      // STEP 4: Render scene
      renderer.render(scene, camera);
      
      // Next frame
      frameId = requestAnimationFrame(animate);
    }
    
    // Start animation
    frameId = requestAnimationFrame(animate);
    
    // Return cleanup function
    return () => {
      console.log("Cleaning up Three.js + Cannon.js");
      
      // Stop animation
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
      
      // Remove all physics objects
      context.removeAllPhysicsObjects();
      
      // Unregister resize handler
      context.unregisterUpdatable(checkResize);
      
      // Dispose Three.js resources
      renderer.dispose();
      
      // Dispose static objects
      [floor, sphere, cylinder].forEach(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
      
      // Clear context references
      context.setScene(null);
      context.setCamera(null);
      context.setPhysicsWorld(null);
      context.renderer = null;
      context.camera = null;
    };
  };
}