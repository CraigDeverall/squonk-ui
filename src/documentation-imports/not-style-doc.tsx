import { useEffect } from "react";

export const NoStyleDoc = () => {
  useEffect(() => {
    const styleTag = document.createElement("style");
    styleTag.innerHTML = `
      .sbdocs-wrapper {
        padding: 0!important;
      
      }
      .sbdocs-content { 
        max-width: 100%!important;
      }
    `;
    document.head.appendChild(styleTag);
    return () => {
      styleTag.remove();
    };
  }, []);
  return null;
};
