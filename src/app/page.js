"use client";

import { useEffect, useState } from "react";
import InteractiveMap from "../components/InteractiveMap";
import Credits from "../components/Credits";
// import head
import Head from "next/head";

export default function Home() {
  const isMobile = useMobileDetect();

  const [showCredits, setShowCredits] = useState(false);

  useEffect(() => {
    // Function to handle key down
    const handleKeyDown = (e) => {
      if (e.key === " ") {
        // Prevent default action to avoid any side effect like scrolling
        e.preventDefault();
        setShowCredits((prevShowCredits) => !prevShowCredits);
      }
    };

    // Add event listener to the window
    window.addEventListener("keydown", handleKeyDown);

    // Cleanup function to remove the event listener
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []); // Empty dependency array means this effect runs only once on mount

  return (
    <>
      <Head>
        <link
          rel="icon"
          href="/icon?<generated>"
          type="image/<generated>"
          sizes="<generated>"
        />
      </Head>
      <main id={isMobile ? "main-mobile" : ""}>
        {/* render interactive map once isMobile is not undefined */}
        {isMobile !== undefined && <InteractiveMap isMobile={isMobile} />}

        <Credits />
      </main>
    </>
  );
}

function useMobileDetect() {
  const [isMobile, setIsMobile] = useState(undefined);

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
