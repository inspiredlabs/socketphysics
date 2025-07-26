<script>
  // ./routes/physics/[room]/+page.svelte
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { socket } from '$lib/client/socket.js';
  import { main } from '../main.js';
  import { createContext } from '../simpleContext.svelte.js';
  
  import CameraControls from '../CameraControls.svelte';
  import GizmoControls from '../GizmoControls.svelte';
  import FpsCounter from '../FpsCounter.svelte';
  import PhysicsControls from '../PhysicsControls.svelte';
  
  const context = createContext();
  const roomId = $page.params.room;

  let width = $state(window.innerWidth);
  let height = $state(window.innerHeight);
  
  $effect(() => {
    context.canvasWidth = width;
    context.canvasHeight = height;
  });
  
  function handleResize() {
    width = window.innerWidth;
    height = window.innerHeight;
  }
  
  $effect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  });
  
  function init(canvas) {
    const cleanupThree = main()(canvas);
    
    if (socket.connected) {
      socket.emit('joinRoom', { roomId });
    } else {
      socket.once('connect', () => socket.emit('joinRoom', { roomId }));
    }

    socket.on('physicsState', (serverState) => {
      if (context && context.updateFromServer) {
        context.updateFromServer(serverState);
      }
    });

    socket.on('error', () => goto('/'));
    
    return () => {
      if (cleanupThree) cleanupThree();
      if (socket.connected) socket.emit('leaveRoom', { roomId });
      socket.off('physicsState');
      socket.off('error');
    };
  }
</script>

<svelte:window bind:innerHeight={height} bind:innerWidth={width} />

<h1>Physics Room: {roomId}</h1>
<canvas {@attach init}></canvas>

<CameraControls />
<FpsCounter />
<GizmoControls size={2} />
<!-- MODIFIED: Pass down roomId and socket -->
<PhysicsControls {socket} {roomId} />

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
  
  h1 {
    position: fixed;
    top: 50px;
    left: 20px;
    color: white;
    z-index: 1001;
    font-size: 1.2em;
    font-family: monospace;
    background: rgba(0,0,0,0.5);
    padding: 5px 10px;
    border-radius: 5px;
  }
</style>