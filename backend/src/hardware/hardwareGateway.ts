/**
 * ════════════════════════════════════════════════════════════════════
 *  HARDWARE GATEWAY INTERFACE & TYPED ACTUATION ARCHITECTURE (v6.0)
 * ════════════════════════════════════════════════════════════════════
 * Enforces hardware truth, device identity binding, allowlisted pinouts,
 * safe default states, and independent physical readback verification.
 * Zero fabricated timestamps, zero simulated readbacks.
 */

import { z } from 'zod';

export type HardwareTransportType = 'SERIAL' | 'LOCAL_IPC' | 'MOCK_TEST';

/**
 * Sixth-Pass Strict Execution States:
 * - UNAVAILABLE: Hardware gateway or device not connected or uninitialized.
 * - SIMULATED: Operation executed strictly on mock/simulator transport.
 * - CONNECTED: Transport and device handshake verified.
 * - COMMAND_SENT: Frame dispatched over wire to microcontroller.
 * - DEVICE_ACKNOWLEDGED: Microcontroller acknowledged command over wire (no readback).
 * - READBACK_VERIFIED: Independent physical voltage readback confirmed output in safe state.
 * - FAILED: Actuation failed, safety invariant violated, or readback returned unsafe voltage.
 * - TIMED_OUT: Transport or device failed to respond within bounded timeout.
 */
export type ActuationState =
  | 'UNAVAILABLE'
  | 'SIMULATED'
  | 'CONNECTED'
  | 'COMMAND_SENT'
  | 'DEVICE_ACKNOWLEDGED'
  | 'READBACK_VERIFIED'
  | 'FAILED'
  | 'TIMED_OUT'
  // Backward compatibility aliases
  | 'REQUESTED'
  | 'DISPATCHED'
  | 'ACKNOWLEDGED'
  | 'PHYSICALLY_VERIFIED';

export interface HardwareDeviceDescriptor {
  deviceId: string;
  deviceType: 'WINDOWS_LOCAL_BRIDGE' | 'ARDUINO_SERIAL' | 'MOCK_SIMULATOR' | 'STM32_SERIAL' | 'GENERIC_SERIAL';
  firmwareVersion: string;
  supportedPins: number[];
  maxPulseDurationMs: number;
  minPulseDurationMs: number;
  safeDefaultState: 'LOW' | 'HIGH';
  transport: HardwareTransportType;
  supportsReadback: boolean;
  status: 'ONLINE' | 'OFFLINE' | 'BUSY';
  capabilities?: string[];
  protocolVersion?: string;
  baudRate?: number;
  portPath?: string;
}

export interface GpioPulseRequest {
  deviceId?: string;
  pin: number;
  durationMs: number;
  expectedSafeState?: 'LOW' | 'HIGH';
}

export interface GpioPulseExecutionResult {
  state: ActuationState;
  deviceId?: string;
  pin: number;
  requestedDurationMs: number;
  measuredDurationMs?: number;
  deviceAcknowledged: boolean;
  physicalReadbackVerified: boolean;
  pinStateAfterPulse?: 'LOW' | 'HIGH';
  dispatchedAt?: number;
  acknowledgedAt?: number;
  verifiedAt?: number;
  rawResponse?: string;
  error?: string;
  transport?: HardwareTransportType;
  isPhysicalTransport?: boolean;
}

/**
 * Versioned wire protocol packet definition (v1.0 & v1.1)
 */
export interface HardwareProtocolPacket {
  version: '1.0' | '1.1';
  type:
    | 'CMD_HANDSHAKE'
    | 'RSP_HANDSHAKE'
    | 'CMD_GPIO_PULSE'
    | 'RSP_GPIO_PULSE'
    | 'CMD_READ_PIN'
    | 'RSP_READ_PIN'
    | 'CMD_EMERGENCY_STOP'
    | 'RSP_EMERGENCY_STOP'
    | 'RSP_ERROR';
  reqId: string;
  deviceId: string;
  timestamp: number;
  expiresAtEpochMs?: number;
  correlationId?: string;
  payload: Record<string, unknown>;
  signature?: string;
}

/**
 * Structured Schemas for Hardware Protocol Frames
 */
export const HardwareProtocolSchemas = {
  HandshakePayload: z.object({
    authToken: z.string().optional(),
    clientVersion: z.string(),
    requestedProtocolVersion: z.enum(['1.0', '1.1']).default('1.0')
  }),

  HandshakeResponsePayload: z.object({
    deviceId: z.string().min(1),
    firmwareVersion: z.string().min(1),
    supportedPins: z.array(z.number().int().min(0).max(128)),
    maxPulseDurationMs: z.number().int().positive().default(5000),
    minPulseDurationMs: z.number().int().positive().default(5),
    safeDefaultState: z.enum(['LOW', 'HIGH']).default('LOW'),
    supportsReadback: z.boolean().default(false),
    capabilities: z.array(z.string()).default(['GPIO_PULSE']),
    negotiatedVersion: z.enum(['1.0', '1.1']).default('1.0')
  }),

  PulsePayload: z.object({
    pin: z.number().int().min(0),
    durationMs: z.number().int().positive()
  }),

  PulseResponsePayload: z.object({
    status: z.enum(['ACK', 'EXECUTED', 'NACK', 'ERROR']),
    measuredDurationMs: z.number().optional(),
    error: z.string().optional()
  }),

  ReadPinPayload: z.object({
    pin: z.number().int().min(0)
  }),

  ReadPinResponsePayload: z.object({
    pin: z.number().int().min(0),
    pinState: z.enum(['LOW', 'HIGH']),
    measuredVoltageMv: z.number().optional()
  })
};

export interface IHardwareTransport {
  readonly transportType: HardwareTransportType;
  readonly isPhysicalTransport: boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  sendPacket(packet: HardwareProtocolPacket, timeoutMs?: number): Promise<HardwareProtocolPacket>;
}

export interface IHardwareGateway {
  readonly gatewayName: string;
  readonly isPhysicalGateway: boolean;
  isConnected(): boolean;
  getConnectedDevices(): HardwareDeviceDescriptor[];
  executePulse(req: GpioPulseRequest): Promise<GpioPulseExecutionResult>;
  readPinState?(deviceId: string, pin: number): Promise<'LOW' | 'HIGH' | null>;
  emergencyStop?(deviceId?: string): Promise<{ success: boolean; reason?: string }>;
  discoverAvailableDevices?(): Promise<Array<{ portOrPipe: string; transport: HardwareTransportType }>>;
}
