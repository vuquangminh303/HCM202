import React, { useEffect, useState } from 'react';

export default function Fade({
  animationDuration = 800,
  children,
  className,
  show,
  style,
}) {
  const [shouldRender, setRender] = useState(show);

  useEffect(() => {
    if (show) {
      setRender(true);
    }
  }, [show]);

  function onAnimationEnd() {
    if (!show) {
      setRender(false);
    }
  }

  const animationKeyFrame = show ? 'fade-in' : 'fade-out';

  if (!shouldRender) {
    return null;
  }

  return (
    <div
      className={className}
      style={{
        animation: `${animationKeyFrame} ${animationDuration}ms ease-in-out`,
        ...style,
      }}
      onAnimationEnd={onAnimationEnd}
    >
      {children}
    </div>
  );
}
