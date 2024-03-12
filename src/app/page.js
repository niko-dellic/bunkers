"use client";

import { useEffect, useState } from "react";
import InteractiveMap from "../components/InteractiveMap";
// import head
import Head from "next/head";

export default function Home() {
  const isMobile = useMobileDetect();

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
