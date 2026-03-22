import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../navigation/AppNavigator';
import { useFinancialStore } from '../store';
import { AIAnalysis, KondratievPhase, ActionItem, RiskAlert } from '../types';
import KondratievWaveChart from '../components/charts/KondratievWaveChart';
import InsightCard from '../components/cards/InsightCard';

// ============================================================
// Score Gauge Component
// ============================================================

function ScoreGauge({ label, score, color }: { label: string; score: number; color: string }) {
  const getColor = (s: number) => {
    if (s >= 80) return COLORS.success;
    if (s >= 60) return COLORS.warning;
    return COLORS.danger;
  };
  const c = color || getColor(score);

  return (
    <View style={styles.gaugeItem}>
      <View style={styles.gaugeCircle}>
        <View
          style={[
            styles.gaugeFill,
            {
              height: `${score}%`,
              backgroundColor: `${c}30`,
              borderTopLeftRadius: score > 90 ? 20 : 0,
              borderTopRightRadius: score > 90 ? 20 : 0,
            },
          ]}
        />
        <Text style={[styles.gaugeScore, { color: c }]}>{score}</Text>
      </View>
      <Text style={styles.gaugeLabel}>{label}</Text>
    </View>
  );
}

// ============================================================
// Business Cycle Indicator
// ============================================================

function BusinessCycleIndicator({ phase }: { phase: string }) {
  const phases = ['Trough', 'Expansion', 'Peak', 'Contraction'];
  const currentIndex = phases.indexOf(phase);

  return (
    <View style={styles.cycleContainer}>
      <Text style={styles.cycleTitle}>Business Cycle</Text>
      <View style={styles.cyclePhases}>
        {phases.map((p, i) => (
          <View key={p} style={styles.cyclePhaseItem}>
            <View
              style={[
                styles.cycleDot,
                i === currentIndex && styles.cycleDotActive,
                {
                  backgroundColor:
                    i === currentIndex
                      ? p === 'Expansion'
                        ? COLORS.success
                        : p === 'Peak'
                        ? COLORS.warning
                        : p === 'Contraction'
                        ? COLORS.danger
                        : COLORS.accent
                      : COLORS.border,
                },
              ]}
            />
            {i < phases.length - 1 && (
              <View
                style={[
                  styles.cycleLine,
                  { backgroundColor: i < currentIndex ? COLORS.accent : COLORS.border },
                ]}
              />
            )}
          </View>
        ))}
      </View>
      <View style={styles.cycleLabels}>
        {phases.map((p, i) => (
          <Text
            key={p}
            style={[
              styles.cyclePhaseLabel,
              i === currentIndex && { color: COLORS.textPrimary, fontWeight: '700' },
            ]}
          >
            {p}
          </Text>
        ))}
      </View>
      <Text style={styles.currentPhaseText}>Current: {phase}</Text>
    </View>
  );
}

// ============================================================
// Yield Curve Visualization
// ============================================================

function YieldCurveWidget() {
  const maturities = ['3M', '6M', '1Y', '2Y', '5Y', '10Y', '30Y'];
  const yields = [5.45, 5.35, 5.15, 4.85, 4.45, 4.35, 4.55]; // Mock inverted curve

  const maxYield = Math.max(...yields);
  const minYield = Math.min(...yields);
  const range = maxYield - minYield;

  return (
    <View style={styles.yieldCard}>
      <View style={styles.yieldHeader}>
        <Text style={styles.yieldTitle}>Yield Curve</Text>
        <View style={styles.yieldBadge}>
          <Text style={styles.yieldBadgeText}>Inverted</Text>
        </View>
      </View>
      <View style={styles.yieldChart}>
        {maturities.map((maturity, i) => {
          const pct = range > 0 ? ((yields[i] - minYield) / range) * 80 + 20 : 50;
          return (
            <View key={maturity} style={styles.yieldBar}>
              <Text style={styles.yieldValue}>{yields[i].toFixed(1)}%</Text>
              <View style={styles.yieldBarTrack}>
                <View
                  style={[
                    styles.yieldBarFill,
                    {
                      height: `${pct}%`,
                      backgroundColor: yields[i] > yields[3] ? COLORS.warning : COLORS.accent,
                    },
                  ]}
                />
              </View>
              <Text style={styles.yieldMaturity}>{maturity}</Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.yieldNote}>
        Inverted yield curve signals potential recession risk in 12-18 months
      </Text>
    </View>
  );
}

// ============================================================
// Analysis Screen
// ============================================================

export default function AnalysisScreen() {
  const insets = useSafeAreaInsets();
  const { latestAnalysis, isLoading } = useFinancialStore();

  const [activeTab, setActiveTab] = useState<'report' | 'economic' | 'history'>('report');
  const [expandedSection, setExpandedSection] = useState<string | null>('spending');

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  if (!latestAnalysis) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <Ionicons name="analytics-outline" size={64} color={COLORS.textMuted} />
        <Text style={styles.noDataTitle}>No Analysis Available</Text>
        <Text style={styles.noDataSubtitle}>Generate your first AI financial report</Text>
        <TouchableOpacity style={styles.generateButton}>
          <Text style={styles.generateButtonText}>Generate Report</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const analysis = latestAnalysis;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>AI Analysis</Text>
          <Text style={styles.headerSubtitle}>
            Week of {new Date(analysis.period.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshButton}>
          <Ionicons name="refresh" size={20} color={COLORS.accent} />
        </TouchableOpacity>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabs}>
        {(['report', 'economic', 'history'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'report' ? 'Report' : tab === 'economic' ? 'Economic' : 'History'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ============ REPORT TAB ============ */}
        {activeTab === 'report' && (
          <>
            {/* Score Overview */}
            <View style={styles.section}>
              <LinearGradient
                colors={['#0D0D2A', '#08081E']}
                style={styles.scoreCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.scoreHeader}>
                  <View>
                    <Text style={styles.scoreLabel}>Financial Health Score</Text>
                    <Text style={styles.scoreMainValue}>{analysis.score.overall}</Text>
                    <Text style={styles.scoreSubtitle}>out of 100</Text>
                  </View>
                  <View style={styles.scoreGauges}>
                    <ScoreGauge label="Spend" score={analysis.score.spending} color="" />
                    <ScoreGauge label="Save" score={analysis.score.saving} color="" />
                    <ScoreGauge label="Invest" score={analysis.score.investing} color="" />
                    <ScoreGauge label="Debt" score={analysis.score.debtManagement} color="" />
                  </View>
                </View>
              </LinearGradient>
            </View>

            {/* Executive Summary */}
            <View style={styles.section}>
              <InsightCard
                title="Executive Summary"
                description={analysis.executiveSummary}
                type="ai"
              />
            </View>

            {/* Spending Analysis */}
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection('spending')}
              activeOpacity={0.7}
            >
              <View style={styles.sectionHeaderLeft}>
                <Ionicons name="wallet" size={18} color={COLORS.danger} />
                <Text style={styles.sectionTitle}>Spending Analysis</Text>
              </View>
              <View style={styles.sectionHeaderRight}>
                <Text style={styles.sectionAmount}>
                  ${analysis.spendingAnalysis.total.toFixed(0)}
                </Text>
                <Text style={[
                  styles.sectionTrend,
                  { color: analysis.spendingAnalysis.vsLastPeriod < 0 ? COLORS.success : COLORS.danger }
                ]}>
                  {analysis.spendingAnalysis.vsLastPeriod > 0 ? '+' : ''}
                  {analysis.spendingAnalysis.vsLastPeriod.toFixed(1)}%
                </Text>
                <Ionicons
                  name={expandedSection === 'spending' ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={COLORS.textMuted}
                />
              </View>
            </TouchableOpacity>

            {expandedSection === 'spending' && (
              <View style={[styles.section, styles.expandedSection]}>
                <View style={styles.analysisCard}>
                  <View style={styles.metricRow}>
                    <View style={styles.metric}>
                      <Text style={styles.metricLabel}>Budget Used</Text>
                      <Text style={[styles.metricValue, {
                        color: analysis.spendingAnalysis.vsBudget > 100 ? COLORS.danger : COLORS.success
                      }]}>
                        {analysis.spendingAnalysis.vsBudget.toFixed(1)}%
                      </Text>
                    </View>
                    <View style={styles.metric}>
                      <Text style={styles.metricLabel}>Daily Average</Text>
                      <Text style={styles.metricValue}>${analysis.spendingAnalysis.dailyAverage.toFixed(0)}</Text>
                    </View>
                    <View style={styles.metric}>
                      <Text style={styles.metricLabel}>Projected</Text>
                      <Text style={styles.metricValue}>${analysis.spendingAnalysis.projectedMonthly.toFixed(0)}/mo</Text>
                    </View>
                  </View>

                  <Text style={styles.subsectionTitle}>Top Categories</Text>
                  {analysis.spendingAnalysis.topCategories.map((cat, i) => (
                    <View key={i} style={styles.categoryRow}>
                      <Text style={styles.categoryRowName}>{cat.name}</Text>
                      <View style={styles.categoryRowBar}>
                        <View style={[styles.categoryRowFill, { width: `${cat.percentage}%` }]} />
                      </View>
                      <Text style={styles.categoryRowAmount}>${cat.amount.toFixed(0)}</Text>
                      <Text style={styles.categoryRowPct}>{cat.percentage.toFixed(1)}%</Text>
                    </View>
                  ))}

                  {analysis.spendingAnalysis.anomalies.length > 0 && (
                    <>
                      <Text style={[styles.subsectionTitle, { marginTop: 12 }]}>Anomalies</Text>
                      {analysis.spendingAnalysis.anomalies.map((anomaly, i) => (
                        <View key={i} style={styles.anomalyRow}>
                          <Ionicons name="alert-circle" size={14} color={COLORS.warning} />
                          <Text style={styles.anomalyText}>{anomaly}</Text>
                        </View>
                      ))}
                    </>
                  )}

                  <Text style={styles.insightText}>{analysis.spendingAnalysis.insights}</Text>
                </View>
              </View>
            )}

            {/* Income Analysis */}
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection('income')}
              activeOpacity={0.7}
            >
              <View style={styles.sectionHeaderLeft}>
                <Ionicons name="cash" size={18} color={COLORS.success} />
                <Text style={styles.sectionTitle}>Income Analysis</Text>
              </View>
              <View style={styles.sectionHeaderRight}>
                <Text style={styles.sectionAmount}>${analysis.incomeAnalysis.total.toFixed(0)}</Text>
                <Ionicons
                  name={expandedSection === 'income' ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={COLORS.textMuted}
                />
              </View>
            </TouchableOpacity>

            {expandedSection === 'income' && (
              <View style={[styles.section, styles.expandedSection]}>
                <View style={styles.analysisCard}>
                  <View style={styles.metricRow}>
                    <View style={styles.metric}>
                      <Text style={styles.metricLabel}>vs Benchmark</Text>
                      <Text style={[styles.metricValue, { color: COLORS.success }]}>
                        +{analysis.incomeAnalysis.vsProfessionBenchmark.toFixed(1)}%
                      </Text>
                    </View>
                    <View style={styles.metric}>
                      <Text style={styles.metricLabel}>vs City Median</Text>
                      <Text style={[styles.metricValue, { color: COLORS.success }]}>
                        +{analysis.incomeAnalysis.vsCityMedian.toFixed(1)}%
                      </Text>
                    </View>
                    <View style={styles.metric}>
                      <Text style={styles.metricLabel}>Savings Rate</Text>
                      <Text style={styles.metricValue}>{analysis.incomeAnalysis.savingsRate.toFixed(1)}%</Text>
                    </View>
                  </View>

                  <Text style={styles.subsectionTitle}>Sources</Text>
                  {analysis.incomeAnalysis.sources.map((source, i) => (
                    <View key={i} style={styles.categoryRow}>
                      <Text style={styles.categoryRowName}>{source.name}</Text>
                      <View style={styles.categoryRowBar}>
                        <View style={[styles.categoryRowFill, { width: `${source.percentage}%`, backgroundColor: COLORS.success }]} />
                      </View>
                      <Text style={styles.categoryRowAmount}>${source.amount.toFixed(0)}</Text>
                    </View>
                  ))}

                  <Text style={styles.insightText}>{analysis.incomeAnalysis.insights}</Text>
                </View>
              </View>
            )}

            {/* Investment Performance */}
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection('investment')}
              activeOpacity={0.7}
            >
              <View style={styles.sectionHeaderLeft}>
                <Ionicons name="trending-up" size={18} color={COLORS.accent} />
                <Text style={styles.sectionTitle}>Investment Performance</Text>
              </View>
              <View style={styles.sectionHeaderRight}>
                <Text style={[styles.sectionAmount, { color: COLORS.success }]}>
                  +{analysis.investmentPerformance.totalReturn.toFixed(2)}%
                </Text>
                <Ionicons
                  name={expandedSection === 'investment' ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={COLORS.textMuted}
                />
              </View>
            </TouchableOpacity>

            {expandedSection === 'investment' && (
              <View style={[styles.section, styles.expandedSection]}>
                <View style={styles.analysisCard}>
                  <View style={styles.metricRow}>
                    <View style={styles.metric}>
                      <Text style={styles.metricLabel}>vs S&P 500</Text>
                      <Text style={[styles.metricValue, { color: COLORS.success }]}>
                        +{analysis.investmentPerformance.vsMarket.toFixed(2)}%
                      </Text>
                    </View>
                    <View style={styles.metric}>
                      <Text style={styles.metricLabel}>Sharpe Ratio</Text>
                      <Text style={styles.metricValue}>
                        {analysis.investmentPerformance.sharpeRatio?.toFixed(2) || 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.metric}>
                      <Text style={styles.metricLabel}>Rebalance</Text>
                      <Text style={[styles.metricValue, {
                        color: analysis.investmentPerformance.rebalancingNeeded ? COLORS.warning : COLORS.success
                      }]}>
                        {analysis.investmentPerformance.rebalancingNeeded ? 'Needed' : 'OK'}
                      </Text>
                    </View>
                  </View>

                  {analysis.investmentPerformance.rebalancingNeeded && (
                    <InsightCard
                      title="Rebalancing Suggested"
                      description={analysis.investmentPerformance.rebalancingDetails || ''}
                      type="warning"
                      compact
                    />
                  )}

                  <Text style={styles.insightText}>{analysis.investmentPerformance.insights}</Text>
                </View>
              </View>
            )}

            {/* Action Items */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>
                Action Items
              </Text>
              {analysis.actionItems.map((item, i) => (
                <View key={i} style={styles.actionItemCard}>
                  <View style={[styles.priorityBadge, {
                    backgroundColor: item.priority === 1 ? `${COLORS.danger}20`
                      : item.priority === 2 ? `${COLORS.warning}20`
                      : `${COLORS.accent}20`
                  }]}>
                    <Text style={[styles.priorityText, {
                      color: item.priority === 1 ? COLORS.danger
                        : item.priority === 2 ? COLORS.warning
                        : COLORS.accent
                    }]}>
                      #{item.priority}
                    </Text>
                  </View>
                  <View style={styles.actionContent}>
                    <Text style={styles.actionText}>{item.action}</Text>
                    <View style={styles.actionMeta}>
                      <Text style={styles.actionCategory}>{item.category}</Text>
                      <View style={[styles.impactBadge, {
                        backgroundColor: item.impact === 'High' ? `${COLORS.danger}20`
                          : item.impact === 'Medium' ? `${COLORS.warning}20`
                          : `${COLORS.success}20`
                      }]}>
                        <Text style={[styles.impactText, {
                          color: item.impact === 'High' ? COLORS.danger
                            : item.impact === 'Medium' ? COLORS.warning
                            : COLORS.success
                        }]}>
                          {item.impact} Impact
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* Risk Alerts */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Risk Alerts</Text>
              {analysis.riskAlerts.map((alert, i) => (
                <InsightCard
                  key={i}
                  title={`${alert.level} Risk · ${alert.category}`}
                  description={`${alert.description}${alert.recommendation ? `\n\nRecommendation: ${alert.recommendation}` : ''}`}
                  type={alert.level === 'High' ? 'danger' : alert.level === 'Medium' ? 'warning' : 'info'}
                />
              ))}
            </View>
          </>
        )}

        {/* ============ ECONOMIC TAB ============ */}
        {activeTab === 'economic' && (
          <>
            {/* Kondratiev Wave */}
            <View style={styles.section}>
              <KondratievWaveChart
                currentYear={2026}
                currentPhase={analysis.economicContext.kondratievPhase}
                showImplications={true}
                height={220}
              />
            </View>

            {/* Business Cycle */}
            <View style={styles.section}>
              <View style={styles.analysisCard}>
                <BusinessCycleIndicator phase={analysis.economicContext.businessCycle} />
              </View>
            </View>

            {/* Yield Curve */}
            <View style={styles.section}>
              <YieldCurveWidget />
            </View>

            {/* Inflation Impact */}
            <View style={styles.section}>
              <InsightCard
                title="Inflation Analysis"
                description={analysis.economicContext.inflationImpact}
                type="warning"
                icon="flame"
              />
            </View>

            {/* Opportunities */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>Opportunities</Text>
              <View style={styles.analysisCard}>
                {analysis.economicContext.opportunities.map((opp, i) => (
                  <View key={i} style={styles.oppRow}>
                    <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                    <Text style={styles.oppText}>{opp}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Risks */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>Economic Risks</Text>
              <View style={styles.analysisCard}>
                {analysis.economicContext.risks.map((risk, i) => (
                  <View key={i} style={styles.oppRow}>
                    <Ionicons name="alert-circle" size={16} color={COLORS.danger} />
                    <Text style={styles.oppText}>{risk}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Outlook */}
            <View style={styles.section}>
              <InsightCard
                title="Economic Outlook"
                description={analysis.economicContext.outlook || ''}
                type="info"
                icon="earth"
              />
            </View>
          </>
        )}

        {/* ============ HISTORY TAB ============ */}
        {activeTab === 'history' && (
          <View style={styles.section}>
            <View style={styles.analysisCard}>
              <Text style={styles.historyTitle}>Report History</Text>
              {[analysis].map((report, i) => (
                <View key={i} style={styles.historyItem}>
                  <View style={styles.historyDot} />
                  <View style={styles.historyContent}>
                    <Text style={styles.historyPeriod}>
                      {new Date(report.period.start).toLocaleDateString()} –{' '}
                      {new Date(report.period.end).toLocaleDateString()}
                    </Text>
                    <Text style={styles.historyScore}>
                      Score: {report.score.overall}/100
                    </Text>
                    <Text style={styles.historySummary} numberOfLines={2}>
                      {report.executiveSummary}
                    </Text>
                  </View>
                </View>
              ))}
              <Text style={styles.historyEmpty}>
                Weekly reports accumulate here. New report every Monday at 8am.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { alignItems: 'center', justifyContent: 'center', gap: 16 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  refreshButton: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: `${COLORS.accent}15`,
    alignItems: 'center', justifyContent: 'center',
  },
  tabs: {
    flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 10, gap: 8,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  tab: {
    paddingHorizontal: 18, paddingVertical: 7, borderRadius: 10,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
  },
  tabActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  tabText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  tabTextActive: { color: '#000' },
  scroll: { flex: 1 },
  section: { paddingHorizontal: 20, marginBottom: 16, marginTop: 16 },
  expandedSection: { marginTop: 0 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: {
    fontSize: 14, fontWeight: '700', color: COLORS.textPrimary,
  },
  sectionAmount: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary },
  sectionTrend: { fontSize: 12, fontWeight: '600' },
  // Score Card
  scoreCard: {
    borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#9B59F530',
  },
  scoreHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  scoreLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 6 },
  scoreMainValue: { fontSize: 56, fontWeight: '800', color: '#9B59F5', lineHeight: 60 },
  scoreSubtitle: { fontSize: 13, color: COLORS.textSecondary },
  scoreGauges: { flexDirection: 'row', gap: 10 },
  gaugeItem: { alignItems: 'center' },
  gaugeCircle: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.card,
    overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  gaugeFill: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  gaugeScore: { fontSize: 14, fontWeight: '800', zIndex: 1 },
  gaugeLabel: { fontSize: 10, color: COLORS.textMuted, marginTop: 4 },
  // Analysis Cards
  analysisCard: {
    backgroundColor: COLORS.card, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  metric: { alignItems: 'center', flex: 1 },
  metricLabel: { fontSize: 11, color: COLORS.textSecondary, marginBottom: 4, textAlign: 'center' },
  metricValue: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  subsectionTitle: {
    fontSize: 12, fontWeight: '700', color: COLORS.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10,
  },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  categoryRowName: { fontSize: 13, color: COLORS.textSecondary, width: 90 },
  categoryRowBar: {
    flex: 1, height: 5, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden',
  },
  categoryRowFill: { height: '100%', backgroundColor: COLORS.accent, borderRadius: 3 },
  categoryRowAmount: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, width: 55, textAlign: 'right' },
  categoryRowPct: { fontSize: 12, color: COLORS.textMuted, width: 40, textAlign: 'right' },
  anomalyRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  anomalyText: { fontSize: 13, color: COLORS.textSecondary, flex: 1 },
  insightText: {
    fontSize: 13, color: COLORS.textSecondary, lineHeight: 19,
    borderTopWidth: 1, borderTopColor: COLORS.border, marginTop: 12, paddingTop: 12,
  },
  // Action Items
  actionItemCard: {
    flexDirection: 'row', gap: 12,
    backgroundColor: COLORS.card, borderRadius: 14, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: COLORS.border,
  },
  priorityBadge: {
    width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  priorityText: { fontSize: 13, fontWeight: '800' },
  actionContent: { flex: 1 },
  actionText: { fontSize: 14, color: COLORS.textPrimary, lineHeight: 20, marginBottom: 6 },
  actionMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionCategory: { fontSize: 11, color: COLORS.textMuted, textTransform: 'capitalize' },
  impactBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  impactText: { fontSize: 11, fontWeight: '600' },
  // Cycle Indicator
  cycleContainer: { padding: 4 },
  cycleTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 16 },
  cyclePhases: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cyclePhaseItem: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  cycleDot: { width: 16, height: 16, borderRadius: 8 },
  cycleDotActive: { width: 20, height: 20, borderRadius: 10 },
  cycleLine: { flex: 1, height: 2 },
  cycleLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  cyclePhaseLabel: { fontSize: 11, color: COLORS.textMuted, flex: 1, textAlign: 'center' },
  currentPhaseText: {
    fontSize: 13, color: COLORS.accent, fontWeight: '700', textAlign: 'center', marginTop: 12,
  },
  // Yield Curve
  yieldCard: {
    backgroundColor: COLORS.card, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  yieldHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  yieldTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  yieldBadge: {
    backgroundColor: `${COLORS.danger}20`, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8,
  },
  yieldBadgeText: { fontSize: 12, color: COLORS.danger, fontWeight: '600' },
  yieldChart: { flexDirection: 'row', justifyContent: 'space-between', height: 100, alignItems: 'flex-end' },
  yieldBar: { flex: 1, alignItems: 'center' },
  yieldValue: { fontSize: 9, color: COLORS.textMuted, marginBottom: 4 },
  yieldBarTrack: { width: 18, height: 70, backgroundColor: COLORS.border, borderRadius: 3, justifyContent: 'flex-end' },
  yieldBarFill: { width: '100%', borderRadius: 3 },
  yieldMaturity: { fontSize: 9, color: COLORS.textMuted, marginTop: 4 },
  yieldNote: { fontSize: 12, color: COLORS.textSecondary, marginTop: 12, lineHeight: 17 },
  // Opportunities
  oppRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  oppText: { fontSize: 14, color: COLORS.textSecondary, flex: 1, lineHeight: 19 },
  // History
  historyTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 16 },
  historyItem: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  historyDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.accent, marginTop: 5,
  },
  historyContent: { flex: 1 },
  historyPeriod: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 3 },
  historyScore: { fontSize: 12, color: COLORS.accent, marginBottom: 4 },
  historySummary: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 17 },
  historyEmpty: { fontSize: 12, color: COLORS.textMuted, textAlign: 'center', marginTop: 12, lineHeight: 17 },
  // No data
  noDataTitle: { fontSize: 18, fontWeight: '600', color: COLORS.textSecondary },
  noDataSubtitle: { fontSize: 14, color: COLORS.textMuted },
  generateButton: {
    backgroundColor: COLORS.accent, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14,
  },
  generateButtonText: { fontSize: 15, fontWeight: '700', color: '#000' },
});
