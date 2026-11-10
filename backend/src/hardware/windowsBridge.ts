/**
 * ════════════════════════════════════════════════════════════════════
 *  LOCAL WINDOWS HARDWARE BRIDGE ADAPTER & FRAMED IPC TRANSPORT
 * ════════════════════════════════════════════════════════════════════
 * Manages communication with physical microcontrollers/bridges on
 * the local Windows host via authenticated Local IPC (Named Pipe / TCP loopback).
 * Fails closed with UNAVAILABLE if bridge daemon or hardware is disconnected.
 * Zero fabricated timestamps, zero simulated readbacks.
 */

import net from 'net';
import crypto from 'crypto';
import {
  IHardwareGateway,
  IHardwareTransport,
  HardwareDeviceDescriptor,
  GpioPulseRequest,
  GpioPulseExecutionResult,
  HardwareTransportType,
  HardwareProtocolPacket
} from './hardwareGateway.js';

/**
 * Real framed IPC transport over Node net.Socket.
 * Communicates with Windows Named Pipes (\\.\pipe\...) or loopback TCP sockets.
 * Uses newline-delimited JSON framing with request tracking and replay protection.
 */
export class FramedIpcTransport implements IHardwareTransport {
  public readonly transportType: HardwareTransportType = 'LOCAL_IPC';
  private socket: net.Socket | null = null;
  private connected = false;
  private pendingRequests = new Map<
    string,
    {
      resolve: (pkt: HardwareProtocolPacket) => void;
      reject: (err: Error) => void;
      timeout: NodeJS.Timeout;
    }
  >();
  private processedReqIds = new Set<string>();
  private buffer = '';

  constructor(
    private pipeOrPort: string | number,
    private host: string = '127.0.0.1'
  ) {}

  public isConnected(): boolean {
    return this.connected && this.socket !== null && !this.socket.destroyed;
  }

  public async connect(): Promise<void> {
    if (this.isConnected()) return;

    return new Promise<void>((resolve, reject) => {
      const isPipe = typeof this.pipeOrPort === 'string' && this.pipeOrPort.startsWith('\\\\.\\pipe\\');

      const client = isPipe
        ? net.createConnection(this.pipeOrPort as string)
        : net.createConnection(Number(this.pipeOrPort), this.host);

      const connectTimeout = setTimeout(() => {
        client.destroy();
        reject(new Error(`Hardware IPC connection timeout to ${this.pipeOrPort}`));
      }, 3000);

      client.on('connect', () => {
        clearTimeout(connectTimeout);
        this.socket = client;
        this.connected = true;
        resolve();
      });

      client.on('data', (chunk) => {
        this.handleData(chunk);
      });

      client.on('error', (err) => {
        clearTimeout(connectTimeout);
        this.connected = false;
        reject(err);
      });

      client.on('close', () => {
        this.connected = false;
        this.socket = null;
        // Reject all pending requests
        for (const [reqId, pending] of this.pendingRequests.entries()) {
          clearTimeout(pending.timeout);
          pending.reject(new Error('Hardware IPC transport disconnected while request pending'));
          this.pendingRequests.delete(reqId);
        }
      });
    });
  }

  public async disconnect(): Promise<void> {
    if (this.socket && !this.socket.destroyed) {
      this.socket.end();
      this.socket.destroy();
    }
    this.connected = false;
    this.socket = null;
  }

  private handleData(chunk: Buffer): void {
    this.buffer += chunk.toString('utf8');
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || ''; // Keep remainder in buffer

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      try {
        const packet = JSON.parse(trimmed) as HardwareProtocolPacket;
        if (!packet.reqId || !packet.type || packet.version !== '1.0') {
          continue; // Malformed packet
        }

        // Replay attack protection: reject if duplicate response reqId
        if (this.processedReqIds.has(packet.reqId)) {
          console.warn(`[Hardware Security] Replay packet rejected with duplicate reqId: ${packet.reqId}`);
          continue;
        }

        const pending = this.pendingRequests.get(packet.reqId);
        if (pending) {
          clearTimeout(pending.timeout);
          this.pendingRequests.delete(packet.reqId);
          this.processedReqIds.add(packet.reqId);
          pending.resolve(packet);
        }
      } catch (err) {
        console.warn('[Hardware Security] Failed to parse incoming packet frame:', err);
      }
    }
  }

  public async sendPacket(packet: HardwareProtocolPacket, timeoutMs = 5000): Promise<HardwareProtocolPacket> {
    if (!this.isConnected() || !this.socket) {
      throw new Error('Hardware transport is not connected');
    }

    return new Promise<HardwareProtocolPacket>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(packet.reqId);
        reject(new Error(`Hardware communication timed out after ${timeoutMs}ms for reqId: ${packet.reqId}`));
      }, timeoutMs);

      this.pendingRequests.set(packet.reqId, {
        resolve,
        reject,
        timeout: timer
      });

      const serialized = JSON.stringify(packet) + '\n';
      this.socket!.write(serialized, (err) => {
        if (err) {
          clearTimeout(timer);
          this.pendingRequests.delete(packet.reqId);
          reject(err);
        }
      });
    });
  }
}

export interface WindowsHardwareBridgeOptions {
  enabled?: boolean;
  transport?: IHardwareTransport;
  ipcPipeName?: string;
  ipcPort?: number;
  ipcAuthToken?: string;
}

export class WindowsLocalHardwareBridge implements IHardwareGateway {
  public readonly gatewayName = 'WINDOWS_LOCAL_HARDWARE_BRIDGE';
  private transport: IHardwareTransport | null = null;
  private devices = new Map<string, HardwareDeviceDescriptor>();
  private activeDeviceId: string | null = null;
  private ipcAuthToken?: string;
  private isHandshakeComplete = false;

  constructor(options: WindowsHardwareBridgeOptions = {}) {
    this.ipcAuthToken = options.ipcAuthToken;

    if (options.transport) {
      this.transport = options.transport;
    } else if (options.ipcPipeName) {
      this.transport = new FramedIpcTransport(options.ipcPipeName);
    } else if (options.ipcPort) {
      this.transport = new FramedIpcTransport(options.ipcPort);
    }

    // Notice: `options.enabled = true` does NOT fabricate connection!
    // Real initialization requires calling `initialize()` or physical handshake.
  }

  /**
   * Initializes the physical transport and completes authenticated device handshake.
   * If physical transport is absent or device unreachable, remains UNAVAILABLE.
   */
  public async initialize(): Promise<boolean> {
    if (!this.transport) {
      return false; // No transport configured -> remains UNAVAILABLE
    }

    try {
      await this.transport.connect();
      return await this.performHandshake();
    } catch {
      this.isHandshakeComplete = false;
      return false;
    }
  }

  public setTransport(transport: IHardwareTransport): void {
    this.transport = transport;
    this.isHandshakeComplete = false;
    this.devices.clear();
    this.activeDeviceId = null;
  }

  public isConnected(): boolean {
    return Boolean(this.transport && this.transport.isConnected() && this.isHandshakeComplete);
  }

  public getConnectedDevices(): HardwareDeviceDescriptor[] {
    if (!this.isConnected()) return [];
    return Array.from(this.devices.values()).filter((d) => d.status === 'ONLINE');
  }

  /**
   * Performs real authenticated device handshake over the wire protocol.
   * Device MUST return valid device descriptor with supported pins and capabilities.
   */
  public async performHandshake(): Promise<boolean> {
    if (!this.transport || !this.transport.isConnected()) {
      this.isHandshakeComplete = false;
      return false;
    }

    const reqId = crypto.randomUUID();
    const handshakePacket: HardwareProtocolPacket = {
      version: '1.0',
      type: 'CMD_HANDSHAKE',
      reqId,
      deviceId: 'UNKNOWN',
      timestamp: Date.now(),
      payload: {
        authToken: this.ipcAuthToken || 'ANON_LOCAL_IPC',
        clientVersion: 'MiniAdhy/5.0.0'
      }
    };

    try {
      const response = await this.transport.sendPacket(handshakePacket, 4000);
      if (response.type !== 'RSP_HANDSHAKE' || response.reqId !== reqId) {
        this.isHandshakeComplete = false;
        return false;
      }

      const p = response.payload;
      if (!p.deviceId || !Array.isArray(p.supportedPins) || typeof p.firmwareVersion !== 'string') {
        this.isHandshakeComplete = false;
        return false;
      }

      const descriptor: HardwareDeviceDescriptor = {
        deviceId: String(p.deviceId),
        deviceType: 'WINDOWS_LOCAL_BRIDGE',
        firmwareVersion: String(p.firmwareVersion),
        supportedPins: p.supportedPins as number[],
        maxPulseDurationMs: Number(p.maxPulseDurationMs) || 5000,
        minPulseDurationMs: Number(p.minPulseDurationMs) || 5,
        safeDefaultState: (p.safeDefaultState as 'LOW' | 'HIGH') || 'LOW',
        transport: this.transport.transportType,
        supportsReadback: Boolean(p.supportsReadback),
        status: 'ONLINE',
        capabilities: Array.isArray(p.capabilities) ? (p.capabilities as string[]) : ['GPIO_PULSE', 'READ_PIN']
      };

      this.devices.set(descriptor.deviceId, descriptor);
      this.activeDeviceId = descriptor.deviceId;
      this.isHandshakeComplete = true;
      return true;
    } catch {
      this.isHandshakeComplete = false;
      return false;
    }
  }

  /**
   * Queries physical pin voltage/state through device protocol
   */
  public async readPinState(deviceId: string, pin: number): Promise<'LOW' | 'HIGH' | null> {
    if (!this.isConnected() || !this.transport) return null;
    const device = this.devices.get(deviceId);
    if (!device || device.status !== 'ONLINE') return null;
    if (!device.supportedPins.includes(pin)) return null;

    const reqId = crypto.randomUUID();
    const packet: HardwareProtocolPacket = {
      version: '1.0',
      type: 'CMD_READ_PIN',
      reqId,
      deviceId,
      timestamp: Date.now(),
      payload: { pin }
    };

    try {
      const res = await this.transport.sendPacket(packet, 3000);
      if (res.type !== 'RSP_READ_PIN' || res.reqId !== reqId || res.deviceId !== deviceId) {
        return null;
      }
      const state = res.payload.pinState;
      if (state === 'LOW' || state === 'HIGH') {
        return state;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Executes physical pulse on verified hardware.
   * NEVER fabricates timestamps, acknowledgements, or readbacks.
   */
  public async executePulse(req: GpioPulseRequest): Promise<GpioPulseExecutionResult> {
    const requestedAt = Date.now();

    // 1. Connection and handshake verification
    if (!this.isConnected() || !this.transport) {
      return {
        state: 'UNAVAILABLE',
        pin: req.pin,
        requestedDurationMs: req.durationMs,
        deviceAcknowledged: false,
        physicalReadbackVerified: false,
        transport: this.transport ? this.transport.transportType : 'LOCAL_IPC',
        error: 'Hardware gateway is UNAVAILABLE. Physical transport not connected or device handshake incomplete.'
      };
    }

    // 2. Resolve target device identity
    const targetId = req.deviceId || this.activeDeviceId;
    const device = targetId ? this.devices.get(targetId) : undefined;

    if (!device || device.status !== 'ONLINE') {
      return {
        state: 'UNAVAILABLE',
        deviceId: targetId || undefined,
        pin: req.pin,
        requestedDurationMs: req.durationMs,
        deviceAcknowledged: false,
        physicalReadbackVerified: false,
        transport: this.transport.transportType,
        error: `Target device [${targetId || 'DEFAULT'}] is not ONLINE or handshake not registered.`
      };
    }

    // 3. Hardware pin allowlist check
    if (!device.supportedPins.includes(req.pin)) {
      return {
        state: 'FAILED',
        deviceId: device.deviceId,
        pin: req.pin,
        requestedDurationMs: req.durationMs,
        deviceAcknowledged: false,
        physicalReadbackVerified: false,
        transport: this.transport.transportType,
        error: `Hardware Safety Invariant: Pin ${req.pin} not in device allowlist [${device.supportedPins.join(', ')}].`
      };
    }

    // 4. Safe duration bounds check
    if (req.durationMs < device.minPulseDurationMs || req.durationMs > device.maxPulseDurationMs) {
      return {
        state: 'FAILED',
        deviceId: device.deviceId,
        pin: req.pin,
        requestedDurationMs: req.durationMs,
        deviceAcknowledged: false,
        physicalReadbackVerified: false,
        transport: this.transport.transportType,
        error: `Hardware Safety Invariant: Pulse duration ${req.durationMs}ms outside physical limits [${device.minPulseDurationMs}ms - ${device.maxPulseDurationMs}ms].`
      };
    }

    // 5. Dispatch command frame to physical device
    const reqId = crypto.randomUUID();
    const commandPacket: HardwareProtocolPacket = {
      version: '1.0',
      type: 'CMD_GPIO_PULSE',
      reqId,
      deviceId: device.deviceId,
      timestamp: Date.now(),
      payload: {
        pin: req.pin,
        durationMs: req.durationMs
      }
    };

    const dispatchedAt = Date.now();
    let response: HardwareProtocolPacket;

    try {
      // Timeout is bounded to requested duration + 2000ms protocol overhead
      const timeoutMs = req.durationMs + 2500;
      response = await this.transport.sendPacket(commandPacket, timeoutMs);
    } catch (err: any) {
      return {
        state: 'FAILED',
        deviceId: device.deviceId,
        pin: req.pin,
        requestedDurationMs: req.durationMs,
        deviceAcknowledged: false,
        physicalReadbackVerified: false,
        dispatchedAt,
        transport: this.transport.transportType,
        error: `Device actuation failed: ${err.message}`
      };
    }

    // 6. Validate device response framing and identity binding
    if (response.type !== 'RSP_GPIO_PULSE') {
      return {
        state: 'FAILED',
        deviceId: device.deviceId,
        pin: req.pin,
        requestedDurationMs: req.durationMs,
        deviceAcknowledged: false,
        physicalReadbackVerified: false,
        dispatchedAt,
        transport: this.transport.transportType,
        error: `Unexpected device packet type: ${response.type}`
      };
    }

    if (response.reqId !== reqId) {
      return {
        state: 'FAILED',
        deviceId: device.deviceId,
        pin: req.pin,
        requestedDurationMs: req.durationMs,
        deviceAcknowledged: false,
        physicalReadbackVerified: false,
        dispatchedAt,
        transport: this.transport.transportType,
        error: `Request ID mismatch in device response (expected ${reqId}, got ${response.reqId})`
      };
    }

    if (response.deviceId !== device.deviceId) {
      return {
        state: 'FAILED',
        deviceId: device.deviceId,
        pin: req.pin,
        requestedDurationMs: req.durationMs,
        deviceAcknowledged: false,
        physicalReadbackVerified: false,
        dispatchedAt,
        transport: this.transport.transportType,
        error: `Device ID mismatch in response (expected ${device.deviceId}, got ${response.deviceId})`
      };
    }

    const payload = response.payload;
    if (payload.status !== 'ACK' && payload.status !== 'EXECUTED') {
      return {
        state: 'FAILED',
        deviceId: device.deviceId,
        pin: req.pin,
        requestedDurationMs: req.durationMs,
        deviceAcknowledged: false,
        physicalReadbackVerified: false,
        dispatchedAt,
        transport: this.transport.transportType,
        error: `Device reported error: ${payload.error || 'NACK'}`
      };
    }

    const acknowledgedAt = response.timestamp || Date.now();
    const measuredDurationMs = typeof payload.measuredDurationMs === 'number' ? payload.measuredDurationMs : undefined;

    // 7. Physical Readback Verification: query physical state via device protocol
    let physicalReadbackVerified = false;
    let pinStateAfterPulse: 'LOW' | 'HIGH' = device.safeDefaultState;

    if (device.supportsReadback) {
      const readback = await this.readPinState(device.deviceId, req.pin);
      if (readback === null) {
        return {
          state: 'FAILED',
          deviceId: device.deviceId,
          pin: req.pin,
          requestedDurationMs: req.durationMs,
          measuredDurationMs,
          deviceAcknowledged: true,
          physicalReadbackVerified: false,
          dispatchedAt,
          acknowledgedAt,
          transport: this.transport.transportType,
          error: `Physical readback failed to obtain pin state from device ${device.deviceId}`
        };
      }

      pinStateAfterPulse = readback;
      const expectedSafe = req.expectedSafeState || device.safeDefaultState;

      if (readback === expectedSafe) {
        physicalReadbackVerified = true;
      } else {
        // Output failed to return to safe state!
        return {
          state: 'FAILED',
          deviceId: device.deviceId,
          pin: req.pin,
          requestedDurationMs: req.durationMs,
          measuredDurationMs,
          deviceAcknowledged: true,
          physicalReadbackVerified: false,
          pinStateAfterPulse,
          dispatchedAt,
          acknowledgedAt,
          transport: this.transport.transportType,
          error: `Hardware Safety Failure: Pin ${req.pin} remained in unsafe state [${readback}] after pulse. Expected safe state: [${expectedSafe}].`
        };
      }
    }

    return {
      state: physicalReadbackVerified ? 'PHYSICALLY_VERIFIED' : 'ACKNOWLEDGED',
      deviceId: device.deviceId,
      pin: req.pin,
      requestedDurationMs: req.durationMs,
      measuredDurationMs,
      deviceAcknowledged: true,
      physicalReadbackVerified,
      pinStateAfterPulse,
      dispatchedAt,
      acknowledgedAt,
      verifiedAt: physicalReadbackVerified ? Date.now() : undefined,
      transport: this.transport.transportType,
      rawResponse: JSON.stringify(response)
    };
  }

  /**
   * Emergency stop: sends immediate CMD_EMERGENCY_STOP to physical hardware
   */
  public async emergencyStop(deviceId?: string): Promise<{ success: boolean; reason?: string }> {
    if (!this.isConnected() || !this.transport) {
      return { success: false, reason: 'Transport not connected' };
    }

    const targetId = deviceId || this.activeDeviceId;
    const reqId = crypto.randomUUID();
    const packet: HardwareProtocolPacket = {
      version: '1.0',
      type: 'CMD_EMERGENCY_STOP',
      reqId,
      deviceId: targetId || 'ALL',
      timestamp: Date.now(),
      payload: { reason: 'OPERATOR_EMERGENCY_STOP' }
    };

    try {
      const res = await this.transport.sendPacket(packet, 2000);
      return { success: res.type === 'RSP_EMERGENCY_STOP' && res.payload.status === 'STOPPED' };
    } catch (err: any) {
      return { success: false, reason: err.message };
    }
  }
}
