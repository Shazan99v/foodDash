import React from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  colors,
  radius,
  spacing,
} from '../../constants/theme';

type SearchBarProps = {
  value?: string;
  onChangeText?: (text: string) => void;
  onFilterPress?: () => void;
};

export default function SearchBar({
  value = '',
  onChangeText,
  onFilterPress,
}: SearchBarProps) {
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const hasSearch = value.trim().length > 0;

  const handleClear = () => {
    onChangeText?.('');
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.searchBox,
          isCompact && styles.searchBoxCompact,
          hasSearch && styles.searchBoxActive,
        ]}
      >
        <View
          style={[
            styles.searchIcon,
            hasSearch && styles.searchIconActive,
          ]}
        >
          <Ionicons
            name="search"
            size={19}
            color={hasSearch ? colors.secondary : colors.textSecondary}
          />
        </View>

        <TextInput
          value={value}
          onChangeText={onChangeText}
          style={styles.input}
          placeholder="Search food or restaurants"
          placeholderTextColor={colors.textLight}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          selectionColor={colors.primary}
          accessibilityLabel="Search food or restaurants"
        />

        {hasSearch ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            activeOpacity={0.7}
            onPress={handleClear}
            style={styles.actionButton}
          >
            <Ionicons
              name="close-circle"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Open filters"
            activeOpacity={0.78}
            onPress={onFilterPress}
            style={styles.filterButton}
          >
            <Ionicons
              name="options-outline"
              size={19}
              color={colors.background}
            />
          </TouchableOpacity>
        )}
      </View>

      {hasSearch && (
        <View style={styles.searchStatus}>
          <View style={styles.statusDot} />
          <View style={styles.statusLine} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    backgroundColor: colors.background,
  },

  searchBox: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.sm,
    paddingRight: 7,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },

  searchBoxCompact: {
    minHeight: 54,
  },

  searchBoxActive: {
    borderColor: colors.primary,
  },

  searchIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },

  searchIconActive: {
    backgroundColor: '#C6F54A12',
  },

  input: {
    flex: 1,
    minWidth: 0,
    height: 48,
    marginLeft: spacing.md,
    marginRight: spacing.xs,
    paddingVertical: 0,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },

  actionButton: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  filterButton: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchStatus: {
    height: 3,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    marginLeft: spacing.md,
    marginRight: spacing.md,
  },

  statusDot: {
    width: 5,
    height: 3,
    borderRadius: radius.round,
    backgroundColor: colors.primary,
  },

  statusLine: {
    flex: 1,
    height: 1,
    marginLeft: 5,
    backgroundColor: colors.border,
  },
});