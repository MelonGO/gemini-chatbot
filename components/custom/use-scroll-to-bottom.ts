import { useEffect, useRef, RefObject } from "react";

export function useScrollToBottom<T extends HTMLElement>(): [
  RefObject<T | null>,
  RefObject<T | null>,
] {
  const containerRef = useRef<T>(null);
  const endRef = useRef<T>(null);

  useEffect(() => {
    const container = containerRef.current;
    const end = endRef.current;

    if (container && end) {
      const observer = new MutationObserver(() => {
        // Don't auto-scroll if the user is focused on an input/textarea (e.g., editing a message)
        const activeElement = document.activeElement;
        const isEditing = activeElement?.tagName === "TEXTAREA" || activeElement?.tagName === "INPUT";
        if (isEditing) {
          return;
        }
        end.scrollIntoView({ behavior: "instant", block: "end" });
      });

      observer.observe(container, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
      });

      return () => observer.disconnect();
    }
  }, []);

  return [containerRef, endRef];
}
