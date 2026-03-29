import { StyleSheet, View, Text, TextInput, TouchableOpacity, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useState } from 'react';
import Colors from '@/constants/Colors';

export default function QRScreen() {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const formatDisplay = (value: string) => {
    const num = parseFloat(value) / 100;
    return num.toLocaleString('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleNumpad = (key: string) => {
    if (key === 'C') {
      setAmount('');
    } else if (key === '⌫') {
      setAmount(prev => prev.slice(0, -1));
    } else {
      // Max 8 digits (999999.99)
      if (amount.length < 8) {
        setAmount(prev => prev + key);
      }
    }
  };

  const amountInCents = parseInt(amount) || 0;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {/* Amount Display */}
        <View style={styles.amountContainer}>
          <Text style={styles.currencySymbol}>€</Text>
          <Text style={styles.amountText}>
            {amount ? formatDisplay(amount) : '0,00'}
          </Text>
        </View>

        {/* Description Input */}
        <TextInput
          style={styles.descriptionInput}
          placeholder="Beschreibung (optional)"
          placeholderTextColor="rgba(255,255,255,0.4)"
          value={description}
          onChangeText={setDescription}
        />

        {/* Numpad */}
        <View style={styles.numpad}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((key) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.numpadKey,
                key === 'C' && styles.clearKey,
                key === '⌫' && styles.backspaceKey,
              ]}
              onPress={() => handleNumpad(key)}
            >
              <Text style={[
                styles.numpadKeyText,
                (key === 'C' || key === '⌫') && styles.specialKeyText,
              ]}>
                {key}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Generate Button */}
        <TouchableOpacity
          style={[styles.generateButton, !amountInCents && styles.generateButtonDisabled]}
          disabled={!amountInCents}
        >
          <Text style={styles.generateButtonText}>QR Code generieren</Text>
        </TouchableOpacity>

        <Text style={styles.hint}>
          Betrag eingeben und QR Code generieren
        </Text>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    padding: 20,
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline',
    marginVertical: 30,
  },
  currencySymbol: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 32,
    marginRight: 8,
  },
  amountText: {
    color: '#fff',
    fontSize: 56,
    fontWeight: '700',
  },
  descriptionInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
  },
  numpad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  numpadKey: {
    width: '28%',
    aspectRatio: 1.6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numpadKeyText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '500',
  },
  clearKey: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  backspaceKey: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  specialKeyText: {
    fontSize: 22,
  },
  generateButton: {
    backgroundColor: Colors.accent,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  generateButtonDisabled: {
    opacity: 0.5,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  hint: {
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
  },
});
