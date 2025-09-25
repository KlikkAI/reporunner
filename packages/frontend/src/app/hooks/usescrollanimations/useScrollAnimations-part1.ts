/**
 * Scroll Animations Hook
 *
 * Custom hook for handling scroll-based animations
 * and intersection observer effects
 */

import { useEffect, useRef } from 'react';

interface UseScrollAnimationsOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  animationClass?: string;
}

export const useScrollAnimations = (options: UseScrollAnimationsOptions = {}) => {
  const {
    threshold = 0.1,
    rootMargin = '0px 0px -50px 0px',
    triggerOnce = true,
    animationClass = 'visible',
  } = options;

  useEffect(() => {
    const animatedElements = document.querySelectorAll(
      '.fade-in-on-scroll, .slide-in-left-on-scroll, .slide-in-right-on-scroll'
    );

    if (!animatedElements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(animationClass);

            if (triggerOnce) {
              observer.unobserve(entry.target);
            }
          } else if (!triggerOnce) {
            entry.target.classList.remove(animationClass);
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    animatedElements.forEach((element) => {
      observer.observe(element);
    });

    return () => {
      animatedElements.forEach((element) => {
        observer.unobserve(element);
      });
    };
  }, [threshold, rootMargin, triggerOnce, animationClass]);
};

export const useParallaxEffect = () => {
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      document.documentElement.style.setProperty('--scroll-y', scrollY.toString());
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
};

export const useCountUpAnimation = (
  targetValue: number,
  duration: number = 2000,
  startOnVisible: boolean = true
) => {
  const elementRef = useRef<HTMLElement>(null);
  const animationRef = useRef<number | null>(null);

  const animateCount = () => {
    const startTime = Date.now();
    const startValue = 0;

    const updateCount = () => {
      const currentTime = Date.now();
      const progress = Math.min((currentTime - startTime) / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - (1 - progress) ** 4;
      const currentValue = Math.floor(startValue + (targetValue - startValue) * easeOutQuart);

      if (elementRef.current) {
        elementRef.current.textContent = currentValue.toLocaleString();
