import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  ScrollView,
} from 'react-native';
import Svg, {
  Path,
  Circle,
  Text as SvgText,
  Line,
  Rect,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from 'react-native-svg';
import { COLORS } from '../../navigation/AppNavigator';
import { KondratievPhase } from '../../types';

// ============================================================
// Kondratiev Wave Data
// ============================================================

const KONDRATIEV_WAVES = [
  {
    wave: 1,
    name: 'Industrial Revolution',
    start: 1780,
    end: 1843,
    phases: { spring: [1780, 1790], summer: [1790, 1815], autumn: [1815, 1825], winter: [1825, 1843] },
    color: '#4A90D9',
  },
  {
    wave: 2,
    name: 'Steam & Railways',
    start: 1843,
    end: 1896,
    phases: { spring: [1843, 1858], summer: [1858, 1873], autumn: [1873, 1882], winter: [1882, 1896] },
    color: '#7B68EE',
  },
  {
    wave: 3,
    name: 'Steel & Electricity',
    start: 1896,
    end: 1949,
    phases: { spring: [1896, 1907], summer: [1907, 1929], autumn: [1929, 1937], winter: [1937, 1949] },
    color: '#20B2AA',
  },
  {
    wave: 4,
    name: 'Oil & Automobiles',
    start: 1949,
    end: 1982,
    phases: { spring: [1949, 1960], summer: [1960, 1973], autumn: [1973, 1977], winter: [1977, 1982] },
    color: '#FF6347',
  },
  {
    wave: 5,
    name: 'Information & Digital',
    start: 1982,
    end: 2035,
    phases: { spring: [1982, 1995], summer: [1995, 2008], autumn: [2008, 2020], winter: [2020, 2035] },
    color: '#00D4FF',
  },
];

const PHASE_COLORS: Record<string, string> = {
  spring: '#00E676',
  summer: '#FFB300',
  autumn: '#FF9800',
  winter: '#FF5252',
};

const PHASE_DESCRIPTIONS: Record<KondratievPhase, string> = {
  [KondratievPhase.Spring]: 'Recovery & Expansion\nTechnology adoption, rising productivity',
  [KondratievPhase.Summer]: 'Peak Growth\nHigh employment, innovation boom',
  [KondratievPhase.Autumn]: 'Plateau & Financialization\nAsset bubbles, debt expansion',
  [KondratievPhase.Winter]: 'Decline & Reset\nDebt purge, deflation, opportunity',
};

const INVESTMENT_IMPLICATIONS: Record<KondratievPhase, string[]> = {
  [KondratievPhase.Spring]: [
    'Growth stocks & emerging tech',
    'Real assets & commodities',
    'High-yield bonds',
    'Entrepreneurship opportunities',
  ],
  [KondratievPhase.Summer]: [
    'Equities broadly',
    'Commodities peak',
    'Real estate strong',
    'Inflation hedges',
  ],
  [KondratievPhase.Autumn]: [
    'Financial assets (stocks/bonds)',
    'Real estate speculation',
    'Debt instruments',
    'Begin defensive positioning',
  ],
  [KondratievPhase.Winter]: [
    'Cash & short-term bonds',
    'Gold & precious metals',
    'Defensive sectors',
    'Avoid speculative assets',
    'Accumulate quality assets cheap',
  ],
};

// ============================================================
// Props
// ============================================================

interface KondratievWaveChartProps {
  currentYear?: number;
  currentPhase?: KondratievPhase;
  showImplications?: boolean;
  height?: number;
}

// ============================================================
// Chart Component
// ============================================================

export default function KondratievWaveChart({
  currentYear = 2026,
  currentPhase = KondratievPhase.Winter,
  showImplications = true,
  height = 200,
}: KondratievWaveChartProps) {
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 40;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.4, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Year range for display
  const startYear = 1949;
  const endYear = 2040;
  const totalYears = endYear - startYear;

  const yearToX = (year: number) =>
    ((year - startYear) / totalYears) * (chartWidth - 40) + 20;

  // Generate wave SVG path for a single wave cycle
  const generateWavePath = (
    waveStart: number,
    waveEnd: number,
    amplitude: number,
    baseY: number
  ): string => {
    const waveDuration = waveEnd - waveStart;
    const x1 = yearToX(waveStart);
    const x2 = yearToX(waveEnd);
    const midX = (x1 + x2) / 2;
    const peakY = baseY - amplitude;

    return `M ${x1} ${baseY} C ${x1 + (midX - x1) * 0.3} ${peakY} ${x1 + (midX - x1) * 0.7} ${peakY} ${midX} ${peakY} C ${midX + (x2 - midX) * 0.3} ${peakY} ${midX + (x2 - midX) * 0.7} ${baseY} ${x2} ${baseY}`;
  };

  const baseY = height - 40;
  const amplitude = height * 0.55;
  const currentX = yearToX(currentYear);

  // Filter waves visible in display range
  const visibleWaves = KONDRATIEV_WAVES.filter(
    (w) => w.end > startYear && w.start < endYear
  );

  // Phase color background rects
  const wave5 = KONDRATIEV_WAVES.find((w) => w.wave === 5)!;

  return (
    <View style={styles.container}>
      {/* Chart Title */}
      <View style={styles.titleRow}>
        <Text style={styles.chartTitle}>Kondratiev Wave Position</Text>
        <View style={[styles.phaseBadge, { backgroundColor: `${PHASE_COLORS[currentPhase.toLowerCase()]}25` }]}>
          <View style={[styles.phaseDot, { backgroundColor: PHASE_COLORS[currentPhase.toLowerCase()] }]} />
          <Text style={[styles.phaseLabel, { color: PHASE_COLORS[currentPhase.toLowerCase()] }]}>
            {currentPhase}
          </Text>
        </View>
      </View>

      {/* SVG Chart */}
      <View style={styles.chartContainer}>
        <Svg width={chartWidth} height={height}>
          <Defs>
            <SvgLinearGradient id="waveGrad5" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#00D4FF" stopOpacity="0.3" />
              <Stop offset="1" stopColor="#00D4FF" stopOpacity="0" />
            </SvgLinearGradient>
          </Defs>

          {/* Phase background shading for wave 5 */}
          {Object.entries(wave5.phases).map(([phase, [start, end]]) => {
            const x1 = yearToX(Math.max(start, startYear));
            const x2 = yearToX(Math.min(end, endYear));
            if (x1 >= chartWidth || x2 <= 0) return null;
            return (
              <Rect
                key={phase}
                x={x1}
                y={10}
                width={Math.max(0, x2 - x1)}
                height={height - 50}
                fill={PHASE_COLORS[phase]}
                opacity={0.06}
              />
            );
          })}

          {/* Baseline */}
          <Line
            x1={20}
            y1={baseY}
            x2={chartWidth - 20}
            y2={baseY}
            stroke={COLORS.border}
            strokeWidth={1}
            strokeDasharray="4,4"
          />

          {/* Wave paths */}
          {visibleWaves.map((wave) => {
            const waveStart = Math.max(wave.start, startYear);
            const waveEnd = Math.min(wave.end, endYear);
            const isCurrent = wave.wave === 5;

            return (
              <Path
                key={wave.wave}
                d={generateWavePath(waveStart, waveEnd, amplitude, baseY)}
                stroke={wave.color}
                strokeWidth={isCurrent ? 2.5 : 1.5}
                fill="none"
                opacity={isCurrent ? 1 : 0.5}
              />
            );
          })}

          {/* Year labels */}
          {[1960, 1980, 2000, 2020, 2040].map((year) => {
            const x = yearToX(year);
            if (x < 15 || x > chartWidth - 15) return null;
            return (
              <SvgText
                key={year}
                x={x}
                y={height - 5}
                fontSize={10}
                fill={COLORS.textMuted}
                textAnchor="middle"
              >
                {year}
              </SvgText>
            );
          })}

          {/* Phase labels on wave 5 */}
          {Object.entries(wave5.phases).map(([phase, [start, end]]) => {
            const midX = yearToX((start + end) / 2);
            const phaseAmp = amplitude;
            const phaseY = baseY - phaseAmp * 0.5;
            if (midX < 10 || midX > chartWidth - 10) return null;
            return (
              <SvgText
                key={phase}
                x={midX}
                y={phaseY}
                fontSize={9}
                fill={PHASE_COLORS[phase]}
                textAnchor="middle"
                fontWeight="600"
              >
                {phase.charAt(0).toUpperCase() + phase.slice(1)}
              </SvgText>
            );
          })}

          {/* Current year indicator */}
          <Line
            x1={currentX}
            y1={10}
            x2={currentX}
            y2={baseY}
            stroke={COLORS.warning}
            strokeWidth={1.5}
            strokeDasharray="3,3"
          />

          {/* YOU ARE HERE dot */}
          <Circle
            cx={currentX}
            cy={baseY - amplitude * 0.15}
            r={6}
            fill={COLORS.warning}
            opacity={0.9}
          />

          {/* Label */}
          <SvgText
            x={currentX}
            y={baseY - amplitude * 0.15 - 12}
            fontSize={9}
            fill={COLORS.warning}
            textAnchor="middle"
            fontWeight="700"
          >
            {currentYear}
          </SvgText>
        </Svg>

        {/* Animated pulse on current position */}
        <Animated.View
          style={[
            styles.currentDotPulse,
            {
              left: currentX - 12,
              top: baseY - amplitude * 0.15 + 10 - 12,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />
      </View>

      {/* Phase Description */}
      <View style={[styles.phaseCard, { borderColor: `${PHASE_COLORS[currentPhase.toLowerCase()]}40` }]}>
        <Text style={[styles.phaseTitle, { color: PHASE_COLORS[currentPhase.toLowerCase()] }]}>
          Wave 5 · {currentPhase} Phase ({currentYear})
        </Text>
        <Text style={styles.phaseDescription}>
          {PHASE_DESCRIPTIONS[currentPhase]}
        </Text>
      </View>

      {/* Investment Implications */}
      {showImplications && (
        <View style={styles.implicationsContainer}>
          <Text style={styles.implicationsTitle}>Investment Positioning</Text>
          {INVESTMENT_IMPLICATIONS[currentPhase].map((implication, index) => (
            <View key={index} style={styles.implicationRow}>
              <View style={[styles.bullet, { backgroundColor: PHASE_COLORS[currentPhase.toLowerCase()] }]} />
              <Text style={styles.implicationText}>{implication}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Wave Legend */}
      <View style={styles.legendContainer}>
        <Text style={styles.legendTitle}>Historical Waves</Text>
        <View style={styles.legendRow}>
          {KONDRATIEV_WAVES.map((wave) => (
            <View key={wave.wave} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: wave.color }]} />
              <Text style={styles.legendText} numberOfLines={1}>
                W{wave.wave}: {wave.name.split(' ')[0]}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  phaseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 6,
  },
  phaseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  phaseLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  chartContainer: {
    marginBottom: 12,
  },
  currentDotPulse: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: `${COLORS.warning}30`,
  },
  phaseCard: {
    backgroundColor: COLORS.cardElevated || '#1A2035',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  phaseTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  phaseDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  implicationsContainer: {
    marginBottom: 12,
  },
  implicationsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  implicationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 5,
  },
  bullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  implicationText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  legendContainer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  legendTitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
});
