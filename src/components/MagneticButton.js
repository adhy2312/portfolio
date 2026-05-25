import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function MagneticButton({ children, className, ...props }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const smoothX = useSpring(x, { stiffness: 200, damping: 20, mass: 0.5 });
  const smoothY = useSpring(y, { stiffness: 200, damping: 20, mass: 0.5 });

  const handleMouse = (e) => {
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    x.set(middleX * 0.5);
    y.set(middleY * 0.5);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      style={{ position: 'relative', display: 'inline-block', x: smoothX, y: smoothY }}
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
