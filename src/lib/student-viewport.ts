import { createContext, useContext } from "react";
import { useWindowDimensions } from "react-native";
export const StudentViewportContext = createContext<{
  width: number;
  height: number;
} | null>(null);
/** Page geometry follows the open desktop sidebar. CSS-style breakpoints still
 * follow the physical viewport, not the narrowed page. */
export function useStudentDimensions() {
  const window = useWindowDimensions();
  const page = useContext(StudentViewportContext);
  return {
    ...window,
    width: page?.width ?? window.width,
    height: page?.height ?? window.height,
    viewportWidth: window.width,
    viewportHeight: window.height,
  };
}
