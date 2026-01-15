import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useRouter, useLocalSearchParams, Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore'; 
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '@/src/config/firebase'; 

export default function RegisterProfessional() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const salonName = params.salonName as string || '';
  const salonDocument = params.salonDocument as string || '';
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePhoneChange = (text: string) => {
    let formattedText = text.replace(/\D/g, '');
    if (formattedText.length > 11) {
      formattedText = formattedText.substring(0, 11);
    }

    if (formattedText.length > 2) {
      formattedText = `(${formattedText.substring(0, 2)}) ${formattedText.substring(2)}`;
    }
    if (formattedText.length > 10) {
      formattedText = `${formattedText.substring(0, 10)}-${formattedText.substring(10)}`;
    }
    
    setPhone(formattedText);
  };

  const handleRegister = async () => {
    if (name.trim().length === 0 || email.trim().length === 0 || password.trim().length === 0 || phone.trim().length === 0) {
      Alert.alert('Atenção', 'Por favor, preencha todos os campos.');
      return;
    }

    if (! salonName || !salonDocument) {
      Alert.alert('Erro', 'Dados do salão não encontrados.  Por favor, volte e preencha os dados do salão.');
      return;
    }

    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      Alert.alert('Atenção', 'Informe um telefone válido com DDD.');
      return;
    }

    setLoading(true);
    try {
      const salonId = salonDocument.replace(/\D/g, '');
      const salonDocRef = doc(db, "salons", salonId);

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: name
      });

      const salonDocSnap = await getDoc(salonDocRef);
      
      if (! salonDocSnap.exists()) {
        await setDoc(salonDocRef, {
          name: salonName,
          document: salonDocument,
          ownerId: user.uid,
          createdAt: new Date().toISOString(),
        });
      }

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: name,
        email: email,
        phone: phoneDigits,
        salonId: salonId,
        salonName: salonName,
        createdAt: new Date().toISOString(),
      });

      await SecureStore.setItemAsync(`password_${user.uid}`, password);

      Alert.alert('Sucesso', 'Conta criada com sucesso!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') }
      ]);

    } catch (error:  any) {
      console.error(error);
      let msg = "Não foi possível criar a conta. ";
      if (error.code === 'auth/email-already-in-use') msg = "Este e-mail já está em uso.";
      if (error.code === 'auth/invalid-email') msg = "E-mail inválido.";
      if (error.code === 'auth/weak-password') msg = "A senha deve ter pelo menos 6 caracteres.";
      
      Alert.alert('Erro no Cadastro', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.innerContainer}>
              <View style={styles.salonInfoContainer}>
                <View style={styles.salonHeader}>
                  <Ionicons name="business" size={20} color="#666" />
                  <Text style={styles.salonLabel}>Salão</Text>
                </View>
                <Text style={styles.salonName}>{salonName}</Text>
              </View>

              <View style={styles.form}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Nome Completo</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Nome do profissional"
                      placeholderTextColor="#999"
                      value={name}
                      onChangeText={setName}
                      editable={! loading}
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Telefone</Text>
                  <View style={styles. inputWrapper}>
                    <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                      style={styles. input}
                      placeholder="(00) 00000-0000"
                      placeholderTextColor="#999"
                      value={phone}
                      onChangeText={handlePhoneChange}
                      keyboardType="phone-pad"
                      editable={!loading}
                      maxLength={15}
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles. label}>E-mail</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                      style={styles. input}
                      placeholder="seu@email.com"
                      placeholderTextColor="#999"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      editable={!loading}
                      maxLength={100}
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Senha</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Crie uma senha (mín. 6 caracteres)"
                      placeholderTextColor="#999"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      editable={!loading}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#666" />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity 
                  style={[styles.button, loading && styles. buttonDisabled]} 
                  onPress={handleRegister}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator color="#FFF" size="small" />
                      <Text style={styles.buttonText}>Cadastrando...</Text>
                    </View>
                  ) : (
                    <View style={styles.buttonContent}>
                      <Text style={styles.buttonText}>Criar Conta</Text>
                      <Ionicons name="arrow-forward" size={20} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Já tem uma conta? </Text>
                <Link href="/login" asChild>
                  <TouchableOpacity>
                    <Text style={styles.footerLink}>Fazer Login</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  innerContainer: {
    flex: 1,
  },

  salonInfoContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 28,
    borderWidth: 2,
    borderColor: '#e5e5e5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  salonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  salonLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  salonName: {
    fontSize:  20,
    fontWeight:  '700',
    color: '#000',
    letterSpacing: -0.3,
  },

  form: {
    width: '100%',
  },
  inputContainer:  {
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
    height:  56,
    shadowColor:  '#000',
    shadowOffset:  { width: 0, height:  1 },
    shadowOpacity:  0.05,
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
    opacity:  0.7,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingContainer:  {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  footer:  {
    flexDirection: 'row',
    justifyContent:  'center',
    alignItems: 'center',
    marginTop: 32,
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
});