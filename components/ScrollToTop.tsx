import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Scrolls window and main content area to top on every route change,
 * so each page starts from the top instead of keeping previous scroll position.
 */
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    const main = document.querySelector('main');
    if (main) main.scrollTop = 0;
  }, [pathname]);

  return null;
};

export default ScrollToTop;
