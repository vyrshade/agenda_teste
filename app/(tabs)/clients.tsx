import { Ionicons } from "@expo/vector-icons";
import * as Contacts from "expo-contacts";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  SafeAreaView,
} from "react-native";
import ClientCard from "@/components/ClientCard";
import PrimaryButton from "@/components/PrimaryButton";
import { useClients } from "@/store/clients";

const normalize = (s: string) =>
  (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const onlyDigits = (v: string) => (v || "").replace(/\D/g, "");

export default function Clients() {
  const router = useRouter();
  const { clients, addClient, upsertMany } = useClients() as any;

  const [search, setSearch] = useState("");
  const [importing, setImporting] = useState(false);

  const [importModalVisible, setImportModalVisible] = useState(false);
  const [candidates, setCandidates] = useState<{ name: string; phone: string }[]>([]);
  const [selectedPhones, setSelectedPhones] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = normalize(search.trim());
    if (!q) return clients;
    return clients.filter((c: any) => normalize(c.name).includes(q));
  }, [clients, search]);

  async function handleImportContacts() {
    try {
      setImporting(true);
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permissão negada", "Habilite o acesso aos contatos nas configurações.");
        setImporting(false);
        return;
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
        pageSize: 2000,
      });

      if (!data?.length) {
        Alert.alert("Sem contatos", "Nenhum contato encontrado.");
        setImporting(false);
        return;
      }

      const flat = data
        .filter((c) => c.name && c.phoneNumbers?.length)
        .flatMap((c) =>
          (c.phoneNumbers || [])
            .map((p) => ({
              name: c.name!.trim(),
              phone: onlyDigits(p.number || ""),
            }))
            .filter((x) => x.phone.length >= 8)
        );

      const byPhone = new Map<string, { name: string; phone: string }>();
      for (const c of flat) if (!byPhone.has(c.phone)) byPhone.set(c.phone, c);
      const unique = Array.from(byPhone.values());

      const existingPhones = new Set(
        clients.map((c: any) => onlyDigits(c.phone))
      );
      const toInsert = unique.filter(
        (c) => !existingPhones.has(onlyDigits(c.phone))
      );

      if (!toInsert.length) {
        Alert.alert("Nada para importar", "Todos já cadastrados.");
        setImporting(false);
        return;
      }

      setCandidates(toInsert.sort((a, b) => a.name.localeCompare(b.name)));
      
      const initialSelection = new Set<string>();
      toInsert.forEach(c => initialSelection.add(c.phone));
      setSelectedPhones(initialSelection);
      
      setImportModalVisible(true);
      
    } catch (e: any) {
      console.error("Erro na busca:", e);
      Alert.alert("Erro ao buscar", e?.message || "Tente novamente.");
    } finally {
      setImporting(false);
    }
  }

  const toggleSelection = (phone: string) => {
    const next = new Set(selectedPhones);
    if (next.has(phone)) next.delete(phone);
    else next.add(phone);
    setSelectedPhones(next);
  };

  const toggleSelectAll = () => {
    if (selectedPhones.size === candidates.length) {
      setSelectedPhones(new Set());
    } else {
      const all = new Set<string>();
      candidates.forEach(c => all.add(c.phone));
      setSelectedPhones(all);
    }
  };

  async function confirmImport() {
    if (selectedPhones.size === 0) {
      Alert.alert("Atenção", "Selecione pelo menos um contato.");
      return;
    }

    setImporting(true);
    try {
      const finalToInsert = candidates.filter(c => selectedPhones.has(c.phone));
      
      const payload = finalToInsert.map((c) => ({
        name: c.name,
        phone: c.phone,
        address: "",
      }));

      if (typeof upsertMany === "function") {
        await upsertMany(payload);
      } else if (typeof addClient === "function") {
        for (const c of payload) await addClient(c);
      }

      setImportModalVisible(false);
      Alert.alert("Importação concluída", `Importados ${payload.length} contato(s).`);
    } catch (e: any) {
      console.error("Erro na importação:", e);
      Alert.alert("Erro ao importar", e?.message || "Tente novamente.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <PrimaryButton
          title={importing ? "Carregando..." : "Importar Contatos"}
          rightIconName="cloud-download-outline"
          disabled={importing}
          onPress={handleImportContacts}
        />
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Pesquisar por nome"
          placeholderTextColor="#999"
          style={styles.searchInput}
          returnKeyType="search"
          autoCapitalize="none"
        />
        {search.length > 0 && (
          <Ionicons
            name="close-circle"
            size={20}
            color="#999"
            onPress={() => setSearch("")}
            style={{ padding: 4 }}
          />
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item: any, index) =>
          item.id || `${onlyDigits(item.phone)}-${index}`
        }
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <ClientCard
            client={item}
            onPress={() =>
              router.push({ pathname: "/clients_register", params: { id: item.id } })
            }
            onHistoryPress={(c) =>
              router.push({ pathname: "/client_history", params: { id: c.id } })
            }
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="people-outline" size={64} color="#ddd" />
            </View>
            <Text style={styles.emptyText}>Nenhum cliente encontrado</Text>
            <Text style={styles.emptySubtext}>
              {search ? "Tente uma busca diferente" : "Comece adicionando um cliente"}
            </Text>
          </View>
        }
        style={styles.list}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.section}>
        <PrimaryButton
          title="Cadastrar Cliente"
          rightIconName="add-circle-outline"
          onPress={() => router.push("/clients_register")}
        />
      </View>

      <Modal
        visible={importModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setImportModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderTop}>
              <TouchableOpacity onPress={() => setImportModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Importar Contatos</Text>
              <TouchableOpacity onPress={toggleSelectAll}>
                <Text style={styles.modalActionText}>
                  {selectedPhones.size === candidates.length ? "Desmarcar" : "Todos"}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              {selectedPhones.size} selecionado(s) de {candidates.length} novos encontrados
            </Text>
          </View>

          <FlatList
            data={candidates}
            keyExtractor={(item) => item.phone}
            contentContainerStyle={styles.modalListContent}
            renderItem={({ item }) => {
              const isSelected = selectedPhones.has(item.phone);
              return (
                <TouchableOpacity 
                  style={[styles.candidateItem, isSelected && styles.candidateItemSelected]} 
                  onPress={() => toggleSelection(item.phone)}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name={isSelected ? "checkbox" : "square-outline"} 
                    size={24} 
                    color={isSelected ? "#000" : "#ccc"} 
                  />
                  <View style={styles.candidateInfo}>
                    <Text style={styles.candidateName}>{item.name}</Text>
                    <Text style={styles.candidatePhone}>{item.phone}</Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />

          <View style={styles.modalFooter}>
            <PrimaryButton 
              title={`Importar (${selectedPhones.size})`}
              onPress={confirmImport}
              disabled={selectedPhones.size === 0 || importing}
              rightIconName="download-outline"
            />
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },

  section: {
    marginBottom: 16,
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#e5e5e5",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#000",
  },

  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 8,
    gap: 12,
    flexGrow: 1,
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#999",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#bbb",
    textAlign: "center",
  },

  modalContainer: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  modalHeader: {
    backgroundColor: "#fff",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  modalHeaderTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#000",
  },
  modalCancelText: {
    fontSize: 16,
    color: "#ff3b30",
  },
  modalActionText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
  },
  modalSubtitle: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
  },
  modalListContent: {
    padding: 16,
    gap: 8,
  },
  candidateItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    gap: 12,
  },
  candidateItemSelected: {
    borderColor: "#000",
    backgroundColor: "#f9f9f9",
  },
  candidateInfo: {
    flex: 1,
  },
  candidateName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  candidatePhone: {
    fontSize: 14,
    color: "#666",
  },
  modalFooter: {
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
  },
});