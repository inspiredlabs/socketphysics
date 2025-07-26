<script>
	// ./routes/+page.svelte
	import { goto } from '$app/navigation';
	import { socket } from '$lib/client/socket.js';
	
	let isConnected = $state(socket.connected);
	
	$effect(() => {
			function onConnect() { isConnected = true; }
			function onDisconnect() { isConnected = false; }
			function onRoomCreated(data) { goto(`/physics/${data.roomId}`); }
	
			socket.on('connect', onConnect);
			socket.on('disconnect', onDisconnect);
			socket.on('roomCreated', onRoomCreated);
	
			return () => {
					socket.off('connect', onConnect);
					socket.off('disconnect', onDisconnect);
					socket.off('roomCreated', onRoomCreated);
			};
	});
	
	function createRoom() {
			socket.emit('createRoom');
	}
	</script>
	
	<h1>Server-Authoritative Physics Demo</h1>
	<h2>(SvelteKit + Three.js + Cannon-es)</h2>
	{#if isConnected}
		<button onclick={createRoom}>Create New Physics Room</button>
	{:else}
		<p>Connecting to server...</p>
	{/if}
	
	<style>
			:global(body) { background: #222; color: #eee; font-family: sans-serif; text-align: center; padding-top: 5rem;}
			h1 { font-weight: 300; }
			h2 { color: #aaa; font-size: 1.1rem; margin-bottom: 3rem;}
			button { font-size: 1.2rem; padding: 10px 20px; }
	</style>