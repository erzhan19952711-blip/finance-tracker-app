import { useUploadSms, getListTransactionsQueryKey } from "@workspace/api-client-react";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import * as Haptics from "expo-haptics";

const EXAMPLE_SMS = [
  {
    text: "Покупка 3200₸ KFC Almaty 04.04.2026 12:35. Карта *4521. Остаток 45800₸",
    bank: "Kaspi",
    type: "expense",
  },
  {
    text: "Зачисление 50000₸ на счёт Kaspi Gold. Отправитель: Работодатель. 04.04.2026",
    bank: "Kaspi",
    type: "income",
  },
  {
    text: "Покупка 8900₸ Magnum Cash&Carry Almaty. Карта Kaspi Gold *4521. Остаток 36900₸",
    bank: "BCC",
    type: "expense",
  },
];

export default function SmsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [smsText, setSmsText] = useState("");
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [lastStatus, setLastStatus] = useState<"success" | "error" | "skipped" | null>(null);

  const uploadSmsMutation = useUploadSms({
    mutation: {
      onSuccess: (data) => {
        Haptics.notificationAsync(
          data.parsed
            ? Haptics.NotificationFeedbackType.Success
            : Haptics.NotificationFeedbackType.Warning
        );
        if (data.parsed) {
          const amount = data.parsed.amount;
          const type = data.parsed.type === "income" ? "Доход" : "Расход";
          setLastResult(`${type}: ${amount.toLocaleString("ru-RU")} ₸ — добавлено!`);
          setLastStatus("success");
          setSmsText("");
          queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
        } else {
          setLastResult("SMS не распознан как финансовая операция. Попробуйте другой текст.");
          setLastStatus("skipped");
        }
      },
      onError: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setLastResult("Ошибка отправки. Проверьте соединение.");
        setLastStatus("error");
      },
    },
  });

  const handleSend = () => {
    const text = smsText.trim();
    if (!text) return;
    setLastResult(null);
    setLastStatus(null);
    uploadSmsMutation.mutate({ data: { sms: text, from: "manual" } });
  };

  const handleExample = (example: string) => {
    setSmsText(example);
    setLastResult(null);
    setLastStatus(null);
    Haptics.selectionAsync();
  };

  const topInset = Platform.OS === "web" ? 67 : 0;
  const bottomInset = Platform.OS === "web" ? 34 : 0;
  const canSend = smsText.trim().length > 0 && !uploadSmsMutation.isPending;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{
          paddingBottom: insets.bottom + 32 + bottomInset,
          paddingTop: topInset,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top + 8 : 20 }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>Добавить SMS</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Скопируй банковское SMS и вставь ниже
          </Text>
        </View>

        <View style={[styles.inputCard, { backgroundColor: colors.card }]}>
          <View style={styles.inputHeader}>
            <View style={[styles.inputIconWrap, { backgroundColor: colors.primary + "15" }]}>
              <Feather name="message-square" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.inputLabel, { color: colors.foreground }]}>Текст SMS</Text>
          </View>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.muted,
                color: colors.foreground,
                borderColor: smsText ? colors.primary : colors.border,
              },
            ]}
            placeholder="Вставьте текст SMS от Kaspi, BCC, Halyk или другого банка..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={5}
            value={smsText}
            onChangeText={setSmsText}
            textAlignVertical="top"
            testID="input-sms-text"
          />

          {lastResult ? (
            <View
              style={[
                styles.resultBox,
                {
                  backgroundColor:
                    lastStatus === "success"
                      ? colors.income + "15"
                      : lastStatus === "error"
                      ? colors.expense + "15"
                      : colors.muted,
                  borderColor:
                    lastStatus === "success"
                      ? colors.income
                      : lastStatus === "error"
                      ? colors.expense
                      : colors.border,
                },
              ]}
            >
              <Feather
                name={
                  lastStatus === "success"
                    ? "check-circle"
                    : lastStatus === "error"
                    ? "x-circle"
                    : "alert-circle"
                }
                size={20}
                color={
                  lastStatus === "success"
                    ? colors.income
                    : lastStatus === "error"
                    ? colors.expense
                    : colors.mutedForeground
                }
              />
              <Text
                style={[
                  styles.resultText,
                  {
                    color:
                      lastStatus === "success"
                        ? colors.income
                        : lastStatus === "error"
                        ? colors.expense
                        : colors.mutedForeground,
                  },
                ]}
              >
                {lastResult}
              </Text>
            </View>
          ) : null}

          <TouchableOpacity
            onPress={handleSend}
            disabled={!canSend}
            testID="button-send-sms"
            activeOpacity={0.8}
          >
            {canSend ? (
              <LinearGradient
                colors={["#16a34a", "#22c55e"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.sendBtn}
              >
                <Feather name="zap" size={20} color="#fff" />
                <Text style={styles.sendBtnText}>Распознать и добавить</Text>
              </LinearGradient>
            ) : (
              <View style={[styles.sendBtn, { backgroundColor: colors.muted }]}>
                {uploadSmsMutation.isPending ? (
                  <>
                    <ActivityIndicator color={colors.primary} size="small" />
                    <Text style={[styles.sendBtnText, { color: colors.primary }]}>Анализирую...</Text>
                  </>
                ) : (
                  <>
                    <Feather name="send" size={20} color={colors.mutedForeground} />
                    <Text style={[styles.sendBtnText, { color: colors.mutedForeground }]}>
                      Вставьте текст SMS
                    </Text>
                  </>
                )}
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Примеры SMS</Text>
          <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>Нажми чтобы вставить</Text>
        </View>

        {EXAMPLE_SMS.map((ex, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.exampleCard, { backgroundColor: colors.card }]}
            onPress={() => handleExample(ex.text)}
            testID={`button-example-${i}`}
            activeOpacity={0.7}
          >
            <View style={[
              styles.exampleBadge,
              { backgroundColor: ex.type === "income" ? colors.income + "15" : colors.expense + "15" }
            ]}>
              <Feather
                name={ex.type === "income" ? "arrow-down-left" : "arrow-up-right"}
                size={16}
                color={ex.type === "income" ? colors.income : colors.expense}
              />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.exampleTop}>
                <Text style={[styles.exampleBank, { color: colors.primary }]}>{ex.bank}</Text>
                <Text style={[styles.exampleType, {
                  color: ex.type === "income" ? colors.income : colors.expense
                }]}>
                  {ex.type === "income" ? "Зачисление" : "Покупка"}
                </Text>
              </View>
              <Text style={[styles.exampleText, { color: colors.foreground }]} numberOfLines={2}>
                {ex.text}
              </Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        ))}

        <View style={[styles.infoCard, { backgroundColor: colors.secondary, borderColor: colors.accent }]}>
          <View style={[styles.infoIconWrap, { backgroundColor: colors.primary + "15" }]}>
            <Feather name="shield" size={18} color={colors.primary} />
          </View>
          <Text style={[styles.infoText, { color: colors.secondaryForeground }]}>
            Поддерживаются SMS от Kaspi, Halyk, BCC, Freedom Bank и других казахстанских банков.
            Суммы в тенге (₸) определяются автоматически через ИИ.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  title: { fontSize: 30, fontWeight: "800", letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { fontSize: 15, lineHeight: 21 },
  inputCard: {
    marginHorizontal: 24,
    marginBottom: 28,
    borderRadius: 24,
    padding: 20,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  inputHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  inputIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  inputLabel: { fontSize: 17, fontWeight: "700" },
  input: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    fontSize: 15,
    minHeight: 130,
    lineHeight: 22,
  },
  resultBox: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  resultText: { fontSize: 14, flex: 1, fontWeight: "600", lineHeight: 20 },
  sendBtn: {
    borderRadius: 18,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  sendBtnText: { fontSize: 17, fontWeight: "700", color: "#fff" },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 24,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 20, fontWeight: "700" },
  sectionSub: { fontSize: 13 },
  exampleCard: {
    marginHorizontal: 24,
    marginBottom: 10,
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  exampleBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  exampleTop: { flexDirection: "row", gap: 8, alignItems: "center", marginBottom: 4 },
  exampleBank: { fontSize: 12, fontWeight: "700" },
  exampleType: { fontSize: 12, fontWeight: "500" },
  exampleText: { fontSize: 13, lineHeight: 18 },
  infoCard: {
    marginHorizontal: 24,
    marginTop: 8,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  infoIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  infoText: { fontSize: 13, flex: 1, lineHeight: 20 },
});
