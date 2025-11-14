"use Client";

import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

const useAos = () => {
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: false,
      easing: "ease-in-out",
      delay: 100,
      offset: 200,
    });
  }, []);
};

export default useAos;
