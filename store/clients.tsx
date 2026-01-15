import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { auth, db } from "@/src/config/firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

export type Client = {
  id: string;
  name: string;
  phone: string;
  address?: string;
  userId: string;
  salonId: string;
  createdAt: Date;
};

type Ctx = {
  clients: Client[];
  addClient: (c: Omit<Client, "id">) => Promise<void>;
  upsertMany?: (clients: any[]) => Promise<void>;
  updateClient: (id: string, patch: Partial<Client>) => Promise<void>;
  removeClient: (id: string) => Promise<void>;
};

const ClientsContext = createContext<Ctx | null>(null);

export function ClientsProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [user, setUser] = useState(auth.currentUser);
  const [salonId, setSalonId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setSalonId(null);
        setClients([]);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    
    const unsubscribeUser = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setSalonId(data.salonId || null);
      } else {
        setSalonId(null);
      }
    }, (error) => {
      console.error("Erro ao monitorar perfil do usuário:", error);
    });

    return () => unsubscribeUser();
  }, [user]);

  useEffect(() => {
    if (!salonId) {
      setClients([]);
      return;
    }

    const q = query(
      collection(db, "clients"), 
      where("salonId", "==", salonId)
    );

    const unsubscribeSnapshot = onSnapshot(q, (querySnapshot) => {
      const clientsList: Client[] = [];
      querySnapshot.forEach((doc) => {
        clientsList.push({ id: doc.id, ...doc.data() } as Client);
      });
      
      clientsList.sort((a, b) => a.name.localeCompare(b.name));
      
      setClients(clientsList);
    });

    return () => unsubscribeSnapshot();
  }, [salonId]);

  const addClient = async (c: Omit<Client, "id">) => {
    if (!user || !salonId) {
      throw new Error("Aguarde um momento, estamos finalizando a configuração da sua conta.");
    }
    
    try {
      await addDoc(collection(db, "clients"), {
        ...c,
        userId: user.uid,
        salonId: salonId, 
        createdAt: new Date()
      });
    } catch (error) {
      console.error("Erro ao adicionar cliente:", error);
      throw error;
    }
  };

  const upsertMany = async (clientsToAdd: any[]) => {
    if (!user || !salonId) {
      throw new Error("Aguarde um momento, estamos finalizando a configuração da sua conta.");
    }

    try {
      const promises = clientsToAdd.map((c) =>
        addDoc(collection(db, "clients"), {
          ...c,
          userId: user.uid, 
          salonId: salonId,
          createdAt: new Date(),
        })
      );
      await Promise.all(promises);
    } catch (error) {
      console.error("Erro ao importar clientes:", error);
      throw error;
    }
  };

  const updateClient = async (id: string, patch: Partial<Client>) => {
    if (!user || !salonId) {
      throw new Error("Sessão inválida. Por favor, faça login novamente.");
    }

    try {
      const docRef = doc(db, "clients", id);
      await updateDoc(docRef, patch);
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      throw error;
    }
  };

  const removeClient = async (id: string) => {
    if (!user || !salonId) {
      throw new Error("Sessão inválida. Por favor, faça login novamente.");
    }

    try {
      await deleteDoc(doc(db, "clients", id));
    } catch (error) {
      console.error("Erro ao remover:", error);
      throw error;
    }
  };

  return (
    <ClientsContext.Provider value={{ clients, addClient, upsertMany, updateClient, removeClient }}>
      {children}
    </ClientsContext.Provider>
  );
}

export function useClients() {
  const ctx = useContext(ClientsContext);
  if (!ctx) throw new Error("useClients must be used within ClientsProvider");
  return ctx;
}