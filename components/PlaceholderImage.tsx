import { View } from 'react-native';

type PlaceholderImageProps = {
  width: number | string;
  height: number | string;
  borderRadius?: number;
  backgroundColor?: string;
};

const PlaceholderImage = ({
  width,
  height,
  borderRadius = 0,
  backgroundColor = '#e5e7eb',
}: PlaceholderImageProps) => {
  return (
    <View
      style={{
        width: Number(width),
        height: Number(height),
        borderRadius,
        backgroundColor,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    />
  );
};

export default PlaceholderImage;
