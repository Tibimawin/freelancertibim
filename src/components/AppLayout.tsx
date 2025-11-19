import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Outlet } from 'react-router-dom';

export default function AppLayout() {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const baseWidth = 1280;
    const update = () => {
      const w = window.innerWidth;
      setScale(w >= baseWidth ? 1 : w / baseWidth);
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);
  return (
    <div
      style={{
        transform: scale < 1 ? `scale(${scale})` : 'none',
        transformOrigin: 'top left',
        width: scale < 1 ? 1280 : '100%',
        margin: scale < 1 ? 0 : '0 auto',
        overflowX: 'hidden',
      }}
    >
      <Header />
      <Outlet />
      <Footer />
    </div>
  );
}