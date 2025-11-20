import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Outlet } from 'react-router-dom';

export default function AppLayout() {
  const [scale, setScale] = useState(1);

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

  return (
    <div className="bg-background min-h-screen">
      <div
        style={{
          width: 1280,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          minHeight: `calc(100vh / ${scale})`,
        }}
      >
        <Header />
        <Outlet />
        <Footer />
      </div>
    </div>
  );
}