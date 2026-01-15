import { Stack, useRouter, useSegments, usePathname } from "expo-router";
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Text, StyleSheet, Animated } from "react-native";
import { onAuthStateChanged, User } from "firebase/auth";
import { ClientsProvider } from "@/store/clients";
import { SchedulesProvider } from "@/store/schedules";
import { auth } from "@/src/config/firebase";
import { sessionService } from "@/src/services/sessionService";

function TransitionScreen({ message }: { message: string }) {
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver:  true,
    }).start();
  }, []);

  return (
    <View style={styles.transitionContainer}>
      <Animated.View 
        style={[
          styles.transitionContent,
          { opacity: fadeAnim },
        ]}
      >
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.transitionText}>{message}</Text>
      </Animated.View>
    </View>
  );
}

export default function RootLayout() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [sessionRestored, setSessionRestored] = useState(false);
  const [isSwitchingAccount, setIsSwitchingAccount] = useState(false);
  const router = useRouter();
  const segments = useSegments();
  const pathname = usePathname(); 

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (isSwitchingAccount && currentUser) {
        setUser(currentUser);
        setTimeout(() => {
          setIsSwitchingAccount(false);
          if (initializing) setInitializing(false);
        }, 800);
        return;
      }

      setUser(currentUser);
      
      if (currentUser && !sessionRestored) {
        const lastSession = await sessionService.getLastRoute();
        
        if (lastSession && sessionService.isSessionValid(lastSession)) {
          const route = lastSession.lastRoute;
          
          if (route && 
              ! route.includes('login') && 
              ! route.includes('register') &&
              route !== '/(tabs)' 
          ) {
            console.log('🔄 RESTAURANDO ROTA:', route);
            
            setTimeout(() => {
              try {
                if (lastSession.lastParams) {
                  router.push({ 
                    pathname: route as any, 
                    params: lastSession.lastParams 
                  });
                } else {
                  router.push(route as any);
                }
              } catch (error) {
                console. error('Erro ao restaurar rota:', error);
                router. replace('/(tabs)');
              }
            }, 300); 
          }
        }
        
        setSessionRestored(true);
      }
      
      if (initializing) setInitializing(false);
    });
    
    return unsubscribe;
  }, [sessionRestored, isSwitchingAccount]);

  useEffect(() => {
    if (initializing || isSwitchingAccount) return;

    const isGuestRoute = segments[0] === "login" || 
                        segments[0] === "register" || 
                        segments[0] === "register_professional";

    if (! user && ! isGuestRoute) {
      router.replace("/login");
    } 
    else if (user && (segments[0] === "login" || segments[0] === "register")) {
      router.replace("/(tabs)");
    }
  }, [user, initializing, segments, isSwitchingAccount]);

  useEffect(() => {
    if (user && pathname) {
      if (! pathname.includes('login') && 
          !pathname.includes('register')) {
        
        console.log('💾 SALVANDO ROTA ATUAL:', pathname);
        sessionService.saveCurrentRoute(pathname);
      }
    }
  }, [pathname, user]);

  useEffect(() => {
    (global as any).setAccountSwitching = (switching: boolean) => {
      setIsSwitchingAccount(switching);
    };
  }, []);

  if (initializing || isSwitchingAccount) {
    return (
      <TransitionScreen 
        message={isSwitchingAccount ? "Trocando de conta..." : "Carregando..."} 
      />
    );
  }

  return (
    <ClientsProvider>
      <SchedulesProvider>
        <Stack screenOptions={{ headerShadowVisible: false }}>
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
          
          <Stack.Screen name="(tabs)" options={{ headerShown:  false }} />
          <Stack.Screen name="user_profile" options={{ title: "Meu Perfil" }} />
          <Stack.Screen name="clients_register" options={{ title: "Novo Cliente" }} />
          <Stack. Screen name="scheduling" options={{ title: "Novo Agendamento" }} />
          <Stack.Screen name="client_history" options={{ title: "Histórico" }} />
          
          <Stack.Screen name="register_professional" options={{ title: "Registrar Profissional" }} />
        </Stack>
      </SchedulesProvider>
    </ClientsProvider>
  );
}

const styles = StyleSheet.create({
  transitionContainer: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    alignItems: "center",
    justifyContent: "center",
  },
  transitionContent: {
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  transitionText: {
    fontSize: 18,
    color: "#000",
    fontWeight: "600",
    letterSpacing: -0.3,
  },
});