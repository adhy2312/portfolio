import React, { useEffect, useState, useRef } from 'react';
import './About.css';
import dp from '../assets/dp.jpg';
import { FiDownload, FiMapPin } from 'react-icons/fi';
import { urlFor } from '../sanity';
import { useSanityQuery } from '../hooks/useSanityQuery';
import { useStory } from '../contexts/StoryContext';
import { useSiteMode } from '../contexts/SiteModeContext';
import DecryptedText from './DecryptedText';
import Typography from './motion/Typography';
import SchrodingersNode from './motion/SchrodingersNode';
import PoltergeistNode from './motion/PoltergeistNode';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ExpertDoc from './ExpertDoc';

gsap.registerPlugin(ScrollTrigger);

const defaultStats = [
  { value: '300+', label: 'Members Led (ISTE)', iconName: 'FiAward' },
  { value: '4+', label: 'Projects Built', iconName: 'FiAward' },
  { value: '20+', label: 'Designs Done · More on the way', iconName: 'FiPenTool' },
  { value: '10+', label: 'Tech Stacks', iconName: 'FiAward' },
];

const About = () => {
  const { data: aboutData } = useSanityQuery('*[_type == "about"][0]');
  const { getStoryForSection, openStory } = useStory();
  const { lang, t } = useSiteMode();
  const hasStory = !!getStoryForSection('about');

  const sectionRef = useRef(null);
  const imageWrapperRef = useRef(null);
  const textColRef = useRef(null);
  const statsRef = useRef(null);

  const translatedBios = [
    t('about.bio1'),
    t('about.bio2'),
    t('about.bio3'),
  ];

  const translatedStats = (aboutData?.stats || defaultStats).map((s, idx) => ({
    ...s,
    label: lang === 'en' ? s.label : t(`about.stat${idx}`, s.label),
  }));

  const displayData = {
    location: lang === 'en' ? (aboutData?.location || t('about.location')) : t('about.location'),
    bioParagraphs: lang === 'en'
      ? (aboutData?.bioParagraphs || translatedBios)
      : translatedBios,
    stats: translatedStats,
    profileImage: aboutData?.profileImage ? urlFor(aboutData.profileImage).url() : dp,
    experienceYears: aboutData?.experienceYears || "2+"
  };

  if (!displayData.profileImage && !dp) {
    displayData.profileImage = "https://via.placeholder.com/400";
  }

  // GSAP Scroll Animations
  useEffect(() => {
    if (!sectionRef.current) return;
    const ctx = gsap.context(() => {
      // Image: scale-in with parallax
      if (imageWrapperRef.current) {
        gsap.fromTo(imageWrapperRef.current,
          { clipPath: 'polygon(0 0, 100% 0, 100% 0, 0 0)', scale: 1.1, filter: 'blur(10px)' },
          {
            clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
            scale: 1,
            filter: 'blur(0px)',
            duration: 1.8,
            ease: 'power4.inOut',
            scrollTrigger: {
              trigger: imageWrapperRef.current,
              start: 'top 85%',
              once: true,
            }
          }
        );
      }

      // Text column: stagger paragraphs
      if (textColRef.current) {
        const elements = textColRef.current.querySelectorAll('.section-label, .section-title-wrapper, .section-divider, .about-location, .about-cta');
        gsap.fromTo(elements,
          { y: 40, opacity: 0 },
          {
            y: 0, opacity: 1,
            duration: 0.9,
            stagger: 0.08,
            ease: 'power4.out',
            scrollTrigger: {
              trigger: textColRef.current,
              start: 'top 85%',
              toggleActions: 'play none none none',
              once: true,
            }
          }
        );
      }

      // Stats: stagger with scale bounce
      if (statsRef.current) {
        const statCards = statsRef.current.querySelectorAll('.about-stat');
        gsap.fromTo(statCards,
          { y: 30, opacity: 0, scale: 0.9 },
          {
            y: 0, opacity: 1, scale: 1,
            duration: 0.8,
            stagger: 0.1,
            ease: 'back.out(1.7)',
            scrollTrigger: {
              trigger: statsRef.current,
              start: 'top 90%',
              toggleActions: 'play none none none',
              once: true,
            }
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, [aboutData]);

  // GSAP 3D Tilt on Image (replaces Framer Motion springs)
  useEffect(() => {
    if (!imageWrapperRef.current) return;
    const el = imageWrapperRef.current;
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) return;

    const handleMouseMove = (e) => {
      const rect = el.getBoundingClientRect();
      const xPct = (e.clientX - rect.left) / rect.width - 0.5;
      const yPct = (e.clientY - rect.top) / rect.height - 0.5;

      gsap.to(el, {
        rotateX: yPct * -15,
        rotateY: xPct * 15,
        duration: 0.5,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    };

    const handleMouseLeave = () => {
      gsap.to(el, {
        rotateX: 0,
        rotateY: 0,
        duration: 1,
        ease: 'elastic.out(1, 0.5)',
      });
    };

    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <section className="about" id="about" ref={sectionRef}>
      <ExpertDoc
        title="About.js"
        notes="Responsive layout with 3D Poltergeist Nodes."
        data={{
          'componentLayout': 'Flex/Grid Hybrid',
          'parallaxEngine': 'GSAP ScrollTrigger',
          'tiltEffect': 'Custom pointer math (no Framer Motion)',
          'storyContext': 'Context API + Sanity',
          'interactiveNodes': 'SchrodingersNode, PoltergeistNode'
        }}
      />
      <div className="container">
        <div className="about-grid">
          {/* Image side */}
          <div className="about-image-col">
            <SchrodingersNode className="about-img-wrapper">
              <div
                ref={imageWrapperRef}
                style={{
                  transformStyle: "preserve-3d",
                  perspective: 1000,
                  width: '100%',
                  height: '100%'
                }}
              >
                <div style={{ overflow: 'hidden', borderRadius: '12px', width: '100%', height: '100%' }}>
                  <img
                    src={displayData.profileImage}
                    alt="Adhithya Mohan"
                    className="about-img"
                    style={{ transform: "translateZ(30px)", width: '100%', height: '100%', objectFit: 'cover' }}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="about-img-glow" />
              </div>
            </SchrodingersNode>
          </div>

          {/* Text side */}
          <div className="about-text-col" ref={textColRef}>
            <span className="section-label">{t('about.label', '// who I am')}</span>
            <div className="section-title-wrapper">
              <Typography as="h2" variant="mask" className="section-title about-title" data-hover="Adhithya Mohan">
                <span className="section-title-inner"><DecryptedText text={t('about.title', 'About')} speed={15} /> <span><DecryptedText text={t('about.titleAccent', 'Me')} speed={15} /></span></span>
              </Typography>
              {hasStory && (
                <button className="story-btn" onClick={() => openStory('about')} aria-label="Read story behind this section">
                  <span>✦</span> See Story
                </button>
              )}
            </div>
            <div className="section-divider" />

            <div className="about-location">
              <FiMapPin size={14} />
              <span>{displayData.location}</span>
            </div>

            {displayData.bioParagraphs.map((p, i) => (
              <Typography key={`${lang}-${i}`} variant="split" as="p" className="about-p" text={p} />
            ))}

            <div className="about-stats" ref={statsRef}>
              {displayData.stats.map((s, i) => (
                <div key={i} className="about-stat">
                  <PoltergeistNode radius={300} strength={0.25} className="stat-poltergeist">
                    <span className="stat-value">
                      {s.label?.toLowerCase().includes('projects built')
                        ? '4+'
                        : s.label?.toLowerCase().includes('designs done')
                          ? '20+'
                          : s.value}
                    </span>
                    <span className="stat-label">{s.label}</span>
                  </PoltergeistNode>
                </div>
              ))}
            </div>

            <a href="/resume.pdf" download className="btn-primary about-cta">
              <FiDownload />
              {t('about.cta', 'Download Resume')}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
