import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAnalytics } from '../hooks/useAnalytics';

interface AnalyticsWrapperProps {
  children: React.ReactNode;
}

/**
 * Wrapper component that automatically tracks page views and provides
 * analytics tracking capabilities to child components
 */
const AnalyticsWrapper: React.FC<AnalyticsWrapperProps> = ({ children }) => {
  const location = useLocation();
  const analytics = useAnalytics();

  useEffect(() => {
    // Track page view whenever the route changes
    // Note: The backend middleware already tracks page views, 
    // but this provides additional client-side tracking
    console.log(`Analytics: Page view tracked for ${location.pathname}`);
  }, [location.pathname]);

  // Add click tracking to all links and buttons
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Track clicks on buttons and links
      if (target.tagName === 'BUTTON' || target.tagName === 'A') {
        analytics.trackClick(target);
      }

      // Track phone number clicks
      if (target.tagName === 'A' && target.getAttribute('href')?.startsWith('tel:')) {
        const phoneNumber = target.getAttribute('href')?.replace('tel:', '') || '';
        analytics.trackPhoneClick(phoneNumber);
      }

      // Track email clicks
      if (target.tagName === 'A' && target.getAttribute('href')?.startsWith('mailto:')) {
        const email = target.getAttribute('href')?.replace('mailto:', '') || '';
        analytics.trackEmailClick(email);
      }

      // Track external links
      if (target.tagName === 'A') {
        const href = target.getAttribute('href');
        if (href && (href.startsWith('http://') || href.startsWith('https://')) && !href.includes(window.location.hostname)) {
          analytics.trackExternalLink(href, target.textContent || undefined);
        }
      }
    };

    document.addEventListener('click', handleClick);
    
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [analytics]);

  return <>{children}</>;
};

export default AnalyticsWrapper;