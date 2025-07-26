// lib/client/socket.js
import { io } from 'socket.io-client';

// Create and export a single, auto-connecting socket instance.
// This instance will be shared across the entire application.
export const socket = io({
    transports: ['websocket'],
});