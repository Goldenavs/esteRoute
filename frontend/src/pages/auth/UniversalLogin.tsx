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
  const forceNavbarVisibleRef = useRef(false);
  const hasScrolledPastHeroRef = useRef(false);
  const lastScrollYRef = useRef(0);
  const isScrollingRef = useRef(false);

  useEffect(() => {
    lastScrollYRef.current = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const isScrollingUp = currentScrollY < lastScrollYRef.current;
      const heroEl = document.getElementById('hero');
      const isHeroOffScreen = heroEl ? heroEl.getBoundingClientRect().bottom <= 10 : currentScrollY >= window.innerHeight;

      // Track when the user is scrolled past the hero section
      if (isHeroOffScreen) {
        hasScrolledPastHeroRef.current = true;
      }

      // If this is a manual user scroll (not programmatic scrollTo)
      if (!isScrollingRef.current) {
        // If the user manually scrolls UP into the hero section after having left it:
        if (isScrollingUp && !isHeroOffScreen && hasScrolledPastHeroRef.current) {
          forceNavbarVisibleRef.current = false;
          hasScrolledPastHeroRef.current = false;
        }
      }

      lastScrollYRef.current = currentScrollY;

      // Show navbar if hero is completely off-screen OR if forced visible after portal switch
      setIsScrolled(isHeroOffScreen || forceNavbarVisibleRef.current);

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

  const handleSelectPortal = (portal: 'citizen' | 'admin') => {
    setActivePortal(portal);
    const heroEl = document.getElementById('hero');
    const isHeroOffScreen = heroEl ? heroEl.getBoundingClientRect().bottom <= 10 : window.scrollY >= window.innerHeight;
    
    // If user is in any part aside from the hero section, keep navbar visible when scrolling up to hero
    if (isHeroOffScreen || activeSection !== 'hero') {
      forceNavbarVisibleRef.current = true;
      hasScrolledPastHeroRef.current = false;
      setIsScrolled(true);
    }
  };

  const scrollTo = (id: string) => {
    setActiveSection(id);
    isScrollingRef.current = true;
    
    const element = document.getElementById(id);
    if (element) {
      // Scroll flush so target section occupies the full screen
      const top = element.getBoundingClientRect().top + window.scrollY;
      
      window.scrollTo({ top, behavior: 'smooth' });
      
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
        onSelectPortal={handleSelectPortal}
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
