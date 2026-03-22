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

interface InsightCardProps {
  title: string;
  description: string;
  type?: 'info' | 'warning' | 'success' | 'danger' | 'ai';
  icon?: string;
  onPress?: () => void;
  onDismiss?: () => void;
  score?: number;
  compact?: boolean;
}

const TYPE_CONFIG = {
  info: {
    gradient: ['#0D1D35', '#0A1A2E'] as [string, string],
    iconColor: COLORS.accent,
    borderColor: `${COLORS.accent}40`,
    icon: 'information-circle',
  },
  warning: {
    gradient: ['#2A1F08', '#1E1505'] as [string, string],
    iconColor: COLORS.warning,
    borderColor: `${COLORS.warning}40`,
    icon: 'warning',
  },
  success: {
    gradient: ['#0A1F15', '#071510'] as [string, string],
    iconColor: COLORS.success,
    borderColor: `${COLORS.success}40`,
    icon: 'checkmark-circle',
  },
  danger: {
    gradient: ['#2A0D0D', '#1E0808'] as [string, string],
    iconColor: COLORS.danger,
    borderColor: `${COLORS.danger}40`,
    icon: 'alert-circle',
  },
  ai: {
    gradient: ['#0D0D2A', '#08081E'] as [string, string],
    iconColor: '#9B59F5',
    borderColor: '#9B59F540',
    icon: 'sparkles',
  },
};

export default function InsightCard({
  title,
  description,
  type = 'info',
  icon,
  onPress,
  onDismiss,
  score,
  compact = false,
}: InsightCardProps) {
  const config = TYPE_CONFIG[type];
  const iconName = (icon || config.icon) as any;

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.8 : 1}
      onPress={onPress}
      style={[styles.card, { borderColor: config.borderColor }]}
    >
      <LinearGradient
        colors={config.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={[styles.iconBadge, { backgroundColor: `${config.iconColor}20` }]}>
            <Ionicons name={iconName} size={18} color={config.iconColor} />
          </View>
          <Text style={[styles.title, { color: config.iconColor }]}>{title}</Text>

          {score !== undefined && (
            <View style={[styles.scoreBadge, { backgroundColor: `${config.iconColor}20` }]}>
              <Text style={[styles.scoreText, { color: config.iconColor }]}>{score}/100</Text>
            </View>
          )}

          {onDismiss && (
            <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
              <Ionicons name="close" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <Text
          style={[styles.description, compact && styles.descriptionCompact]}
          numberOfLines={compact ? 2 : undefined}
        >
          {description}
        </Text>

        {onPress && (
          <View style={styles.tapHint}>
            <Text style={[styles.tapText, { color: config.iconColor }]}>Read more</Text>
            <Ionicons name="chevron-forward" size={14} color={config.iconColor} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 12,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scoreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  scoreText: {
    fontSize: 13,
    fontWeight: '700',
  },
  dismissButton: {
    padding: 4,
  },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  descriptionCompact: {
    fontSize: 13,
  },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 4,
  },
  tapText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
