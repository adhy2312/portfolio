import React from 'react';
import { motion } from 'framer-motion';
import photo1 from '../assets/photo1.jpg';
import photo2 from '../assets/photo2.jpg';
import photo3 from '../assets/photo3.jpg';

const images = [photo1, photo2, photo3];

export default () => (
  <section id="gallery" className="section">
    <motion.h2 initial={{opacity:0, y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{duration:0.6}}>
      📷 My Photography
    </motion.h2>
    <motion.div style={{display:'flex',flexWrap:'wrap',justifyContent:'center',gap:'20px',marginTop:'2rem'}}
      initial="hidden" whileInView="visible" viewport={{ once:true }} variants={{
        visible:{transition:{staggerChildren:0.2}}
      }}>
      {images.map((src,i)=>(
        <motion.img key={i} src={src} alt={`photo${i+1}`} style={{width:'280px',borderRadius:'8px',boxShadow:'0 4px 15px rgba(0,0,0,0.3)'}}
          variants={{hidden:{opacity:0, scale:0.8}, visible:{opacity:1, scale:1}}}
          whileHover={{ scale:1.05 }} transition={{ duration:0.6, delay:i*0.2 }}/>
      ))}
    </motion.div>
  </section>
);
