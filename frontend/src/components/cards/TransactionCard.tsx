import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transaction, TransactionCategory } from '../../types';
import { COLORS } from '../../navigation/AppNavigator';

// ============================================================
// Category Icon & Color Maps
// ============================================================

const CATEGORY_CONFIG: Record<
  TransactionCategory,
  { icon: string; color: string; bg: string }
> = {
  Housing: { icon: 'home', color: '#00D4FF', bg: '#00D4FF20' },
  'Food & Dining': { icon: 'restaurant', color: '#FF6B35', bg: '#FF6B3520' },
  Transportation: { icon: 'car', color: '#A855F7', bg: '#A855F720' },
  Healthcare: { icon: 'medkit', color: '#00E676', bg: '#00E67620' },
  Entertainment: { icon: 'game-controller', color: '#FF5252', bg: '#FF525220' },
  Shopping: { icon: 'bag', color: '#FFB300', bg: '#FFB30020' },
  Education: { icon: 'school', color: '#00BCD4', bg: '#00BCD420' },
  Utilities: { icon: 'flash', color: '#FFC107', bg: '#FFC10720' },
  Travel: { icon: 'airplane', color: '#4CAF50', bg: '#4CAF5020' },
  'Personal Care': { icon: 'heart', color: '#E91E63', bg: '#E91E6320' },
  Insurance: { icon: 'shield-checkmark', color: '#607D8B', bg: '#607D8B20' },
  Investments: { icon: 'trending-up', color: '#00E676', bg: '#00E67620' },
  Savings: { icon: 'wallet', color: '#00D4FF', bg: '#00D4FF20' },
  'Debt Payment': { icon: 'receipt', color: '#FF5252', bg: '#FF525220' },
  Other: { icon: 'ellipsis-horizontal', color: '#8899AA', bg: '#8899AA20' },
};

interface TransactionCardProps {
  transaction: Transaction;
  onPress?: () => void;
  onDelete?: () => void;
  showDate?: boolean;
  compact?: boolean;
}

export default function TransactionCard({
  transaction,
  onPress,
  onDelete,
  showDate = true,
  compact = false,
}: TransactionCardProps) {
  const config = CATEGORY_CONFIG[transaction.category] || CATEGORY_CONFIG['Other'];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <TouchableOpacity
      style={[styles.card, compact && styles.compact]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Category Icon */}
      <View style={[styles.iconContainer, { backgroundColor: config.bg }]}>
        <Ionicons name={config.icon as any} size={compact ? 18 : 20} color={config.color} />
      </View>

      {/* Transaction Info */}
      <View style={styles.info}>
        <Text style={[styles.merchant, compact && styles.merchantCompact]} numberOfLines={1}>
          {transaction.merchant || 'Unknown'}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.category}>{transaction.category}</Text>
          {transaction.isOnline && (
            <>
              <Text style={styles.dot}>·</Text>
              <Ionicons name="globe-outline" size={11} color={COLORS.textMuted} />
              <Text style={styles.online}>Online</Text>
            </>
          )}
          {showDate && (
            <>
              <Text style={styles.dot}>·</Text>
              <Text style={styles.date}>{formatDate(transaction.date)}</Text>
            </>
          )}
        </View>
      </View>

      {/* Amount */}
      <View style={styles.amountContainer}>
        <Text style={styles.amount}>
          -{transaction.currency === 'USD' ? '$' : ''}{transaction.amount.toFixed(2)}
        </Text>
        {transaction.currency !== 'USD' && (
          <Text style={styles.usdAmount}>
            ${transaction.amountUSD.toFixed(2)}
          </Text>
        )}
      </View>

      {/* Delete button */}
      {onDelete && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={onDelete}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  compact: {
    padding: 10,
    marginBottom: 6,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  merchant: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  merchantCompact: {
    fontSize: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  category: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  dot: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  online: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  date: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.danger,
  },
  usdAmount: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  deleteButton: {
    padding: 6,
  },
});
