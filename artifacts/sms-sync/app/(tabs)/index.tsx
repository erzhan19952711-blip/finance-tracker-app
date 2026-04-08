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
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

function formatTenge(amount: number): string {
  return amount.toLocaleString("ru-RU") + " ₸";
}

const CATEGORY_ICONS: Record<string, string> = {
  "Еда": "coffee",
  "Транспорт": "navigation",
  "Покупки": "shopping-bag",
  "Развлечения": "film",
  "Здоровье": "heart",
  "Связь": "smartphone",
  "Зарплата": "briefcase",
  "Переводы": "repeat",
};

function StatCard({
  label,
  value,
  color,
  icon,
  bgColor,
}: {
  label: string;
  value: string;
  color: string;
  icon: string;
  bgColor: string;
}) {
  const colors = useColors();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card }]}>
      <View style={[styles.statIconWrap, { backgroundColor: bgColor }]}>
        <Feather name={icon as any} size={22} color={color} />
      </View>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.statValue, { color: color }]}>{value}</Text>
    </View>
  );
}

function TxIcon({ type, category }: { type: string; category?: string }) {
  const colors = useColors();
  const iconName = (category && CATEGORY_ICONS[category]) ||
    (type === "income" ? "arrow-down-left" : "arrow-up-right");
  const bg = type === "income" ? colors.income + "15" : type === "expense" ? colors.expense + "15" : colors.muted;
  const fg = type === "income" ? colors.income : type === "expense" ? colors.expense : colors.unknown;
  return (
    <View style={[styles.txIcon, { backgroundColor: bg }]}>
      <Feather name={iconName as any} size={18} color={fg} />
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

  const balance = summary?.balance ?? 0;
  const isPositive = balance >= 0;

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
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>Финансы</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Обзор счёта</Text>
        </View>
        <TouchableOpacity
          onPress={onRefresh}
          style={[styles.headerBtn, { backgroundColor: colors.card }]}
        >
          <Feather name="refresh-cw" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {isLoading && !summary ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Загрузка данных...</Text>
        </View>
      ) : (
        <>
          <LinearGradient
            colors={["#0d5c2e", "#16a34a", "#22c55e"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceCard}
          >
            <View style={styles.balanceTop}>
              <View style={styles.balanceLabelRow}>
                <View style={styles.balanceDot} />
                <Text style={styles.balanceLabel}>Текущий баланс</Text>
              </View>
              <View style={[styles.txCountBadge]}>
                <Feather name="list" size={12} color="rgba(255,255,255,0.9)" />
                <Text style={styles.txCountText}>{summary?.transactionCount ?? 0} операций</Text>
              </View>
            </View>
            <Text style={styles.balanceAmount}>
              {isPositive ? "" : "−"}{formatTenge(Math.abs(balance))}
            </Text>
            <View style={styles.balanceFooter}>
              <View style={styles.balanceMiniStat}>
                <Feather name="trending-up" size={14} color="rgba(255,255,255,0.8)" />
                <Text style={styles.balanceMiniText}>
                  Доходы: {formatTenge(summary?.totalIncome ?? 0)}
                </Text>
              </View>
              <View style={styles.balanceMiniStat}>
                <Feather name="trending-down" size={14} color="rgba(255,255,255,0.8)" />
                <Text style={styles.balanceMiniText}>
                  Расходы: {formatTenge(summary?.totalExpense ?? 0)}
                </Text>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.statsRow}>
            <StatCard
              label="Доходы"
              value={formatTenge(summary?.totalIncome ?? 0)}
              color={colors.income}
              icon="trending-up"
              bgColor={colors.income + "15"}
            />
            <StatCard
              label="Расходы"
              value={formatTenge(summary?.totalExpense ?? 0)}
              color={colors.expense}
              icon="trending-down"
              bgColor={colors.expense + "15"}
            />
          </View>

          {summary?.avgDailyExpense && summary.avgDailyExpense > 0 ? (
            <View style={[styles.avgCard, { backgroundColor: colors.secondary, borderColor: colors.accent }]}>
              <View style={[styles.avgIcon, { backgroundColor: colors.primary + "20" }]}>
                <Feather name="activity" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.avgLabel, { color: colors.mutedForeground }]}>Среднедневные расходы</Text>
                <Text style={[styles.avgValue, { color: colors.foreground }]}>
                  {formatTenge(Math.round(summary.avgDailyExpense))}
                </Text>
              </View>
            </View>
          ) : null}

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Последние операции</Text>
            <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
              {txData?.transactions?.length ?? 0} записей
            </Text>
          </View>

          {!txData?.transactions?.length ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.emptyIconWrap, { backgroundColor: colors.muted }]}>
                <Feather name="inbox" size={36} color={colors.mutedForeground} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Нет операций</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Добавьте SMS во вкладке "SMS" чтобы увидеть транзакции здесь
              </Text>
            </View>
          ) : (
            <View style={[styles.txList, { backgroundColor: colors.card }]}>
              {txData.transactions.map((tx, idx) => (
                <View key={tx.id}>
                  <View style={styles.txCard} testID={`tx-card-${tx.id}`}>
                    <TxIcon type={tx.type} category={tx.category ?? undefined} />
                    <View style={styles.txInfo}>
                      <Text style={[styles.txMerchant, { color: colors.foreground }]} numberOfLines={1}>
                        {tx.merchant ?? tx.description ?? "Транзакция"}
                      </Text>
                      {tx.category ? (
                        <Text style={[styles.txCategory, { color: colors.mutedForeground }]}>
                          {tx.category}
                        </Text>
                      ) : null}
                    </View>
                    <View style={styles.txRight}>
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
                        {tx.type === "expense" ? "−" : tx.type === "income" ? "+" : ""}
                        {formatTenge(tx.amount)}
                      </Text>
                    </View>
                  </View>
                  {idx < txData.transactions.length - 1 && (
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  )}
                </View>
              ))}
            </View>
          )}
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
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  greeting: { fontSize: 14, fontWeight: "500", marginBottom: 2 },
  title: { fontSize: 30, fontWeight: "800", letterSpacing: -0.5 },
  headerBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  loaderWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  loadingText: { fontSize: 15 },
  balanceCard: {
    marginHorizontal: 24,
    marginBottom: 20,
    borderRadius: 28,
    padding: 28,
    gap: 6,
  },
  balanceTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  balanceLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  balanceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  balanceLabel: { color: "rgba(255,255,255,0.85)", fontSize: 15, fontWeight: "500" },
  txCountBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  txCountText: { color: "rgba(255,255,255,0.9)", fontSize: 12, fontWeight: "500" },
  balanceAmount: {
    color: "#ffffff",
    fontSize: 42,
    fontWeight: "800",
    letterSpacing: -1.5,
    marginVertical: 8,
  },
  balanceFooter: {
    flexDirection: "row",
    gap: 20,
    marginTop: 4,
  },
  balanceMiniStat: { flexDirection: "row", alignItems: "center", gap: 5 },
  balanceMiniText: { color: "rgba(255,255,255,0.75)", fontSize: 13 },
  statsRow: { flexDirection: "row", gap: 14, marginHorizontal: 24, marginBottom: 16 },
  statCard: {
    flex: 1,
    borderRadius: 22,
    padding: 18,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: { fontSize: 13, fontWeight: "500" },
  statValue: { fontSize: 18, fontWeight: "700", letterSpacing: -0.3 },
  avgCard: {
    marginHorizontal: 24,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 24,
  },
  avgIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  avgLabel: { fontSize: 13, marginBottom: 2 },
  avgValue: { fontSize: 18, fontWeight: "700" },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 24,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 20, fontWeight: "700" },
  sectionSub: { fontSize: 13 },
  emptyCard: {
    marginHorizontal: 24,
    borderRadius: 24,
    padding: 40,
    borderWidth: 1.5,
    alignItems: "center",
    gap: 14,
    borderStyle: "dashed",
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontSize: 17, fontWeight: "600" },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  txList: {
    marginHorizontal: 24,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  txCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 14,
  },
  txIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  txInfo: { flex: 1, gap: 3 },
  txMerchant: { fontSize: 15, fontWeight: "600" },
  txCategory: { fontSize: 13 },
  txRight: { alignItems: "flex-end" },
  txAmount: { fontSize: 16, fontWeight: "700" },
  divider: { height: 1, marginHorizontal: 18 },
});
