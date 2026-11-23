import { useLayoutEffect, useRef } from 'react';

export default function FitText({
  children, 
  min = 6, 
  step = 0.5, 
  multiline = false,
  as: Tag = 'div', 
  className = '', 
  style,
}) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    
    // Function to shrink the text
    const fit = () => {
      el.style.fontSize = ''; // Reset to base size
      let size = parseFloat(getComputedStyle(el).fontSize);
      
      // Check if it overflows
      const over = () => el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1;
      
      // Shrink until it fits
      while (size > min && over()) {
        size -= step;
        el.style.fontSize = `${size}px`;
      }
    };

    // Run once immediately, then again on the next frame to catch grid layout
    fit();
    const frame = requestAnimationFrame(fit);

    // Add a ResizeObserver so it re-fits if the window or zoom scale changes
    const observer = new ResizeObserver(() => fit());
    observer.observe(el.parentElement); // Observe the parent container

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [children, min, step, multiline]);

  const text = typeof children === 'string' ? children : undefined;
  return (
    <Tag
      ref={ref}
      title={text}
      className={`fit ${multiline ? 'fit-multi' : 'fit-one'} ${className}`}
      style={style}
    >
      {children}
    </Tag>
  );
}