import { useGetAiReport, useGetCategoryBreakdown, getGetAiReportQueryKey } from "@workspace/api-client-react";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import * as Haptics from "expo-haptics";

const CAT_COLORS = ["#16a34a", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];

export default function ReportScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data: report, isLoading: loadingReport } = useGetAiReport();
  const { data: categories, isLoading: loadingCats } = useGetCategoryBreakdown();

  const handleRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await queryClient.invalidateQueries({ queryKey: getGetAiReportQueryKey() });
    setRefreshing(false);
  };

  const topInset = Platform.OS === "web" ? 67 : 0;
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  const hasCategories = categories && categories.length > 0;
  const topCategory = hasCategories ? categories[0] : null;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 32 + bottomInset, paddingTop: topInset }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top + 8 : 20 }]}>
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>AI Анализ</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Финансовый отчёт на основе ИИ
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleRefresh}
          disabled={loadingReport || refreshing}
          testID="button-refresh-report"
          style={[styles.refreshBtn, { backgroundColor: colors.card }]}
        >
          <Feather
            name="refresh-cw"
            size={20}
            color={refreshing ? colors.mutedForeground : colors.primary}
          />
        </TouchableOpacity>
      </View>

      {hasCategories ? (
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconWrap, { backgroundColor: colors.primary + "15" }]}>
              <Feather name="pie-chart" size={18} color={colors.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Расходы по категориям</Text>
          </View>

          {topCategory && (
            <View style={[styles.topCatBanner, { backgroundColor: CAT_COLORS[0] + "12", borderColor: CAT_COLORS[0] + "30" }]}>
              <Text style={[styles.topCatLabel, { color: colors.mutedForeground }]}>Главная статья расходов</Text>
              <View style={styles.topCatRow}>
                <View style={[styles.topCatDot, { backgroundColor: CAT_COLORS[0] }]} />
                <Text style={[styles.topCatName, { color: colors.foreground }]}>{topCategory.category}</Text>
                <Text style={[styles.topCatPct, { color: CAT_COLORS[0] }]}>{topCategory.percentage}%</Text>
              </View>
            </View>
          )}

          <View style={styles.catList}>
            {categories.map((cat, i) => (
              <View key={cat.category} style={styles.catRow}>
                <View style={styles.catLeft}>
                  <View style={[styles.catDot, { backgroundColor: CAT_COLORS[i % CAT_COLORS.length] }]} />
                  <Text style={[styles.catName, { color: colors.foreground }]}>{cat.category}</Text>
                </View>
                <View style={styles.catBarWrap}>
                  <View style={[styles.catBarTrack, { backgroundColor: colors.muted }]}>
                    <View
                      style={[
                        styles.catBar,
                        {
                          width: `${cat.percentage}%` as any,
                          backgroundColor: CAT_COLORS[i % CAT_COLORS.length],
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.catPct, { color: colors.mutedForeground }]}>{cat.percentage}%</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleLeft}>
            <LinearGradient
              colors={["#16a34a", "#22c55e"]}
              style={styles.aiIconWrap}
            >
              <Feather name="zap" size={18} color="#fff" />
            </LinearGradient>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>AI Рекомендации</Text>
          </View>
        </View>

        {loadingReport || refreshing ? (
          <View style={styles.loadingBox}>
            <View style={[styles.loadingIconWrap, { backgroundColor: colors.primary + "15" }]}>
              <ActivityIndicator color={colors.primary} size="large" />
            </View>
            <Text style={[styles.loadingTitle, { color: colors.foreground }]}>Анализирую данные</Text>
            <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
              ИИ обрабатывает ваши финансовые операции...
            </Text>
          </View>
        ) : !report?.hasData ? (
          <View style={styles.emptyBox}>
            <View style={[styles.emptyIconWrap, { backgroundColor: colors.muted }]}>
              <Feather name="bar-chart-2" size={36} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Нет данных для анализа</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Добавьте SMS-сообщения банка во вкладке "SMS", чтобы получить персональный AI-анализ
            </Text>
            <TouchableOpacity
              onPress={handleRefresh}
              style={[styles.retryBtn, { backgroundColor: colors.primary + "15" }]}
            >
              <Feather name="refresh-cw" size={16} color={colors.primary} />
              <Text style={[styles.retryText, { color: colors.primary }]}>Обновить</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.analysisWrap}>
            <Text style={[styles.analysisText, { color: colors.foreground }]}>
              {report.analysis}
            </Text>
            {report?.generatedAt ? (
              <View style={[styles.timestampRow, { borderTopColor: colors.border }]}>
                <Feather name="clock" size={12} color={colors.mutedForeground} />
                <Text style={[styles.timestamp, { color: colors.mutedForeground }]}>
                  Обновлено: {new Date(report.generatedAt).toLocaleString("ru-RU")}
                </Text>
              </View>
            ) : null}
          </View>
        )}
      </View>

      <TouchableOpacity
        onPress={handleRefresh}
        disabled={loadingReport || refreshing}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={refreshing ? [colors.muted, colors.muted] : ["#16a34a", "#22c55e"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.refreshFullBtn}
        >
          {refreshing ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <Feather name="zap" size={20} color="#fff" />
          )}
          <Text style={[styles.refreshFullBtnText, { color: refreshing ? colors.mutedForeground : "#fff" }]}>
            {refreshing ? "Обновляю..." : "Обновить AI-анализ"}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
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
  title: { fontSize: 30, fontWeight: "800", letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { fontSize: 15 },
  refreshBtn: {
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
  card: {
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 24,
    padding: 20,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitleLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  aiIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontSize: 18, fontWeight: "700" },
  topCatBanner: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  topCatLabel: { fontSize: 12, fontWeight: "500" },
  topCatRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  topCatDot: { width: 10, height: 10, borderRadius: 5 },
  topCatName: { fontSize: 16, fontWeight: "700", flex: 1 },
  topCatPct: { fontSize: 20, fontWeight: "800" },
  catList: { gap: 12 },
  catRow: { gap: 8 },
  catLeft: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  catDot: { width: 10, height: 10, borderRadius: 5 },
  catName: { fontSize: 14, fontWeight: "600" },
  catBarWrap: { flexDirection: "row", alignItems: "center", gap: 10 },
  catBarTrack: { flex: 1, height: 8, borderRadius: 4, overflow: "hidden" },
  catBar: { height: 8, borderRadius: 4, minWidth: 4 },
  catPct: { fontSize: 13, minWidth: 36, textAlign: "right", fontWeight: "600" },
  loadingBox: { alignItems: "center", gap: 14, paddingVertical: 24 },
  loadingIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingTitle: { fontSize: 17, fontWeight: "700" },
  loadingText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  emptyBox: { alignItems: "center", gap: 12, paddingVertical: 24 },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontSize: 17, fontWeight: "700" },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 4,
  },
  retryText: { fontSize: 15, fontWeight: "600" },
  analysisWrap: { gap: 16 },
  analysisText: { fontSize: 15, lineHeight: 24 },
  timestampRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderTopWidth: 1,
    paddingTop: 12,
  },
  timestamp: { fontSize: 12 },
  refreshFullBtn: {
    marginHorizontal: 24,
    borderRadius: 20,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  refreshFullBtnText: { fontSize: 17, fontWeight: "700" },
});
