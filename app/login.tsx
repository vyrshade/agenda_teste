import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Modal, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '@/src/config/firebase';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const match = cleaned.substring(0, 11);

    if (match.length === 0) return '';

    if (match.length <= 2) {
      return `(${match}`;
    }
    if (match.length <= 7) {
      return `(${match.slice(0, 2)}) ${match.slice(2)}`;
    }
    return `(${match.slice(0, 2)}) ${match.slice(2, 7)}-${match.slice(7)}`;
  };

  const handleInputChange = (text: string) => {
    const isEmail = /[a-zA-Z@]/.test(text);

    if (isEmail) {
      setEmail(text);
    } else {
      setEmail(formatPhoneNumber(text));
    }
  };

  const resolveEmailForLogin = async (identifier: string) => {
    const trimmed = identifier.trim();
    if (trimmed.includes('@')) return trimmed; 

    const phoneDigits = trimmed.replace(/\D/g, '');
    if (phoneDigits.length < 8) {
      throw new Error('Telefone inválido.');
    }

    const usersCol = collection(db, "users");
    const q = query(usersCol, where("phone", "==", phoneDigits));
    const snap = await getDocs(q);
    if (snap.empty) {
      throw new Error('Telefone não encontrado.');
    }
    const first = snap.docs[0].data();
    if (!first.email) {
      throw new Error('Nenhum e-mail associado a este telefone.');
    }
    return first.email as string;
  };

  const handleLogin = async () => {
    if (email.trim().length === 0 || password.trim().length === 0) {
      Alert.alert('Atenção', 'Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    try {
      const loginEmail = await resolveEmailForLogin(email);

      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, password);
      
      await SecureStore.setItemAsync(`password_${userCredential.user.uid}`, password);
      
      router.replace('/(tabs)'); 
    } catch (error: any) {
      console.error(error);
      let msg = "Ocorreu um erro ao fazer login. ";
      if (error.message && (error.message.includes('Telefone') || error.message.includes('e-mail'))) {
        msg = error.message;
      }
      if (error.code === 'auth/invalid-email') msg = "E-mail inválido.";
      if (error.code === 'auth/user-not-found') msg = "Usuário não encontrado.";
      if (error.code === 'auth/wrong-password') msg = "Senha incorreta.";
      if (error.code === 'auth/invalid-credential') msg = "Credenciais inválidas.";
      
      Alert.alert('Erro no Login', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (resetEmail.trim().length === 0) {
      Alert.alert('Atenção', 'Por favor, digite seu e-mail.');
      return;
    }

    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      Alert.alert(
        'E-mail enviado!',
        'Verifique sua caixa de entrada (e spam) para redefinir sua senha.',
        [{ text: 'OK', onPress: () => {
          setForgotModalVisible(false);
          setResetEmail('');
        }}]
      );
    } catch (error: any) {
      let msg = "Não foi possível enviar o e-mail de recuperação.";
      if (error.code === 'auth/invalid-email') msg = "E-mail inválido.";
      if (error.code === 'auth/user-not-found') msg = "Nenhuma conta encontrada com este e-mail.";
      
      Alert.alert('Erro', msg);
    } finally {
      setResetLoading(false);
    }
  };

  const openForgotModal = () => {
    setResetEmail(email); 
    setForgotModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: "padding", android: "height" })}
        keyboardVerticalOffset={Platform.OS === "ios" ? 24 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            
            <View style={styles.header}>
              <Text style={styles.appName}>Agenda</Text>
              <Text style={styles.subtitle}>Bem-vindo de volta</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>E-mail ou Telefone</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Digite seu e-mail ou telefone"
                    placeholderTextColor="#999"
                    value={email}
                    onChangeText={handleInputChange}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    accessibilityLabel="E-mail ou telefone"
                    editable={!loading}
                    maxLength={/[a-zA-Z@]/.test(email) ? 256 : 15}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Senha</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Digite sua senha"
                    placeholderTextColor="#999"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    accessibilityLabel="Senha"
                    editable={!loading}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.button, loading && styles.buttonDisabled]} 
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <View style={styles.buttonContent}>
                    <ActivityIndicator color="#FFF" size="small" />
                    <Text style={styles.buttonText}>Entrando...</Text>
                  </View>
                ) : (
                  <View style={styles.buttonContent}>
                    <Text style={styles.buttonText}>Entrar</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.forgotButton} 
                onPress={openForgotModal}
                disabled={loading}
              >
                <Ionicons name="help-circle-outline" size={16} color="#666" />
                <Text style={styles.forgotText}>Esqueci minha senha</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Não tem uma conta? </Text>
              <Link href="/register" asChild>
                <TouchableOpacity>
                  <Text style={styles.footerLink}>Cadastre-se</Text>
                </TouchableOpacity>
              </Link>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={forgotModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setForgotModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Ionicons name="key-outline" size={32} color="#000" />
              <Text style={styles.modalTitle}>Recuperar Senha</Text>
            </View>
            
            <Text style={styles.modalDescription}>
              Digite seu e-mail e enviaremos um link para você redefinir sua senha.
            </Text>

            <View style={styles.modalInputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.modalInput}
                placeholder="Digite seu e-mail"
                placeholderTextColor="#999"
                value={resetEmail}
                onChangeText={setResetEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoFocus
                accessibilityLabel="E-mail para recuperação de senha"
                editable={!resetLoading}
              />
            </View>

            <TouchableOpacity
              style={[styles.modalButton, resetLoading && styles.buttonDisabled]}
              onPress={handleForgotPassword}
              disabled={resetLoading}
              activeOpacity={0.8}
            >
              {resetLoading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <View style={styles.buttonContent}>
                  <Ionicons name="send" size={18} color="#fff" />
                  <Text style={styles.modalButtonText}>Enviar E-mail</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => {
                setForgotModalVisible(false);
                setResetEmail('');
              }}
              disabled={resetLoading}
            >
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
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
  container: {
    flex: 1,
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
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e5e5',
    paddingHorizontal: 16,
    height: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
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
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  forgotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingVertical: 8,
    gap: 6,
  },
  forgotText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
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
    fontSize: 15,
  },
  footerLink: {
    color: '#000',
    fontWeight: '700',
    fontSize: 15,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginTop: 12,
    letterSpacing: -0.3,
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e5e5',
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 20,
  },
  modalInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  modalButton: {
    backgroundColor: '#000',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  modalCancelButton: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 12,
  },
  modalCancelText: {
    color: '#666',
    fontSize: 15,
    fontWeight: '600',
  },
});