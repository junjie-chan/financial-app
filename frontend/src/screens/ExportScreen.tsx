import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { COLORS } from '../navigation/AppNavigator';
import { useFinancialStore } from '../store';
import { exportService } from '../services/export.service';

type DatePreset = '7d' | '30d' | '90d' | '1y' | 'custom';

export default function ExportScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { transactions, income, investments, latestAnalysis } = useFinancialStore();

  const [selectedPreset, setSelectedPreset] = useState<DatePreset>('30d');
  const [includeTransactions, setIncludeTransactions] = useState(true);
  const [includeIncome, setIncludeIncome] = useState(true);
  const [includeInvestments, setIncludeInvestments] = useState(true);
  const [includeAnalysis, setIncludeAnalysis] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const getDateRange = (preset: DatePreset): { start: string; end: string } => {
    const end = new Date();
    const start = new Date();

    switch (preset) {
      case '7d':
        start.setDate(end.getDate() - 7);
        break;
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case '90d':
        start.setDate(end.getDate() - 90);
        break;
      case '1y':
        start.setFullYear(end.getFullYear() - 1);
        break;
    }

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  };

  const dateRange = getDateRange(selectedPreset);

  // Count selected items
  const filteredTransactions = transactions.filter(
    (t) => t.date >= dateRange.start && t.date <= dateRange.end
  );
  const filteredIncome = income.filter(
    (i) => i.date >= dateRange.start && i.date <= dateRange.end
  );

  const totalRecords =
    (includeTransactions ? filteredTransactions.length : 0) +
    (includeIncome ? filteredIncome.length : 0) +
    (includeInvestments ? investments.length : 0) +
    (includeAnalysis && latestAnalysis ? 1 : 0);

  const handleExport = async (format: 'csv' | 'report') => {
    if (totalRecords === 0) {
      Alert.alert('No Data', 'No data to export for the selected criteria.');
      return;
    }

    setIsExporting(true);
    try {
      if (format === 'csv') {
        if (includeTransactions && filteredTransactions.length > 0) {
          await exportService.exportTransactionsCSV(filteredTransactions);
        } else if (includeIncome && filteredIncome.length > 0) {
          await exportService.exportIncomeCSV(filteredIncome);
        } else if (includeInvestments && investments.length > 0) {
          await exportService.exportInvestmentsCSV(investments);
        }
      } else if (format === 'report') {
        await exportService.exportAllData(
          filteredTransactions,
          filteredIncome,
          investments,
          latestAnalysis,
          dateRange
        );
      }
    } catch (error: any) {
      Alert.alert('Export Failed', error.message || 'An error occurred during export');
    } finally {
      setIsExporting(false);
    }
  };

  const presets: { label: string; value: DatePreset }[] = [
    { label: 'Last 7 Days', value: '7d' },
    { label: 'Last 30 Days', value: '30d' },
    { label: 'Last 90 Days', value: '90d' },
    { label: 'Last Year', value: '1y' },
  ];

  const toggleOption = (
    current: boolean,
    setter: (v: boolean) => void
  ) => setter(!current);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Export Data</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Date Range */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date Range</Text>
          <View style={styles.presetGrid}>
            {presets.map((preset) => (
              <TouchableOpacity
                key={preset.value}
                style={[
                  styles.presetButton,
                  selectedPreset === preset.value && styles.presetButtonActive,
                ]}
                onPress={() => setSelectedPreset(preset.value)}
              >
                <Text
                  style={[
                    styles.presetText,
                    selectedPreset === preset.value && styles.presetTextActive,
                  ]}
                >
                  {preset.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.dateRangeDisplay}>
            <Ionicons name="calendar-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.dateRangeText}>
              {dateRange.start} → {dateRange.end}
            </Text>
          </View>
        </View>

        {/* Data Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Include Data</Text>
          <View style={styles.card}>
            {[
              {
                label: 'Transactions',
                value: includeTransactions,
                count: filteredTransactions.length,
                icon: 'receipt-outline',
                color: COLORS.danger,
                setter: setIncludeTransactions,
              },
              {
                label: 'Income',
                value: includeIncome,
                count: filteredIncome.length,
                icon: 'cash-outline',
                color: COLORS.success,
                setter: setIncludeIncome,
              },
              {
                label: 'Investments',
                value: includeInvestments,
                count: investments.length,
                icon: 'trending-up-outline',
                color: COLORS.accent,
                setter: setIncludeInvestments,
              },
              {
                label: 'AI Analysis Report',
                value: includeAnalysis,
                count: latestAnalysis ? 1 : 0,
                icon: 'analytics-outline',
                color: '#9B59F5',
                setter: setIncludeAnalysis,
              },
            ].map((item) => (
              <TouchableOpacity
                key={item.label}
                style={styles.dataOption}
                onPress={() => toggleOption(item.value, item.setter)}
                activeOpacity={0.7}
              >
                <View style={[styles.dataIcon, { backgroundColor: `${item.color}20` }]}>
                  <Ionicons name={item.icon as any} size={18} color={item.color} />
                </View>
                <View style={styles.dataInfo}>
                  <Text style={styles.dataLabel}>{item.label}</Text>
                  <Text style={styles.dataCount}>{item.count} records</Text>
                </View>
                <View style={[styles.checkbox, item.value && { backgroundColor: COLORS.accent, borderColor: COLORS.accent }]}>
                  {item.value && <Ionicons name="checkmark" size={14} color="#000" />}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Summary */}
        <View style={styles.section}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Export Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Records</Text>
              <Text style={styles.summaryValue}>{totalRecords}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Date Range</Text>
              <Text style={styles.summaryValue}>
                {selectedPreset === '7d' ? '7 Days' : selectedPreset === '30d' ? '30 Days' : selectedPreset === '90d' ? '90 Days' : '1 Year'}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Transaction Total</Text>
              <Text style={styles.summaryValue}>
                ${filteredTransactions.reduce((sum, t) => sum + t.amountUSD, 0).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Export Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export Format</Text>

          <TouchableOpacity
            style={[styles.exportButton, isExporting && styles.exportButtonDisabled]}
            onPress={() => handleExport('report')}
            disabled={isExporting}
          >
            <View style={styles.exportButtonLeft}>
              <View style={styles.exportButtonIcon}>
                <Ionicons name="document-text" size={22} color="#000" />
              </View>
              <View>
                <Text style={styles.exportButtonTitle}>Full Report</Text>
                <Text style={styles.exportButtonSubtitle}>Financial summary + AI insights</Text>
              </View>
            </View>
            {isExporting ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Ionicons name="share-outline" size={20} color="#000" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.exportButtonSecondary, isExporting && styles.exportButtonDisabled]}
            onPress={() => handleExport('csv')}
            disabled={isExporting}
          >
            <View style={styles.exportButtonLeft}>
              <View style={[styles.exportButtonIcon, { backgroundColor: `${COLORS.accent}20` }]}>
                <Ionicons name="grid" size={22} color={COLORS.accent} />
              </View>
              <View>
                <Text style={[styles.exportButtonTitle, { color: COLORS.accent }]}>CSV Export</Text>
                <Text style={styles.exportButtonSubtitle}>Raw data for spreadsheets</Text>
              </View>
            </View>
            {isExporting ? (
              <ActivityIndicator size="small" color={COLORS.accent} />
            ) : (
              <Ionicons name="share-outline" size={20} color={COLORS.accent} />
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.card,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  scroll: { flex: 1 },
  section: { paddingHorizontal: 20, marginTop: 20 },
  sectionTitle: {
    fontSize: 14, fontWeight: '700', color: COLORS.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12,
  },
  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  presetButton: {
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 12,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
  },
  presetButtonActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  presetText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  presetTextActive: { color: '#000' },
  dateRangeDisplay: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12,
    backgroundColor: COLORS.card, padding: 12, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },
  dateRangeText: { fontSize: 13, color: COLORS.textSecondary },
  card: {
    backgroundColor: COLORS.card, borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: COLORS.border,
  },
  dataOption: {
    flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  dataIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dataInfo: { flex: 1 },
  dataLabel: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  dataCount: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  checkbox: {
    width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  summaryCard: {
    backgroundColor: COLORS.card, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  summaryTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 14 },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  summaryLabel: { fontSize: 13, color: COLORS.textSecondary },
  summaryValue: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  exportButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.accent, borderRadius: 16, padding: 16, marginBottom: 12,
  },
  exportButtonSecondary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.card, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: `${COLORS.accent}40`,
  },
  exportButtonDisabled: { opacity: 0.6 },
  exportButtonLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  exportButtonIcon: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  exportButtonTitle: { fontSize: 15, fontWeight: '700', color: '#000' },
  exportButtonSubtitle: { fontSize: 12, color: 'rgba(0,0,0,0.6)', marginTop: 2 },
});
