import { useEffect } from "react";

const getSb = () =>
  window.parent.document.querySelector(".sb-bar") as HTMLDivElement;

export const HideSbBar = () => {
  useEffect(() => {
    setTimeout(() => {
      const sbBar = getSb();
      console.log("sbBar", sbBar);
      if (sbBar) {
        sbBar.style.display = "none";
      }
    });

    return () => {
      setTimeout(() => {
        const sbBar = getSb();
        if (sbBar) {
          sbBar.style.display = "block";
        }
      });
    };
  }, []);
  return null;
};
