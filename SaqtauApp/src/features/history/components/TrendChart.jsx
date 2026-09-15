import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import {
  Circle,
  Line,
  Path,
  Svg,
} from 'react-native-svg';

const HEIGHT = 142;
const H_PADDING = 14;
const V_PADDING = 18;

function buildPath(points, width) {
  if (!points.length || width <= 0) {
    return { path: '', coordinates: [] };
  }

  const values = points.map((point) => point.value);
  let min = Math.min(...values);
  let max = Math.max(...values);

  if (min === max) {
    min -= 4;
    max += 4;
  }

  const chartWidth = Math.max(1, width - H_PADDING * 2);
  const chartHeight = HEIGHT - V_PADDING * 2;

  const coordinates = points.map((point, index) => {
    const x =
      H_PADDING +
      (points.length === 1
        ? chartWidth / 2
        : (index / (points.length - 1)) * chartWidth);

    const ratio = (point.value - min) / (max - min);
    const y = V_PADDING + (1 - ratio) * chartHeight;

    return { x, y };
  });

  const path = coordinates
    .map(
      ({ x, y }, index) =>
        `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`,
    )
    .join(' ');

  return { path, coordinates };
}

export default function TrendChart({ points }) {
  const [width, setWidth] = useState(0);

  const { path, coordinates } = useMemo(
    () => buildPath(points, width),
    [points, width],
  );

  return (
    <View
      className="mt-4 overflow-hidden rounded-[14px] bg-[#E7E6E7]"
      onLayout={(event) => {
        setWidth(event.nativeEvent.layout.width);
      }}
    >
      {points.length ? (
        <Svg width={width} height={HEIGHT}>
          {[0.25, 0.5, 0.75].map((ratio) => (
            <Line
              key={ratio}
              x1={12}
              x2={Math.max(12, width - 12)}
              y1={HEIGHT * ratio}
              y2={HEIGHT * ratio}
              stroke="#CAC7CE"
              strokeWidth={1}
              strokeDasharray="4 6"
            />
          ))}

          <Path
            d={path}
            fill="none"
            stroke="#181027"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {coordinates.map((point, index) => (
            <Circle
              key={`${point.x}-${point.y}-${index}`}
              cx={point.x}
              cy={point.y}
              r={3.5}
              fill="#181027"
            />
          ))}
        </Svg>
      ) : (
        <View className="h-[142px] items-center justify-center px-5">
          <Text className="text-center font-inter-medium text-[13px] leading-[19px] text-[#8E879B]">
            More completed check-ins will build your trend here.
          </Text>
        </View>
      )}
    </View>
  );
}
