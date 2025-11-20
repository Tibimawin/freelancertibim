import React, { useEffect, useRef, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Outlet } from 'react-router-dom';

export default function AppLayout() {
  const [scale, setScale] = useState(1);
  const footerRef = useRef<HTMLDivElement | null>(null);
  const [padBottom, setPadBottom] = useState(0);

  useEffect(() => {
    const BASE_WIDTH = 1280;
    const updateScale = () => {
      const w = window.innerWidth;
      const s = Math.min(1, w / BASE_WIDTH);
      setScale(s);
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  useEffect(() => {
    const h = footerRef.current?.offsetHeight || 0;
    setPadBottom(h * scale);
  }, [scale]);

  return (
    <div className="bg-background h-screen overflow-hidden">
      <div className="h-full overflow-auto" style={{ paddingBottom: padBottom }}>
        <div
          style={{
            width: 1280,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          <Header />
          <Outlet />
        </div>
      </div>
      <div
        ref={footerRef}
        className="fixed left-0 bottom-0 z-40"
        style={{
          width: 1280,
          transform: `scale(${scale})`,
          transformOrigin: 'bottom left',
        }}
      >
        <Footer />
      </div>
    </div>
  );
}