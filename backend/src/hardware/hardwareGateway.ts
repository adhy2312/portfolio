/**
 * ════════════════════════════════════════════════════════════════════
 *  HARDWARE GATEWAY INTERFACE & TYPED ACTUATION ARCHITECTURE
 * ════════════════════════════════════════════════════════════════════
 * Enforces hardware truth, device identity binding, allowlisted pinouts,
 * safe default states, and independent physical readback verification.
 */

export type HardwareTransportType = 'SERIAL' | 'LOCAL_IPC' | 'MOCK_TEST';

export type ActuationState =
  | 'REQUESTED'
  | 'DISPATCHED'
  | 'ACKNOWLEDGED'
  | 'PHYSICALLY_VERIFIED'
  | 'FAILED'
  | 'UNAVAILABLE';

export interface HardwareDeviceDescriptor {
  deviceId: string;
  deviceType: 'WINDOWS_LOCAL_BRIDGE' | 'ARDUINO_SERIAL' | 'MOCK_SIMULATOR';
  firmwareVersion: string;
  supportedPins: number[];
  maxPulseDurationMs: number;
  minPulseDurationMs: number;
  safeDefaultState: 'LOW' | 'HIGH';
  transport: HardwareTransportType;
  supportsReadback: boolean;
  status: 'ONLINE' | 'OFFLINE' | 'BUSY';
  capabilities?: string[];
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
}

/**
 * Versioned wire protocol packet definition
 */
export interface HardwareProtocolPacket {
  version: '1.0';
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
  payload: Record<string, unknown>;
  signature?: string;
}

export interface IHardwareTransport {
  readonly transportType: HardwareTransportType;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  sendPacket(packet: HardwareProtocolPacket, timeoutMs?: number): Promise<HardwareProtocolPacket>;
}

export interface IHardwareGateway {
  readonly gatewayName: string;
  isConnected(): boolean;
  getConnectedDevices(): HardwareDeviceDescriptor[];
  executePulse(req: GpioPulseRequest): Promise<GpioPulseExecutionResult>;
  readPinState?(deviceId: string, pin: number): Promise<'LOW' | 'HIGH' | null>;
  emergencyStop?(deviceId?: string): Promise<{ success: boolean; reason?: string }>;
}
