import React, {
  createContext,
  useContext,
  useLayoutEffect,
  useState,
} from "react";
import { View } from "react-native";
// Route controls that must sit above the shared phone capsule, without a Modal
// intercepting the rest of the page. The common chrome owns this one host.
export const StudentOverlayContext = createContext<
  React.Dispatch<React.SetStateAction<React.ReactNode>>
>(() => {});
export function StudentOverlay({ children }: { children: React.ReactNode }) {
  const setOverlay = useContext(StudentOverlayContext);
  useLayoutEffect(() => {
    setOverlay(children);
    return () => setOverlay(null);
  }, [children, setOverlay]);
  return null;
}

export function StudentOverlayProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [overlay, setOverlay] = useState<React.ReactNode>(null);
  return (
    <StudentOverlayContext.Provider value={setOverlay}>
      <View style={{ flex: 1 }}>
        {children}
        {overlay && (
          <View
            pointerEvents="box-none"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              zIndex: 2000,
              elevation: 30,
            }}
          >
            {overlay}
          </View>
        )}
      </View>
    </StudentOverlayContext.Provider>
  );
}
