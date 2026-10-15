import { useEffect, useState } from "react";

const KEY = "eduplanner-tema";

export function useTheme() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem(KEY, next ? "escuro" : "claro");
  };
  return { dark, toggle };
}

/** Script inline para aplicar o tema salvo antes da primeira pintura. */
export const themeInitScript = `try{if(localStorage.getItem('${KEY}')==='escuro')document.documentElement.classList.add('dark')}catch(e){}`;
