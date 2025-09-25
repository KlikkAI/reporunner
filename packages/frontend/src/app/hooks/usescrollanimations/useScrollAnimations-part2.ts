}

if (progress < 1) {
  animationRef.current = requestAnimationFrame(updateCount);
}
}

animationRef.current = requestAnimationFrame(updateCount)
}

useEffect(() =>
{
  if (!startOnVisible) {
    animateCount();
    return;
  }

  const element = elementRef.current;
  if (!element) return;

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
}
, [startOnVisible, animateCount])

return elementRef;
}

export const useTypewriterEffect = (text: string, speed: number = 50, startDelay: number = 0) => {
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

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
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
