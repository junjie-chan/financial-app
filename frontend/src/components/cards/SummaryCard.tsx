import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../navigation/AppNavigator';

interface SummaryCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: number; // percentage change
  icon?: string;
  accentColor?: string;
  gradient?: [string, string];
  onPress?: () => void;
  badge?: string;
  badgeColor?: string;
}

export default function SummaryCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  accentColor = COLORS.accent,
  gradient,
  onPress,
  badge,
  badgeColor,
}: SummaryCardProps) {
  const trendPositive = trend !== undefined && trend >= 0;
  const trendColor = trendPositive ? COLORS.success : COLORS.danger;

  const content = (
    <>
      {gradient ? (
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}

      <View style={styles.header}>
        {icon && (
          <View style={[styles.iconContainer, { backgroundColor: `${accentColor}20` }]}>
            <Ionicons name={icon as any} size={18} color={accentColor} />
          </View>
        )}
        <Text style={styles.title}>{title}</Text>
        {badge && (
          <View style={[styles.badge, { backgroundColor: `${badgeColor || accentColor}25` }]}>
            <Text style={[styles.badgeText, { color: badgeColor || accentColor }]}>{badge}</Text>
          </View>
        )}
      </View>

      <Text style={styles.value}>{value}</Text>

      <View style={styles.footer}>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        {trend !== undefined && (
          <View style={styles.trendContainer}>
            <Ionicons
              name={trendPositive ? 'trending-up' : 'trending-down'}
              size={14}
              color={trendColor}
            />
            <Text style={[styles.trendText, { color: trendColor }]}>
              {trendPositive ? '+' : ''}{trend.toFixed(1)}%
            </Text>
          </View>
        )}
      </View>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.card, gradient && styles.gradientCard]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.card, gradient && styles.gradientCard]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  gradientCard: {
    borderWidth: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    flex: 1,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
