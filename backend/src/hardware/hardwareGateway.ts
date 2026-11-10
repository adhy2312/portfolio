/**
 * ════════════════════════════════════════════════════════════════════
 *  HARDWARE GATEWAY INTERFACE & TYPED ACTUATION ARCHITECTURE
 * ════════════════════════════════════════════════════════════════════
 * Enforces hardware truth, device identity binding, allowlisted pinouts,
 * safe default states, and independent physical readback verification.
 */

export type HardwareTransportType = 'SERIAL' | 'USB' | 'LOCAL_IPC' | 'MOCK_TEST';

export type ActuationState =
  | 'REQUESTED'
  | 'DISPATCHED'
  | 'ACKNOWLEDGED'
  | 'PHYSICALLY_VERIFIED'
  | 'FAILED'
  | 'UNAVAILABLE';

export interface HardwareDeviceDescriptor {
  deviceId: string;
  deviceType: 'WINDOWS_LOCAL_BRIDGE' | 'ARDUINO_SERIAL' | 'RP2040_USB' | 'MOCK_SIMULATOR';
  firmwareVersion: string;
  supportedPins: number[];
  maxPulseDurationMs: number;
  minPulseDurationMs: number;
  safeDefaultState: 'LOW' | 'HIGH';
  transport: HardwareTransportType;
  supportsReadback: boolean;
  status: 'ONLINE' | 'OFFLINE' | 'BUSY';
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

export interface IHardwareGateway {
  readonly gatewayName: string;
  isConnected(): boolean;
  getConnectedDevices(): HardwareDeviceDescriptor[];
  executePulse(req: GpioPulseRequest): Promise<GpioPulseExecutionResult>;
  readPinState?(deviceId: string, pin: number): Promise<'LOW' | 'HIGH' | null>;
}

