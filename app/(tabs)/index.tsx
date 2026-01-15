import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Image, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Calendar, LocaleConfig } from "react-native-calendars";
import PrimaryButton from "@/components/PrimaryButton";
import ScheduleCard from "@/components/ScheduleCard";
import { useSchedules } from "@/store/schedules";
import { auth } from "@/src/config/firebase";

LocaleConfig.locales["pt-br"] = {
  monthNames:  ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"],
  monthNamesShort: ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"],
  dayNames: ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"],
  dayNamesShort: ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"],
  today: "Hoje",
};
LocaleConfig.defaultLocale = "pt-br";

function getTodayYMD(timeZone: string = "America/Sao_Paulo") {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
}

function formatDateBR(ymd: string) {
  if (!ymd || ymd.length < 10) return ymd;
  const [y, m, d] = ymd.split("-");
  return `${d}/${m}/${y}`;
}

function UserDisplayName() {
  const router = useRouter();
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
    });
    return unsubscribe;
  }, []);

  if (!user) return null;

  const displayName = user.displayName?. split(' ')[0] || user.email || '';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <TouchableOpacity
      style={styles.profileChip}
      onPress={() => router.push('/user_profile')}
      activeOpacity={0.7}
    >
      {user.photoURL ?  (
        <Image source={{ uri: user.photoURL }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarInitial}>{initial}</Text>
        </View>
      )}
      <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">
        {displayName}
      </Text>
      <Ionicons name="chevron-forward" size={16} color="#999" />
    </TouchableOpacity>
  );
}

export default function Index() {
  const [selected, setSelected] = useState<string>("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const router = useRouter();
  const { schedules } = useSchedules();
  const params = useLocalSearchParams<{ date?: string; refresh?: string }>();

  useEffect(() => {
    if (params.date) {
      setSelected(params.date);
    }
  }, [params.date, params.refresh]);

  const countsByDate = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const s of schedules) acc[s.date] = (acc[s.date] ??  0) + 1;
    return acc;
  }, [schedules]);

  const dayItems = useMemo(() => {
    if (!selected) return [];
    return schedules
      .filter((s) => s.date === selected)
      .sort((a, b) => a.startTime. localeCompare(b.startTime));
  }, [selected, schedules]);

  const todayDs = getTodayYMD();
  const displayDate = selected || todayDs;

  const DayCell = ({ date, state }: any) => {
    const ds = date.dateString;
    const isSelected = selected === ds;
    const isToday = ds === todayDs;
    const count = countsByDate[ds] ??  0;

    return (
      <Pressable 
        onPress={() => {
          setSelected(ds);
          setCalendarOpen(false);
        }} 
        style={styles.dayPress}
      >
        <View style={[styles.day, isSelected && styles.daySelected]}>
          <Text
            style={[
              styles. dayText,
              state === "disabled" && styles.dayTextDisabled,
              isSelected && styles.dayTextSelected,
              isToday && ! isSelected && styles.dayTextToday,
            ]}
          >
            {date.day}
          </Text>
          {count > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{count > 9 ? "9+" : String(count)}</Text>
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  const handleAgendar = () => {
    router.push({ pathname: "/scheduling", params: { date: selected || todayDs } });
  };

  return (
    <View style={styles.container}>
      {}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.dateButton}
          activeOpacity={0.7}
          onPress={() => setCalendarOpen(! calendarOpen)}
        >
          <Ionicons name="calendar-outline" size={22} color="#000" />
          <Text style={styles.dateText}>{formatDateBR(displayDate)}</Text>
          <Ionicons
            name={calendarOpen ? "chevron-up" : "chevron-down"}
            size={20}
            color="#666"
          />
        </TouchableOpacity>
        <UserDisplayName />
      </View>

      {}
      {calendarOpen && (
        <View style={styles.calendarWrapper}>
          <Calendar
            key={selected}
            style={styles.calendar}
            dayComponent={DayCell}
            current={displayDate}
            onDayPress={(day) => {
              setSelected(day.dateString);
              setCalendarOpen(false);
            }}
            renderArrow={(direction) => (
              <Ionicons
                name={direction === "left" ? "chevron-back" : "chevron-forward"}
                size={24}
                color="#000"
              />
            )}
            theme={{ 
              arrowColor: "#000", 
              todayTextColor: "#ff3b30",
              textMonthFontWeight: "700",
              textMonthFontSize: 18,
              monthTextColor: "#000",
            }}
          />
        </View>
      )}

      {}
      <View style={styles.buttonSection}>
        <PrimaryButton
          title="Novo Agendamento"
          rightIconName="add-circle-outline"
          onPress={handleAgendar}
        />
      </View>

      {}
      <FlatList
        data={dayItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <ScheduleCard
            schedule={item}
            onEditPress={(s) =>
              router.push({ pathname: "/scheduling", params: { id: s.id } })
            }
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons 
                name={selected ?  "calendar-clear-outline" : "calendar-outline"} 
                size={64} 
                color="#ddd" 
              />
            </View>
            <Text style={styles.emptyText}>
              {selected ? "Nenhum agendamento" : "Selecione uma data"}
            </Text>
            <Text style={styles.emptySubtext}>
              {selected 
                ? "Não há agendamentos para este dia" 
                : "Escolha um dia no calendário acima"}
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#f8f8f8", 
    paddingHorizontal: 20, 
    paddingTop: 16,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  dateButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 10,
    borderWidth: 2,
    borderColor: "#e5e5e5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity:  0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dateText: { 
    flex: 1, 
    fontSize: 16, 
    fontWeight: "700", 
    color: "#000",
    letterSpacing: -0.2,
  },

  profileChip:  {
    flexDirection: 'row',
    alignItems:  'center',
    backgroundColor: '#fff',
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: 12,
    borderRadius: 32,
    gap: 8,
    borderWidth: 2,
    borderColor: '#e5e5e5',
    maxWidth: '50%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ddd',
  },
  avatarPlaceholder: {
    width:  32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontSize:  14,
    fontWeight: '700',
  },
  userName:  {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    flexShrink: 1,
  },

  calendarWrapper: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#e5e5e5",
  },
  calendar: {
    backgroundColor: "#fff",
  },
  dayPress: { 
    alignItems: "center", 
    justifyContent:  "center",
    padding: 4,
  },
  day: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  daySelected: {
    backgroundColor: "#000",
  },
  dayText: { 
    color: "#000", 
    fontWeight: "600",
    fontSize: 15,
  },
  dayTextSelected: { color: "#fff" },
  dayTextDisabled: { color: "#ccc" },
  dayTextToday: { color: "#ff3b30" },
  badge: {
    position: "absolute", 
    top: -2, 
    right: -2,
    minWidth: 18, 
    height: 18, 
    borderRadius: 9, 
    backgroundColor: "#ff3b30",
    alignItems:  "center", 
    justifyContent: "center",
    paddingHorizontal: 4, 
    borderWidth: 2, 
    borderColor: "#fff",
  },
  badgeText: { 
    color: "#fff", 
    fontSize: 10, 
    fontWeight: "700", 
    lineHeight:  12,
  },

  buttonSection: {
    marginBottom: 16,
  },

  listContent: {
    paddingBottom: 24,
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
    fontWeight: "700",
    color: "#999",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtext:  {
    fontSize: 14,
    color: "#bbb",
    textAlign: "center",
    lineHeight: 20,
  },
});