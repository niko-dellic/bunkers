"use client";

import { useEffect, useState } from "react";
import InteractiveMap from "../components/InteractiveMap";

export default function Home() {
  const isMobile = useMobileDetect();

  return (
    <main id={isMobile ? "main-mobile" : ""}>
      <InteractiveMap isMobile={isMobile} />
    </main>
  );
}

function useMobileDetect() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    setIsMobile(
      /mobile|android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(
        userAgent
      )
    );
  }, []);

  return isMobile;
}
