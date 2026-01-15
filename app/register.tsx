import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function Register() {
  const router = useRouter();
  const [salonName, setSalonName] = useState('');
  const [salonDocument, setSalonDocument] = useState(''); 

  const handleDocumentChange = (text:  string) => {
    setSalonDocument(formatCpfCnpj(text));
  };

  const handleNext = async () => {
    if (salonName.trim().length === 0 || salonDocument.trim().length === 0) {
      Alert.alert('Atenção', 'Por favor, preencha todos os campos.');
      return;
    }

    if (! validateCpfCnpj(salonDocument)) {
      Alert.alert('Atenção', 'CPF ou CNPJ inválido.');
      return;
    }

    router.push({
      pathname: '/register_professional',
      params: {
        salonName: salonName,
        salonDocument: salonDocument,
      }
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: "padding", android: "height" })}
        keyboardVerticalOffset={Platform.OS === "ios" ? 16 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {}
          <View style={styles.header}>
            <Text style={styles.appName}>Agenda</Text>
            <Text style={styles.subtitle}>Cadastre seu Salão</Text>
          </View>

          {}
          <View style={styles.form}>
            {}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nome do Estabelecimento</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="business-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Salão Le Belle"
                  placeholderTextColor="#999"
                  value={salonName}
                  onChangeText={setSalonName}
                  accessibilityLabel="Nome do estabelecimento"
                />
              </View>
            </View>

            {}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>CNPJ/CPF Estabelecimento</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="document-text-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="00.000.000/0000-00"
                  placeholderTextColor="#999"
                  value={salonDocument}
                  onChangeText={handleDocumentChange}
                  keyboardType="numeric"
                  maxLength={18}
                  accessibilityLabel="CNPJ ou CPF do estabelecimento"
                />
              </View>
            </View>

            {}
            <TouchableOpacity 
              style={styles.button} 
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <View style={styles.buttonContent}>
                <Text style={styles.buttonText}>Continuar</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>

          {}
          <View style={styles.footer}>
            <Text style={styles. footerText}>Já tem uma conta?  </Text>
            <Link href="/login" asChild>
              <TouchableOpacity>
                <Text style={styles. footerLink}>Fazer Login</Text>
              </TouchableOpacity>
            </Link>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- FUNÇÕES DE MÁSCARA E VALIDAÇÃO ---

function formatCpfCnpj(value: string) {
  const cleanValue = value.replace(/\D/g, '');
  if (cleanValue.length <= 11) {
    return cleanValue
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+? $/, '$1');
  } else {
    return cleanValue
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  }
}

function validateCpfCnpj(val: string) {
  if (!val) return false;
  const cleanVal = val.replace(/\D/g, '');
  if (cleanVal.length === 11) return validateCPF(cleanVal);
  if (cleanVal.length === 14) return validateCNPJ(cleanVal);
  return false;
}

function validateCPF(cpf: string) {
  if (/^(\d)\1+$/.test(cpf)) return false;
  let sum = 0, remainder;
  for (let i = 1; i <= 9; i++) sum = sum + parseInt(cpf.substring(i - 1, i)) * (11 - i);
  remainder = (sum * 10) % 11;
  if ((remainder === 10) || (remainder === 11)) remainder = 0;
  if (remainder !== parseInt(cpf.substring(9, 10))) return false;
  sum = 0;
  for (let i = 1; i <= 10; i++) sum = sum + parseInt(cpf.substring(i - 1, i)) * (12 - i);
  remainder = (sum * 10) % 11;
  if ((remainder === 10) || (remainder === 11)) remainder = 0;
  if (remainder !== parseInt(cpf.substring(10, 11))) return false;
  return true;
}

function validateCNPJ(cnpj: string) {
  if (/^(\d)\1+$/.test(cnpj)) return false;
  return true; 
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 32,
    justifyContent: 'center',
  },

  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  appName: {
    fontSize: 36,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },

  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label:  {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection:  'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e5e5',
    paddingHorizontal: 16,
    height: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity:  0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  input:  {
    flex: 1,
    fontSize: 16,
    color:  '#000',
  },

  button: {
    backgroundColor: '#000',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity:  0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems:  'center',
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  footerText: {
    color: '#666',
    fontSize:  15,
  },
  footerLink: {
    color: '#000',
    fontWeight: '700',
    fontSize: 15,
  },
});