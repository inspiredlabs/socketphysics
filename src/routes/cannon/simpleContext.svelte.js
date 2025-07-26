// ./simpleContext.svelte.js
import { getContext, setContext } from 'svelte';
//import * as CANNON from 'cannon-es';

const CONTEXT_KEY = Symbol('three-context');

export function createContext() {
  // Use a single state object to hold all context values
  const state = {
    scene: null,
    camera: null,
    physicsWorld: null,
    physicsObjects: new Map(), // Map of Three.js mesh to Cannon body pairs
    gizmoPosition: { x: 0, y: 0.5, z: 0 },
    canvasWidth: window.innerWidth,
    canvasHeight: window.innerHeight,
    updatableFunctions: new Set(),
    sounds: new Map(), // For collision sounds
  };
  
  const context = {
    // Scene and camera getters/setters
    getScene() { return state.scene; },
    setScene(scene) { state.scene = scene; },
    
    getCamera() { return state.camera; },
    setCamera(camera) { state.camera = camera; },
    
    // Physics world management
    getPhysicsWorld() { return state.physicsWorld; },
    setPhysicsWorld(world) { state.physicsWorld = world; },
    
    // Physics object lifecycle
    addPhysicsObject(mesh, body, options = {}) {
      if (!mesh || !body) return;
      
      const physicsObj = {
        mesh,
        body,
        cleanup: options.cleanup || null,
        playSound: options.playSound || null
      };
      
      state.physicsObjects.set(mesh, physicsObj);
      
      // Add collision sound if provided
      if (options.playSound) {
        body.addEventListener('collide', options.playSound);
      }
      
      // Add to physics world and Three.js scene
      if (state.physicsWorld) state.physicsWorld.addBody(body);
      if (state.scene) state.scene.add(mesh);
    },
    
    removePhysicsObject(mesh) {
      const physicsObj = state.physicsObjects.get(mesh);
      if (!physicsObj) return;
      
      const { body, cleanup, playSound } = physicsObj;
      
      // Remove event listeners
      if (playSound) {
        body.removeEventListener('collide', playSound);
      }
      
      // Remove from physics world and scene
      if (state.physicsWorld) state.physicsWorld.removeBody(body);
      if (state.scene) state.scene.remove(mesh);
      
      // Run custom cleanup
      if (cleanup) cleanup();
      
      // Dispose Three.js resources
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(m => m.dispose());
        } else {
          mesh.material.dispose();
        }
      }
      
      state.physicsObjects.delete(mesh);
    },
    
    removeAllPhysicsObjects() {
      // Create array copy to avoid iteration issues
      const meshes = Array.from(state.physicsObjects.keys());
      meshes.forEach(mesh => this.removePhysicsObject(mesh));
    },
    
    getPhysicsObjects() {
      return state.physicsObjects;
    },
    
    // Sound management
    loadSound(name, url) {
      const audio = new Audio(url);
      state.sounds.set(name, audio);
      return audio;
    },
    
    playSound(name, options = {}) {
      const sound = state.sounds.get(name);
      if (sound) {
        if (options.volume !== undefined) sound.volume = options.volume;
        if (options.reset) sound.currentTime = 0;
        sound.play().catch(e => console.warn('Sound play failed:', e));
      }
    },
    
    // Gizmo position management
    getGizmoPosition() { return state.gizmoPosition; },
    updateGizmoAxis(axis, value) {
      if (axis in state.gizmoPosition) {
        state.gizmoPosition[axis] = value;
      }
    },
    
    // Canvas dimensions
    get canvasWidth() { return state.canvasWidth; },
    set canvasWidth(value) { state.canvasWidth = value; },
    
    get canvasHeight() { return state.canvasHeight; },
    set canvasHeight(value) { state.canvasHeight = value; },
    
    // Status getters
    get threeJsScene() { return state.scene; },
    get threeJsCamera() { return state.camera; },
    get threeJsReady() { return state.scene !== null && state.camera !== null; },
    get physicsReady() { return state.physicsWorld !== null; },
    get ready() { return this.threeJsReady && this.physicsReady; },
    
    // Updatable functions management
    registerUpdatable(fn) {
      if (typeof fn === 'function') {
        state.updatableFunctions.add(fn);
      }
    },
    
    unregisterUpdatable(fn) {
      state.updatableFunctions.delete(fn);
    },
    
    _getUpdatableFunctions() {
      return state.updatableFunctions;
    }
  };
  
  setContext(CONTEXT_KEY, context);
  return context;
}

// Retrieves the context across all components
export function useContext() {
  return getContext(CONTEXT_KEY);
}