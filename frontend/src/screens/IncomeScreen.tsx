import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS } from '../navigation/AppNavigator';
import { useFinancialStore } from '../store';
import { Income, IncomeSource, IncomeFrequency } from '../types';

const SOURCE_ICONS: Record<string, string> = {
  salary: 'briefcase',
  freelance: 'laptop',
  business: 'business',
  investment: 'trending-up',
  rental: 'home',
  pension: 'shield-checkmark',
  gift: 'gift',
  other: 'ellipsis-horizontal',
};

const SOURCE_COLORS: Record<string, string> = {
  salary: COLORS.accent,
  freelance: '#A855F7',
  business: '#FF6B35',
  investment: COLORS.success,
  rental: '#FFB300',
  pension: '#4CAF50',
  gift: '#E91E63',
  other: COLORS.textSecondary,
};

const SOURCES: IncomeSource[] = [
  'salary', 'freelance', 'business', 'investment', 'rental', 'pension', 'gift', 'other'
];

const FREQUENCIES: IncomeFrequency[] = [
  'one-time', 'weekly', 'bi-weekly', 'monthly', 'quarterly', 'annually'
];

export default function IncomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { income, addIncome, deleteIncome } = useFinancialStore();

  const [showModal, setShowModal] = useState(false);

  // Form state
  const [formAmount, setFormAmount] = useState('');
  const [formSource, setFormSource] = useState<IncomeSource>('salary');
  const [formDescription, setFormDescription] = useState('');
  const [formFrequency, setFormFrequency] = useState<IncomeFrequency>('monthly');
  const [formIsRecurring, setFormIsRecurring] = useState(true);

  const totalMonthly = income.reduce((sum, inc) => {
    const multipliers: Record<IncomeFrequency, number> = {
      'one-time': 0,
      'daily': 30,
      'weekly': 4.33,
      'bi-weekly': 2.17,
      'monthly': 1,
      'quarterly': 0.333,
      'annually': 0.0833,
    };
    return sum + inc.amountUSD * (multipliers[inc.frequency] || 1);
  }, 0);

  const totalAnnual = totalMonthly * 12;

  const handleSave = () => {
    if (!formAmount || isNaN(parseFloat(formAmount))) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const newIncome: Income = {
      id: Date.now().toString(),
      amount: parseFloat(formAmount),
      amountUSD: parseFloat(formAmount),
      source: formSource,
      sourceName: formDescription || formSource,
      date: new Date().toISOString().split('T')[0],
      frequency: formFrequency,
      currency: 'USD',
      isRecurring: formIsRecurring,
    };

    addIncome(newIncome);
    setShowModal(false);

    // Reset form
    setFormAmount('');
    setFormDescription('');
    setFormSource('salary');
    setFormFrequency('monthly');
    setFormIsRecurring(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Income', 'Remove this income source?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteIncome(id) },
    ]);
  };

  const getMonthlyAmount = (inc: Income): number => {
    const multipliers: Record<IncomeFrequency, number> = {
      'one-time': 0,
      'daily': 30,
      'weekly': 4.33,
      'bi-weekly': 2.17,
      'monthly': 1,
      'quarterly': 0.333,
      'annually': 0.0833,
    };
    return inc.amountUSD * (multipliers[inc.frequency] || 1);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Income</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowModal(true)}>
          <Ionicons name="add" size={22} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Card */}
        <LinearGradient
          colors={['#0D2A1A', '#081510']}
          style={styles.summaryCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.summaryLabel}>Estimated Monthly Income</Text>
          <Text style={styles.summaryValue}>
            ${totalMonthly.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </Text>
          <Text style={styles.summaryAnnual}>
            ${totalAnnual.toLocaleString('en-US', { maximumFractionDigits: 0 })} annually
          </Text>

          <View style={styles.sourceSummaryRow}>
            {income.slice(0, 3).map((inc) => {
              const pct = totalMonthly > 0 ? (getMonthlyAmount(inc) / totalMonthly) * 100 : 0;
              return (
                <View key={inc.id} style={styles.sourceSummaryItem}>
                  <Text style={[styles.sourceSummaryPct, { color: SOURCE_COLORS[inc.source] || COLORS.accent }]}>
                    {pct.toFixed(0)}%
                  </Text>
                  <Text style={styles.sourceSummaryLabel}>{inc.source}</Text>
                </View>
              );
            })}
          </View>
        </LinearGradient>

        {/* Income Sources */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Income Sources</Text>
          {income.map((inc) => (
            <View key={inc.id} style={styles.incomeCard}>
              <View style={[styles.sourceIcon, { backgroundColor: `${SOURCE_COLORS[inc.source] || COLORS.accent}20` }]}>
                <Ionicons
                  name={(SOURCE_ICONS[inc.source] || 'cash') as any}
                  size={20}
                  color={SOURCE_COLORS[inc.source] || COLORS.accent}
                />
              </View>
              <View style={styles.incomeInfo}>
                <Text style={styles.incomeName}>{inc.sourceName || inc.source}</Text>
                <View style={styles.incomeMetaRow}>
                  <Text style={styles.incomeMeta}>{inc.frequency}</Text>
                  {inc.isRecurring && (
                    <>
                      <Text style={styles.metaDot}>·</Text>
                      <Ionicons name="refresh" size={11} color={COLORS.success} />
                      <Text style={[styles.incomeMeta, { color: COLORS.success }]}>Recurring</Text>
                    </>
                  )}
                </View>
              </View>
              <View style={styles.incomeAmountContainer}>
                <Text style={styles.incomeAmount}>
                  ${inc.amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </Text>
                <Text style={styles.incomeFrequency}>/{inc.frequency}</Text>
                <Text style={styles.incomeMonthly}>
                  ${getMonthlyAmount(inc).toFixed(0)}/mo
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(inc.id)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          ))}

          {income.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="cash-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No income sources</Text>
              <Text style={styles.emptySubtitle}>Add your income sources to track your earnings</Text>
            </View>
          )}
        </View>

        {/* Profession Benchmark */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profession Benchmark</Text>
          <View style={styles.benchmarkCard}>
            <Text style={styles.benchmarkTitle}>Senior Software Engineer · San Francisco</Text>
            <View style={styles.benchmarkRow}>
              <View style={styles.benchmarkItem}>
                <Text style={styles.benchmarkLabel}>P25</Text>
                <Text style={styles.benchmarkValue}>$8,500</Text>
                <Text style={styles.benchmarkSub}>monthly</Text>
              </View>
              <View style={[styles.benchmarkItem, styles.benchmarkHighlight]}>
                <Text style={[styles.benchmarkLabel, { color: COLORS.accent }]}>Median</Text>
                <Text style={[styles.benchmarkValue, { color: COLORS.accent }]}>$10,200</Text>
                <Text style={styles.benchmarkSub}>monthly</Text>
              </View>
              <View style={styles.benchmarkItem}>
                <Text style={styles.benchmarkLabel}>P75</Text>
                <Text style={styles.benchmarkValue}>$14,000</Text>
                <Text style={styles.benchmarkSub}>monthly</Text>
              </View>
              <View style={styles.benchmarkItem}>
                <Text style={styles.benchmarkLabel}>P90</Text>
                <Text style={styles.benchmarkValue}>$18,500</Text>
                <Text style={styles.benchmarkSub}>monthly</Text>
              </View>
            </View>
            <View style={styles.yourPositionBar}>
              <Text style={styles.yourPositionLabel}>Your position</Text>
              <View style={styles.positionTrack}>
                <View style={[styles.positionFill, { width: '70%' }]} />
                <View style={styles.positionMarker} />
              </View>
              <View style={styles.positionLabels}>
                <Text style={styles.positionLabelText}>P25</Text>
                <Text style={[styles.positionLabelText, { color: COLORS.success }]}>+18.5% above median</Text>
                <Text style={styles.positionLabelText}>P90</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Add Income Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Income</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Amount */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Amount</Text>
                <View style={styles.amountRow}>
                  <Text style={styles.dollarSign}>$</Text>
                  <TextInput
                    style={styles.amountField}
                    value={formAmount}
                    onChangeText={setFormAmount}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={COLORS.textMuted}
                  />
                </View>
              </View>

              {/* Source */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Source</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {SOURCES.map((src) => (
                    <TouchableOpacity
                      key={src}
                      style={[styles.sourceOption, formSource === src && styles.sourceOptionSelected]}
                      onPress={() => setFormSource(src)}
                    >
                      <Ionicons
                        name={(SOURCE_ICONS[src] || 'cash') as any}
                        size={16}
                        color={formSource === src ? '#000' : COLORS.textSecondary}
                      />
                      <Text style={[styles.sourceOptionText, formSource === src && styles.sourceOptionTextSelected]}>
                        {src}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Description */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={styles.textInput}
                  value={formDescription}
                  onChangeText={setFormDescription}
                  placeholder="e.g., Tech Corp salary"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>

              {/* Frequency */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Frequency</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {FREQUENCIES.map((freq) => (
                    <TouchableOpacity
                      key={freq}
                      style={[styles.freqOption, formFrequency === freq && styles.freqOptionSelected]}
                      onPress={() => setFormFrequency(freq)}
                    >
                      <Text style={[styles.freqOptionText, formFrequency === freq && styles.freqOptionTextSelected]}>
                        {freq}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Recurring Toggle */}
              <View style={styles.toggleRow}>
                <Text style={styles.inputLabel}>Recurring</Text>
                <TouchableOpacity
                  style={[styles.toggle, formIsRecurring && styles.toggleActive]}
                  onPress={() => setFormIsRecurring(!formIsRecurring)}
                >
                  <View style={[styles.toggleThumb, formIsRecurring && styles.toggleThumbActive]} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Add Income</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  addButton: {
    width: 40, height: 40, borderRadius: 14,
    backgroundColor: COLORS.success, alignItems: 'center', justifyContent: 'center',
  },
  scroll: { flex: 1 },
  summaryCard: {
    margin: 20, borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: `${COLORS.success}30`,
  },
  summaryLabel: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 8 },
  summaryValue: { fontSize: 36, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -1 },
  summaryAnnual: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4, marginBottom: 16 },
  sourceSummaryRow: { flexDirection: 'row', gap: 20 },
  sourceSummaryItem: { alignItems: 'center' },
  sourceSummaryPct: { fontSize: 18, fontWeight: '700' },
  sourceSummaryLabel: { fontSize: 11, color: COLORS.textMuted, textTransform: 'capitalize' },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: {
    fontSize: 14, fontWeight: '700', color: COLORS.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12,
  },
  incomeCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.card, borderRadius: 14, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: COLORS.border, gap: 12,
  },
  sourceIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  incomeInfo: { flex: 1 },
  incomeName: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 4 },
  incomeMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  incomeMeta: { fontSize: 12, color: COLORS.textSecondary, textTransform: 'capitalize' },
  metaDot: { fontSize: 12, color: COLORS.textMuted },
  incomeAmountContainer: { alignItems: 'flex-end' },
  incomeAmount: { fontSize: 15, fontWeight: '700', color: COLORS.success },
  incomeFrequency: { fontSize: 11, color: COLORS.textMuted },
  incomeMonthly: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  deleteBtn: { padding: 6 },
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: COLORS.textSecondary },
  emptySubtitle: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center' },
  benchmarkCard: {
    backgroundColor: COLORS.card, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  benchmarkTitle: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 14 },
  benchmarkRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  benchmarkItem: { alignItems: 'center', flex: 1 },
  benchmarkHighlight: {
    backgroundColor: `${COLORS.accent}10`, borderRadius: 10, padding: 8,
  },
  benchmarkLabel: { fontSize: 11, color: COLORS.textMuted, marginBottom: 4 },
  benchmarkValue: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  benchmarkSub: { fontSize: 10, color: COLORS.textMuted },
  yourPositionBar: { marginTop: 8 },
  yourPositionLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 6 },
  positionTrack: {
    height: 6, backgroundColor: COLORS.border, borderRadius: 3, marginBottom: 4,
  },
  positionFill: { height: '100%', backgroundColor: COLORS.success, borderRadius: 3 },
  positionMarker: {
    position: 'absolute', right: '30%', top: -4,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: COLORS.success, borderWidth: 2, borderColor: COLORS.background,
  },
  positionLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  positionLabelText: { fontSize: 11, color: COLORS.textMuted },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContainer: {
    backgroundColor: COLORS.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40, maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  inputGroup: { marginBottom: 16 },
  inputLabel: {
    fontSize: 12, fontWeight: '600', color: COLORS.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
  },
  amountRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.background, borderRadius: 14, paddingLeft: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  dollarSign: { fontSize: 20, fontWeight: '700', color: COLORS.textSecondary, marginRight: 4 },
  amountField: { flex: 1, fontSize: 24, fontWeight: '700', color: COLORS.textPrimary, paddingVertical: 14 },
  textInput: {
    backgroundColor: COLORS.background, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 15, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.border,
  },
  sourceOption: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    backgroundColor: COLORS.background, marginRight: 8, borderWidth: 1, borderColor: COLORS.border,
  },
  sourceOptionSelected: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  sourceOptionText: { fontSize: 13, color: COLORS.textSecondary, textTransform: 'capitalize' },
  sourceOptionTextSelected: { color: '#000', fontWeight: '600' },
  freqOption: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    backgroundColor: COLORS.background, marginRight: 8, borderWidth: 1, borderColor: COLORS.border,
  },
  freqOptionSelected: { backgroundColor: `${COLORS.accent}25`, borderColor: COLORS.accent },
  freqOptionText: { fontSize: 13, color: COLORS.textSecondary, textTransform: 'capitalize' },
  freqOptionTextSelected: { color: COLORS.accent, fontWeight: '600' },
  toggleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
  },
  toggle: {
    width: 50, height: 28, borderRadius: 14, backgroundColor: COLORS.border,
    justifyContent: 'center', padding: 3,
  },
  toggleActive: { backgroundColor: COLORS.accent },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.textSecondary },
  toggleThumbActive: { backgroundColor: '#000', alignSelf: 'flex-end' },
  saveButton: {
    backgroundColor: COLORS.success, borderRadius: 16, paddingVertical: 16,
    alignItems: 'center', marginTop: 8,
  },
  saveButtonText: { fontSize: 16, fontWeight: '700', color: '#000' },
});
