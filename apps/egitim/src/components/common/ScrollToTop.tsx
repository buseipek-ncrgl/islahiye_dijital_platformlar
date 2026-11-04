import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Sayfa geçişlerinde pencereyi ve ana içerik kapsayıcısını en yukarı kaydırır.
 * SPA'larda bir sayfada aşağı kaydırıp yeni sayfaya geçildiğinde
 * sayfanın alt kısımdan başlamasını engeller.
 */
export const ScrollToTop: React.FC = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // 1. Pencere ve kök kaydırmasını anında en üste al
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
    }
    if (document.body) {
      document.body.scrollTop = 0;
    }

    // 2. Sayfa içi kaydırılabilir ana kapsayıcıları da sıfırla
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTop = 0;
    }

    const appScroll = document.getElementById('app-scroll-container');
    if (appScroll) {
      appScroll.scrollTop = 0;
    }
  }, [pathname, search]);

  return null;
};
