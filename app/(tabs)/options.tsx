import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState, useEffect, useCallback } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
} from "react-native";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "@/src/config/firebase";

interface Professional {
  id: string;
  uid: string;
  name: string;
  email: string;
  phone: string;
  photoURL: string | null;
}

export default function Options() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [salonName, setSalonName] = useState("");
  const [salonDocument, setSalonDocument] = useState("");
  const [salonId, setSalonId] = useState("");
  const [professionals, setProfessionals] = useState<Professional[]>([]);

  const fetchProfessionals = useCallback(async (userSalonId: string) => {
    try {
      const usersCollection = collection(db, "users");
      const q = query(usersCollection, where("salonId", "==", userSalonId));
      const querySnapshot = await getDocs(q);
      
      const professionalsList = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          uid: data.uid,
          name: data.name || "Sem nome",
          email: data. email || "",
          phone: data.phone || "",
          photoURL: data. photoURL || null,
        };
      });
      
      setProfessionals(professionalsList);
    } catch (error) {
      console.error("Erro ao buscar profissionais:", error);
      Alert.alert("Erro", "Não foi possível carregar os profissionais");
    }
  }, []);

  const fetchUserSalonData = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Erro", "Usuário não autenticado");
        setLoading(false);
        return;
      }

      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap. exists()) {
        const userData = userDocSnap.data();
        const userSalonId = userData.salonId;
        const salonNameFromUser = userData.salonName;

        if (userSalonId) {
          setSalonId(userSalonId);
          
          const salonDocRef = doc(db, "salons", userSalonId);
          const salonDocSnap = await getDoc(salonDocRef);

          if (salonDocSnap.exists()) {
            const salonData = salonDocSnap.data();
            setSalonName(salonData.name || salonNameFromUser || "");
            setSalonDocument(salonData.document || "");
          } else {
            setSalonName(salonNameFromUser || "");
            setSalonDocument("");
          }
          
          fetchProfessionals(userSalonId);
        } else {
          setSalonName(salonNameFromUser || "");
          setSalonDocument("");
        }
      }
    } catch (error) {
      console.error("Erro ao buscar dados do salão:", error);
      Alert.alert("Erro", "Não foi possível carregar os dados do salão");
    } finally {
      setLoading(false);
    }
  }, [fetchProfessionals]);

  useEffect(() => {
    fetchUserSalonData();
  }, [fetchUserSalonData]);

  const handleRegisterProfessional = () => {
    if (! salonName || !salonDocument) {
      Alert.alert(
        "Atenção",
        "Não foi possível obter os dados completos do salão. Certifique-se de que o salão foi cadastrado corretamente."
      );
      return;
    }

    router.push({
      pathname: "/register_professional",
      params: {
        salonName:  salonName,
        salonDocument: salonDocument,
      },
    });
  };

  if (loading) {
    return (
      <View style={styles. loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  const canRegisterProfessional = !!salonName && !!salonDocument;

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {}
      <View style={styles.section}>
        <TouchableOpacity
          style={[
            styles.optionButton,
            ! canRegisterProfessional && styles.optionButtonDisabled
          ]}
          onPress={handleRegisterProfessional}
          disabled={!canRegisterProfessional}
          activeOpacity={0.7}
        >
          <View style={styles.optionLeft}>
            <View style={styles.iconContainer}>
              <Ionicons name="person-add" size={24} color="#666" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.optionTitle}>Cadastrar Profissional</Text>
              <Text style={styles. optionDescription}>
                {canRegisterProfessional
                  ? "Adicione novos profissionais ao seu salão"
                  : "Dados do salão incompletos"}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#999" />
        </TouchableOpacity>
      </View>

      {}
      {salonId && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profissionais do Salão</Text>

          {professionals.length === 0 ?  (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="people-outline" size={56} color="#ddd" />
              </View>
              <Text style={styles. emptyText}>Nenhum profissional cadastrado</Text>
              <Text style={styles.emptySubtext}>
                Adicione profissionais para começar
              </Text>
            </View>
          ) : (
            <View style={styles.professionalsContainer}>
              {professionals.map((item, index) => (
                <View 
                  key={item.id} 
                  style={[
                    styles.professionalItem,
                    index === professionals.length - 1 && styles.professionalItemLast
                  ]}
                >
                  <View style={styles.professionalAvatar}>
                    {item.photoURL ? (
                      <Image
                        source={{ uri: item.photoURL }}
                        style={styles.professionalAvatarImage}
                      />
                    ) : (
                      <Ionicons name="person" size={28} color="#666" />
                    )}
                  </View>
                  <View style={styles.professionalInfo}>
                    <Text style={styles.professionalName}>{item.name}</Text>
                    {!! item.email && (
                      <View style={styles.professionalDetailRow}>
                        <Ionicons name="mail-outline" size={14} color="#666" />
                        <Text style={styles.professionalEmail}>{item.email}</Text>
                      </View>
                    )}
                    {!!item.phone && (
                      <View style={styles.professionalDetailRow}>
                        <Ionicons name="call-outline" size={14} color="#666" />
                        <Text style={styles.professionalPhone}>{item.phone}</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex:  1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor:  "#f8f8f8",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },

  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    letterSpacing: -0.3,
    marginBottom: 16,
  },

  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#e5e5e5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  optionButtonDisabled: {
    opacity: 0.5,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#e0e0e0",
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  optionDescription: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },

  professionalsContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#e5e5e5",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  professionalItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor:  "#f0f0f0",
  },
  professionalItemLast: {
    borderBottomWidth: 0,
  },
  professionalAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#e0e0e0",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  professionalAvatarImage:  {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  professionalInfo:  {
    flex: 1,
    gap: 4,
  },
  professionalName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  professionalDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap:  6,
  },
  professionalEmail: {
    fontSize: 14,
    color: "#666",
  },
  professionalPhone: {
    fontSize: 14,
    color: "#666",
  },

  emptyContainer: {
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 48,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#e5e5e5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyIconContainer: {
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#999",
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize:  14,
    color: "#bbb",
  },
});