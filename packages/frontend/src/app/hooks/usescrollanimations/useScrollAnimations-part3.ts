element.style.setProperty('--mouse-x', `${x}px`);
element.style.setProperty('--mouse-y', `${y}px`);
element.style.setProperty('--glow-intensity', intensity.toString());
}

const handleMouseLeave = () => {
  element.style.setProperty('--glow-intensity', '0');
};

element.addEventListener('mousemove', handleMouseMove);
element.addEventListener('mouseleave', handleMouseLeave);

return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
}, [intensity])

return elementRef;
}

export const useMorphingText = (
  texts: string[],
  interval: number = 3000,
  morphDuration: number = 300
) => {
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || texts.length === 0) return;

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
