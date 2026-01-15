import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PrimaryButton from "@/components/PrimaryButton";
import { useClients } from "@/store/clients";

export default function ClientsRegister() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?:  string }>();
  const { clients, addClient, updateClient, removeClient } = useClients() as any;

  const editing = typeof id === "string" && id. length > 0;
  const editingClient = editing ? clients.find((c:  any) => c.id === id) : undefined;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!editingClient) return;
    setName(editingClient. name || "");
    setPhone(editingClient.phone || "");
    setAddress(editingClient. address || "");
  }, [editingClient]);

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

  const handleSave = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert("Campos obrigatórios", "Preencha nome e telefone.");
      return;
    }

    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      Alert.alert('Atenção', 'Informe um telefone válido com DDD.');
      return;
    }

    setIsSaving(true);
    try {
      if (editing && editingClient) {
        await updateClient(editingClient.id, {
          name: name. trim(),
          phone: phone. trim(),
          address: address. trim(),
        });
      } else {
        await addClient({
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
        });
      }
      router.back();
    } catch (error) {
      Alert.alert("Erro", "Não foi possível salvar as alterações.");
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (! editing || !editingClient) return;

    Alert.alert(
      "Excluir cliente",
      `Tem certeza que deseja excluir ${editingClient.name}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await removeClient(editingClient.id);
              router.back();
            } catch (error) {
              Alert.alert("Erro", "Não foi possível excluir.");
            }
          },
        },
      ]
    );
  };

  const isValid = name.trim().length > 0 && phone. trim().length > 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding", android:  "height" })}
      style={styles.flex}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        style={styles.scrollView}
      >
        {}
        {editing && editingClient && (
          <View style={styles.header}>
            <View style={styles.editBadge}>
              <Ionicons name="pencil" size={12} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.editBadgeText}>Editando Cliente</Text>
            </View>
          </View>
        )}

        {}
        <View style={[styles.section, ! editing && styles.firstSection]}>
          <Text style={styles.label}>Nome Completo *</Text>
          <View style={styles.fieldWrapper}>
            <Ionicons name="person-outline" size={20} color="#666" style={styles.fieldIcon} />
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Digite o nome do cliente"
              placeholderTextColor="#999"
              style={styles.textInput}
              returnKeyType="next"
              editable={!isSaving}
            />
          </View>
        </View>

        {}
        <View style={styles.section}>
          <Text style={styles.label}>Telefone *</Text>
          <View style={styles.fieldWrapper}>
            <Ionicons name="call-outline" size={20} color="#666" style={styles.fieldIcon} />
            <TextInput
              value={phone}
              onChangeText={handlePhoneChange}
              placeholder="(00) 00000-0000"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
              style={styles.textInput}
              returnKeyType="next"
              editable={!isSaving}
              maxLength={15}
            />
          </View>
        </View>

        {}
        <View style={styles.section}>
          <Text style={styles.label}>Endereço</Text>
          <View style={styles.fieldWrapper}>
            <Ionicons name="location-outline" size={20} color="#666" style={styles.fieldIcon} />
            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder="Rua, número, bairro (opcional)"
              placeholderTextColor="#999"
              style={styles.textInput}
              returnKeyType="done"
              editable={!isSaving}
              multiline
            />
          </View>
        </View>

        <View style={{ height: 24 }} />

        {}
        {isSaving ?  (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000" />
            <Text style={styles.loadingText}>
              {editing ? "Salvando alterações..." : "Cadastrando cliente..."}
            </Text>
          </View>
        ) : (
          <PrimaryButton
            title={editing ?  "Salvar Alterações" : "Cadastrar Cliente"}
            rightIconName="save-outline"
            onPress={handleSave}
            disabled={! isValid}
          />
        )}

        {}
        {editing && ! isSaving && (
          <TouchableOpacity
            style={styles.dangerButton}
            activeOpacity={0.7}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={20} color="#ff3b30" />
            <Text style={styles.dangerText}>Excluir Cliente</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: Math.max(insets.bottom, 20) + 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { 
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  scrollView: {
    backgroundColor: "#f8f8f8",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },

  header: {
    marginBottom: 24,
  },
  editBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#000",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical:  8,
    borderRadius:  20,
  },
  editBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  section: {
    marginBottom: 24,
  },
  firstSection: {
    marginTop: 0,
  },
  label: {
    fontSize:  13,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  fieldWrapper:  {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#e5e5e5",
    borderRadius:  12,
    paddingHorizontal: 16,
    minHeight: 56,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity:  0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  fieldIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: "#000",
    paddingVertical: 12,
  },

  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },

  dangerButton: {
    marginTop: 12,
    height: 56,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#ff3b30",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  dangerText: {
    color: "#ff3b30",
    fontWeight: "700",
    fontSize: 16,
  },
});