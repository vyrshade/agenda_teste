import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  FlatList,
  ActivityIndicator,
  Image,
  ScrollView,
  Alert,
} from "react-native";
import { signOut, signInWithEmailAndPassword, updateProfile, User } from "firebase/auth";
import { collection, getDocs, doc, getDoc, updateDoc, query, where } from "firebase/firestore";

import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';

import { auth, db } from "@/src/config/firebase";
import { uploadToCloudinary } from "@/src/services/cloudinary";

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState(auth.currentUser);
  
  const [userSalonId, setUserSalonId] = useState<string>("");

  const [avatarUrl, setAvatarUrl] = useState(auth.currentUser?.photoURL);
  const [accountsModalVisible, setAccountsModalVisible] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser:  User | null) => {
      setUser(currentUser);
      setAvatarUrl(currentUser?. photoURL);
      
      if (currentUser) {
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            setUserSalonId(data.salonId || ""); 
          }
        } catch (error) {
          console. error("Erro ao buscar dados do usuário:", error);
        }
      } else {
        setUserSalonId("");
      }
    });

    return () => unsubscribe();
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker. requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result. assets[0]. uri) {
      handleImageUpload(result.assets[0].uri);
    }
  };

  const handleImageUpload = async (uri: string) => {
    setUploadingImage(true);
    
    try {
      if (! user) return;

      const cloudinaryUrl = await uploadToCloudinary(uri);

      if (! cloudinaryUrl) {
        throw new Error("Falha ao obter URL do Cloudinary");
      }

      const finalUrl = cloudinaryUrl;

      await updateProfile(user, {
        photoURL: finalUrl,
      });

      try {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          photoURL: finalUrl
        });
      } catch (firestoreError) {
        console.log("Erro ao atualizar firestore (não crítico):", firestoreError);
      }

      setAvatarUrl(finalUrl);

    } catch (error:  any) {
      console.error("Erro detalhado:", error);
    } finally {
      setUploadingImage(false);
    }
  };
  
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const usersCollection = collection(db, "users");
      
      let usersSnapshot;
      if (userSalonId) {
        const q = query(usersCollection, where("salonId", "==", userSalonId));
        usersSnapshot = await getDocs(q);
      } else {
        usersSnapshot = await getDocs(usersCollection);
      }
      
      const usersList = usersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          uid: data.uid,
          name: data.name,
          email: data.email,
          photoURL: data.photoURL || null,
        };
      });
      setUsers(usersList);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchAccount = async (selectedUser: any) => {
    if (selectedUser. uid === user?. uid) return;

    setAccountsModalVisible(false);
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if ((global as any).setAccountSwitching) {
      (global as any).setAccountSwitching(true);
    }

    try {
      const storedPassword = await SecureStore.getItemAsync(`password_${selectedUser.uid}`);
      
      if (! storedPassword) {
        if ((global as any).setAccountSwitching) {
          (global as any).setAccountSwitching(false);
        }
        
        await signOut(auth);
        router.replace("/login");
        return;
      }
      
      await signOut(auth);
      await signInWithEmailAndPassword(auth, selectedUser.email, storedPassword);
      
      
    } catch (error:  any) {
      console.error("Erro ao trocar conta:", error);
      
      if ((global as any).setAccountSwitching) {
        (global as any).setAccountSwitching(false);
      }
      
      if (error.code === 'auth/invalid-credential') {
        await SecureStore.deleteItemAsync(`password_${selectedUser.uid}`);
        Alert.alert(
          "Erro",
          "Credenciais inválidas. Por favor, faça login novamente.",
          [{ text: "OK", onPress: () => router.replace("/login") }]
        );
      } else {
        Alert.alert(
          "Erro",
          "Não foi possível trocar de conta.  Tente novamente.",
          [{ text: "OK" }]
        );
      }
    }
  };

  const handleOpenAccountsModal = () => {
    setAccountsModalVisible(true);
    fetchUsers();
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/login");
    } catch {
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {}
      <View style={styles.avatarSection}>
        <View style={styles.avatarContainer}>
          {uploadingImage ? (
            <View style={[styles.avatar, styles.avatarLoading]}>
              <ActivityIndicator color="#666" size="large" />
            </View>
          ) : (
            <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper} activeOpacity={0.8}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatar}>
                  <Ionicons name="person" size={56} color="#666" />
                </View>
              )}
              <View style={styles.editIconOverlay}>
                <Ionicons name="camera" size={16} color="#fff" />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {}
        <View style={styles.infoContainer}>
          <Text style={styles.name}>{user?.displayName || "Usuário"}</Text>
          <Text style={styles. email}>{user?.email || "email@exemplo.com"}</Text>
        </View>
      </View>

      {}
      <View style={styles.cardsContainer}>
        <View style={styles.infoCard}>
          <View style={styles.infoCardIcon}>
            <Ionicons name="person-outline" size={22} color="#000" />
          </View>
          <View style={styles.infoCardContent}>
            <Text style={styles.infoCardLabel}>Nome</Text>
            <Text style={styles.infoCardValue}>{user?.displayName || "Não informado"}</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoCardIcon}>
            <Ionicons name="mail-outline" size={22} color="#000" />
          </View>
          <View style={styles.infoCardContent}>
            <Text style={styles.infoCardLabel}>E-mail</Text>
            <Text style={styles.infoCardValue}>{user?.email || "Não informado"}</Text>
          </View>
        </View>
      </View>

      {}
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.switchAccountButton} 
          onPress={handleOpenAccountsModal}
          activeOpacity={0.7}
        >
          <Ionicons name="people-outline" size={22} color="#000" />
          <Text style={styles.switchAccountText}>Trocar de Conta</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={22} color="#ff3b30" />
          <Text style={styles.logoutText}>Sair da Conta</Text>
        </TouchableOpacity>
      </View>

      {}
      <Modal
        visible={accountsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAccountsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione uma Conta</Text>
              <TouchableOpacity 
                onPress={() => setAccountsModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={28} color="#000" />
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#000" />
                <Text style={styles.loadingText}>Carregando contas...</Text>
              </View>
            ) : (
              <FlatList
                data={users}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.accountItem,
                      item.uid === user?.uid && styles.currentAccountItem
                    ]}
                    onPress={() => handleSwitchAccount(item)}
                    disabled={item.uid === user?.uid}
                    activeOpacity={0.7}
                  >
                    <View style={styles.accountAvatar}>
                      {item.photoURL ? (
                        <Image
                          source={{ uri: item. photoURL }}
                          style={styles.accountAvatarImage}
                        />
                      ) : (
                        <Ionicons name="person" size={28} color="#666" />
                      )}
                    </View>
                    <View style={styles.accountInfo}>
                      <Text style={styles.accountName}>{item.name || "Sem nome"}</Text>
                      <Text style={styles.accountEmail}>{item.email}</Text>
                    </View>
                    {item.uid === user?.uid && (
                      <View style={styles.checkmarkContainer}>
                        <Ionicons name="checkmark-circle" size={24} color="#000" />
                      </View>
                    )}
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Ionicons name="people-outline" size={64} color="#ddd" />
                    <Text style={styles.emptyText}>Nenhuma conta encontrada</Text>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </Modal>
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
    paddingTop: 24,
    paddingBottom: 40,
  },

  avatarSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatarContainer: {
    marginBottom: 20,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#e0e0e0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarLoading: {
    backgroundColor:  "#f0f0f0",
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#fff",
  },
  editIconOverlay:  {
    position: 'absolute',
    bottom: 0,
    right:  0,
    backgroundColor: '#000',
    borderRadius: 18,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity:  0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  infoContainer: {
    alignItems: "center",
  },
  name: {
    fontSize: 26,
    fontWeight: "700",
    color: "#000",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  email: {
    fontSize: 15,
    color: "#666",
    fontWeight: "500",
  },

  cardsContainer: {
    gap: 12,
    marginBottom: 28,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding:  18,
    borderRadius: 16,
    gap: 16,
    borderWidth: 2,
    borderColor: "#e5e5e5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity:  0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  infoCardIcon: {
    width:  44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f8f8f8",
    alignItems: "center",
    justifyContent: "center",
  },
  infoCardContent:  {
    flex: 1,
  },
  infoCardLabel:  {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
    textTransform: "uppercase",
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  infoCardValue: {
    fontSize: 16,
    color: "#000",
    fontWeight: "600",
  },

  actionsContainer: {
    gap: 12,
  },
  switchAccountButton: {
    flexDirection:  "row",
    alignItems:  "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 16,
    gap: 12,
    borderWidth: 2,
    borderColor: "#e5e5e5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  switchAccountText: {
    flex: 1,
    fontSize:  16,
    color: "#000",
    fontWeight: "600",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 16,
    gap: 10,
    borderWidth: 2,
    borderColor: "#ff3b30",
  },
  logoutText: {
    fontSize: 16,
    color: "#ff3b30",
    fontWeight:  "700",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent:  "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth:  2,
    borderBottomColor:  "#e5e5e5",
  },
  modalTitle:  {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    padding: 60,
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  accountItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 16,
  },
  currentAccountItem: {
    backgroundColor: "#f8f8f8",
  },
  accountAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#e0e0e0",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  accountAvatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  accountEmail: {
    fontSize: 14,
    color: "#666",
  },
  checkmarkContainer: {
    marginLeft: 8,
  },
  separator: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginHorizontal: 16,
  },
  emptyContainer: {
    padding: 60,
    alignItems: "center",
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    fontWeight: "600",
  },
});