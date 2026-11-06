/**
 * ════════════════════════════════════════════════════════════════════
 *  DEVICE ADAPTER CONTRACT & HARDWARE SAFETY GATEWAY
 * ════════════════════════════════════════════════════════════════════
 * Platform interface for extending Mini-Adhy from portfolio website
 * to desktop environment and future rolling desk companion robot.
 * 
 * CORE ROBOTICS SAFETY INVARIANT:
 * High-level AI models can ONLY propose actions.
 * A deterministic hardware safety gateway validates all motions,
 * with hardware-level emergency stop operating completely independent of the AI.
 */

export class DeviceAdapterContract {
  constructor({ platform = 'browser_web', deviceId = 'primary_display' } = {}) {
    this.platform = platform; // 'browser_web' | 'desktop_runtime' | 'desk_robot_companion'
    this.deviceId = deviceId;
    this.emergencyStopEngaged = false;
    this.batteryLevel = 1.0;
    this.safetyState = 'NORMAL'; // 'NORMAL' | 'CAUTION' | 'EMERGENCY_STOP' | 'DISCONNECTED'
  }

  /**
   * Discover available onboard physical or digital capabilities
   */
  getCapabilities() {
    return {
      platform: this.platform,
      hasAudioOutput: typeof window !== 'undefined' && Boolean(window.AudioContext || window.webkitAudioContext),
      hasAudioInput: typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia),
      hasCamera: typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia),
      hasMotorActuation: this.platform === 'desk_robot_companion',
      hasDisplay: true,
      hasBatteryTelemetry: this.platform !== 'browser_web'
    };
  }

  /**
   * Deterministic Hardware Safety Gateway
   * Validates motor or motion proposals before any physical or layout commands
   */
  validateMotionProposal(proposal = {}) {
    if (this.emergencyStopEngaged) {
      return {
        allowed: false,
        reason: 'Hardware Emergency Stop engaged. All physical motions locked.',
        safetyState: 'EMERGENCY_STOP'
      };
    }

    if (this.batteryLevel < 0.10) {
      return {
        allowed: false,
        reason: 'Critically low battery (<10%). Physical motion inhibited to preserve system state.',
        safetyState: 'CAUTION'
      };
    }

    // Velocity and range clamping for desk robot safety
    const maxVelocityMmSec = 150; // 15cm/sec safe speed limit
    const proposedSpeed = proposal.velocityMmSec || 0;

    if (proposedSpeed > maxVelocityMmSec) {
      return {
        allowed: false,
        reason: `Proposed velocity (${proposedSpeed} mm/s) exceeds maximum hardware safety limit (${maxVelocityMmSec} mm/s).`,
        safetyState: 'NORMAL'
      };
    }

    return {
      allowed: true,
      clampedProposal: {
        ...proposal,
        velocityMmSec: Math.min(proposedSpeed, maxVelocityMmSec)
      },
      safetyState: 'NORMAL'
    };
  }

  /**
   * Emergency Stop: Operates deterministically without AI reasoning
   */
  triggerEmergencyStop(reason = 'Manual operator trigger') {
    this.emergencyStopEngaged = true;
    this.safetyState = 'EMERGENCY_STOP';
    return {
      stopped: true,
      reason,
      timestamp: new Date().toISOString()
    };
  }

  resetEmergencyStop() {
    this.emergencyStopEngaged = false;
    this.safetyState = 'NORMAL';
    return { stopped: false, timestamp: new Date().toISOString() };
  }
}

export const webDeviceAdapter = new DeviceAdapterContract({
  platform: 'browser_web',
  deviceId: 'adhy_portfolio_surface'
});

