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
  TouchableOpacity,
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
  valueColor,
  icon,
  iconColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
  icon: string;
  iconColor: string;
}) {
  const colors = useColors();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.statCardHeader}>
        <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
        <Feather name={icon as any} size={16} color={iconColor} />
      </View>
      <Text style={[styles.statValue, { color: valueColor ?? colors.foreground }]}>{value}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data: summary, isLoading: loadingSummary } = useGetAnalyticsSummary();
  const { data: txData, isLoading: loadingTx } = useListTransactions({ limit: 7 });

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
      contentContainerStyle={{ paddingBottom: insets.bottom + 32 + bottomInset, paddingTop: topInset }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top + 8 : 20 }]}>
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>Обзор</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Ваш финансовый отчёт</Text>
        </View>
        <TouchableOpacity
          onPress={onRefresh}
          style={[styles.refreshBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Feather name="refresh-cw" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {isLoading && !summary ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <>
          <View style={styles.statsGrid}>
            <StatCard
              label="Баланс"
              value={formatTenge(summary?.balance ?? 0)}
              icon="credit-card"
              iconColor={colors.mutedForeground}
            />
            <StatCard
              label="Доходы"
              value={formatTenge(summary?.totalIncome ?? 0)}
              valueColor={colors.income}
              icon="trending-up"
              iconColor={colors.income}
            />
            <StatCard
              label="Расходы"
              value={formatTenge(summary?.totalExpense ?? 0)}
              valueColor={colors.expense}
              icon="trending-down"
              iconColor={colors.expense}
            />
            <StatCard
              label="Ср. в день"
              value={formatTenge(Math.round(summary?.avgDailyExpense ?? 0))}
              icon="activity"
              iconColor={colors.mutedForeground}
            />
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Последние операции</Text>
              <Text style={[styles.cardMeta, { color: colors.mutedForeground }]}>
                {summary?.transactionCount ?? 0} всего
              </Text>
            </View>

            {!txData?.transactions?.length ? (
              <View style={styles.emptyBox}>
                <Feather name="inbox" size={28} color={colors.mutedForeground} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  Нет операций. Добавьте SMS.
                </Text>
              </View>
            ) : (
              txData.transactions.map((tx, idx) => (
                <View key={tx.id}>
                  <View style={styles.txRow} testID={`tx-card-${tx.id}`}>
                    <View style={styles.txLeft}>
                      <View>
                        <Text style={[styles.txMerchant, { color: colors.foreground }]} numberOfLines={1}>
                          {tx.merchant ?? tx.description ?? "Транзакция"}
                        </Text>
                        <Text style={[styles.txCategory, { color: colors.mutedForeground }]}>
                          {tx.category ?? "Без категории"}
                        </Text>
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
                  {idx < txData.transactions.length - 1 && (
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  )}
                </View>
              ))
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: { fontSize: 26, fontWeight: "700", letterSpacing: -0.3 },
  subtitle: { fontSize: 13, marginTop: 2 },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  loaderWrap: { alignItems: "center", paddingTop: 80 },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    width: "47%",
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  statCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statLabel: { fontSize: 13 },
  statValue: { fontSize: 20, fontWeight: "700", letterSpacing: -0.3 },
  card: {
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: "600" },
  cardMeta: { fontSize: 13 },
  emptyBox: { alignItems: "center", gap: 10, paddingVertical: 32 },
  emptyText: { fontSize: 14 },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  txLeft: { flex: 1, gap: 2 },
  txMerchant: { fontSize: 15, fontWeight: "500" },
  txCategory: { fontSize: 13 },
  txAmount: { fontSize: 15, fontWeight: "600" },
  divider: { height: 1, marginHorizontal: 16 },
});
