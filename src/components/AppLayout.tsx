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
  if (scale < 1) {
    return (
      <div style={{ height: '100vh', width: '100%', overflowX: 'hidden', overflowY: 'auto' }}>
        <div
          style={{
            width: 1280,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          <Header />
          <Outlet />
          <Footer />
        </div>
      </div>
    );
  }
  return (
    <div style={{ width: '100%', margin: '0 auto', overflowX: 'hidden' }}>
      <Header />
      <Outlet />
      <Footer />
    </div>
  );
}