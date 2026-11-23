import React from "react";
import Svg, {
  Path,
  Circle,
  Line,
  Polyline,
  Polygon,
  Rect,
  Ellipse,
  G,
} from "react-native-svg";
const icons = require("../../../assets/lecture-pdf-icons.json") as Record<
  string,
  [string, Record<string, string>][]
>;
const nodes: Record<string, React.ElementType> = {
  path: Path,
  circle: Circle,
  line: Line,
  polyline: Polyline,
  polygon: Polygon,
  rect: Rect,
  ellipse: Ellipse,
};
function makeIcon(name: string, mirror = false) {
  return function PdfSourceIcon({
    size = 16,
    color = "currentColor",
  }: {
    size?: number;
    color?: string;
  }) {
    return (
      <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        color={color}
      >
        <G transform={mirror ? "translate(24 0) scale(-1 1)" : undefined}>
          {icons[name].map(([tag, attributes], index) => {
            const Component = nodes[tag];
            if (!Component) return null;
            const { key, ...props } = attributes;
            return (
              <Component
                key={key || index}
                {...props}
                stroke={props.stroke === "currentColor" ? color : props.stroke}
              />
            );
          })}
        </G>
      </Svg>
    );
  };
}
export const PdfPanelLeft = makeIcon("panel");
export const PdfRotateCcw = makeIcon("rotate");
export const PdfRotateCw = makeIcon("rotate", true);
export const PdfMinusCircle = makeIcon("minus");
export const PdfPlusCircle = makeIcon("plus");
export const PdfSearch = makeIcon("search");
export const PdfPrevious = makeIcon("previous");
export const PdfNext = makeIcon("next");
