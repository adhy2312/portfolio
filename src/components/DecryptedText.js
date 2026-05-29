import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const chars = '!@#%&*+<>?$[]';

const DecryptedText = ({ text, className, speed = 30 }) => {
  const [displayText, setDisplayText] = useState(text.replace(/[^\s]/g, () => chars[Math.floor(Math.random() * chars.length)]));
  const ref = useRef(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    
    const trigger = ScrollTrigger.create({
      trigger: ref.current,
      start: "top 95%",
      onEnter: () => {
        setIsInView(true);
        trigger.kill(); // run once
      }
    });

    return () => trigger.kill();
  }, []);

  useEffect(() => {
    if (isInView && !hasAnimated) {
      let iteration = 0;
      let interval = setInterval(() => {
        setDisplayText(
          text
            .split('')
            .map((letter, index) => {
              if (index < iteration) {
                return text[index];
              }
              if (letter === ' ') return ' ';
              return chars[Math.floor(Math.random() * chars.length)];
            })
            .join('')
        );

        if (iteration >= text.length) {
          clearInterval(interval);
          setHasAnimated(true);
        }
        
        iteration += 1/2; 
      }, speed);

      return () => clearInterval(interval);
    }
  }, [isInView, text, hasAnimated, speed]);

  return (
    <span ref={ref} className={className}>
      {hasAnimated ? text : displayText}
    </span>
  );
};

export default DecryptedText;
