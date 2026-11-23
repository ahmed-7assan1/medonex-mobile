import { useRef, useState } from "react";
import { View } from "react-native";
export function usePdfPopoverGeometry() {
  const root = useRef<View | null>(null),
    search = useRef<View | null>(null),
    zoom = useRef<View | null>(null);
  const [searchBox, setSearchBox] = useState({
      top: 84,
      right: 88,
      width: 288,
    }),
    [zoomBox, setZoomBox] = useState({ top: 84, right: 128, width: 128 });
  const measure = (kind: "search" | "zoom") => {
    const anchor = kind === "search" ? search.current : zoom.current;
    anchor?.measureInWindow((x, y, width, height) =>
      root.current?.measureInWindow((rx, ry, rw, rh) => {
        if (!rw || !rh) return;
        const popupWidth = Math.min(kind === "search" ? 288 : 128, rw - 16),
          popupHeight = kind === "search" ? 158 : 266;
        let left = kind === "search" ? x + width - popupWidth - rx : x - rx;
        left = Math.max(8, Math.min(rw - popupWidth - 8, left));
        let top = y + height + 4 - ry;
        if (top + popupHeight > rh - 8 && y - ry - popupHeight - 4 >= 8)
          top = y - ry - popupHeight - 4;
        const box = {
          top: Math.max(8, top),
          right: rw - left - popupWidth,
          width: popupWidth,
        };
        if (kind === "search") setSearchBox(box);
        else setZoomBox(box);
      })
    );
  };
  return { root, search, zoom, searchBox, zoomBox, measure };
}
