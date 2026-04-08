import {
  useGetBrokerStatus,
  useGetBrokerPortfolio,
  useGetBrokerTrades,
  useSaveBrokerKeys,
  getGetBrokerStatusQueryKey,
  getGetBrokerPortfolioQueryKey,
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
  TextInput,
  Platform,
  Alert,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import * as Haptics from "expo-haptics";

type TabType = "portfolio" | "trades";

function formatNum(n: number, dec = 2): string {
  return n.toLocaleString("ru-RU", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

export default function BrokerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabType>("portfolio");
  const [publicKey, setPublicKey] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [showPrivate, setShowPrivate] = useState(false);

  const topInset = Platform.OS === "web" ? 67 : 0;
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  const { data: status, isLoading: loadingStatus } = useGetBrokerStatus();
  const { data: portfolio, isLoading: loadingPortfolio } = useGetBrokerPortfolio();
  const { data: trades, isLoading: loadingTrades } = useGetBrokerTrades({ limit: 50, offset: 0 });

  const saveKeysMutation = useSaveBrokerKeys({
    mutation: {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        queryClient.invalidateQueries({ queryKey: getGetBrokerStatusQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetBrokerPortfolioQueryKey() });
        setPublicKey("");
        setPrivateKey("");
        Alert.alert("Успешно", "Ключи сохранены и подключены");
      },
      onError: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert("Ошибка", "Не удалось сохранить ключи");
      },
    },
  });

  const handleSave = () => {
    if (!publicKey.trim() || !privateKey.trim()) {
      Alert.alert("Ошибка", "Заполните оба ключа");
      return;
    }
    saveKeysMutation.mutate({ data: { publicKey: publicKey.trim(), privateKey: privateKey.trim() } });
  };

  const isConnected = status?.connected;

  if (loadingStatus) {
    return (
      <View style={[styles.loaderFull, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 32 + bottomInset, paddingTop: topInset }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top + 8 : 20 }]}>
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>Брокер</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Freedom Broker портфель</Text>
        </View>
        {isConnected && (
          <View style={[styles.connectedBadge, { backgroundColor: colors.income + "15", borderColor: colors.income + "30" }]}>
            <View style={[styles.connectedDot, { backgroundColor: colors.income }]} />
            <Text style={[styles.connectedText, { color: colors.income }]}>Подключён</Text>
          </View>
        )}
      </View>

      {!isConnected ? (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.connectHeader}>
            <View style={[styles.connectIcon, { backgroundColor: colors.primary + "15" }]}>
              <Feather name="key" size={22} color={colors.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Подключить Freedom Broker</Text>
          </View>

          <View style={[styles.infoBox, { backgroundColor: colors.muted }]}>
            <Text style={[styles.infoTitle, { color: colors.foreground }]}>Как получить API ключи:</Text>
            <Text style={[styles.infoStep, { color: colors.mutedForeground }]}>1. Войдите в личный кабинет Freedom Broker</Text>
            <Text style={[styles.infoStep, { color: colors.mutedForeground }]}>2. Перейдите в Настройки → API/FIX соединение</Text>
            <Text style={[styles.infoStep, { color: colors.mutedForeground }]}>3. Создайте новую пару ключей</Text>
            <Text style={[styles.infoStep, { color: colors.mutedForeground }]}>4. Скопируйте ключи в поля ниже</Text>
            <TouchableOpacity
              onPress={() => Linking.openURL("https://tradernet.com/profile/api")}
              style={styles.linkRow}
            >
              <Text style={[styles.linkText, { color: colors.primary }]}>Открыть настройки API</Text>
              <Feather name="external-link" size={13} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.foreground }]}>Публичный ключ</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
              placeholder="pub_xxxxx"
              placeholderTextColor={colors.mutedForeground}
              value={publicKey}
              onChangeText={setPublicKey}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.foreground }]}>Приватный ключ</Text>
            <View style={[styles.inputWrap, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <TextInput
                style={[styles.inputInner, { color: colors.foreground }]}
                placeholder="••••••••••••••••"
                placeholderTextColor={colors.mutedForeground}
                value={privateKey}
                onChangeText={setPrivateKey}
                secureTextEntry={!showPrivate}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowPrivate(!showPrivate)}>
                <Feather name={showPrivate ? "eye-off" : "eye"} size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: saveKeysMutation.isPending ? 0.7 : 1 }]}
            onPress={handleSave}
            disabled={saveKeysMutation.isPending}
          >
            {saveKeysMutation.isPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Feather name="link" size={18} color="#fff" />
                <Text style={styles.saveBtnText}>Сохранить и подключить</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.tabRow}>
            {(["portfolio", "trades"] as TabType[]).map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setTab(t)}
                style={[
                  styles.tabBtn,
                  {
                    backgroundColor: tab === t ? colors.primary : colors.card,
                    borderColor: tab === t ? colors.primary : colors.border,
                  },
                ]}
              >
                <Feather
                  name={t === "portfolio" ? "briefcase" : "repeat"}
                  size={14}
                  color={tab === t ? "#fff" : colors.mutedForeground}
                />
                <Text style={[styles.tabBtnText, { color: tab === t ? "#fff" : colors.mutedForeground }]}>
                  {t === "portfolio" ? "Портфель" : "Сделки"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {tab === "portfolio" ? (
            loadingPortfolio ? (
              <View style={styles.loaderWrap}><ActivityIndicator color={colors.primary} /></View>
            ) : (
              <>
                <View style={styles.statsRow}>
                  <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Стоимость портфеля</Text>
                    <Text style={[styles.statValue, { color: colors.foreground }]}>
                      {formatNum(portfolio?.positions?.reduce((s, p) => s + p.currentValue, 0) ?? 0)} KZT
                    </Text>
                  </View>
                  <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Общий P&L</Text>
                    <Text style={[
                      styles.statValue,
                      { color: (portfolio?.positions?.reduce((s, p) => s + p.pnl, 0) ?? 0) >= 0 ? colors.income : colors.expense }
                    ]}>
                      {(portfolio?.positions?.reduce((s, p) => s + p.pnl, 0) ?? 0) >= 0 ? "+" : ""}
                      {formatNum(portfolio?.positions?.reduce((s, p) => s + p.pnl, 0) ?? 0)}
                    </Text>
                  </View>
                </View>

                <View style={[styles.list, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {(portfolio?.positions ?? []).length === 0 ? (
                    <View style={styles.emptyBox}>
                      <Feather name="briefcase" size={28} color={colors.mutedForeground} />
                      <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Портфель пуст</Text>
                    </View>
                  ) : (
                    portfolio?.positions?.map((pos, idx) => (
                      <View key={idx}>
                        <View style={styles.posRow}>
                          <View style={styles.posInfo}>
                            <Text style={[styles.posTicker, { color: colors.foreground }]}>{pos.ticker}</Text>
                            <Text style={[styles.posName, { color: colors.mutedForeground }]} numberOfLines={1}>{pos.name}</Text>
                          </View>
                          <View style={styles.posRight}>
                            <Text style={[styles.posValue, { color: colors.foreground }]}>{formatNum(pos.currentValue)}</Text>
                            <Text style={[styles.posPnl, { color: pos.pnl >= 0 ? colors.income : colors.expense }]}>
                              {pos.pnl >= 0 ? "+" : ""}{formatNum(pos.pnl)}
                            </Text>
                          </View>
                        </View>
                        {idx < (portfolio?.positions?.length ?? 0) - 1 && (
                          <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        )}
                      </View>
                    ))
                  )}
                </View>
              </>
            )
          ) : (
            loadingTrades ? (
              <View style={styles.loaderWrap}><ActivityIndicator color={colors.primary} /></View>
            ) : (
              <View style={[styles.list, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {(trades?.trades ?? []).length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Feather name="repeat" size={28} color={colors.mutedForeground} />
                    <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Нет сделок</Text>
                  </View>
                ) : (
                  trades?.trades?.map((trade, idx) => (
                    <View key={idx}>
                      <View style={styles.tradeRow}>
                        <View style={styles.tradeInfo}>
                          <Text style={[styles.tradeTicker, { color: colors.foreground }]}>{trade.ticker}</Text>
                          <Text style={[styles.tradeDate, { color: colors.mutedForeground }]}>{trade.date}</Text>
                        </View>
                        <View style={styles.tradeRight}>
                          <View style={[styles.tradeSideBadge, {
                            backgroundColor: trade.side === "buy" ? colors.income + "15" : colors.expense + "15"
                          }]}>
                            <Text style={[styles.tradeSide, {
                              color: trade.side === "buy" ? colors.income : colors.expense
                            }]}>
                              {trade.side === "buy" ? "Покупка" : "Продажа"}
                            </Text>
                          </View>
                          <Text style={[styles.tradeAmount, { color: colors.foreground }]}>
                            {formatNum(trade.price)} × {formatNum(trade.quantity, 0)}
                          </Text>
                        </View>
                      </View>
                      {idx < (trades?.trades?.length ?? 0) - 1 && (
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                      )}
                    </View>
                  ))
                )}
              </View>
            )
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loaderFull: { flex: 1, alignItems: "center", justifyContent: "center" },
  loaderWrap: { alignItems: "center", paddingVertical: 40 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: { fontSize: 26, fontWeight: "700", letterSpacing: -0.3 },
  subtitle: { fontSize: 13, marginTop: 2 },
  connectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  connectedDot: { width: 7, height: 7, borderRadius: 4 },
  connectedText: { fontSize: 12, fontWeight: "600" },
  card: {
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  connectHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  connectIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 17, fontWeight: "700" },
  infoBox: { borderRadius: 10, padding: 14, gap: 4 },
  infoTitle: { fontSize: 13, fontWeight: "600", marginBottom: 4 },
  infoStep: { fontSize: 13, lineHeight: 20 },
  linkRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 },
  linkText: { fontSize: 13, fontWeight: "500" },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 14, fontWeight: "500" },
  input: { borderRadius: 8, borderWidth: 1, padding: 12, fontSize: 14 },
  inputWrap: { flexDirection: "row", alignItems: "center", borderRadius: 8, borderWidth: 1, paddingHorizontal: 12 },
  inputInner: { flex: 1, paddingVertical: 12, fontSize: 14 },
  saveBtn: { borderRadius: 10, paddingVertical: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  tabRow: { flexDirection: "row", gap: 8, paddingHorizontal: 20, marginBottom: 16 },
  tabBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 8, borderWidth: 1 },
  tabBtnText: { fontSize: 13, fontWeight: "500" },
  statsRow: { flexDirection: "row", gap: 10, paddingHorizontal: 20, marginBottom: 12 },
  statCard: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 14, gap: 4 },
  statLabel: { fontSize: 12 },
  statValue: { fontSize: 17, fontWeight: "700" },
  list: { marginHorizontal: 20, borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  emptyBox: { alignItems: "center", gap: 10, paddingVertical: 40 },
  emptyText: { fontSize: 14 },
  posRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 13 },
  posInfo: { flex: 1, gap: 2 },
  posTicker: { fontSize: 14, fontWeight: "600" },
  posName: { fontSize: 12 },
  posRight: { alignItems: "flex-end", gap: 2 },
  posValue: { fontSize: 14, fontWeight: "500" },
  posPnl: { fontSize: 12, fontWeight: "600" },
  tradeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 13 },
  tradeInfo: { gap: 2 },
  tradeTicker: { fontSize: 14, fontWeight: "600" },
  tradeDate: { fontSize: 12 },
  tradeRight: { alignItems: "flex-end", gap: 4 },
  tradeSideBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  tradeSide: { fontSize: 11, fontWeight: "600" },
  tradeAmount: { fontSize: 12 },
  divider: { height: 1, marginHorizontal: 16 },
});
