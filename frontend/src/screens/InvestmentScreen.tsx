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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS } from '../navigation/AppNavigator';
import { useFinancialStore } from '../store';
import { Investment, InvestmentType } from '../types';
import KondratievWaveChart from '../components/charts/KondratievWaveChart';
import { KondratievPhase } from '../types';

const TYPE_CONFIG: Record<string, { color: string; icon: string }> = {
  stocks: { color: COLORS.accent, icon: 'trending-up' },
  etf: { color: COLORS.success, icon: 'stats-chart' },
  crypto: { color: '#FF9800', icon: 'logo-bitcoin' },
  bonds: { color: '#A855F7', icon: 'shield-checkmark' },
  'real-estate': { color: '#FF6B35', icon: 'home' },
  commodities: { color: '#FFB300', icon: 'diamond' },
  'mutual-fund': { color: '#4CAF50', icon: 'pie-chart' },
  options: { color: '#FF5252', icon: 'options' },
  forex: { color: '#00BCD4', icon: 'swap-horizontal' },
  cash: { color: COLORS.textSecondary, icon: 'cash' },
  other: { color: COLORS.textMuted, icon: 'help-circle' },
};

const INVESTMENT_TYPES: InvestmentType[] = [
  'stocks', 'etf', 'crypto', 'bonds', 'real-estate', 'commodities', 'mutual-fund', 'cash', 'other'
];

export default function InvestmentScreen() {
  const insets = useSafeAreaInsets();
  const { investments, addInvestment, deleteInvestment } = useFinancialStore();

  const [showModal, setShowModal] = useState(false);
  const [showKondratiev, setShowKondratiev] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formSymbol, setFormSymbol] = useState('');
  const [formType, setFormType] = useState<InvestmentType>('stocks');
  const [formQuantity, setFormQuantity] = useState('');
  const [formPurchasePrice, setFormPurchasePrice] = useState('');
  const [formCurrentPrice, setFormCurrentPrice] = useState('');
  const [formPlatform, setFormPlatform] = useState('');

  // Computed portfolio metrics
  const portfolioMetrics = useMemo(() => {
    const totalValue = investments.reduce((sum, inv) => sum + inv.currentPrice * inv.quantity, 0);
    const totalCost = investments.reduce((sum, inv) => sum + inv.purchasePrice * inv.quantity, 0);
    const totalGain = totalValue - totalCost;
    const totalReturnPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

    // Allocation by type
    const byType: Record<string, number> = {};
    investments.forEach((inv) => {
      const val = inv.currentPrice * inv.quantity;
      byType[inv.type] = (byType[inv.type] || 0) + val;
    });

    const allocation = Object.entries(byType)
      .map(([type, value]) => ({
        type,
        value,
        percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);

    return { totalValue, totalCost, totalGain, totalReturnPct, allocation };
  }, [investments]);

  const handleSave = () => {
    const qty = parseFloat(formQuantity);
    const purchasePrice = parseFloat(formPurchasePrice);
    const currentPrice = parseFloat(formCurrentPrice);

    if (!formName || isNaN(qty) || isNaN(purchasePrice) || isNaN(currentPrice)) {
      Alert.alert('Error', 'Please fill all required fields with valid numbers');
      return;
    }

    const newInvestment: Investment = {
      id: Date.now().toString(),
      type: formType,
      symbol: formSymbol.toUpperCase() || undefined,
      name: formName,
      amount: currentPrice * qty,
      amountUSD: currentPrice * qty,
      purchasePrice,
      currentPrice,
      quantity: qty,
      date: new Date().toISOString().split('T')[0],
      platform: formPlatform || undefined,
      currency: 'USD',
    };

    addInvestment(newInvestment);
    setShowModal(false);

    setFormName('');
    setFormSymbol('');
    setFormType('stocks');
    setFormQuantity('');
    setFormPurchasePrice('');
    setFormCurrentPrice('');
    setFormPlatform('');
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Remove Investment', `Remove ${name} from portfolio?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => deleteInvestment(id) },
    ]);
  };

  const { totalValue, totalCost, totalGain, totalReturnPct, allocation } = portfolioMetrics;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Portfolio</Text>
          <Text style={styles.headerSubtitle}>{investments.length} holdings</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowModal(true)}>
          <Ionicons name="add" size={22} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Portfolio Summary */}
        <LinearGradient
          colors={totalReturnPct >= 0 ? ['#0D2A1A', '#081510'] : ['#2A0D0D', '#1E0808']}
          style={styles.summaryCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.summaryLabel}>Portfolio Value</Text>
          <Text style={styles.summaryValue}>
            ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <View style={styles.gainRow}>
            <Ionicons
              name={totalReturnPct >= 0 ? 'trending-up' : 'trending-down'}
              size={16}
              color={totalReturnPct >= 0 ? COLORS.success : COLORS.danger}
            />
            <Text style={[styles.gainText, { color: totalReturnPct >= 0 ? COLORS.success : COLORS.danger }]}>
              {totalReturnPct >= 0 ? '+' : ''}{totalReturnPct.toFixed(2)}%
            </Text>
            <Text style={styles.gainAmount}>
              ({totalGain >= 0 ? '+' : ''}${totalGain.toLocaleString('en-US', { maximumFractionDigits: 0 })})
            </Text>
          </View>

          <View style={styles.summaryStats}>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatLabel}>Total Invested</Text>
              <Text style={styles.summaryStatValue}>
                ${totalCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </Text>
            </View>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatLabel}>Unrealized P&L</Text>
              <Text style={[styles.summaryStatValue, { color: totalGain >= 0 ? COLORS.success : COLORS.danger }]}>
                {totalGain >= 0 ? '+' : ''}${Math.abs(totalGain).toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Asset Allocation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Asset Allocation</Text>
          <View style={styles.allocationCard}>
            {/* Allocation Bar */}
            <View style={styles.allocationBar}>
              {allocation.map((item) => (
                <View
                  key={item.type}
                  style={[
                    styles.allocationSegment,
                    {
                      width: `${item.percentage}%`,
                      backgroundColor: TYPE_CONFIG[item.type]?.color || COLORS.textMuted,
                    },
                  ]}
                />
              ))}
            </View>

            {/* Legend */}
            <View style={styles.allocationLegend}>
              {allocation.map((item) => (
                <View key={item.type} style={styles.allocationLegendItem}>
                  <View
                    style={[
                      styles.legendDot,
                      { backgroundColor: TYPE_CONFIG[item.type]?.color || COLORS.textMuted },
                    ]}
                  />
                  <Text style={styles.legendType}>{item.type}</Text>
                  <Text style={styles.legendPct}>{item.percentage.toFixed(1)}%</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Holdings List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Holdings</Text>
          {investments.map((inv) => {
            const value = inv.currentPrice * inv.quantity;
            const cost = inv.purchasePrice * inv.quantity;
            const gain = value - cost;
            const gainPct = cost > 0 ? (gain / cost) * 100 : 0;
            const config = TYPE_CONFIG[inv.type] || TYPE_CONFIG['other'];

            return (
              <TouchableOpacity
                key={inv.id}
                style={styles.holdingCard}
                activeOpacity={0.8}
                onLongPress={() => handleDelete(inv.id, inv.name)}
              >
                <View style={[styles.holdingIcon, { backgroundColor: `${config.color}20` }]}>
                  <Text style={[styles.holdingSymbolText, { color: config.color }]}>
                    {inv.symbol?.slice(0, 4) || inv.name.slice(0, 3).toUpperCase()}
                  </Text>
                </View>

                <View style={styles.holdingInfo}>
                  <Text style={styles.holdingName} numberOfLines={1}>{inv.name}</Text>
                  <Text style={styles.holdingMeta}>
                    {inv.quantity} {inv.type === 'crypto' ? 'coins' : 'shares'} · {inv.platform || 'N/A'}
                  </Text>
                </View>

                <View style={styles.holdingValues}>
                  <Text style={styles.holdingValue}>
                    ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                  <View style={[
                    styles.gainBadge,
                    { backgroundColor: gainPct >= 0 ? `${COLORS.success}20` : `${COLORS.danger}20` }
                  ]}>
                    <Text style={[styles.gainPct, { color: gainPct >= 0 ? COLORS.success : COLORS.danger }]}>
                      {gainPct >= 0 ? '+' : ''}{gainPct.toFixed(2)}%
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          {investments.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="trending-up-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No investments yet</Text>
              <Text style={styles.emptySubtitle}>Start tracking your portfolio</Text>
            </View>
          )}
        </View>

        {/* Kondratiev Analysis */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.kondratievToggle}
            onPress={() => setShowKondratiev(!showKondratiev)}
          >
            <Text style={styles.sectionTitle}>Cycle Analysis</Text>
            <Ionicons
              name={showKondratiev ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>
          {showKondratiev && (
            <KondratievWaveChart
              currentYear={2026}
              currentPhase={KondratievPhase.Winter}
              showImplications={true}
            />
          )}
        </View>
      </ScrollView>

      {/* Add Investment Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Investment</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Type */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {INVESTMENT_TYPES.map((type) => {
                    const conf = TYPE_CONFIG[type];
                    return (
                      <TouchableOpacity
                        key={type}
                        style={[styles.typeOption, formType === type && { borderColor: conf.color, backgroundColor: `${conf.color}20` }]}
                        onPress={() => setFormType(type)}
                      >
                        <Ionicons name={conf.icon as any} size={16} color={formType === type ? conf.color : COLORS.textMuted} />
                        <Text style={[styles.typeOptionText, formType === type && { color: conf.color }]}>
                          {type}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formName}
                  onChangeText={setFormName}
                  placeholder="e.g., Apple Inc."
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>

              {/* Symbol */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Symbol</Text>
                <TextInput
                  style={styles.textInput}
                  value={formSymbol}
                  onChangeText={setFormSymbol}
                  placeholder="e.g., AAPL"
                  placeholderTextColor={COLORS.textMuted}
                  autoCapitalize="characters"
                />
              </View>

              {/* Row: Quantity + Purchase Price */}
              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Quantity *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formQuantity}
                    onChangeText={setFormQuantity}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={COLORS.textMuted}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Buy Price *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formPurchasePrice}
                    onChangeText={setFormPurchasePrice}
                    keyboardType="decimal-pad"
                    placeholder="$0.00"
                    placeholderTextColor={COLORS.textMuted}
                  />
                </View>
              </View>

              {/* Current Price + Platform */}
              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Current Price *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formCurrentPrice}
                    onChangeText={setFormCurrentPrice}
                    keyboardType="decimal-pad"
                    placeholder="$0.00"
                    placeholderTextColor={COLORS.textMuted}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Platform</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formPlatform}
                    onChangeText={setFormPlatform}
                    placeholder="Fidelity..."
                    placeholderTextColor={COLORS.textMuted}
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Add to Portfolio</Text>
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  addButton: {
    width: 42, height: 42, borderRadius: 14, backgroundColor: COLORS.success,
    alignItems: 'center', justifyContent: 'center',
  },
  scroll: { flex: 1 },
  summaryCard: {
    margin: 20, borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: `${COLORS.success}30`,
  },
  summaryLabel: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 6 },
  summaryValue: { fontSize: 34, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -1, marginBottom: 8 },
  gainRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  gainText: { fontSize: 16, fontWeight: '700' },
  gainAmount: { fontSize: 13, color: COLORS.textSecondary },
  summaryStats: { flexDirection: 'row', gap: 24 },
  summaryStatItem: {},
  summaryStatLabel: { fontSize: 11, color: COLORS.textSecondary, marginBottom: 3 },
  summaryStatValue: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: {
    fontSize: 14, fontWeight: '700', color: COLORS.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12,
  },
  allocationCard: {
    backgroundColor: COLORS.card, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  allocationBar: { flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', marginBottom: 14 },
  allocationSegment: { height: '100%' },
  allocationLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  allocationLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendType: { fontSize: 12, color: COLORS.textSecondary, textTransform: 'capitalize' },
  legendPct: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
  holdingCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.card, borderRadius: 14, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: COLORS.border, gap: 12,
  },
  holdingIcon: {
    width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
  },
  holdingSymbolText: { fontSize: 12, fontWeight: '800' },
  holdingInfo: { flex: 1 },
  holdingName: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 4 },
  holdingMeta: { fontSize: 12, color: COLORS.textSecondary, textTransform: 'capitalize' },
  holdingValues: { alignItems: 'flex-end', gap: 4 },
  holdingValue: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  gainBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  gainPct: { fontSize: 12, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: COLORS.textSecondary },
  emptySubtitle: { fontSize: 13, color: COLORS.textMuted },
  kondratievToggle: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12,
  },
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
  inputGroup: { marginBottom: 14 },
  inputLabel: {
    fontSize: 12, fontWeight: '600', color: COLORS.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6,
  },
  textInput: {
    backgroundColor: COLORS.background, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.border,
  },
  rowInputs: { flexDirection: 'row', gap: 12 },
  typeOption: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    backgroundColor: COLORS.background, marginRight: 8, borderWidth: 1, borderColor: COLORS.border,
  },
  typeOptionText: {
    fontSize: 12, color: COLORS.textMuted, textTransform: 'capitalize',
  },
  saveButton: {
    backgroundColor: COLORS.success, borderRadius: 16, paddingVertical: 16,
    alignItems: 'center', marginTop: 8,
  },
  saveButtonText: { fontSize: 16, fontWeight: '700', color: '#000' },
});
