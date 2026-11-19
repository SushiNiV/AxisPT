// FitText.jsx
import { useLayoutEffect, useRef } from 'react';

export default function FitText({
  children, min = 6, step = 0.5, multiline = false,
  as: Tag = 'div', className = '', style,
}) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.fontSize = '';                       // back to the CSS size
    let size = parseFloat(getComputedStyle(el).fontSize);
    const over = () =>
      el.scrollWidth > el.clientWidth + 0.5 || el.scrollHeight > el.clientHeight + 0.5;
    while (size > min && over()) {
      size -= step;
      el.style.fontSize = `${size}px`;
    }
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