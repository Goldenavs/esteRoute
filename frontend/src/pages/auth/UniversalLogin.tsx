import { useState, useEffect, useRef } from 'react';
import AuthNavbar from '../../components/auth/navigation/AuthNavbar';
import HeroSection from '../../components/auth/sections/HeroSection';
import FeaturesSection from '../../components/auth/sections/FeaturesSection';
import CoreEngineSection from '../../components/auth/sections/CoreEngineSection';
import FaqsSection from '../../components/auth/sections/FaqsSection';
import FooterSection from '../../components/auth/sections/FooterSection';
import AuthModals from '../../components/auth/modals/AuthModals';
import GlobalSonarBackground from '../../components/auth/background/GlobalSonarBackground';

export default function UniversalLogin() {
  const [activeSection, setActiveSection] = useState('hero');
  const [activePortal, setActivePortal] = useState<'citizen' | 'admin'>('citizen');
  const [activeModal, setActiveModal] = useState<'admin' | 'citizen' | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const isScrollingRef = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show navbar ONLY when the hero is completely off-screen (features section fully on screen)
      const heroEl = document.getElementById('hero');
      if (heroEl) {
        setIsScrolled(heroEl.getBoundingClientRect().bottom <= 10);
      } else {
        setIsScrolled(window.scrollY >= window.innerHeight);
      }

      if (isScrollingRef.current) return;
      
      const sections = ['hero', 'features', 'core-engine', 'faqs', 'footer'];
      for (const id of [...sections].reverse()) {
        const element = document.getElementById(id);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top < window.innerHeight * 0.4) {
            setActiveSection(id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check immediately on mount
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    setActiveSection(id);
    isScrollingRef.current = true;

    if (id === 'hero') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 800);
      return;
    }

    const element = document.getElementById(id);
    if (element) {
      // Target the section header (h2) or fall back to section container
      const headerEl = element.querySelector('h2') || element;
      const headerRect = headerEl.getBoundingClientRect();
      
      // Floating navbar is top-4 (16px) with ~68px height (bottom ~84px).
      // Leaving ~24px-28px breathing room below the navbar ensures the header is never covered.
      const navOffset = window.innerWidth < 768 ? 90 : 112;
      const targetTop = headerRect.top + window.scrollY - navOffset;

      window.scrollTo({
        top: Math.max(0, targetTop),
        behavior: 'smooth'
      });

      setTimeout(() => {
        isScrollingRef.current = false;
      }, 800);
    } else {
      isScrollingRef.current = false;
    }
  };

  return (
    <div className="min-h-screen bg-app-bg text-text-primary w-full overflow-x-hidden relative">
      <GlobalSonarBackground />
      <AuthNavbar 
        activeSection={activeSection} 
        isScrolled={isScrolled} 
        scrollTo={scrollTo} 
        activePortal={activePortal}
        onSelectPortal={setActivePortal}
      />
      <HeroSection 
        activePortal={activePortal}
        setActivePortal={setActivePortal}
        scrollTo={scrollTo} 
      />
      <FeaturesSection />
      <CoreEngineSection />
      <FaqsSection />
      <FooterSection />
      
      <AuthModals activeModal={activeModal} onClose={() => setActiveModal(null)} />
    </div>
  );
}
