import { YoloObjectDetectionEngine, YOLO_CATEGORIES } from '../YoloObjectDetectionEngine';

describe('YoloObjectDetectionEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new YoloObjectDetectionEngine();
  });

  afterEach(() => {
    engine.stop();
  });

  test('normalizes YOLO bbox coordinates and tracks objects', () => {
    const rawObjects = [
      {
        id: 'IC_1',
        label: 'STM32F401 Microcontroller',
        category: 'INTEGRATED_CIRCUIT',
        confidence: 0.98,
        bbox: [200, 300, 600, 700] // 0-1000 scale
      },
      {
        id: 'PASSIVE_1',
        label: 'Ceramic Capacitor 10uF',
        category: 'PASSIVE',
        confidence: 0.91,
        bbox: [0.1, 0.2, 0.3, 0.4] // 0-1 scale
      }
    ];

    engine.updateDetections(rawObjects);
    expect(engine.trackedBoxes.size).toBe(2);

    const ic = engine.trackedBoxes.get('IC_1');
    expect(ic.label).toBe('STM32F401 Microcontroller');
    expect(ic.x).toBeCloseTo(0.3);
    expect(ic.y).toBeCloseTo(0.2);
    expect(ic.w).toBeCloseTo(0.4);
    expect(ic.h).toBeCloseTo(0.4);

    const cap = engine.trackedBoxes.get('PASSIVE_1');
    expect(cap.category).toBe('PASSIVE');
    expect(cap.w).toBeCloseTo(0.2);
  });

  test('smooths moving objects over consecutive frames (EMA)', () => {
    engine.updateDetections([
      { id: 'OBJ_1', label: 'Resistor', bbox: [100, 100, 200, 200], confidence: 0.9 }
    ]);
    const initialX = engine.trackedBoxes.get('OBJ_1').x;

    // Next frame with slight movement
    engine.updateDetections([
      { id: 'OBJ_1', label: 'Resistor', bbox: [100, 150, 200, 250], confidence: 0.92 }
    ]);
    const smoothedX = engine.trackedBoxes.get('OBJ_1').x;

    // Smoothed X should be between initial (0.1) and new target (0.15)
    expect(smoothedX).toBeGreaterThan(initialX);
    expect(smoothedX).toBeLessThan(0.15);
  });

  test('selects targets on touch or click within normalized coordinates', () => {
    engine.updateDetections([
      { id: 'TARGET_A', label: 'ESP32 Module', bbox: [0.2, 0.2, 0.6, 0.6], category: 'PCB' }
    ]);

    const hit = engine.selectTargetAt(0.35, 0.35);
    expect(hit).not.toBeNull();
    expect(hit.id).toBe('TARGET_A');
    expect(engine.selectedTargetId).toBe('TARGET_A');

    // Deselects when clicking outside
    const miss = engine.selectTargetAt(0.05, 0.05);
    expect(miss).toBeNull();
    expect(engine.selectedTargetId).toBeNull();
  });
});

