import React, { useEffect, useState } from 'react';

const ANIMATION_TYPES = {
  fade: { in: 'fade-in', out: 'fade-out' },
  'slide-left': { in: 'slide-in-left', out: 'slide-out-left' },
};

export default function Fade({
  animationDuration = 800,
  animationType = 'fade',
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

  const animations = ANIMATION_TYPES[animationType] || ANIMATION_TYPES.fade;
  const animationKeyFrame = show ? animations.in : animations.out;

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
