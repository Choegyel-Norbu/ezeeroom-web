import React, { useState, useEffect, useRef } from "react";

import LoginModal from "../authentication/LoginModal";
import "../../assets/css/custom.css";
import Footer from "../../layouts/Footer";
import { useInView } from "react-intersection-observer";
import HeroLG from "./HeroLG";
import { Link, useLocation } from "react-router-dom";
import Navbar from "../../layouts/Navbar";
import FeatureSection from "./FeatureSection";
import PropertyTypeSection from "./PropertyTypeSection";
import TopHighlightsSection from "./TopHighlightsSection";
import ListYourPropertySection from "./ListYourPropertySection";
import StickySocialIcons from "@/shared/components/StickySocialIcons";
import { getStorageItem } from "@/shared/utils/safariLocalStorage";

const Landing = () => {
  const [loginShow, setLoginShow] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [certModalOpen, setCertModalOpen] = useState(false);
  const certiRef = useRef(null);
  const [rating, setRating] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const contactMeRef = useRef(null);
  const homeRef = useRef(null);
  const footerRef = useRef(null);
  const listPropertyRef = useRef(null);
  const [hasRated, setHasRated] = useState(
    getStorageItem("hasRated") === "true"
  );
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const lastScrollY = useRef(0);

  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Track scroll direction for navbar visibility
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show navbar when at top of page
      if (currentScrollY < 10) {
        setIsNavbarVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }
      
      // Determine scroll direction
      const scrollingDown = currentScrollY > lastScrollY.current;
      const scrollingUp = currentScrollY < lastScrollY.current;
      
      // Show when scrolling up, hide when scrolling down
      if (scrollingUp) {
        setIsNavbarVisible(true);
      } else if (scrollingDown) {
        setIsNavbarVisible(false);
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [ref, inView] = useInView({
    triggerOnce: false, // Set true if you want it only once
    threshold: 0.1,
  });

  const toggleLogin = () => {
    setLoginShow(!loginShow);
    
  };

  // Removed AOS initialization - using Framer Motion for all animations
  // This eliminates double animation overhead and scroll event conflicts

  useEffect(() => {
    const timer = setTimeout(() => {
      setRating(true);
    }, 3 * 60 * 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!dismissed) return;

    const interval = setInterval(() => {
      setRating(true);
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [dismissed]);

  const handleDismiss = () => {
    setRating(false);
    setDismissed(true);
  };

  const handleSubmit = () => {
    // Your submit logic here
    setRating(false);
    setDismissed(false); // Stop showing if submitted
  };

  const cardVariants = {
    offscreen: { opacity: 0, x: 100 },
    onscreen: { opacity: 1, x: 0, transition: { duration: 0.8 } },
  };

  const heroVariants = {
    offscreen: { y: 100 },
    onscreen: { y: -30, transition: { duration: 0.8 } },
  };

  const fadeInUp = {
    offscreen: {
      opacity: 0,
      y: 40,
    },
    onscreen: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  };

  const MenuSlideIn = {
    offscreen: {
      opacity: 0,
      x: -300, // Start off-screen to the left
    },
    onscreen: {
      opacity: 1,
      x: 0, // Slide in to normal position
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 20,
        duration: 0.5,
      },
    },
    exit: {
      opacity: 0,
      x: -300, // Slide back out to the left
      transition: {
        ease: "easeIn",
        duration: 0.3,
      },
    },
  };

  const closeLogin = () => {
    setLoginShow(false);
  };
  const menuButtonRef = useRef(null);
  const sideBarRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (certiRef.current && !certiRef.current.contains(event.target)) {
        setCertModalOpen(false);
      }
      if (
        sideBarRef.current &&
        !sideBarRef.current.contains(event.target) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [certiRef]);

  return (
    <>
      <div className=" relative bg-white text-[#050203] dark:text-white">
        {/* Navigation */}
        <div className="pr-0 sm:pr-0">
          <Navbar 
            onLoginClick={toggleLogin} 
            onContactClick={() => footerRef.current?.scrollIntoView({ behavior: 'smooth' })} 
            isVisible={isNavbarVisible}
          />
        </div>

        {/* LoginModal */}
        {loginShow && <LoginModal onClose={closeLogin} />}

        {/* Sticky Social Media Icons */}
        <StickySocialIcons />

        <HeroLG
          ref={homeRef}
          onScroll={() =>
            contactMeRef.current?.scrollIntoView({ behavior: "smooth" })
          }
        />
        <PropertyTypeSection />
        <FeatureSection />
        <TopHighlightsSection />
        <div ref={listPropertyRef}>
          <ListYourPropertySection onLoginClick={toggleLogin} />
        </div>
        
        <Footer ref={footerRef} />
      </div>
    </>
  );
};

export default Landing;
