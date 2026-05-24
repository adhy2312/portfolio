import { useEffect } from 'react';

// Simplified solar calculation for Trivandrum
// Sunrise ~6:00 AM, Sunset ~6:00 PM
export const useSolarLighting = () => {
  useEffect(() => {
    const updateSolarShadows = () => {
      const now = new Date();
      // Adjust to IST (Trivandrum time) - rough approximation if user is not in IST, 
      // but assuming local time for simplicity as requested 'exact angle of the sun at this very minute'
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const time = hours + minutes / 60;

      let sunAngle = 0; // 0 to 180 degrees (6AM to 6PM)
      let intensity = 0;

      if (time >= 6 && time <= 18) {
        // Daytime
        sunAngle = ((time - 6) / 12) * Math.PI; // 0 to PI
        intensity = Math.sin(sunAngle); // peaks at noon (1.0)
      } else {
        // Nighttime (moonlight/ambient)
        // subtle static glow or opposite angle
        sunAngle = Math.PI / 2; // static straight down
        intensity = 0.2; 
      }

      // Max shadow distance
      const maxDist = 20;
      const xOffset = -Math.cos(sunAngle) * maxDist;
      const yOffset = Math.sin(sunAngle) * maxDist + 5; // always slightly down

      // Cast it to root variables
      const root = document.documentElement;
      root.style.setProperty('--solar-x', `${xOffset.toFixed(2)}px`);
      root.style.setProperty('--solar-y', `${yOffset.toFixed(2)}px`);
      root.style.setProperty('--solar-blur', `${(30 - intensity * 15).toFixed(2)}px`);
      root.style.setProperty('--solar-opacity', (intensity * 0.4 + 0.1).toFixed(2));
    };

    updateSolarShadows();
    const interval = setInterval(updateSolarShadows, 60000); // update every minute

    return () => clearInterval(interval);
  }, []);
};
