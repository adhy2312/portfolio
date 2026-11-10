/**
 * ════════════════════════════════════════════════════════════════════
 *  MOCK HARDWARE SIMULATOR (FOR ISOLATED UNIT TESTING)
 * ════════════════════════════════════════════════════════════════════
 * Used strictly for unit and regression testing.
 * Mock responses are explicitly tagged with transport = 'MOCK_TEST'
 * and NEVER claim physical verification (PHYSICALLY_VERIFIED) on real hardware.
 */

import {
  IHardwareGateway,
  HardwareDeviceDescriptor,
  GpioPulseRequest,
  GpioPulseExecutionResult
} from './hardwareGateway.js';

export interface MockHardwareConfig {
  connected?: boolean;
  devices?: HardwareDeviceDescriptor[];
  simulateAcknowledge?: boolean;
  simulateReadbackMismatch?: boolean;
  simulateError?: string;
}

export class MockHardwareGateway implements IHardwareGateway {
  public readonly gatewayName = 'MOCK_HARDWARE_SIMULATOR';
  private connected: boolean;
  private devices: Map<string, HardwareDeviceDescriptor> = new Map();
  private simulateAcknowledge: boolean;
  private simulateReadbackMismatch: boolean;
  private simulateError?: string;

  constructor(config: MockHardwareConfig = {}) {
    this.connected = config.connected ?? true;
    this.simulateAcknowledge = config.simulateAcknowledge ?? true;
    this.simulateReadbackMismatch = config.simulateReadbackMismatch ?? false;
    this.simulateError = config.simulateError;

    const defaultDevice: HardwareDeviceDescriptor = {
      deviceId: 'MOCK_SIMULATOR_01',
      deviceType: 'MOCK_SIMULATOR',
      firmwareVersion: 'MOCK_v1.0.0',
      supportedPins: [4, 7, 17, 22, 27],
      maxPulseDurationMs: 5000,
      minPulseDurationMs: 10,
      safeDefaultState: 'LOW',
      transport: 'MOCK_TEST',
      supportsReadback: true,
      status: 'ONLINE'
    };

    if (config.devices && config.devices.length > 0) {
      for (const d of config.devices) {
        this.devices.set(d.deviceId, d);
      }
    } else {
      this.devices.set(defaultDevice.deviceId, defaultDevice);
    }
  }

  public setConnected(connected: boolean): void {
    this.connected = connected;
  }

  public isConnected(): boolean {
    return this.connected;
  }

  public getConnectedDevices(): HardwareDeviceDescriptor[] {
    if (!this.connected) return [];
    return Array.from(this.devices.values());
  }

  public async readPinState(deviceId: string, pin: number): Promise<'LOW' | 'HIGH' | null> {
    if (!this.connected) return null;
    return this.simulateReadbackMismatch ? 'HIGH' : 'LOW';
  }

  public async emergencyStop(deviceId?: string): Promise<{ success: boolean; reason?: string }> {
    return { success: true };
  }

  public async executePulse(req: GpioPulseRequest): Promise<GpioPulseExecutionResult> {
    if (!this.connected) {
      return {
        state: 'UNAVAILABLE',
        pin: req.pin,
        requestedDurationMs: req.durationMs,
        deviceAcknowledged: false,
        physicalReadbackVerified: false,
        transport: 'MOCK_TEST',
        error: 'Mock hardware gateway is disconnected'
      };
    }

    if (this.simulateError) {
      return {
        state: 'FAILED',
        pin: req.pin,
        requestedDurationMs: req.durationMs,
        deviceAcknowledged: false,
        physicalReadbackVerified: false,
        transport: 'MOCK_TEST',
        error: this.simulateError
      };
    }

    const device = req.deviceId ? this.devices.get(req.deviceId) : Array.from(this.devices.values())[0];
    if (!device) {
      return {
        state: 'UNAVAILABLE',
        pin: req.pin,
        requestedDurationMs: req.durationMs,
        deviceAcknowledged: false,
        physicalReadbackVerified: false,
        transport: 'MOCK_TEST',
        error: `Device [${req.deviceId}] not found`
      };
    }

    if (!device.supportedPins.includes(req.pin)) {
      return {
        state: 'FAILED',
        deviceId: device.deviceId,
        pin: req.pin,
        requestedDurationMs: req.durationMs,
        deviceAcknowledged: false,
        physicalReadbackVerified: false,
        transport: 'MOCK_TEST',
        error: `Pin ${req.pin} is not supported`
      };
    }

    if (req.durationMs < device.minPulseDurationMs || req.durationMs > device.maxPulseDurationMs) {
      return {
        state: 'FAILED',
        deviceId: device.deviceId,
        pin: req.pin,
        requestedDurationMs: req.durationMs,
        deviceAcknowledged: false,
        physicalReadbackVerified: false,
        transport: 'MOCK_TEST',
        error: `Duration ${req.durationMs}ms outside bounds`
      };
    }

    if (!this.simulateAcknowledge) {
      return {
        state: 'DISPATCHED',
        deviceId: device.deviceId,
        pin: req.pin,
        requestedDurationMs: req.durationMs,
        deviceAcknowledged: false,
        physicalReadbackVerified: false,
        transport: 'MOCK_TEST',
        error: 'Hardware acknowledgement missing or timed out'
      };
    }

    if (this.simulateReadbackMismatch) {
      return {
        state: 'FAILED',
        deviceId: device.deviceId,
        pin: req.pin,
        requestedDurationMs: req.durationMs,
        measuredDurationMs: req.durationMs,
        deviceAcknowledged: true,
        physicalReadbackVerified: false,
        pinStateAfterPulse: 'HIGH',
        transport: 'MOCK_TEST',
        error: 'Hardware Readback Mismatch: Pin stuck in HIGH state after pulse'
      };
    }

    // Mock test returns ACKNOWLEDGED, never PHYSICALLY_VERIFIED on real hardware
    return {
      state: 'ACKNOWLEDGED',
      deviceId: device.deviceId,
      pin: req.pin,
      requestedDurationMs: req.durationMs,
      measuredDurationMs: req.durationMs,
      deviceAcknowledged: true,
      physicalReadbackVerified: false, // Explicitly false for mock simulator
      pinStateAfterPulse: 'LOW',
      transport: 'MOCK_TEST',
      rawResponse: `MOCK_ACK:PIN:${req.pin}:DURATION:${req.durationMs}`
    };
  }
}

