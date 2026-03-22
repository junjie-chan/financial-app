import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../navigation/AppNavigator';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  showNotification?: boolean;
  showExport?: boolean;
  onBack?: () => void;
  onNotification?: () => void;
  onExport?: () => void;
  rightComponent?: React.ReactNode;
}

export default function Header({
  title,
  subtitle,
  showBack = false,
  showNotification = false,
  showExport = false,
  onBack,
  onNotification,
  onExport,
  rightComponent,
}: HeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.row}>
        {showBack && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        )}

        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>

        <View style={styles.rightActions}>
          {rightComponent}

          {showExport && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onExport}
              activeOpacity={0.7}
            >
              <Ionicons name="share-outline" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}

          {showNotification && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onNotification}
              activeOpacity={0.7}
            >
              <View>
                <Ionicons name="notifications-outline" size={22} color={COLORS.textSecondary} />
                <View style={styles.notificationDot} />
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: COLORS.card,
  },
  notificationDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.danger,
    borderWidth: 1.5,
    borderColor: COLORS.background,
  },
});
