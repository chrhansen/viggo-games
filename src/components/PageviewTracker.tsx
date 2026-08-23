import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackPageview } from "@/lib/analytics";

const PageviewTracker = () => {
  const location = useLocation();
  const hasTrackedInitialPageview = useRef(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    if (!hasTrackedInitialPageview.current) {
      hasTrackedInitialPageview.current = true;
      return;
    }

    trackPageview();
  }, [location.pathname, location.search, location.hash]);

  return null;
};

export default PageviewTracker;
