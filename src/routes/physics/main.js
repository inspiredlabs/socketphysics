// ./routes/physics/main.js
import * as THREE from 'three';
import { useContext } from './simpleContext.svelte.js';

export function main() {
  return (canvas) => {
    const context = useContext();
    let currentWidth = context.canvasWidth || window.innerWidth;
    let currentHeight = context.canvasHeight || window.innerHeight;
    
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(currentWidth, currentHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);  // Darker background for better contrast
    context.setScene(scene);
    
    // Camera setup
    const camera = new THREE.PerspectiveCamera(50, currentWidth / currentHeight, 0.1, 100);
    camera.position.set(8, 6, 8);  // Better viewing angle
    
    const lookAtX = 0;
    const lookAtY = 0;
    const lookAtZ = 0;
    camera.lookAt(lookAtX, lookAtY, lookAtZ);
    
    context.setCamera(camera);
    context.setLookAtTarget(lookAtX, lookAtY, lookAtZ);

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);  // Brighter ambient
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);  // Brighter directional
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.set(2048, 2048);  // Higher resolution shadows
    directionalLight.shadow.camera.far = 20;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.bottom = -10;
    directionalLight.position.set(5, 10, 5);
    scene.add(directionalLight);

    // Enhanced floor with grid
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),  // Larger floor
      new THREE.MeshStandardMaterial({ 
        color: '#444444', 
        metalness: 0.1, 
        roughness: 0.8 
      })
    );
    floor.receiveShadow = true;
    floor.rotation.x = -Math.PI * 0.5;
    scene.add(floor);
    
    // Add grid helper for better depth perception
    const gridHelper = new THREE.GridHelper(20, 20, 0x666666, 0x333333);
    gridHelper.position.y = 0.01;  // Slightly above floor to prevent z-fighting
    scene.add(gridHelper);
    
    // Add coordinate axes helper
    const axesHelper = new THREE.AxesHelper(2);
    scene.add(axesHelper);
    
    function checkResize() {
      const newWidth = context.canvasWidth;
      const newHeight = context.canvasHeight;
      if (renderer && camera && (newWidth !== currentWidth || newHeight !== currentHeight)) {
        currentWidth = newWidth;
        currentHeight = newHeight;
        renderer.setSize(newWidth, newHeight);
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
      }
    }
    context.registerUpdatable(checkResize);
    
    let frameId;
    let frameCount = 0;
    const clock = new THREE.Clock();
    const debuggerInstance = context.getDebugger();
    
    function animate() {
      const deltaTime = clock.getDelta();
      frameCount++;
      
      // ENHANCED: Better interpolation with different rates for position and rotation
      for (const [id, obj] of context.getPhysicsObjects()) {
        if (obj.mesh && obj.target) {
          // Use different interpolation rates for smoother motion
          const positionLerpRate = 0.15;  // Slightly slower for smoother position
          const rotationLerpRate = 0.25;  // Faster rotation for responsiveness
          
          obj.mesh.position.lerp(obj.target.position, positionLerpRate);
          obj.mesh.quaternion.slerp(obj.target.quaternion, rotationLerpRate);
          
          // Debug: Log occasionally to verify movement
          if (frameCount % 180 === 0) {  // Every 3 seconds at 60fps
            console.log(`[Client] Object ${id} - Target: ${obj.target.position.y.toFixed(2)}, Mesh: ${obj.mesh.position.y.toFixed(2)}`);
          }
        }
      }

      // Update other systems
      for (const updatable of context._getUpdatableFunctions()) {
        updatable(deltaTime);
      }

      // Update physics debugger
      if (debuggerInstance) {
        debuggerInstance.update();
      }
      
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    }
    
    frameId = requestAnimationFrame(animate);
    
    // ENHANCED: Better cleanup
    return () => {
      cancelAnimationFrame(frameId);
      context.unregisterUpdatable(checkResize);
      
      // Dispose of all materials and geometries
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      
      renderer.dispose();
      context.removeAllClientObjects();
      context.setScene(null);
      context.setCamera(null);
      
      console.log("[Client] Three.js cleanup completed");
    };
  };
}