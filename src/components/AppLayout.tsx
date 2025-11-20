import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Outlet } from 'react-router-dom';

export default function AppLayout() {
  return (
    <div className="bg-background min-h-screen overflow-x-hidden">
      <Header />
      <Outlet />
      <Footer />
    </div>
  );
}