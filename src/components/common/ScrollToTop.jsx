import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        // Reset window scroll to top on every route change
        window.scrollTo({ top: 0, behavior: 'instant' });

        // Also handle potential scroll containers in the main area
        const containers = [
            document.querySelector('main'),
            document.getElementById('root'),
            document.body
        ];

        containers.forEach(container => {
            if (container) {
                container.scrollTo({ top: 0, behavior: 'instant' });
            }
        });
    }, [pathname]);

    return null;
};

export default ScrollToTop;
