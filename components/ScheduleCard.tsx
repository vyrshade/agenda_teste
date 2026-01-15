import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Schedule = {
  id: string;
  date: string;
  title: string;
  clientName: string;
  startTime: string;
  endTime?: string;
  payment?: string | null;
  value?: number;
};

type Props = {
  schedule: Schedule;
  onEditPress?: (schedule: Schedule) => void;
};

export default function ScheduleCard({ schedule, onEditPress }: Props) {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => onEditPress?.(schedule)}
    >
      <View style={styles.content}>
        <View style={styles.mainInfo}>
          <Text style={styles.title}>{schedule.title}</Text>
          
          <View style={styles.row}>
            <Ionicons name="time-outline" size={14} color="#666" style={{ marginTop: 1 }} />
            <Text style={styles.time}>
              {schedule.startTime}
              {schedule.endTime ? ` - ${schedule.endTime}` : ""}
            </Text>
          </View>

          <View style={styles.row}>
            <Ionicons name="person-outline" size={14} color="#666" style={{ marginTop: 1 }} />
            <Text style={styles.client}>{schedule.clientName}</Text>
          </View>
        </View>

        <View style={styles.rightInfo}>
           {typeof schedule.value === "number" && schedule.value > 0 && (
             <Text style={styles.value}>R$ {schedule.value.toFixed(2).replace('.', ',')}</Text>
           )}
           {schedule.payment && (
             <Text style={styles.payment}>{schedule.payment}</Text>
           )}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={20} color="#e0e0e0" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  mainInfo: {
    flex: 1,
    marginRight: 8,
    gap: 4,
  },
  rightInfo: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingLeft: 8,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    marginBottom: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  time: {
    fontSize: 14,
    color: "#444",
    fontWeight: "500",
  },
  client: {
    fontSize: 14,
    color: "#666",
  },
  value: {
    fontSize: 15,
    fontWeight: "700",
    color: "#000",
  },
  payment: {
    fontSize: 12,
    color: "#888",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
});