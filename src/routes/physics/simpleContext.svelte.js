// src/routes/physics/simpleContext.svelte.js
import { getContext, setContext } from 'svelte';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger';

const CONTEXT_KEY = Symbol('physics-context');

export function createContext() {
  const state = {
    scene: null,
    camera: null,
    clientObjects: new Map(),
    canvasWidth: window.innerWidth,
    canvasHeight: window.innerHeight,
    updatableFunctions: new Set(),
    gizmoPosition: { x: 0, y: 0.5, z: 0 },
    lookAtTarget: { x: 0, y: 0, z: 0 },
    cameraYaw: 0,
    cameraPitch: 0,

    // FIXED: Client debug world setup matching server exactly
    debugWorld: null,
    debugBodies: new Map(), 
    debuggerInstance: null,
    groundMaterial: null,
    defaultMaterial: null,
  };
  
  // FIXED: Initialize debug world with same setup as server
  function initializeDebugWorld() {
    state.debugWorld = new CANNON.World({
      gravity: new CANNON.Vec3(0, -9.82, 0), // Match server exactly
      allowSleep: true,
    });
    
    // FIXED: Use same broadphase as server
    state.debugWorld.broadphase = new CANNON.NaiveBroadphase();
    
    // FIXED: Create same materials as server
    state.groundMaterial = new CANNON.Material('groundMaterial');
    state.defaultMaterial = new CANNON.Material('defaultMaterial');
    
    const groundContactMaterial = new CANNON.ContactMaterial(
      state.defaultMaterial,
      state.groundMaterial,
      {
        friction: 0.4,        // Match server exactly
        restitution: 0.3,     // Match server exactly
        contactEquationStiffness: 1e8,
        contactEquationRelaxation: 3
      }
    );
    
    state.debugWorld.addContactMaterial(groundContactMaterial);
    
    // Add debug floor
    const floorShape = new CANNON.Plane();
    const floorBody = new CANNON.Body({ 
      mass: 0, 
      material: state.groundMaterial 
    });
    floorBody.addShape(floorShape);
    floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    state.debugWorld.addBody(floorBody);
    
    console.log("[Debug] Client debug world initialized with matching server setup");
  }
  
  const context = {
    getScene: () => state.scene,
    getCamera: () => state.camera,
    setCamera: (camera) => { state.camera = camera; },
    getPhysicsObjects: () => state.clientObjects,

    // FIXED: Initialize debug world when scene is set
    setScene: (scene) => { 
      state.scene = scene; 
      
      // Initialize debug world if not already done
      if (!state.debugWorld) {
        initializeDebugWorld();
      }
      
      // Create debugger when scene is available
      if (scene && !state.debuggerInstance && state.debugWorld) {
        console.log("[Debug] Scene is ready, creating CannonDebugger.");
        state.debuggerInstance = new CannonDebugger(scene, state.debugWorld, {
          color: 0x00ff00,
        });
      }
    },

    // FIXED: Enhanced server state synchronization
    updateFromServer(serverState) {
      if (!state.scene || !state.debugWorld) return;

      const receivedIds = new Set();

      serverState.forEach(objData => {
        receivedIds.add(objData.id);
        let clientObj = state.clientObjects.get(objData.id);
        let debugBody = state.debugBodies.get(objData.id);

        if (!clientObj) {
          // Create visual mesh
          let geometry, material;
          material = new THREE.MeshStandardMaterial({ 
            metalness: 0.3, 
            roughness: 0.4,
            color: objData.type === 'sphere' ? 0xff4444 : 0x4444ff  // Color coding
          });
          
          if (objData.type === 'sphere') {
            geometry = new THREE.SphereGeometry(objData.radius, 16, 16);
          } else if (objData.type === 'box') {
            geometry = new THREE.BoxGeometry(objData.width, objData.height, objData.depth);
          }
          
          if (geometry) {
            const mesh = new THREE.Mesh(geometry, material);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            
            // FIXED: Set initial position immediately
            mesh.position.set(objData.position.x, objData.position.y, objData.position.z);
            mesh.quaternion.set(objData.quaternion.x, objData.quaternion.y, objData.quaternion.z, objData.quaternion.w);

            state.scene.add(mesh);
            clientObj = { 
              mesh, 
              target: { 
                position: new THREE.Vector3().copy(objData.position), 
                quaternion: new THREE.Quaternion().copy(objData.quaternion) 
              } 
            };
            state.clientObjects.set(objData.id, clientObj);
            
            console.log(`[Client] Created visual mesh for ${objData.type} ${objData.id} at`, objData.position);
          }
        }
        
        if (!debugBody && state.debugWorld) {
          // Create debug body matching server
          let shape;
          if (objData.type === 'sphere') {
            shape = new CANNON.Sphere(objData.radius);
          } else if (objData.type === 'box') {
            shape = new CANNON.Box(new CANNON.Vec3(objData.width / 2, objData.height / 2, objData.depth / 2));
          }
          
          if (shape) {
            debugBody = new CANNON.Body({ 
              mass: 0,  // Debug bodies don't simulate
              material: state.defaultMaterial 
            });
            debugBody.addShape(shape);
            state.debugWorld.addBody(debugBody);
            state.debugBodies.set(objData.id, debugBody);
            
            console.log(`[Client] Created debug body for ${objData.type} ${objData.id}`);
          }
        }

        // FIXED: Update target positions for smooth interpolation
        if (clientObj) {
          clientObj.target.position.set(objData.position.x, objData.position.y, objData.position.z);
          clientObj.target.quaternion.set(objData.quaternion.x, objData.quaternion.y, objData.quaternion.z, objData.quaternion.w);
        }
        
        // Update debug body position
        if (debugBody) {
          debugBody.position.set(objData.position.x, objData.position.y, objData.position.z);
          debugBody.quaternion.set(objData.quaternion.x, objData.quaternion.y, objData.quaternion.z, objData.quaternion.w);
        }
      });
      
      // Clean up objects that no longer exist on server
      for (const [id, obj] of state.clientObjects.entries()) {
        if (!receivedIds.has(id)) {
          state.scene.remove(obj.mesh);
          obj.mesh.geometry.dispose();
          obj.mesh.material.dispose();
          state.clientObjects.delete(id);
          console.log(`[Client] Removed visual mesh ${id}`);
        }
      }
      
      // Clean up debug bodies
      for (const [id, body] of state.debugBodies.entries()) {
        if (!receivedIds.has(id)) {
          state.debugWorld.removeBody(body);
          state.debugBodies.delete(id);
          console.log(`[Client] Removed debug body ${id}`);
        }
      }
    },
    
    // Debug controls
    toggleDebugger(visible) {
      if (state.debuggerInstance) {
        state.debuggerInstance._meshes.forEach(mesh => {
          mesh.visible = visible;
        });
      }
    },

    getDebugger: () => state.debuggerInstance,

    removeAllClientObjects() {
      for (const [id, obj] of state.clientObjects.entries()) {
        if (state.scene) state.scene.remove(obj.mesh);
        obj.mesh.geometry.dispose();
        obj.mesh.material.dispose();
      }
      state.clientObjects.clear();
      
      // Clear debug bodies
      for (const [id, body] of state.debugBodies.entries()) {
        if (state.debugWorld) state.debugWorld.removeBody(body);
      }
      state.debugBodies.clear();
    },

    // Gizmo position management
    getGizmoPosition() { return state.gizmoPosition; },
    updateGizmoAxis(axis, value) {
      if (axis in state.gizmoPosition) {
        state.gizmoPosition[axis] = value;
      }
    },
    
    // Canvas size management
    get canvasWidth() { return state.canvasWidth; },
    set canvasWidth(value) { state.canvasWidth = value; },
    get canvasHeight() { return state.canvasHeight; },
    set canvasHeight(value) { state.canvasHeight = value; },

    // Camera management
    setLookAtTarget: (x, y, z) => {
      state.lookAtTarget = { x, y, z };
    },
    getLookAtTarget: () => ({ ...state.lookAtTarget }),
    
    getCameraYaw: () => state.cameraYaw,
    setCameraYaw: (yaw) => { state.cameraYaw = yaw; },
    getCameraPitch: () => state.cameraPitch,
    setCameraPitch: (pitch) => { 
      // Clamp pitch to prevent gimbal lock
      state.cameraPitch = Math.max(-Math.PI/2 + 0.01, Math.min(Math.PI/2 - 0.01, pitch)); 
    },
    
    // Update functions
    registerUpdatable: (fn) => state.updatableFunctions.add(fn),
    unregisterUpdatable: (fn) => state.updatableFunctions.delete(fn),
    _getUpdatableFunctions: () => state.updatableFunctions,
  };
  
  setContext(CONTEXT_KEY, context);
  return context;
}

export function useContext() {
  return getContext(CONTEXT_KEY);
}