export const lerp = (start, end, factor) => start + (end - start) * factor;

export const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

export const mapRange = (inMin, inMax, outMin, outMax, value) => {
  return outMin + ((outMax - outMin) * (value - inMin)) / (inMax - inMin);
};
