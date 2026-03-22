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

import { COLORS } from '../navigation/AppNavigator';
import { useFinancialStore } from '../store';
import {
  COUNTRIES,
  ProfessionCategory,
  ProfessionLevel,
  Currency,
} from '../types';

const PROFESSIONS: ProfessionCategory[] = [
  'Software Engineering', 'Product Management', 'Data Science', 'Design',
  'Marketing', 'Finance', 'Healthcare', 'Education', 'Legal',
  'Consulting', 'Sales', 'Operations', 'HR', 'Other',
];

const LEVELS: ProfessionLevel[] = ['junior', 'mid', 'senior', 'lead', 'director', 'executive'];
const CURRENCIES: Currency[] = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL'];
const RISK_LEVELS = ['conservative', 'moderate', 'aggressive'] as const;

// ============================================================
// Settings Row
// ============================================================

function SettingRow({
  icon,
  label,
  value,
  onPress,
  color,
  rightElement,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  color?: string;
  rightElement?: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.settingIcon, { backgroundColor: `${color || COLORS.accent}20` }]}>
        <Ionicons name={icon as any} size={18} color={color || COLORS.accent} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{label}</Text>
        {value && <Text style={styles.settingValue}>{value}</Text>}
      </View>
      {rightElement || (onPress && (
        <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
      ))}
    </TouchableOpacity>
  );
}

// ============================================================
// Toggle Setting
// ============================================================

function ToggleSetting({
  icon,
  label,
  value,
  onToggle,
  color,
}: {
  icon: string;
  label: string;
  value: boolean;
  onToggle: () => void;
  color?: string;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={[styles.settingIcon, { backgroundColor: `${color || COLORS.accent}20` }]}>
        <Ionicons name={icon as any} size={18} color={color || COLORS.accent} />
      </View>
      <Text style={[styles.settingLabel, { flex: 1 }]}>{label}</Text>
      <TouchableOpacity
        style={[styles.toggle, value && styles.toggleActive]}
        onPress={onToggle}
      >
        <View style={[styles.toggleThumb, value && styles.toggleThumbActive]} />
      </TouchableOpacity>
    </View>
  );
}

// ============================================================
// Settings Screen
// ============================================================

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useFinancialStore();

  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showProfessionPicker, setShowProfessionPicker] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  const [monthlyBudget, setMonthlyBudget] = useState(settings.targetMonthlyExpense.toString());
  const [monthlySaving, setMonthlySaving] = useState(settings.targetMonthlySaving.toString());
  const [investmentTarget, setInvestmentTarget] = useState(settings.targetInvestmentAllocation.toString());

  const handleSaveGoals = () => {
    const budget = parseFloat(monthlyBudget);
    const saving = parseFloat(monthlySaving);
    const investment = parseFloat(investmentTarget);

    if (isNaN(budget) || isNaN(saving) || isNaN(investment)) {
      Alert.alert('Error', 'Please enter valid numbers');
      return;
    }

    updateSettings({
      targetMonthlyExpense: budget,
      targetMonthlySaving: saving,
      targetInvestmentAllocation: investment,
    });

    Alert.alert('Saved', 'Financial goals updated successfully!');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <View style={styles.card}>
            <SettingRow
              icon="flag"
              label="Country"
              value={`${COUNTRIES.find((c) => c.code === settings.countryCode)?.flag || ''} ${settings.country}`}
              onPress={() => setShowCountryPicker(true)}
            />
            <SettingRow
              icon="location"
              label="City"
              value={settings.city}
              color="#FF6B35"
              onPress={() => Alert.alert('City', 'City selection coming soon')}
            />
            <SettingRow
              icon="briefcase"
              label="Profession"
              value={settings.profession}
              color="#A855F7"
              onPress={() => setShowProfessionPicker(true)}
            />
            <SettingRow
              icon="ribbon"
              label="Level"
              value={settings.professionLevel}
              color="#FFB300"
              onPress={() => {
                const idx = LEVELS.indexOf(settings.professionLevel);
                const next = LEVELS[(idx + 1) % LEVELS.length];
                updateSettings({ professionLevel: next });
              }}
            />
            <SettingRow
              icon="cash"
              label="Currency"
              value={settings.currency}
              color={COLORS.success}
              onPress={() => setShowCurrencyPicker(true)}
            />
          </View>
        </View>

        {/* Financial Goals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial Goals</Text>
          <View style={styles.card}>
            <View style={styles.goalInput}>
              <View style={[styles.settingIcon, { backgroundColor: `${COLORS.danger}20` }]}>
                <Ionicons name="wallet-outline" size={18} color={COLORS.danger} />
              </View>
              <View style={styles.goalInputContent}>
                <Text style={styles.goalInputLabel}>Monthly Spending Limit</Text>
                <View style={styles.goalInputRow}>
                  <Text style={styles.goalCurrency}>$</Text>
                  <TextInput
                    style={styles.goalInputField}
                    value={monthlyBudget}
                    onChangeText={setMonthlyBudget}
                    keyboardType="decimal-pad"
                    placeholderTextColor={COLORS.textMuted}
                  />
                </View>
              </View>
            </View>

            <View style={styles.goalInput}>
              <View style={[styles.settingIcon, { backgroundColor: `${COLORS.success}20` }]}>
                <Ionicons name="save-outline" size={18} color={COLORS.success} />
              </View>
              <View style={styles.goalInputContent}>
                <Text style={styles.goalInputLabel}>Monthly Saving Target</Text>
                <View style={styles.goalInputRow}>
                  <Text style={styles.goalCurrency}>$</Text>
                  <TextInput
                    style={styles.goalInputField}
                    value={monthlySaving}
                    onChangeText={setMonthlySaving}
                    keyboardType="decimal-pad"
                    placeholderTextColor={COLORS.textMuted}
                  />
                </View>
              </View>
            </View>

            <View style={styles.goalInput}>
              <View style={[styles.settingIcon, { backgroundColor: `${COLORS.accent}20` }]}>
                <Ionicons name="trending-up-outline" size={18} color={COLORS.accent} />
              </View>
              <View style={styles.goalInputContent}>
                <Text style={styles.goalInputLabel}>Investment Allocation %</Text>
                <View style={styles.goalInputRow}>
                  <TextInput
                    style={styles.goalInputField}
                    value={investmentTarget}
                    onChangeText={setInvestmentTarget}
                    keyboardType="decimal-pad"
                    placeholderTextColor={COLORS.textMuted}
                  />
                  <Text style={styles.goalPercent}>%</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.saveGoalsButton} onPress={handleSaveGoals}>
              <Text style={styles.saveGoalsText}>Save Goals</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Risk Tolerance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Risk Tolerance</Text>
          <View style={styles.card}>
            <View style={styles.riskRow}>
              {RISK_LEVELS.map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.riskOption,
                    settings.riskTolerance === level && styles.riskOptionActive,
                    {
                      borderColor:
                        settings.riskTolerance === level
                          ? level === 'conservative' ? COLORS.success
                          : level === 'moderate' ? COLORS.warning
                          : COLORS.danger
                          : COLORS.border,
                    },
                  ]}
                  onPress={() => updateSettings({ riskTolerance: level })}
                >
                  <Ionicons
                    name={
                      level === 'conservative' ? 'shield-checkmark'
                      : level === 'moderate' ? 'trending-up'
                      : 'rocket'
                    }
                    size={18}
                    color={
                      settings.riskTolerance === level
                        ? level === 'conservative' ? COLORS.success
                        : level === 'moderate' ? COLORS.warning
                        : COLORS.danger
                        : COLORS.textMuted
                    }
                  />
                  <Text style={[
                    styles.riskOptionText,
                    settings.riskTolerance === level && { color: COLORS.textPrimary, fontWeight: '700' },
                  ]}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.card}>
            <ToggleSetting
              icon="calendar"
              label="Weekly AI Report"
              value={settings.notifications.weeklyReport}
              onToggle={() => updateSettings({
                notifications: { ...settings.notifications, weeklyReport: !settings.notifications.weeklyReport }
              })}
            />
            <ToggleSetting
              icon="alert-circle"
              label="Budget Alerts"
              value={settings.notifications.budgetAlerts}
              color={COLORS.warning}
              onToggle={() => updateSettings({
                notifications: { ...settings.notifications, budgetAlerts: !settings.notifications.budgetAlerts }
              })}
            />
            <ToggleSetting
              icon="trending-up"
              label="Investment Alerts"
              value={settings.notifications.investmentAlerts}
              color={COLORS.success}
              onToggle={() => updateSettings({
                notifications: { ...settings.notifications, investmentAlerts: !settings.notifications.investmentAlerts }
              })}
            />
            <ToggleSetting
              icon="warning"
              label="Risk Alerts"
              value={settings.notifications.riskAlerts}
              color={COLORS.danger}
              onToggle={() => updateSettings({
                notifications: { ...settings.notifications, riskAlerts: !settings.notifications.riskAlerts }
              })}
            />
            <ToggleSetting
              icon="globe"
              label="Economic Updates"
              value={settings.notifications.economicUpdates}
              color="#A855F7"
              onToggle={() => updateSettings({
                notifications: { ...settings.notifications, economicUpdates: !settings.notifications.economicUpdates }
              })}
            />
          </View>
        </View>

        {/* API Keys */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>API Configuration (Optional)</Text>
          <View style={styles.apiCard}>
            <Text style={styles.apiNote}>
              Optional: Add API keys to enable AI-powered analysis and real-time market data. Keys are stored locally on your device only.
            </Text>
            {[
              { label: 'Anthropic API Key', key: 'anthropic', placeholder: 'sk-ant-...' },
              { label: 'FRED API Key', key: 'fredApiKey', placeholder: 'Your FRED API key' },
              { label: 'Google Vision API', key: 'googleVision', placeholder: 'Your Google Cloud key' },
            ].map((apiConfig) => (
              <View key={apiConfig.key} style={styles.apiInputGroup}>
                <Text style={styles.apiLabel}>{apiConfig.label}</Text>
                <TextInput
                  style={styles.apiInput}
                  value={settings.apiKeys?.[apiConfig.key as keyof typeof settings.apiKeys] || ''}
                  onChangeText={(text) => updateSettings({
                    apiKeys: { ...settings.apiKeys, [apiConfig.key]: text }
                  })}
                  placeholder={apiConfig.placeholder}
                  placeholderTextColor={COLORS.textMuted}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
            ))}
          </View>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <SettingRow icon="information-circle" label="Version" value="1.0.0" color={COLORS.textMuted} />
            <SettingRow icon="document-text" label="Privacy Policy" onPress={() => {}} color={COLORS.textMuted} />
            <SettingRow icon="shield" label="Terms of Service" onPress={() => {}} color={COLORS.textMuted} />
          </View>
        </View>
      </ScrollView>

      {/* Country Picker Modal */}
      <Modal visible={showCountryPicker} transparent animationType="slide">
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Country</Text>
              <TouchableOpacity onPress={() => setShowCountryPicker(false)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {COUNTRIES.map((country) => (
                <TouchableOpacity
                  key={country.code}
                  style={[
                    styles.pickerOption,
                    settings.countryCode === country.code && styles.pickerOptionSelected,
                  ]}
                  onPress={() => {
                    updateSettings({
                      country: country.name,
                      countryCode: country.code,
                      currency: country.currency,
                    });
                    setShowCountryPicker(false);
                  }}
                >
                  <Text style={styles.pickerFlag}>{country.flag}</Text>
                  <Text style={[styles.pickerOptionText, settings.countryCode === country.code && { color: COLORS.accent }]}>
                    {country.name}
                  </Text>
                  {settings.countryCode === country.code && (
                    <Ionicons name="checkmark" size={18} color={COLORS.accent} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Profession Picker Modal */}
      <Modal visible={showProfessionPicker} transparent animationType="slide">
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Profession</Text>
              <TouchableOpacity onPress={() => setShowProfessionPicker(false)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {PROFESSIONS.map((prof) => (
                <TouchableOpacity
                  key={prof}
                  style={[
                    styles.pickerOption,
                    settings.profession === prof && styles.pickerOptionSelected,
                  ]}
                  onPress={() => {
                    updateSettings({ profession: prof });
                    setShowProfessionPicker(false);
                  }}
                >
                  <Text style={[styles.pickerOptionText, settings.profession === prof && { color: COLORS.accent }]}>
                    {prof}
                  </Text>
                  {settings.profession === prof && (
                    <Ionicons name="checkmark" size={18} color={COLORS.accent} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Currency Picker Modal */}
      <Modal visible={showCurrencyPicker} transparent animationType="slide">
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Currency</Text>
              <TouchableOpacity onPress={() => setShowCurrencyPicker(false)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {CURRENCIES.map((currency) => (
                <TouchableOpacity
                  key={currency}
                  style={[
                    styles.pickerOption,
                    settings.currency === currency && styles.pickerOptionSelected,
                  ]}
                  onPress={() => {
                    updateSettings({ currency });
                    setShowCurrencyPicker(false);
                  }}
                >
                  <Text style={[styles.pickerOptionText, settings.currency === currency && { color: COLORS.accent }]}>
                    {currency}
                  </Text>
                  {settings.currency === currency && (
                    <Ionicons name="checkmark" size={18} color={COLORS.accent} />
                  )}
                </TouchableOpacity>
              ))}
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
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary, letterSpacing: -0.5 },
  scroll: { flex: 1 },
  section: { paddingHorizontal: 20, marginTop: 20 },
  sectionTitle: {
    fontSize: 12, fontWeight: '700', color: COLORS.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10,
  },
  card: {
    backgroundColor: COLORS.card, borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: COLORS.border,
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', padding: 14, gap: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  settingIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: 14, fontWeight: '500', color: COLORS.textPrimary },
  settingValue: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2, textTransform: 'capitalize' },
  toggle: {
    width: 46, height: 26, borderRadius: 13, backgroundColor: COLORS.border,
    justifyContent: 'center', padding: 2,
  },
  toggleActive: { backgroundColor: COLORS.accent },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.textSecondary },
  toggleThumbActive: { backgroundColor: '#000', alignSelf: 'flex-end' },
  // Goal Inputs
  goalInput: {
    flexDirection: 'row', alignItems: 'center', padding: 14, gap: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  goalInputContent: { flex: 1 },
  goalInputLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 },
  goalInputRow: { flexDirection: 'row', alignItems: 'center' },
  goalCurrency: { fontSize: 16, color: COLORS.textSecondary, marginRight: 2 },
  goalInputField: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary, flex: 1 },
  goalPercent: { fontSize: 16, color: COLORS.textSecondary },
  saveGoalsButton: {
    backgroundColor: COLORS.accent, margin: 14, borderRadius: 12, paddingVertical: 12, alignItems: 'center',
  },
  saveGoalsText: { fontSize: 14, fontWeight: '700', color: '#000' },
  // Risk
  riskRow: { flexDirection: 'row', padding: 12, gap: 10 },
  riskOption: {
    flex: 1, alignItems: 'center', padding: 12, borderRadius: 12,
    borderWidth: 1.5, borderColor: COLORS.border, gap: 6,
  },
  riskOptionActive: { backgroundColor: `${COLORS.card}` },
  riskOptionText: { fontSize: 12, fontWeight: '500', color: COLORS.textMuted, textAlign: 'center' },
  // API
  apiCard: {
    backgroundColor: COLORS.card, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  apiNote: { fontSize: 12, color: COLORS.textMuted, lineHeight: 17, marginBottom: 14 },
  apiInputGroup: { marginBottom: 12 },
  apiLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6 },
  apiInput: {
    backgroundColor: COLORS.background, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 13, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.border,
    fontFamily: 'monospace',
  },
  // Picker Modal
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  pickerContainer: {
    backgroundColor: COLORS.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, maxHeight: '70%',
  },
  pickerHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
  },
  pickerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  pickerOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 4,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  pickerOptionSelected: { backgroundColor: `${COLORS.accent}10` },
  pickerFlag: { fontSize: 22 },
  pickerOptionText: { fontSize: 15, color: COLORS.textPrimary, flex: 1 },
});
