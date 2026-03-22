import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { COLORS } from '../navigation/AppNavigator';
import { useFinancialStore } from '../store';
import { TimeGranularity, RootStackParamList, KondratievPhase } from '../types';
import SummaryCard from '../components/cards/SummaryCard';
import TransactionCard from '../components/cards/TransactionCard';
import InsightCard from '../components/cards/InsightCard';
import KondratievWaveChart from '../components/charts/KondratievWaveChart';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================
// Granularity Tabs
// ============================================================

const GRANULARITY_OPTIONS: { label: string; value: TimeGranularity }[] = [
  { label: 'Day', value: 'daily' },
  { label: 'Week', value: 'weekly' },
  { label: 'Month', value: 'monthly' },
  { label: 'Quarter', value: 'quarterly' },
  { label: 'Year', value: 'yearly' },
  { label: '5Y', value: '5years' },
  { label: '10Y', value: '10years' },
];

// ============================================================
// Budget Progress Bar
// ============================================================

function BudgetProgressBar({
  category,
  spent,
  budget,
  color,
}: {
  category: string;
  spent: number;
  budget: number;
  color: string;
}) {
  const pct = Math.min((spent / budget) * 100, 100);
  const isOver = spent > budget;

  return (
    <View style={styles.budgetRow}>
      <View style={styles.budgetHeader}>
        <Text style={styles.budgetCategory}>{category}</Text>
        <Text style={[styles.budgetAmount, isOver && { color: COLORS.danger }]}>
          ${spent.toFixed(0)}
          <Text style={styles.budgetTarget}> / ${budget.toFixed(0)}</Text>
        </Text>
      </View>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${pct}%`,
              backgroundColor: isOver ? COLORS.danger : color,
            },
          ]}
        />
      </View>
    </View>
  );
}

// ============================================================
// Quick Action Button
// ============================================================

function QuickAction({
  icon,
  label,
  color,
  onPress,
}: {
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.quickActionIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon as any} size={22} color={color} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// ============================================================
// Dashboard Screen
// ============================================================

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const {
    transactions,
    income,
    investments,
    settings,
    economicData,
    latestAnalysis,
    selectedGranularity,
    setGranularity,
    getTotalExpenses,
    getTotalIncome,
    getTotalInvestmentValue,
    getNetWorth,
    getSavingsRate,
  } = useFinancialStore();

  const [refreshing, setRefreshing] = useState(false);
  const [showKondratiev, setShowKondratiev] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  // Computed values
  const totalInvestmentValue = getTotalInvestmentValue();
  const monthlyExpenses = getTotalExpenses('month');
  const monthlyIncome = getTotalIncome('month');
  const netWorth = getNetWorth();
  const savingsRate = getSavingsRate();

  const recentTransactions = transactions.slice(0, 5);

  // Investment summary
  const totalCost = investments.reduce((sum, inv) => sum + inv.purchasePrice * inv.quantity, 0);
  const investmentReturn = totalCost > 0 ? ((totalInvestmentValue - totalCost) / totalCost) * 100 : 0;

  // Budget progress (mock budgets)
  const budgetItems = [
    { category: 'Housing', spent: 2800, budget: settings.targetMonthlyExpense * 0.30, color: COLORS.accent },
    { category: 'Food & Dining', spent: 450, budget: settings.targetMonthlyExpense * 0.15, color: '#FF6B35' },
    { category: 'Transportation', spent: 180, budget: settings.targetMonthlyExpense * 0.10, color: '#A855F7' },
    { category: 'Entertainment', spent: 120, budget: settings.targetMonthlyExpense * 0.08, color: '#FF5252' },
  ];

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting()}</Text>
          <Text style={styles.date}>{today}</Text>
        </View>
        <TouchableOpacity style={styles.notifButton}>
          <Ionicons name="notifications-outline" size={22} color={COLORS.textSecondary} />
          <View style={styles.notifDot} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.accent}
          />
        }
      >
        {/* Granularity Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.granularityScroll}
          contentContainerStyle={styles.granularityContent}
        >
          {GRANULARITY_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.granularityTab,
                selectedGranularity === opt.value && styles.granularityTabActive,
              ]}
              onPress={() => setGranularity(opt.value)}
            >
              <Text
                style={[
                  styles.granularityText,
                  selectedGranularity === opt.value && styles.granularityTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Net Worth Card */}
        <LinearGradient
          colors={['#0D2137', '#0A1828']}
          style={styles.netWorthCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.netWorthHeader}>
            <Text style={styles.netWorthLabel}>Total Net Worth</Text>
            <View style={styles.netWorthTrend}>
              <Ionicons name="trending-up" size={14} color={COLORS.success} />
              <Text style={[styles.netWorthTrendText, { color: COLORS.success }]}>+8.4%</Text>
            </View>
          </View>
          <Text style={styles.netWorthValue}>
            ${netWorth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <View style={styles.netWorthBreakdown}>
            <View style={styles.netWorthItem}>
              <Text style={styles.netWorthItemLabel}>Investments</Text>
              <Text style={[styles.netWorthItemValue, { color: COLORS.success }]}>
                ${totalInvestmentValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </Text>
            </View>
            <View style={styles.netWorthDivider} />
            <View style={styles.netWorthItem}>
              <Text style={styles.netWorthItemLabel}>Monthly Income</Text>
              <Text style={[styles.netWorthItemValue, { color: COLORS.accent }]}>
                ${monthlyIncome.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </Text>
            </View>
            <View style={styles.netWorthDivider} />
            <View style={styles.netWorthItem}>
              <Text style={styles.netWorthItemLabel}>Savings Rate</Text>
              <Text style={[styles.netWorthItemValue, { color: COLORS.warning }]}>
                {savingsRate.toFixed(1)}%
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Summary Cards Row */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCardHalf}>
            <SummaryCard
              title="Monthly Expenses"
              value={`$${monthlyExpenses.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
              subtitle={`${((monthlyExpenses / settings.targetMonthlyExpense) * 100).toFixed(0)}% of budget`}
              trend={-11.8}
              icon="wallet-outline"
              accentColor={COLORS.danger}
            />
          </View>
          <View style={styles.summaryCardHalf}>
            <SummaryCard
              title="Portfolio Return"
              value={`${investmentReturn > 0 ? '+' : ''}${investmentReturn.toFixed(1)}%`}
              subtitle={`$${totalInvestmentValue.toLocaleString('en-US', { maximumFractionDigits: 0 })} total`}
              trend={investmentReturn}
              icon="trending-up-outline"
              accentColor={COLORS.success}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsRow}>
            <QuickAction
              icon="add-circle"
              label="Add Expense"
              color={COLORS.danger}
              onPress={() => navigation.navigate('AddTransaction', {})}
            />
            <QuickAction
              icon="scan"
              label="Scan Receipt"
              color={COLORS.accent}
              onPress={() => navigation.navigate('ReceiptScan')}
            />
            <QuickAction
              icon="cash"
              label="Add Income"
              color={COLORS.success}
              onPress={() => navigation.navigate('AddIncome', {})}
            />
            <QuickAction
              icon="share-outline"
              label="Export"
              color={COLORS.warning}
              onPress={() => navigation.navigate('Export')}
            />
          </View>
        </View>

        {/* Budget Progress */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Budget Progress</Text>
            <Text style={styles.sectionSubtitle}>This Month</Text>
          </View>
          <View style={styles.card}>
            {budgetItems.map((item) => (
              <BudgetProgressBar key={item.category} {...item} />
            ))}
          </View>
        </View>

        {/* Income vs City & Profession */}
        {economicData && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Income Benchmarks</Text>
            <View style={styles.benchmarkRow}>
              <View style={[styles.benchmarkCard, { flex: 1 }]}>
                <Text style={styles.benchmarkLabel}>vs City Median</Text>
                <Text style={[styles.benchmarkValue, { color: COLORS.success }]}>
                  +{latestAnalysis?.incomeAnalysis.vsCityMedian.toFixed(1)}%
                </Text>
                <Text style={styles.benchmarkSubtitle}>
                  {settings.city}
                </Text>
              </View>
              <View style={[styles.benchmarkCard, { flex: 1 }]}>
                <Text style={styles.benchmarkLabel}>vs Profession</Text>
                <Text style={[styles.benchmarkValue, { color: COLORS.success }]}>
                  +{latestAnalysis?.incomeAnalysis.vsProfessionBenchmark.toFixed(1)}%
                </Text>
                <Text style={styles.benchmarkSubtitle}>
                  {settings.profession}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Economic Indicators */}
        {economicData && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Economic Environment</Text>
            <View style={styles.card}>
              <View style={styles.economicRow}>
                <View style={styles.economicItem}>
                  <Text style={styles.economicLabel}>GDP Growth</Text>
                  <Text style={[
                    styles.economicValue,
                    { color: economicData.gdpGrowth > 2 ? COLORS.success : COLORS.warning }
                  ]}>
                    {economicData.gdpGrowth > 0 ? '+' : ''}{economicData.gdpGrowth}%
                  </Text>
                </View>
                <View style={styles.economicItem}>
                  <Text style={styles.economicLabel}>Inflation</Text>
                  <Text style={[
                    styles.economicValue,
                    { color: economicData.inflation > 4 ? COLORS.danger : COLORS.warning }
                  ]}>
                    {economicData.inflation}%
                  </Text>
                </View>
                <View style={styles.economicItem}>
                  <Text style={styles.economicLabel}>Unemployment</Text>
                  <Text style={[
                    styles.economicValue,
                    { color: economicData.unemploymentRate < 4 ? COLORS.success : COLORS.warning }
                  ]}>
                    {economicData.unemploymentRate}%
                  </Text>
                </View>
                <View style={styles.economicItem}>
                  <Text style={styles.economicLabel}>Interest Rate</Text>
                  <Text style={[styles.economicValue, { color: COLORS.accent }]}>
                    {economicData.interestRate}%
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Kondratiev Wave Teaser */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setShowKondratiev(!showKondratiev)}
            activeOpacity={0.7}
          >
            <Text style={styles.sectionTitle}>Kondratiev Wave Position</Text>
            <View style={styles.kondratievBadge}>
              <Text style={styles.kondratievBadgeText}>Winter Phase</Text>
              <Ionicons
                name={showKondratiev ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={COLORS.danger}
              />
            </View>
          </TouchableOpacity>
          {showKondratiev && (
            <KondratievWaveChart
              currentYear={2026}
              currentPhase={KondratievPhase.Winter}
              showImplications={true}
            />
          )}
          {!showKondratiev && (
            <TouchableOpacity
              style={styles.kondratievPreview}
              onPress={() => setShowKondratiev(true)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#1A0808', '#120505']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <Ionicons name="analytics" size={28} color={COLORS.danger} />
              <View style={styles.kondratievPreviewText}>
                <Text style={styles.kondratievTitle}>5th Wave · Winter Phase (2020-2035)</Text>
                <Text style={styles.kondratievSubtitle}>
                  Debt deleveraging cycle. Focus on cash preservation and real assets.
                </Text>
              </View>
              <Ionicons name="chevron-down" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* AI Insight Teaser */}
        {latestAnalysis && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI Weekly Report</Text>
            <InsightCard
              title="Financial Score: "
              description={latestAnalysis.executiveSummary}
              type="ai"
              score={latestAnalysis.score.overall}
              onPress={() => {}}
              compact={true}
            />
            {latestAnalysis.riskAlerts.slice(0, 1).map((alert, i) => (
              <InsightCard
                key={i}
                title={`${alert.level} Risk: ${alert.category}`}
                description={alert.description}
                type={alert.level === 'High' ? 'danger' : alert.level === 'Medium' ? 'warning' : 'info'}
                compact={true}
              />
            ))}
          </View>
        )}

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {recentTransactions.map((transaction) => (
            <TransactionCard
              key={transaction.id}
              transaction={transaction}
              compact={true}
            />
          ))}
        </View>

        {/* Investment Mini Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Portfolio Overview</Text>
          <View style={styles.card}>
            <View style={styles.portfolioHeader}>
              <View>
                <Text style={styles.portfolioValue}>
                  ${totalInvestmentValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </Text>
                <Text style={styles.portfolioLabel}>Total Portfolio Value</Text>
              </View>
              <View style={[
                styles.returnBadge,
                { backgroundColor: investmentReturn >= 0 ? `${COLORS.success}20` : `${COLORS.danger}20` }
              ]}>
                <Ionicons
                  name={investmentReturn >= 0 ? 'trending-up' : 'trending-down'}
                  size={14}
                  color={investmentReturn >= 0 ? COLORS.success : COLORS.danger}
                />
                <Text style={[
                  styles.returnText,
                  { color: investmentReturn >= 0 ? COLORS.success : COLORS.danger }
                ]}>
                  {investmentReturn >= 0 ? '+' : ''}{investmentReturn.toFixed(2)}%
                </Text>
              </View>
            </View>

            {/* Holdings */}
            {investments.slice(0, 3).map((inv) => {
              const value = inv.currentPrice * inv.quantity;
              const cost = inv.purchasePrice * inv.quantity;
              const ret = cost > 0 ? ((value - cost) / cost) * 100 : 0;
              return (
                <View key={inv.id} style={styles.holdingRow}>
                  <View style={styles.holdingSymbol}>
                    <Text style={styles.holdingSymbolText}>{inv.symbol || inv.name.slice(0, 3)}</Text>
                  </View>
                  <View style={styles.holdingInfo}>
                    <Text style={styles.holdingName} numberOfLines={1}>{inv.name}</Text>
                    <Text style={styles.holdingType}>{inv.type} · {inv.platform || 'N/A'}</Text>
                  </View>
                  <View style={styles.holdingValue}>
                    <Text style={styles.holdingValueText}>
                      ${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </Text>
                    <Text style={[
                      styles.holdingReturn,
                      { color: ret >= 0 ? COLORS.success : COLORS.danger }
                    ]}>
                      {ret >= 0 ? '+' : ''}{ret.toFixed(1)}%
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Bottom Spacer */}
        <View style={{ height: 24 }} />
      </ScrollView>
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  date: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  notifButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.danger,
    borderWidth: 1.5,
    borderColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  granularityScroll: {
    marginBottom: 16,
  },
  granularityContent: {
    paddingHorizontal: 20,
    gap: 6,
  },
  granularityTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  granularityTabActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  granularityText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  granularityTextActive: {
    color: '#000',
  },
  netWorthCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: `${COLORS.accent}30`,
  },
  netWorthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  netWorthLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  netWorthTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${COLORS.success}15`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  netWorthTrendText: {
    fontSize: 12,
    fontWeight: '700',
  },
  netWorthValue: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -1,
    marginBottom: 16,
  },
  netWorthBreakdown: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  netWorthItem: {
    flex: 1,
    alignItems: 'center',
  },
  netWorthItemLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 3,
  },
  netWorthItemValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  netWorthDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.border,
  },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  summaryCardHalf: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  seeAll: {
    fontSize: 13,
    color: COLORS.accent,
    fontWeight: '600',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  budgetRow: {
    marginBottom: 14,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  budgetCategory: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  budgetAmount: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  budgetTarget: {
    color: COLORS.textMuted,
    fontWeight: '400',
  },
  progressTrack: {
    height: 5,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  benchmarkRow: {
    flexDirection: 'row',
    gap: 12,
  },
  benchmarkCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  benchmarkLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  benchmarkValue: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 3,
  },
  benchmarkSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  economicRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  economicItem: {
    alignItems: 'center',
  },
  economicLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 5,
    textAlign: 'center',
  },
  economicValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  kondratievBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: `${COLORS.danger}20`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  kondratievBadgeText: {
    fontSize: 12,
    color: COLORS.danger,
    fontWeight: '600',
  },
  kondratievPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: `${COLORS.danger}30`,
    gap: 12,
    overflow: 'hidden',
  },
  kondratievPreviewText: {
    flex: 1,
  },
  kondratievTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 3,
  },
  kondratievSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
  },
  portfolioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  portfolioValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  portfolioLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  returnBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  returnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  holdingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  holdingSymbol: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: `${COLORS.accent}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  holdingSymbolText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.accent,
  },
  holdingInfo: {
    flex: 1,
  },
  holdingName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  holdingType: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  holdingValue: {
    alignItems: 'flex-end',
  },
  holdingValueText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  holdingReturn: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
});
