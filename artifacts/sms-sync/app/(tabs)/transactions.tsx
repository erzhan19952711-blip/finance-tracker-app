import {
  useListTransactions,
  useDeleteTransaction,
  getListTransactionsQueryKey,
  getGetAnalyticsSummaryQueryKey,
} from "@workspace/api-client-react";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import * as Haptics from "expo-haptics";

type FilterType = "all" | "income" | "expense";

function formatTenge(amount: number): string {
  return amount.toLocaleString("ru-RU") + " ₸";
}

export default function TransactionsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterType>("all");

  const topInset = Platform.OS === "web" ? 67 : 0;
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  const { data, isLoading } = useListTransactions(
    filter === "all" ? { limit: 100 } : { type: filter as any, limit: 100 }
  );

  const deleteMutation = useDeleteTransaction();

  const handleDelete = (id: number, name: string) => {
    Alert.alert(
      "Удалить транзакцию",
      `Удалить "${name}"?`,
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Удалить",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deleteMutation.mutate(
              { id },
              {
                onSuccess: () => {
                  queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
                  queryClient.invalidateQueries({ queryKey: getGetAnalyticsSummaryQueryKey() });
                },
              }
            );
          },
        },
      ]
    );
  };

  const filters: { label: string; value: FilterType; color: string }[] = [
    { label: "Все", value: "all", color: colors.foreground },
    { label: "Доходы", value: "income", color: colors.income },
    { label: "Расходы", value: "expense", color: colors.expense },
  ];

  const transactions = data?.transactions ?? [];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 32 + bottomInset, paddingTop: topInset }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top + 8 : 20 }]}>
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>Транзакции</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Управление доходами и расходами
          </Text>
        </View>
      </View>

      <View style={styles.filterRow}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.value}
            onPress={() => setFilter(f.value)}
            style={[
              styles.filterBtn,
              {
                backgroundColor: filter === f.value ? colors.primary : colors.card,
                borderColor: filter === f.value ? colors.primary : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.filterLabel,
                { color: filter === f.value ? "#fff" : colors.mutedForeground },
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : transactions.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="inbox" size={32} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Нет транзакций. Добавьте SMS во вкладке "SMS".
          </Text>
        </View>
      ) : (
        <View style={[styles.list, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.listHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.listHeaderText, { color: colors.mutedForeground, flex: 2 }]}>Описание</Text>
            <Text style={[styles.listHeaderText, { color: colors.mutedForeground }]}>Сумма</Text>
            <Text style={[styles.listHeaderText, { color: colors.mutedForeground, textAlign: "right" }]}></Text>
          </View>
          {transactions.map((tx, idx) => (
            <View key={tx.id}>
              <View style={styles.txRow}>
                <View style={styles.txInfo}>
                  <View style={styles.txNameRow}>
                    <View
                      style={[
                        styles.txTypeDot,
                        {
                          backgroundColor:
                            tx.type === "income"
                              ? colors.income
                              : tx.type === "expense"
                              ? colors.expense
                              : colors.unknown,
                        },
                      ]}
                    />
                    <Text style={[styles.txMerchant, { color: colors.foreground }]} numberOfLines={1}>
                      {tx.merchant ?? tx.description ?? "Транзакция"}
                    </Text>
                  </View>
                  <Text style={[styles.txCategory, { color: colors.mutedForeground }]}>
                    {tx.category ?? "Без категории"}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.txAmount,
                    {
                      color:
                        tx.type === "income"
                          ? colors.income
                          : tx.type === "expense"
                          ? colors.expense
                          : colors.foreground,
                    },
                  ]}
                >
                  {tx.type === "expense" ? "-" : tx.type === "income" ? "+" : ""}
                  {formatTenge(tx.amount)}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    handleDelete(tx.id, tx.merchant ?? tx.description ?? "Транзакция")
                  }
                  style={[styles.deleteBtn, { backgroundColor: colors.expense + "15" }]}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Feather name="trash-2" size={14} color={colors.expense} />
                </TouchableOpacity>
              </View>
              {idx < transactions.length - 1 && (
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: { fontSize: 26, fontWeight: "700", letterSpacing: -0.3 },
  subtitle: { fontSize: 13, marginTop: 2 },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterLabel: { fontSize: 13, fontWeight: "500" },
  loaderWrap: { alignItems: "center", paddingTop: 60 },
  emptyCard: {
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    padding: 40,
    alignItems: "center",
    gap: 12,
  },
  emptyText: { fontSize: 14, textAlign: "center" },
  list: {
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  listHeader: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  listHeaderText: { fontSize: 12, fontWeight: "500", flex: 1 },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 10,
  },
  txInfo: { flex: 1, gap: 2 },
  txNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  txTypeDot: { width: 7, height: 7, borderRadius: 4 },
  txMerchant: { fontSize: 14, fontWeight: "500", flex: 1 },
  txCategory: { fontSize: 12, marginLeft: 13 },
  txAmount: { fontSize: 14, fontWeight: "600", minWidth: 80, textAlign: "right" },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: { height: 1, marginHorizontal: 16 },
});
