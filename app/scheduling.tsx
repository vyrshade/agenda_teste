import PrimaryButton from "@/components/PrimaryButton";
import { useClients } from "@/store/clients";
import { useSchedules } from "@/store/schedules";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const PAYMENT_METHODS = ["Pix", "Dinheiro", "Cartão", "Transferência"];

function formatTime(input: string) {
  const digits = input.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

const normalize = (s: string) =>
  (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export default function Scheduling() {
  const { clients } = useClients() as any;
  const { schedules, addSchedule, updateSchedule, removeSchedule } = useSchedules() as any;
  const router = useRouter();
  const { id, date } = useLocalSearchParams<{ id?:  string; date?: string }>();
  const insets = useSafeAreaInsets();

  const editing = typeof id === "string" && id. length > 0;
  const editingSchedule = editing ?  schedules. find((s:  any) => s.id === id) : undefined;

  const [scheduleDate, setScheduleDate] = useState(
    (typeof date === "string" && date.length
      ? date
      : new Date().toISOString().slice(0, 10)) as string
  );

  const [clientModal, setClientModal] = useState(false);
  const [clientQuery, setClientQuery] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [payment, setPayment] = useState<string | null>(null);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isSaving, setIsSaving] = useState(false); 

  useEffect(() => {
    if (!editingSchedule) return;
    setScheduleDate(editingSchedule. date);
    setSelectedClientId(editingSchedule. clientId);
    setTitle(editingSchedule.title);
    setValue(
      typeof editingSchedule.value === "number"
        ? String(editingSchedule.value)
        : ""
    );
    setPayment(editingSchedule.payment ??  null);
    setStartTime(editingSchedule.startTime);
    setEndTime(editingSchedule.endTime || "");
  }, [editingSchedule]);

  const selectedClient = clients.find((c: any) => c.id === selectedClientId);

  const handleValue = (v: string) => {
    const digits = v.replace(/[^\d]/g, "");
    setValue(digits);
  };

  const handleStart = (v: string) => setStartTime(formatTime(v));
  const handleEnd = (v: string) => setEndTime(formatTime(v));

  const isValid = useMemo(
    () =>
      selectedClient &&
      title.trim().length > 0 &&
      startTime. trim().length >= 4,
    [selectedClient, title, startTime]
  );

  const handleSubmit = async () => {
    if (!isValid || ! selectedClient) return;

    const payload = {
      date:  scheduleDate,
      title:  title.trim(),
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      value: value ? Number(value) : 0,
      payment,
      startTime,
      endTime:  endTime.trim().length >= 4 ? endTime : "",
    };

    setIsSaving(true);
    try {
      if (editing && editingSchedule) {
        await updateSchedule(editingSchedule.id, payload);
      } else {
        await addSchedule(payload);
      }
      router.navigate({ pathname: "/", params: { date: scheduleDate, refresh: Date.now().toString() } });
    } catch (error) {
      Alert.alert("Erro", "Não foi possível salvar o agendamento.");
      setIsSaving(false);
    }
  };

  const handleCancelAppointment = () => {
    if (! editing || !editingSchedule) return;

    Alert.alert(
      "Cancelar Agendamento",
      "Tem certeza que deseja cancelar este agendamento? ",
      [
        { text: "Não", style: "cancel" },
        { 
          text: "Sim, cancelar", 
          style: "destructive",
          onPress: async () => {
            try {
              await removeSchedule(editingSchedule.id);
              router.navigate({ pathname: "/", params: { date: editingSchedule.date, refresh: Date.now().toString() } });
            } catch (error) {
              Alert.alert("Erro", "Não foi possível cancelar.");
            }
          }
        }
      ]
    );
  };

  const filteredClients = useMemo(() => {
    const raw = clientQuery.trim();
    const q = normalize(raw);
    const digits = raw.replace(/\D/g, "");
    if (! q && ! digits) return clients;
    return clients.filter((c: any) => {
      const nameOk = q ? normalize(c.name).includes(q) : false;
      const phoneDigits = (c.phone || "").replace(/\D/g, "");
      const phoneOk = digits ?  phoneDigits.includes(digits) : false;
      return nameOk || phoneOk;
    });
  }, [clients, clientQuery]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding", android: "height" })}
      style={styles.flex}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        style={styles.scrollView}
      >
        {}
        <View style={styles.header}>
          <View style={styles.dateBadge}>
            <Ionicons name="calendar-outline" size={14} color="#fff" />
            <Text style={styles.dateBadgeText}>{scheduleDate}</Text>
          </View>
        </View>

        {}
        <View style={styles.section}>
          <Text style={styles.label}>Cliente *</Text>
          <TouchableOpacity
            style={styles.fieldWrapper}
            activeOpacity={0.7}
            onPress={() => setClientModal(true)}
            disabled={isSaving}
          >
            <Ionicons name="person-outline" size={20} color="#666" style={styles.fieldIcon} />
            <Text style={[styles.fieldText, !selectedClient && styles.placeholderText]}>
              {selectedClient ?  selectedClient.name : "Selecionar cliente"}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {}
        <View style={styles.section}>
          <Text style={styles.label}>Título do Serviço *</Text>
          <View style={styles.fieldWrapper}>
            <Ionicons name="cut-outline" size={20} color="#666" style={styles.fieldIcon} />
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Ex: Corte de cabelo"
              placeholderTextColor="#999"
              style={styles.textInput}
              returnKeyType="next"
              editable={!isSaving}
            />
          </View>
        </View>

        {}
        <View style={styles.timeContainer}>
          <View style={styles.timeField}>
            <Text style={styles.label}>Hora Início *</Text>
            <View style={styles.fieldWrapper}>
              <Ionicons name="time-outline" size={20} color="#666" style={styles.fieldIcon} />
              <TextInput
                value={startTime}
                onChangeText={handleStart}
                placeholder="HH:MM"
                placeholderTextColor="#999"
                style={styles.textInput}
                keyboardType="numeric"
                maxLength={5}
                returnKeyType="next"
                editable={!isSaving}
              />
            </View>
          </View>

          <View style={styles.timeField}>
            <Text style={styles.label}>Hora Fim</Text>
            <View style={styles.fieldWrapper}>
              <Ionicons name="time-outline" size={20} color="#666" style={styles.fieldIcon} />
              <TextInput
                value={endTime}
                onChangeText={handleEnd}
                placeholder="HH:MM"
                placeholderTextColor="#999"
                style={styles.textInput}
                keyboardType="numeric"
                maxLength={5}
                returnKeyType="done"
                editable={!isSaving}
              />
            </View>
          </View>
        </View>

        {}
        <View style={styles.section}>
          <Text style={styles.label}>Valor (Opcional)</Text>
          <View style={styles.fieldWrapper}>
            <Ionicons name="cash-outline" size={20} color="#666" style={styles.fieldIcon} />
            <TextInput
              value={value}
              onChangeText={handleValue}
              keyboardType="number-pad"
              placeholder="Ex: 50,00"
              placeholderTextColor="#999"
              style={styles.textInput}
              returnKeyType="next"
              maxLength={7}
              editable={!isSaving}
            />
          </View>
        </View>

        {}
        <View style={styles.section}>
          <Text style={styles.label}>Forma de Pagamento (Opcional)</Text>
          <View style={styles.methodsRow}>
            {PAYMENT_METHODS.map((m) => {
              const active = payment === m;
              return (
                <TouchableOpacity
                  key={m}
                  onPress={() => setPayment(active ? null : m)}
                  activeOpacity={0.7}
                  style={[
                    styles.methodPill, 
                    active && styles. methodPillActive,
                    isSaving && { opacity: 0.5 }
                  ]}
                  disabled={isSaving}
                >
                  <Text style={[styles.methodText, active && styles.methodTextActive]}>
                    {m}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={{ height: 24 }} />

        {}
        {isSaving ?  (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000" />
            <Text style={styles.loadingText}>Salvando... </Text>
          </View>
        ) : (
          <PrimaryButton
            title={editing ?  "Salvar Alterações" : "Criar Agendamento"}
            rightIconName="save-outline"
            disabled={!isValid}
            onPress={handleSubmit}
          />
        )}

        {}
        {editing && ! isSaving && (
          <TouchableOpacity
            style={styles.dangerButton}
            activeOpacity={0.7}
            onPress={handleCancelAppointment}
          >
            <Ionicons name="trash-outline" size={20} color="#ff3b30" />
            <Text style={styles.dangerText}>Cancelar Agendamento</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>

      {}
      <Modal
        visible={clientModal}
        animationType="slide"
        onRequestClose={() => setClientModal(false)}
      >
        <SafeAreaView
          style={[
            styles.modalSafe,
            { paddingTop: Math.max(insets.top, 16) } 
          ]}
          edges={['top', 'left', 'right', 'bottom']}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setClientModal(false)}
              hitSlop={{ top: 8, bottom: 8, left:  8, right: 8 }}
              style={styles.backButton}
            >
              <Ionicons name="close" size={28} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Selecionar Cliente</Text>
            <View style={{ width: 28 }} />
          </View>

          <View style={styles.searchBox}>
            <Ionicons name="search" size={20} color="#666" style={{ marginRight: 12 }} />
            <TextInput
              value={clientQuery}
              onChangeText={setClientQuery}
              placeholder="Pesquisar por nome ou telefone"
              placeholderTextColor="#999"
              style={styles.searchInput}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <FlatList
            data={filteredClients}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                activeOpacity={0.7}
                onPress={() => {
                  setSelectedClientId(item.id);
                  setClientModal(false);
                  setClientQuery("");
                }}
              >
                <View style={styles.clientAvatar}>
                  <Ionicons name="person" size={24} color="#fff" />
                </View>
                <View style={styles.clientInfo}>
                  <Text style={styles. clientName}>{item.name}</Text>
                  <Text style={styles.clientPhone}>{item.phone}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={64} color="#ddd" />
                <Text style={styles.emptyText}>Nenhum cliente encontrado</Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>
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
    paddingBottom: 48,
  },

  header: {
    marginBottom: 24,
  },
  dateBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#000",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  dateBadgeText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },

  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  fieldWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#e5e5e5",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
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
    fontSize:  16,
    color: "#000",
  },
  fieldText: {
    flex: 1,
    fontSize: 16,
    color:  "#000",
  },
  placeholderText: {
    color: "#999",
  },

  methodsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  methodPill: {
    paddingHorizontal: 20,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#e5e5e5",
    justifyContent: "center",
    alignItems: "center",
  },
  methodPillActive: {
    backgroundColor:  "#000",
    borderColor: "#000",
  },
  methodText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  methodTextActive: {
    color: "#fff",
  },

  timeContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  timeField: {
    flex: 1,
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

  dangerButton:  {
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

  modalSafe: {
    flex: 1,
    backgroundColor:  "#f8f8f8",
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor:  "#e5e5e5",
  },
  backButton: {
    height: 40,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    letterSpacing: -0.3,
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#e5e5e5",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color:  "#000",
  },

  listContent: {
    paddingVertical: 8,
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  clientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  clientPhone: {
    fontSize: 14,
    color: "#666",
  },
  separator: {
    height: 8,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: "center",
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    fontWeight: "500",
  },
});