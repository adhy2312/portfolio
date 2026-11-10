// jest-dom adds custom jest matchers for asserting on DOM nodes.
import '@testing-library/jest-dom';

// Ensure crypto and getRandomValues are available in JSDOM / Node test environment
const nodeCrypto = require('crypto');
if (typeof window !== 'undefined') {
  if (!window.crypto) {
    window.crypto = {};
  }
  if (!window.crypto.getRandomValues) {
    window.crypto.getRandomValues = function (buffer) {
      return nodeCrypto.randomFillSync(buffer);
    };
  }
  if (!window.crypto.subtle && nodeCrypto.webcrypto) {
    window.crypto.subtle = nodeCrypto.webcrypto.subtle;
  }
}
if (typeof global !== 'undefined') {
  if (!global.crypto) {
    global.crypto = nodeCrypto.webcrypto || {};
  }
  if (!global.crypto.getRandomValues) {
    global.crypto.getRandomValues = function (buffer) {
      return nodeCrypto.randomFillSync(buffer);
    };
  }
}

// 1. Mock HTMLCanvasElement.prototype.getContext for headless JSDOM environments
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = function () {
    return {
      fillRect: () => {},
      clearRect: () => {},
      getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
      putImageData: () => {},
      createImageData: () => [],
      setTransform: () => {},
      drawImage: () => {},
      save: () => {},
      fillText: () => {},
      restore: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {},
      stroke: () => {},
      translate: () => {},
      scale: () => {},
      rotate: () => {},
      arc: () => {},
      fill: () => {},
      measureText: () => ({ width: 0 }),
      transform: () => {},
      rect: () => {},
      clip: () => {}
    };
  };
}

// 2. Mock browser APIs missing in headless Node / JSDOM
if (typeof window !== 'undefined') {
  window.matchMedia = window.matchMedia || function () {
    return {
      matches: false,
      addListener: function () {},
      removeListener: function () {}
    };
  };

  window.ResizeObserver = window.ResizeObserver || class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  window.IntersectionObserver = window.IntersectionObserver || class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
