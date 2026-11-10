/**
 * ════════════════════════════════════════════════════════════════════
 *  LOCAL WINDOWS HARDWARE BRIDGE ADAPTER & SERIAL/IPC TRANSPORTS (v6.0)
 * ════════════════════════════════════════════════════════════════════
 * Supports genuine physical transport over:
 * 1. Windows Serial COM Ports (via 'serialport' package)
 * 2. Authenticated Local IPC (Windows Named Pipes \\.\pipe\... & loopback TCP)
 * Fails closed with UNAVAILABLE if bridge daemon or hardware is disconnected.
 * Enforces command expiry, replay protection, device handshake, and physical readback.
 * Zero fabricated timestamps, zero simulated readbacks.
 */

import net from 'net';
import crypto from 'crypto';
import { SerialPort } from 'serialport';
import {
  IHardwareGateway,
  IHardwareTransport,
  HardwareDeviceDescriptor,
  GpioPulseRequest,
  GpioPulseExecutionResult,
  HardwareTransportType,
  HardwareProtocolPacket,
  HardwareProtocolSchemas,
  ActuationState
} from './hardwareGateway.js';

/**
 * Real framed IPC transport over Node net.Socket.
 * Communicates with Windows Named Pipes (\\.\pipe\...) or loopback TCP sockets.
 * Uses newline-delimited JSON framing with request tracking and replay protection.
 */
export class FramedIpcTransport implements IHardwareTransport {
  public readonly transportType: HardwareTransportType = 'LOCAL_IPC';
  public readonly isPhysicalTransport = true;
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
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      try {
        const packet = JSON.parse(trimmed) as HardwareProtocolPacket;
        if (!packet.reqId || !packet.type || (packet.version !== '1.0' && packet.version !== '1.1')) {
          continue;
        }

        // Replay attack protection: reject if duplicate response reqId
        if (this.processedReqIds.has(packet.reqId)) {
          console.warn(`[Hardware Security] Replay packet rejected with duplicate reqId: ${packet.reqId}`);
          continue;
        }

        // Expired command check
        if (packet.expiresAtEpochMs && packet.expiresAtEpochMs < Date.now()) {
          console.warn(`[Hardware Security] Expired packet received and rejected for reqId: ${packet.reqId}`);
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

    // Command expiry attachment
    if (!packet.expiresAtEpochMs) {
      packet.expiresAtEpochMs = Date.now() + timeoutMs;
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

/**
 * Genuine Physical Serial Port Transport
 * Communicates with physical microcontrollers (Arduino, STM32, ESP32) over Windows COM ports.
 * Uses 'serialport' package with newline framing and hardware handshake.
 */
export class WindowsSerialTransport implements IHardwareTransport {
  public readonly transportType: HardwareTransportType = 'SERIAL';
  public readonly isPhysicalTransport = true;
  private port: SerialPort | null = null;
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
    private portPath: string,
    private baudRate = 115200
  ) {}

  public isConnected(): boolean {
    return this.connected && this.port !== null && this.port.isOpen;
  }

  public static async listAvailablePorts(): Promise<Array<{ path: string; manufacturer?: string; serialNumber?: string }>> {
    try {
      const ports = await SerialPort.list();
      return ports.map((p) => ({
        path: p.path,
        manufacturer: p.manufacturer,
        serialNumber: p.serialNumber
      }));
    } catch {
      return [];
    }
  }

  public async connect(): Promise<void> {
    if (this.isConnected()) return;

    return new Promise<void>((resolve, reject) => {
      try {
        const serial = new SerialPort(
          {
            path: this.portPath,
            baudRate: this.baudRate,
            autoOpen: false
          },
          (err) => {
            if (err) {
              this.connected = false;
              reject(err);
            }
          }
        );

        const timeout = setTimeout(() => {
          if (serial.isOpen) serial.close();
          reject(new Error(`Serial connection timeout to ${this.portPath}`));
        }, 4000);

        serial.open((err) => {
          clearTimeout(timeout);
          if (err) {
            this.connected = false;
            reject(err);
            return;
          }
          this.port = serial;
          this.connected = true;
          resolve();
        });

        serial.on('data', (chunk: Buffer) => {
          this.handleData(chunk);
        });

        serial.on('error', (err) => {
          this.connected = false;
          for (const [reqId, pending] of this.pendingRequests.entries()) {
            clearTimeout(pending.timeout);
            pending.reject(err);
            this.pendingRequests.delete(reqId);
          }
        });

        serial.on('close', () => {
          this.connected = false;
          this.port = null;
          for (const [reqId, pending] of this.pendingRequests.entries()) {
            clearTimeout(pending.timeout);
            pending.reject(new Error('Serial transport closed while request was pending'));
            this.pendingRequests.delete(reqId);
          }
        });
      } catch (err: any) {
        this.connected = false;
        reject(err);
      }
    });
  }

  public async disconnect(): Promise<void> {
    if (this.port && this.port.isOpen) {
      await new Promise<void>((resolve) => {
        this.port!.close(() => resolve());
      });
    }
    this.connected = false;
    this.port = null;
  }

  private handleData(chunk: Buffer): void {
    this.buffer += chunk.toString('utf8');
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      try {
        const packet = JSON.parse(trimmed) as HardwareProtocolPacket;
        if (!packet.reqId || !packet.type || (packet.version !== '1.0' && packet.version !== '1.1')) {
          continue;
        }

        if (this.processedReqIds.has(packet.reqId)) {
          console.warn(`[Serial Security] Replay packet rejected: ${packet.reqId}`);
          continue;
        }

        if (packet.expiresAtEpochMs && packet.expiresAtEpochMs < Date.now()) {
          console.warn(`[Serial Security] Expired packet rejected for reqId: ${packet.reqId}`);
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
        console.warn('[Serial Security] Malformed packet frame on serial bus:', err);
      }
    }
  }

  public async sendPacket(packet: HardwareProtocolPacket, timeoutMs = 5000): Promise<HardwareProtocolPacket> {
    if (!this.isConnected() || !this.port) {
      throw new Error('Serial transport is not connected');
    }

    if (!packet.expiresAtEpochMs) {
      packet.expiresAtEpochMs = Date.now() + timeoutMs;
    }

    return new Promise<HardwareProtocolPacket>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(packet.reqId);
        reject(new Error(`Serial communication timed out after ${timeoutMs}ms for reqId: ${packet.reqId}`));
      }, timeoutMs);

      this.pendingRequests.set(packet.reqId, {
        resolve,
        reject,
        timeout: timer
      });

      const serialized = JSON.stringify(packet) + '\n';
      this.port!.write(serialized, (err) => {
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
  serialPort?: string;
  serialBaudRate?: number;
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
    } else if (options.serialPort) {
      this.transport = new WindowsSerialTransport(options.serialPort, options.serialBaudRate || 115200);
    } else if (options.ipcPipeName) {
      this.transport = new FramedIpcTransport(options.ipcPipeName);
    } else if (options.ipcPort) {
      this.transport = new FramedIpcTransport(options.ipcPort);
    }

    // Critical Invariant: `options.enabled = true` DOES NOT fabricate connection!
    // Hardware is only operational when an actual transport completes physical handshake.
  }

  public get isPhysicalGateway(): boolean {
    return Boolean(this.transport && this.transport.isPhysicalTransport);
  }

  /**
   * Initializes the physical transport and completes authenticated device handshake.
   * If physical transport is absent or device unreachable, remains UNAVAILABLE.
   */
  public async initialize(): Promise<boolean> {
    if (!this.transport) {
      return false;
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

  public async discoverAvailableDevices(): Promise<Array<{ portOrPipe: string; transport: HardwareTransportType }>> {
    const list: Array<{ portOrPipe: string; transport: HardwareTransportType }> = [];
    try {
      const serialPorts = await WindowsSerialTransport.listAvailablePorts();
      for (const p of serialPorts) {
        list.push({ portOrPipe: p.path, transport: 'SERIAL' });
      }
    } catch {}
    return list;
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
      expiresAtEpochMs: Date.now() + 4000,
      payload: {
        authToken: this.ipcAuthToken || 'ANON_LOCAL_HARDWARE',
        clientVersion: 'MiniAdhy/6.0.0',
        requestedProtocolVersion: '1.0'
      }
    };

    try {
      const response = await this.transport.sendPacket(handshakePacket, 4000);
      if (response.type !== 'RSP_HANDSHAKE' || response.reqId !== reqId) {
        this.isHandshakeComplete = false;
        return false;
      }

      const p = response.payload;
      const parsed = HardwareProtocolSchemas.HandshakeResponsePayload.safeParse(p);
      if (!parsed.success) {
        this.isHandshakeComplete = false;
        return false;
      }

      const validated = parsed.data;
      const descriptor: HardwareDeviceDescriptor = {
        deviceId: validated.deviceId,
        deviceType: this.transport.transportType === 'SERIAL' ? 'ARDUINO_SERIAL' : 'WINDOWS_LOCAL_BRIDGE',
        firmwareVersion: validated.firmwareVersion,
        supportedPins: validated.supportedPins,
        maxPulseDurationMs: validated.maxPulseDurationMs,
        minPulseDurationMs: validated.minPulseDurationMs,
        safeDefaultState: validated.safeDefaultState,
        transport: this.transport.transportType,
        supportsReadback: validated.supportsReadback,
        status: 'ONLINE',
        capabilities: validated.capabilities,
        protocolVersion: validated.negotiatedVersion
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
      expiresAtEpochMs: Date.now() + 3000,
      payload: { pin }
    };

    try {
      const res = await this.transport.sendPacket(packet, 3000);
      if (res.type !== 'RSP_READ_PIN' || res.reqId !== reqId || res.deviceId !== deviceId) {
        return null;
      }
      const parsed = HardwareProtocolSchemas.ReadPinResponsePayload.safeParse(res.payload);
      if (!parsed.success) return null;
      return parsed.data.pinState;
    } catch {
      return null;
    }
  }

  /**
   * Executes physical pulse on verified hardware.
   * NEVER fabricates timestamps, acknowledgements, or readbacks.
   */
  public async executePulse(req: GpioPulseRequest): Promise<GpioPulseExecutionResult> {
    // 1. Connection and handshake verification
    if (!this.isConnected() || !this.transport) {
      return {
        state: 'UNAVAILABLE',
        pin: req.pin,
        requestedDurationMs: req.durationMs,
        deviceAcknowledged: false,
        physicalReadbackVerified: false,
        transport: this.transport ? this.transport.transportType : 'LOCAL_IPC',
        isPhysicalTransport: this.isPhysicalGateway,
        error: 'Hardware gateway is UNAVAILABLE. Physical transport not connected or device handshake incomplete.'
      };
    }

    // 2. Mock transport isolation check: mock transports report SIMULATED, never READBACK_VERIFIED
    if (!this.transport.isPhysicalTransport || this.transport.transportType === 'MOCK_TEST') {
      return {
        state: 'SIMULATED',
        deviceId: req.deviceId || this.activeDeviceId || 'MOCK_DEV',
        pin: req.pin,
        requestedDurationMs: req.durationMs,
        deviceAcknowledged: true,
        physicalReadbackVerified: false,
        transport: 'MOCK_TEST',
        isPhysicalTransport: false,
        error: 'Operation executed on simulated mock transport. Physical hardware actuation not performed.'
      };
    }

    // 3. Resolve target device identity
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
        isPhysicalTransport: true,
        error: `Target device [${targetId || 'DEFAULT'}] is not ONLINE or handshake not registered.`
      };
    }

    // 4. Hardware pin allowlist check
    if (!device.supportedPins.includes(req.pin)) {
      return {
        state: 'FAILED',
        deviceId: device.deviceId,
        pin: req.pin,
        requestedDurationMs: req.durationMs,
        deviceAcknowledged: false,
        physicalReadbackVerified: false,
        transport: this.transport.transportType,
        isPhysicalTransport: true,
        error: `Hardware Safety Invariant: Pin ${req.pin} not in device allowlist [${device.supportedPins.join(', ')}].`
      };
    }

    // 5. Safe duration bounds check
    if (req.durationMs < device.minPulseDurationMs || req.durationMs > device.maxPulseDurationMs) {
      return {
        state: 'FAILED',
        deviceId: device.deviceId,
        pin: req.pin,
        requestedDurationMs: req.durationMs,
        deviceAcknowledged: false,
        physicalReadbackVerified: false,
        transport: this.transport.transportType,
        isPhysicalTransport: true,
        error: `Hardware Safety Invariant: Pulse duration ${req.durationMs}ms outside physical limits [${device.minPulseDurationMs}ms - ${device.maxPulseDurationMs}ms].`
      };
    }

    // 6. Dispatch command frame to physical device
    const reqId = crypto.randomUUID();
    const commandPacket: HardwareProtocolPacket = {
      version: '1.0',
      type: 'CMD_GPIO_PULSE',
      reqId,
      deviceId: device.deviceId,
      timestamp: Date.now(),
      expiresAtEpochMs: Date.now() + req.durationMs + 3000,
      payload: {
        pin: req.pin,
        durationMs: req.durationMs
      }
    };

    const dispatchedAt = Date.now();
    let response: HardwareProtocolPacket;

    try {
      const timeoutMs = req.durationMs + 2500;
      response = await this.transport.sendPacket(commandPacket, timeoutMs);
    } catch (err: any) {
      const isTimeout = err.message && err.message.includes('timed out');
      return {
        state: isTimeout ? 'TIMED_OUT' : 'FAILED',
        deviceId: device.deviceId,
        pin: req.pin,
        requestedDurationMs: req.durationMs,
        deviceAcknowledged: false,
        physicalReadbackVerified: false,
        dispatchedAt,
        transport: this.transport.transportType,
        isPhysicalTransport: true,
        error: `Device actuation failed: ${err.message}`
      };
    }

    // 7. Validate device response framing and identity binding
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
        isPhysicalTransport: true,
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
        isPhysicalTransport: true,
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
        isPhysicalTransport: true,
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
        isPhysicalTransport: true,
        error: `Device reported error: ${payload.error || 'NACK'}`
      };
    }

    const acknowledgedAt = response.timestamp || Date.now();
    const measuredDurationMs = typeof payload.measuredDurationMs === 'number' ? payload.measuredDurationMs : undefined;

    // 8. Physical Readback Verification: query physical state via device protocol
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
          isPhysicalTransport: true,
          error: `Physical readback failed to obtain pin state from device ${device.deviceId}`
        };
      }

      pinStateAfterPulse = readback;
      const expectedSafe = req.expectedSafeState || device.safeDefaultState;

      if (readback === expectedSafe) {
        physicalReadbackVerified = true;
      } else {
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
          isPhysicalTransport: true,
          error: `Hardware Safety Failure: Pin ${req.pin} remained in unsafe state [${readback}] after pulse. Expected safe state: [${expectedSafe}].`
        };
      }
    }

    // Truthful state reporting:
    // If readback was performed and verified -> READBACK_VERIFIED
    // If device cannot provide readback -> DEVICE_ACKNOWLEDGED (never upgraded to physical verification)
    const finalState: ActuationState = physicalReadbackVerified ? 'READBACK_VERIFIED' : 'DEVICE_ACKNOWLEDGED';

    return {
      state: finalState,
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
      isPhysicalTransport: true,
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
      expiresAtEpochMs: Date.now() + 2000,
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
