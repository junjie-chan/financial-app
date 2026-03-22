import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { COLORS } from '../navigation/AppNavigator';
import { useFinancialStore } from '../store';
import { Transaction, TransactionCategory, RootStackParamList } from '../types';
import TransactionCard from '../components/cards/TransactionCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================
// Category Filter Chip
// ============================================================

function CategoryChip({
  label,
  selected,
  color,
  onPress,
}: {
  label: string;
  selected: boolean;
  color?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        selected && { backgroundColor: `${color || COLORS.accent}25`, borderColor: color || COLORS.accent },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.chipText, selected && { color: color || COLORS.accent }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ============================================================
// Add Transaction Modal
// ============================================================

interface AddTransactionModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id'>) => void;
}

const CATEGORIES: TransactionCategory[] = [
  'Housing', 'Food & Dining', 'Transportation', 'Healthcare',
  'Entertainment', 'Shopping', 'Education', 'Utilities',
  'Travel', 'Personal Care', 'Insurance', 'Other',
];

function AddTransactionModal({ visible, onClose, onSave }: AddTransactionModalProps) {
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState<TransactionCategory>('Food & Dining');
  const [notes, setNotes] = useState('');
  const [isOnline, setIsOnline] = useState(false);

  const handleSave = () => {
    if (!amount || isNaN(parseFloat(amount))) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    if (!merchant.trim()) {
      Alert.alert('Error', 'Please enter a merchant name');
      return;
    }

    onSave({
      amount: parseFloat(amount),
      amountUSD: parseFloat(amount),
      merchant,
      category,
      date: new Date().toISOString().split('T')[0],
      isOnline,
      currency: 'USD',
      notes,
      tags: [],
    });

    // Reset form
    setAmount('');
    setMerchant('');
    setCategory('Food & Dining');
    setNotes('');
    setIsOnline(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Expense</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Amount */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Amount (USD)</Text>
            <View style={styles.amountInput}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.amountField}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
          </View>

          {/* Merchant */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Merchant</Text>
            <TextInput
              style={styles.textInput}
              value={merchant}
              onChangeText={setMerchant}
              placeholder="e.g., Whole Foods"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          {/* Category */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryOption, category === cat && styles.categoryOptionSelected]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.categoryOptionText, category === cat && styles.categoryOptionTextSelected]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Online toggle */}
          <View style={styles.toggleRow}>
            <Text style={styles.inputLabel}>Online Purchase</Text>
            <TouchableOpacity
              style={[styles.toggle, isOnline && styles.toggleActive]}
              onPress={() => setIsOnline(!isOnline)}
            >
              <View style={[styles.toggleThumb, isOnline && styles.toggleThumbActive]} />
            </TouchableOpacity>
          </View>

          {/* Notes */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Notes (optional)</Text>
            <TextInput
              style={[styles.textInput, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add notes..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={2}
            />
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Expense</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ============================================================
// Expense Screen
// ============================================================

export default function ExpenseScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { transactions, deleteTransaction, addTransaction } = useFinancialStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TransactionCategory | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');

  // Filter & sort transactions
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.merchant?.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.notes?.toLowerCase().includes(q)
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }

    filtered.sort((a, b) => {
      if (sortBy === 'date') return new Date(b.date).getTime() - new Date(a.date).getTime();
      return b.amount - a.amount;
    });

    return filtered;
  }, [transactions, searchQuery, selectedCategory, sortBy]);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};
    transactions.forEach((t) => {
      breakdown[t.category] = (breakdown[t.category] || 0) + t.amountUSD;
    });
    return Object.entries(breakdown)
      .map(([cat, amt]) => ({ category: cat, amount: amt }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);
  }, [transactions]);

  const totalExpenses = transactions.reduce((sum, t) => sum + t.amountUSD, 0);

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteTransaction(id),
        },
      ]
    );
  };

  const handleAddTransaction = (transaction: Omit<Transaction, 'id'>) => {
    addTransaction({
      ...transaction,
      id: Date.now().toString(),
    });
  };

  const uniqueCategories = Array.from(new Set(transactions.map((t) => t.category)));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Expenses</Text>
          <Text style={styles.headerSubtitle}>
            ${totalExpenses.toLocaleString('en-US', { maximumFractionDigits: 2 })} total
          </Text>
        </View>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setSortBy(sortBy === 'date' ? 'amount' : 'date')}
        >
          <Ionicons name="swap-vertical" size={18} color={COLORS.textSecondary} />
          <Text style={styles.sortText}>{sortBy === 'date' ? 'Date' : 'Amount'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search transactions..."
            placeholderTextColor={COLORS.textMuted}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Category Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>By Category</Text>
          <View style={styles.categoryGrid}>
            {categoryBreakdown.map(({ category, amount }) => {
              const pct = (amount / totalExpenses) * 100;
              return (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryCard,
                    selectedCategory === category && styles.categoryCardSelected,
                  ]}
                  onPress={() =>
                    setSelectedCategory(
                      selectedCategory === category ? null : category as TransactionCategory
                    )
                  }
                >
                  <Text style={styles.categoryName} numberOfLines={1}>
                    {category}
                  </Text>
                  <Text style={styles.categoryAmount}>
                    ${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </Text>
                  <Text style={styles.categoryPct}>{pct.toFixed(1)}%</Text>
                  <View style={styles.categoryProgressTrack}>
                    <View style={[styles.categoryProgressFill, { width: `${Math.min(pct * 3, 100)}%` }]} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Category Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          <CategoryChip
            label="All"
            selected={!selectedCategory}
            onPress={() => setSelectedCategory(null)}
          />
          {uniqueCategories.map((cat) => (
            <CategoryChip
              key={cat}
              label={cat}
              selected={selectedCategory === cat}
              onPress={() =>
                setSelectedCategory(selectedCategory === cat ? null : cat as TransactionCategory)
              }
            />
          ))}
        </ScrollView>

        {/* Transactions List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {filteredTransactions.length} Transactions
            {selectedCategory && ` · ${selectedCategory}`}
          </Text>
          {filteredTransactions.map((transaction) => (
            <TransactionCard
              key={transaction.id}
              transaction={transaction}
              onDelete={() => handleDelete(transaction.id)}
            />
          ))}
          {filteredTransactions.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyStateTitle}>No transactions found</Text>
              <Text style={styles.emptyStateSubtitle}>
                {searchQuery ? 'Try a different search term' : 'Add your first expense!'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <View style={[styles.fab, { bottom: insets.bottom + 20 }]}>
        <TouchableOpacity
          style={styles.fabSecondary}
          onPress={() => navigation.navigate('ReceiptScan')}
        >
          <Ionicons name="scan" size={22} color={COLORS.accent} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.fabPrimary}
          onPress={() => setShowModal(true)}
        >
          <Ionicons name="add" size={28} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Add Transaction Modal */}
      <AddTransactionModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleAddTransaction}
      />
    </View>
  );
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.card,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sortText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  scroll: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    margin: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryCard: {
    width: (SCREEN_WIDTH - 56) / 3,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryCardSelected: {
    borderColor: COLORS.accent,
    backgroundColor: `${COLORS.accent}10`,
  },
  categoryName: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 6,
    fontWeight: '500',
  },
  categoryAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  categoryPct: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  categoryProgressTrack: {
    height: 3,
    backgroundColor: COLORS.border,
    borderRadius: 2,
  },
  categoryProgressFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 2,
  },
  filterScroll: {
    marginBottom: 8,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  emptyStateSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  fabPrimary: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  fabSecondary: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: `${COLORS.accent}40`,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginRight: 4,
  },
  amountField: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    paddingVertical: 14,
  },
  textInput: {
    backgroundColor: COLORS.background,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  notesInput: {
    height: 70,
    textAlignVertical: 'top',
  },
  categoryScroll: {
    marginTop: 4,
  },
  categoryOption: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryOptionSelected: {
    backgroundColor: `${COLORS.accent}20`,
    borderColor: COLORS.accent,
  },
  categoryOptionText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  categoryOptionTextSelected: {
    color: COLORS.accent,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    padding: 3,
  },
  toggleActive: {
    backgroundColor: COLORS.accent,
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.textSecondary,
  },
  toggleThumbActive: {
    backgroundColor: '#000',
    alignSelf: 'flex-end',
  },
  saveButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
});
