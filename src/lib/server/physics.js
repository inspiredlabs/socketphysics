// src/lib/server/physics.js
import { Server as SocketServer } from 'socket.io';
import * as CANNON from 'cannon-es';
import { performance } from 'perf_hooks';

// FIXED: Use consistent 60Hz like the working example
const FIXED_TIME_STEP = 1 / 60; // Changed from 1/30 to 1/60
const MAX_SUB_STEPS = 3;

class PhysicsRoom {
  constructor(roomId, io) {
    this.roomId = roomId;
    this.io = io;
    this.players = new Set();
    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -9.82, 0), // Consistent with client
      allowSleep: true,
    });
    
    // FIXED: Use proper broadphase (same as working example)
    this.world.broadphase = new CANNON.NaiveBroadphase();
    
    this.objects = new Map();
    this.nextObjectId = 0;
    this.physicsLoop = null;
    this.lastStepTime = performance.now();

    // FIXED: Create materials BEFORE calling initPhysics
    this.setupMaterials();
    this.initPhysics();
    console.log(`[PhysicsRoom] Created: ${roomId}`);
  }

  // FIXED: Proper material setup matching the working example
  setupMaterials() {
    // Create materials
    this.groundMaterial = new CANNON.Material('groundMaterial');
    this.defaultMaterial = new CANNON.Material('defaultMaterial');
    
    // Create contact material between ground and objects
    const groundContactMaterial = new CANNON.ContactMaterial(
      this.defaultMaterial,
      this.groundMaterial,
      {
        friction: 0.4,        // Match working example
        restitution: 0.3,     // Match working example  
        contactEquationStiffness: 1e8,
        contactEquationRelaxation: 3
      }
    );
    
    // FIXED: Add contact material to world (not set as defaultContactMaterial)
    this.world.addContactMaterial(groundContactMaterial);
    
    console.log(`[PhysicsRoom ${this.roomId}] Materials setup complete`);
  }

  initPhysics() {
    // Create floor with proper material
    const floorShape = new CANNON.Plane();
    const floorBody = new CANNON.Body({ 
      mass: 0, 
      material: this.groundMaterial  // FIXED: Use the ground material
    });
    floorBody.addShape(floorShape);
    floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    this.world.addBody(floorBody);
    
    console.log(`[PhysicsRoom ${this.roomId}] Floor added with material`);
  }

  addPlayer(playerId) {
    console.log(`[PhysicsRoom ${this.roomId}] Player joined: ${playerId}`);
    this.players.add(playerId);
    if (this.players.size === 1 && !this.physicsLoop) {
      this.startSimulation();
    }
  }

  removePlayer(playerId) {
    console.log(`[PhysicsRoom ${this.roomId}] Player left: ${playerId}`);
    this.players.delete(playerId);
    if (this.players.size === 0) {
      this.stopSimulation();
      console.log(`[PhysicsRoom ${this.roomId}] Room empty, stopping simulation.`);
    }
  }
  
  createObject(data) {
    const id = this.nextObjectId++;
    let body;

    const position = new CANNON.Vec3(data.position.x, data.position.y, data.position.z);

    // FIXED: Proper body creation with correct material
    const bodyOptions = {
      mass: 1,  // Ensure dynamic body
      position,
      material: this.defaultMaterial  // FIXED: Use the actual material
    };

    if (data.type === 'sphere') {
      const shape = new CANNON.Sphere(data.radius);
      body = new CANNON.Body(bodyOptions);
      body.addShape(shape);
    } else if (data.type === 'box') {
      const halfExtents = new CANNON.Vec3(data.width / 2, data.height / 2, data.depth / 2);
      const shape = new CANNON.Box(halfExtents);
      body = new CANNON.Body(bodyOptions);
      body.addShape(shape);
    } else {
      console.warn(`[PhysicsRoom ${this.roomId}] Unknown object type: ${data.type}`);
      return;
    }
    
    console.log(`[PhysicsRoom ${this.roomId}] Creating object ID ${id} of type ${data.type} at position:`, position);
    body.metadata = { id, type: data.type, ...data };
    this.world.addBody(body);
    this.objects.set(id, body);
    
    // FIXED: Log body state after creation
    console.log(`[PhysicsRoom ${this.roomId}] Body ${id} created - mass: ${body.mass}, position: ${body.position.toString()}`);
  }

  removeAllObjects() {
    console.log(`[PhysicsRoom ${this.roomId}] Resetting scene, removing ${this.objects.size} objects.`);
    for (const [id, body] of this.objects.entries()) {
      this.world.removeBody(body);
    }
    this.objects.clear();
    this.broadcastState();
  }

  startSimulation() {
    if (this.physicsLoop) {
      console.log(`[PhysicsRoom ${this.roomId}] Simulation already running`);
      return;
    }
    console.log(`[PhysicsRoom ${this.roomId}] Starting physics simulation at ${1/FIXED_TIME_STEP}Hz`);
    this.lastStepTime = performance.now();
    this.runStep();
  }
  
  // Tick
  runStep() {
    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastStepTime) / 1000;
    this.lastStepTime = currentTime;

    // FIXED: Step the world and log occasionally for debugging
    this.world.step(FIXED_TIME_STEP, deltaTime, MAX_SUB_STEPS);
    
    // FIXED: Add debug logging every 60 steps (1 second at 60Hz)
    if (this.world.stepnumber % 60 === 0 && this.objects.size > 0) {
      const firstBody = Array.from(
        this.objects.values()
      )[0];
      console.log(`[PhysicsRoom ${this.roomId}] Step ${this.world.stepnumber} - First body position: ${firstBody.position.toString()}, velocity: ${firstBody.velocity.toString()}`);
    }
    
    this.broadcastState();

    // Schedule next step
    this.physicsLoop = setTimeout(() => this.runStep(), FIXED_TIME_STEP * 1000);
  }

  stopSimulation() {
    if (this.physicsLoop) {
      clearTimeout(this.physicsLoop);  // FIXED: Use clearTimeout not clearInterval
      this.physicsLoop = null;
      console.log(`[PhysicsRoom ${this.roomId}] Physics simulation stopped`);
    }
  }

  // FIXED: Enhanced state broadcasting with validation
  broadcastState() {
    if (this.objects.size === 0) return;
    
    // Potential perf issue (map)
    const stateSnapshot = Array.from(this.objects.values()).map(body => ({
      id: body.metadata.id,
      type: body.metadata.type,
      position: {
        x: body.position.x,
        y: body.position.y, 
        z: body.position.z
      },
      quaternion: {
        x: body.quaternion.x,
        y: body.quaternion.y,
        z: body.quaternion.z,
        w: body.quaternion.w
      },
      // Include metadata for client mesh creation
      radius: body.metadata.radius,
      width: body.metadata.width,
      height: body.metadata.height,
      depth: body.metadata.depth
    }));
    
    this.io.to(this.roomId).emit('physicsState', stateSnapshot);
  }
}

export class PhysicsServer {
  constructor(server) {
    this.rooms = new Map();
    this.io = new SocketServer(server, { 
      cors: { origin: "*", methods: ["GET", "POST"] },
      transports: ['websocket']  // FIXED: Match client transport
    });
    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`[PhysicsServer] Client connected: ${socket.id}`);
      
      socket.on('createRoom', () => {
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        console.log(`[PhysicsServer] Created room: ${roomId}`);
        socket.emit('roomCreated', { roomId });
      });

      socket.on('joinRoom', ({ roomId }) => {
        if (!roomId) return;
        let room = this.rooms.get(roomId);
        if (!room) {
          room = new PhysicsRoom(roomId, this.io);
          this.rooms.set(roomId, room);
        }
        socket.join(roomId);
        room.addPlayer(socket.id);
        socket.emit('joinedRoom', { roomId });
        console.log(`[PhysicsServer] Socket ${socket.id} joined room ${roomId}`);
      });

      socket.on('createObject', ({ roomId, objectData }) => {
        const room = this.rooms.get(roomId);
        if (room) {
          console.log(`[PhysicsServer] Creating object in room ${roomId}:`, objectData);
          room.createObject(objectData);
        } else {
          console.warn(`[PhysicsServer] Received createObject for non-existent room: ${roomId}`);
        }
      });
      
      socket.on('resetScene', ({ roomId }) => {
        const room = this.rooms.get(roomId);
        if (room) {
          room.removeAllObjects();
        } else {
          console.warn(`[PhysicsServer] Received resetScene for non-existent room: ${roomId}`);
        }
      });

      socket.on('leaveRoom', ({ roomId }) => {
        const room = this.rooms.get(roomId);
        if (room) {
          room.removePlayer(socket.id);
          if (room.players.size === 0) {
            room.stopSimulation();  // FIXED: Stop simulation before deleting
            console.log(`[PhysicsServer] Deleting empty room: ${roomId}`);
            this.rooms.delete(roomId);
          }
        }
      });

      socket.on('disconnect', () => {
        console.log(`[PhysicsServer] Client disconnected: ${socket.id}`);
        for (const [roomId, room] of this.rooms.entries()) {
          if (room.players.has(socket.id)) {
            room.removePlayer(socket.id);
            if (room.players.size === 0) {
              room.stopSimulation();  // FIXED: Stop simulation before deleting
              console.log(`[PhysicsServer] Deleting empty room after disconnect: ${roomId}`);
              this.rooms.delete(roomId);
            }
            break;
          }
        }
      });
    });
  }
}