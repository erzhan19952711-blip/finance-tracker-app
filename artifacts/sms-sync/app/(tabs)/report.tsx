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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import * as Haptics from "expo-haptics";

const CATEGORY_COLORS = ["#16a34a", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];

export default function ReportScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data: report, isLoading: loadingReport } = useGetAiReport();
  const { data: categories, isLoading: loadingCats } = useGetCategoryBreakdown();

  const handleRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await queryClient.invalidateQueries({ queryKey: getGetAiReportQueryKey() });
    setRefreshing(false);
  };

  const topInset = Platform.OS === "web" ? 67 : 0;
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 20 + bottomInset, paddingTop: topInset }}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>AI Анализ</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Финансовый отчёт на основе ИИ
        </Text>
      </View>

      {categories && categories.length > 0 ? (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Расходы по категориям</Text>
          {categories.map((cat, i) => (
            <View key={cat.category} style={styles.catRow}>
              <View style={styles.catLeft}>
                <View style={[styles.catDot, { backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }]} />
                <Text style={[styles.catName, { color: colors.foreground }]}>{cat.category}</Text>
              </View>
              <View style={styles.catRight}>
                <View
                  style={[
                    styles.catBar,
                    {
                      width: `${cat.percentage}%` as any,
                      backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
                    },
                  ]}
                />
                <Text style={[styles.catPct, { color: colors.mutedForeground }]}>{cat.percentage}%</Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Feather name="zap" size={18} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>AI Рекомендации</Text>
          </View>
          <TouchableOpacity
            onPress={handleRefresh}
            disabled={loadingReport || refreshing}
            testID="button-refresh-report"
            style={[styles.refreshBtn, { backgroundColor: colors.secondary }]}
          >
            <Feather
              name="refresh-cw"
              size={16}
              color={refreshing ? colors.mutedForeground : colors.primary}
            />
          </TouchableOpacity>
        </View>

        {loadingReport || refreshing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
              ИИ анализирует ваши финансы...
            </Text>
          </View>
        ) : !report?.hasData ? (
          <View style={styles.emptyBox}>
            <Feather name="bar-chart-2" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Добавьте SMS чтобы получить AI-анализ
            </Text>
          </View>
        ) : (
          <Text style={[styles.analysisText, { color: colors.foreground }]}>
            {report.analysis}
          </Text>
        )}
      </View>

      {report?.generatedAt ? (
        <Text style={[styles.timestamp, { color: colors.mutedForeground }]}>
          Обновлено: {new Date(report.generatedAt).toLocaleString("ru-RU")}
        </Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: "700", letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: 2 },
  card: {
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    gap: 14,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { fontSize: 17, fontWeight: "600" },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  catRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  catLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  catDot: { width: 10, height: 10, borderRadius: 5 },
  catName: { fontSize: 14, fontWeight: "500" },
  catRight: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "flex-end" },
  catBar: { height: 6, borderRadius: 3, minWidth: 4 },
  catPct: { fontSize: 12, minWidth: 30, textAlign: "right" },
  loadingBox: { alignItems: "center", gap: 12, paddingVertical: 20 },
  loadingText: { fontSize: 14 },
  emptyBox: { alignItems: "center", gap: 12, paddingVertical: 20 },
  emptyText: { fontSize: 14, textAlign: "center" },
  analysisText: { fontSize: 14, lineHeight: 22 },
  timestamp: { fontSize: 12, textAlign: "center", marginBottom: 8 },
});
