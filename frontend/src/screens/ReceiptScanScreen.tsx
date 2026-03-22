import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

import { COLORS } from '../navigation/AppNavigator';
import { useFinancialStore } from '../store';
import { ParsedReceiptData, Transaction, TransactionCategory } from '../types';
import { receiptService } from '../services/receipt.service';

// ============================================================
// Receipt Scan Screen
// ============================================================

const CATEGORIES: TransactionCategory[] = [
  'Housing', 'Food & Dining', 'Transportation', 'Healthcare',
  'Entertainment', 'Shopping', 'Education', 'Utilities',
  'Travel', 'Personal Care', 'Other',
];

export default function ReceiptScanScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { addTransaction } = useFinancialStore();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedReceiptData | null>(null);
  const [editMode, setEditMode] = useState(false);

  // Form state (filled from parsed data)
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState<TransactionCategory>('Food & Dining');
  const [isOnline, setIsOnline] = useState(false);
  const [notes, setNotes] = useState('');

  // ============================================================
  // Image Handling
  // ============================================================

  const takePicture = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Denied', 'Camera permission is required to scan receipts.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [3, 4],
    });

    if (!result.canceled && result.assets[0]) {
      await processImage(result.assets[0].uri);
    }
  };

  const pickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Denied', 'Photo library access is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [3, 4],
    });

    if (!result.canceled && result.assets[0]) {
      await processImage(result.assets[0].uri);
    }
  };

  const processImage = async (uri: string) => {
    setImageUri(uri);
    setIsProcessing(true);
    setParsedData(null);

    try {
      const parsed = await receiptService.processReceiptImage(uri);
      setParsedData(parsed);

      // Fill form with parsed data
      setMerchant(parsed.merchantName || '');
      setAmount(parsed.totalAmount?.toFixed(2) || '');
      setDate(parsed.date || new Date().toISOString().split('T')[0]);
      setCategory(receiptService.suggestCategory(parsed));
    } catch (error) {
      Alert.alert('Error', 'Failed to process receipt. Please try again or enter manually.');
    } finally {
      setIsProcessing(false);
    }
  };

  // ============================================================
  // Save Transaction
  // ============================================================

  const handleSave = () => {
    if (!amount || isNaN(parseFloat(amount))) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const transaction: Transaction = {
      id: Date.now().toString(),
      amount: parseFloat(amount),
      amountUSD: parseFloat(amount),
      merchant: merchant || 'Unknown Merchant',
      category,
      subcategory: undefined,
      date: date || new Date().toISOString().split('T')[0],
      isOnline,
      currency: parsedData?.currency || 'USD',
      notes,
      tags: ['receipt-scanned'],
      receiptImageUrl: imageUri || undefined,
      lineItems: parsedData?.lineItems,
    };

    addTransaction(transaction);
    Alert.alert('Success', 'Transaction saved successfully!', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  // ============================================================
  // Render
  // ============================================================

  if (!imageUri && !parsedData) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan Receipt</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Camera View Area */}
        <View style={styles.cameraArea}>
          <View style={styles.receiptGuide}>
            <View style={styles.guideTL} />
            <View style={styles.guideTR} />
            <View style={styles.guideBL} />
            <View style={styles.guideBR} />
            <View style={styles.guideCenter}>
              <Ionicons name="receipt-outline" size={56} color={`${COLORS.accent}60`} />
              <Text style={styles.guideText}>Position receipt within frame</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={[styles.actionArea, { paddingBottom: insets.bottom + 20 }]}>
          <Text style={styles.instructionText}>
            Take a photo of your receipt or select from gallery
          </Text>

          <TouchableOpacity style={styles.primaryButton} onPress={takePicture}>
            <Ionicons name="camera" size={22} color="#000" />
            <Text style={styles.primaryButtonText}>Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={pickFromGallery}>
            <Ionicons name="images-outline" size={22} color={COLORS.accent} />
            <Text style={styles.secondaryButtonText}>Choose from Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.manualButton}
            onPress={() => {
              // Use mock data to show the form
              setParsedData(receiptService.getMockReceiptData());
              setMerchant('Manual Entry');
              setAmount('');
              setDate(new Date().toISOString().split('T')[0]);
              setCategory('Food & Dining');
            }}
          >
            <Text style={styles.manualButtonText}>Enter Manually</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            setImageUri(null);
            setParsedData(null);
          }}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isProcessing ? 'Processing...' : 'Confirm Receipt'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Processing Indicator */}
      {isProcessing && (
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.processingText}>Analyzing receipt with AI...</Text>
          <Text style={styles.processingSubtext}>Extracting merchant, amounts, and line items</Text>
        </View>
      )}

      {/* Receipt Form */}
      {!isProcessing && parsedData && (
        <ScrollView
          style={styles.formScroll}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        >
          {/* Image Preview */}
          {imageUri && (
            <View style={styles.imagePreview}>
              <Image source={{ uri: imageUri }} style={styles.receiptImage} resizeMode="cover" />
              <View style={styles.confidenceBadge}>
                <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
                <Text style={styles.confidenceText}>
                  {(parsedData.confidence * 100).toFixed(0)}% confidence
                </Text>
              </View>
            </View>
          )}

          {/* Parsed Fields */}
          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Receipt Details</Text>

            {/* Merchant */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Merchant</Text>
              <TextInput
                style={styles.fieldInput}
                value={merchant}
                onChangeText={setMerchant}
                placeholder="Merchant name"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            {/* Amount */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Total Amount</Text>
              <View style={styles.amountRow}>
                <Text style={styles.dollarSign}>$</Text>
                <TextInput
                  style={[styles.fieldInput, styles.amountInput]}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
              {parsedData.tax && (
                <Text style={styles.fieldHint}>
                  Tax: ${parsedData.tax.toFixed(2)} · Subtotal: ${parsedData.subtotal?.toFixed(2)}
                </Text>
              )}
            </View>

            {/* Date */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Date</Text>
              <TextInput
                style={styles.fieldInput}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            {/* Category */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      category === cat && styles.categoryChipSelected,
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        category === cat && styles.categoryChipTextSelected,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Online Toggle */}
            <View style={styles.toggleRow}>
              <Text style={styles.fieldLabel}>Online Purchase</Text>
              <TouchableOpacity
                style={[styles.toggle, isOnline && styles.toggleActive]}
                onPress={() => setIsOnline(!isOnline)}
              >
                <View style={[styles.toggleThumb, isOnline && styles.toggleThumbActive]} />
              </TouchableOpacity>
            </View>

            {/* Notes */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Notes (optional)</Text>
              <TextInput
                style={[styles.fieldInput, styles.notesInput]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Add notes..."
                placeholderTextColor={COLORS.textMuted}
                multiline
                numberOfLines={2}
              />
            </View>
          </View>

          {/* Line Items */}
          {parsedData.lineItems && parsedData.lineItems.length > 0 && (
            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>
                Line Items ({parsedData.lineItems.length})
              </Text>
              {parsedData.lineItems.map((item, index) => (
                <View key={index} style={styles.lineItem}>
                  <View style={styles.lineItemInfo}>
                    <Text style={styles.lineItemName}>{item.description}</Text>
                    {item.quantity > 1 && (
                      <Text style={styles.lineItemQty}>x{item.quantity} @ ${item.unitPrice.toFixed(2)}</Text>
                    )}
                  </View>
                  <Text style={styles.lineItemPrice}>${item.totalPrice.toFixed(2)}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* Save Button */}
      {!isProcessing && parsedData && (
        <View style={[styles.saveButtonContainer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Ionicons name="checkmark-circle" size={22} color="#000" />
            <Text style={styles.saveButtonText}>Confirm & Save</Text>
          </TouchableOpacity>
        </View>
      )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  cameraArea: {
    flex: 1,
    backgroundColor: '#050810',
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiptGuide: {
    width: 260,
    height: 380,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: COLORS.accent,
    borderTopLeftRadius: 4,
  },
  guideTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: COLORS.accent,
    borderTopRightRadius: 4,
  },
  guideBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: COLORS.accent,
    borderBottomLeftRadius: 4,
  },
  guideBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: COLORS.accent,
    borderBottomRightRadius: 4,
  },
  guideCenter: {
    alignItems: 'center',
    gap: 16,
  },
  guideText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  actionArea: {
    padding: 24,
    gap: 12,
  },
  instructionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.accent,
    borderRadius: 16,
    paddingVertical: 16,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: `${COLORS.accent}40`,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.accent,
  },
  manualButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  manualButtonText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  processingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  processingText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  processingSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  formScroll: {
    flex: 1,
  },
  imagePreview: {
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
    height: 200,
    position: 'relative',
  },
  receiptImage: {
    width: '100%',
    height: '100%',
  },
  confidenceBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  confidenceText: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '600',
  },
  formSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  formSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  fieldInput: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  fieldHint: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingLeft: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dollarSign: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  notesInput: {
    height: 70,
    textAlignVertical: 'top',
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: COLORS.card,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipSelected: {
    backgroundColor: `${COLORS.accent}20`,
    borderColor: COLORS.accent,
  },
  categoryChipText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  categoryChipTextSelected: {
    color: COLORS.accent,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
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
  lineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  lineItemInfo: {
    flex: 1,
  },
  lineItemName: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  lineItemQty: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  lineItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  saveButtonContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.accent,
    borderRadius: 16,
    paddingVertical: 16,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
});
