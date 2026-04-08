import { useGetAnalyticsSummary, useListTransactions, getGetAnalyticsSummaryQueryKey } from "@workspace/api-client-react";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

function formatTenge(amount: number): string {
  return amount.toLocaleString("ru-RU") + " ₸";
}

function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string;
  color: string;
  icon: string;
}) {
  const colors = useColors();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.statIcon, { backgroundColor: color + "20" }]}>
        <Feather name={icon as any} size={18} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data: summary, isLoading: loadingSummary } = useGetAnalyticsSummary();
  const { data: txData, isLoading: loadingTx } = useListTransactions({ limit: 5 });

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: getGetAnalyticsSummaryQueryKey() });
    setRefreshing(false);
  };

  const isLoading = loadingSummary || loadingTx;

  const topInset = Platform.OS === "web" ? 67 : 0;
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 20 + bottomInset, paddingTop: topInset }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Финансы</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Обзор счёта</Text>
      </View>

      {isLoading && !summary ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <>
          <View style={[styles.balanceCard, { backgroundColor: colors.primary }]}>
            <Text style={styles.balanceLabel}>Баланс</Text>
            <Text style={styles.balanceAmount}>
              {formatTenge(summary?.balance ?? 0)}
            </Text>
            <Text style={styles.balanceCount}>
              {summary?.transactionCount ?? 0} транзакций
            </Text>
          </View>

          <View style={styles.statsRow}>
            <StatCard
              label="Доходы"
              value={formatTenge(summary?.totalIncome ?? 0)}
              color={colors.income}
              icon="trending-up"
            />
            <StatCard
              label="Расходы"
              value={formatTenge(summary?.totalExpense ?? 0)}
              color={colors.expense}
              icon="trending-down"
            />
          </View>

          {summary?.avgDailyExpense && summary.avgDailyExpense > 0 ? (
            <View style={[styles.avgCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="activity" size={16} color={colors.mutedForeground} />
              <Text style={[styles.avgText, { color: colors.mutedForeground }]}>
                Среднедневные расходы:{" "}
                <Text style={{ color: colors.foreground, fontWeight: "600" }}>
                  {formatTenge(Math.round(summary.avgDailyExpense))}
                </Text>
              </Text>
            </View>
          ) : null}

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Последние транзакции</Text>

          {!txData?.transactions?.length ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="inbox" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Нет транзакций. Добавьте SMS во вкладке "SMS"
              </Text>
            </View>
          ) : (
            txData.transactions.map((tx) => (
              <View
                key={tx.id}
                style={[styles.txCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                testID={`tx-card-${tx.id}`}
              >
                <View style={styles.txLeft}>
                  <View
                    style={[
                      styles.txDot,
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
                  <View>
                    <Text style={[styles.txMerchant, { color: colors.foreground }]}>
                      {tx.merchant ?? tx.description ?? "Транзакция"}
                    </Text>
                    {tx.category ? (
                      <Text style={[styles.txCategory, { color: colors.mutedForeground }]}>
                        {tx.category}
                      </Text>
                    ) : null}
                  </View>
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
              </View>
            ))
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: "700", letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: 2 },
  loader: { marginTop: 60 },
  balanceCard: {
    marginHorizontal: 20,
    marginVertical: 12,
    borderRadius: 20,
    padding: 24,
  },
  balanceLabel: { color: "rgba(255,255,255,0.8)", fontSize: 14 },
  balanceAmount: { color: "#fff", fontSize: 36, fontWeight: "700", marginTop: 4, letterSpacing: -1 },
  balanceCount: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 4 },
  statsRow: { flexDirection: "row", gap: 12, marginHorizontal: 20, marginBottom: 12 },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 6,
  },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  statValue: { fontSize: 18, fontWeight: "700" },
  statLabel: { fontSize: 12 },
  avgCard: {
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  avgText: { fontSize: 13, flex: 1 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginHorizontal: 20, marginBottom: 12 },
  emptyCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 32,
    borderWidth: 1,
    alignItems: "center",
    gap: 12,
  },
  emptyText: { fontSize: 14, textAlign: "center" },
  txCard: {
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  txLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  txDot: { width: 10, height: 10, borderRadius: 5 },
  txMerchant: { fontSize: 14, fontWeight: "500" },
  txCategory: { fontSize: 12, marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: "600" },
});
