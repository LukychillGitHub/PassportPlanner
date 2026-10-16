import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../theme';

type Props = {
  rating: number;
  onChange?: (rating: number) => void;
  size?: number;
  readOnly?: boolean;
};

export function StarRating({ rating, onChange, size = 28, readOnly = false }: Props) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <View style={styles.row}>
      {stars.map((value) => {
        const filled = value <= rating;
        const Star = (
          <Text style={[styles.star, { fontSize: size, color: filled ? colors.gold : colors.cardBorder }]}>
            ★
          </Text>
        );
        if (readOnly) {
          return <View key={value}>{Star}</View>;
        }
        return (
          <TouchableOpacity
            key={value}
            onPress={() => onChange?.(value)}
            hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
            accessibilityLabel={`${value} estrellas`}
          >
            {Star}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 4,
  },
  star: {
    marginHorizontal: 1,
  },
});
