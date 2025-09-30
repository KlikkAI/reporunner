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

    if (!animatedElements.length) {
      return;
    }

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
      }

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(updateCount);
      }
    };

    animationRef.current = requestAnimationFrame(updateCount);
  };

  useEffect(() => {
    if (!startOnVisible) {
      animateCount();
      return;
    }

    const element = elementRef.current;
    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCount();
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(element);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      observer.disconnect();
    };
  }, [startOnVisible, animateCount]);

  return elementRef;
};

export const useTypewriterEffect = (text: string, speed: number = 50, startDelay: number = 0) => {
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) {
      return;
    }

    let index = 0;
    element.textContent = '';

    const timeoutId = setTimeout(() => {
      const intervalId = setInterval(() => {
        if (index < text.length) {
          element.textContent += text.charAt(index);
          index++;
        } else {
          clearInterval(intervalId);
        }
      }, speed);

      return () => clearInterval(intervalId);
    }, startDelay);

    return () => clearTimeout(timeoutId);
  }, [text, speed, startDelay]);

  return elementRef;
};

export const useStaggeredAnimation = (
  selector: string,
  delay: number = 100,
  animationClass: string = 'animate-fade-in-up'
) => {
  useEffect(() => {
    const elements = document.querySelectorAll(selector);

    elements.forEach((element, index) => {
      setTimeout(() => {
        element.classList.add(animationClass);
      }, index * delay);
    });
  }, [selector, delay, animationClass]);
};

export const useGlowEffect = (intensity: number = 0.5) => {
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      element.style.setProperty('--mouse-x', `${x}px`);
      element.style.setProperty('--mouse-y', `${y}px`);
      element.style.setProperty('--glow-intensity', intensity.toString());
    };

    const handleMouseLeave = () => {
      element.style.setProperty('--glow-intensity', '0');
    };

    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [intensity]);

  return elementRef;
};

export const useMorphingText = (
  texts: string[],
  interval: number = 3000,
  morphDuration: number = 300
) => {
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || texts.length === 0) {
      return;
    }

    let currentIndex = 0;
    element.textContent = texts[0];

    const intervalId = setInterval(() => {
      // Fade out
      element.style.opacity = '0';
      element.style.transform = 'translateY(-10px)';

      setTimeout(() => {
        currentIndex = (currentIndex + 1) % texts.length;
        element.textContent = texts[currentIndex];

        // Fade in
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
      }, morphDuration);
    }, interval);

    // Set initial transition
    element.style.transition = `opacity ${morphDuration}ms ease, transform ${morphDuration}ms ease`;

    return () => clearInterval(intervalId);
  }, [texts, interval, morphDuration]);

  return elementRef;
};
