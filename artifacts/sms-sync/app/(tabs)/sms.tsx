import { useUploadSms, useListTransactions, getListTransactionsQueryKey } from "@workspace/api-client-react";
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
  Alert,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import * as Haptics from "expo-haptics";

const EXAMPLE_SMS = [
  "Покупка 3200₸ KFC Almaty 04.04.2026 12:35. Карта *4521. Остаток 45800₸",
  "Зачисление 50000₸ на счёт Kaspi Gold. Отправитель: Работодатель. 04.04.2026",
  "Покупка 8900₸ Magnum Cash&Carry Almaty. Карта Kaspi Gold *4521. Остаток 36900₸",
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
          setLastResult(`${type}: ${amount.toLocaleString("ru-RU")} ₸ — добавлено`);
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
  };

  const topInset = Platform.OS === "web" ? 67 : 0;
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{
          paddingBottom: insets.bottom + 20 + bottomInset,
          paddingTop: topInset,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>Добавить SMS</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Скопируй SMS от банка и вставь сюда
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>Текст SMS</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.muted,
                color: colors.foreground,
                borderColor: colors.border,
              },
            ]}
            placeholder="Вставьте текст SMS от Kaspi, BCC или другого банка..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={4}
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
                      ? colors.income + "20"
                      : lastStatus === "error"
                      ? colors.expense + "20"
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
                size={16}
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
            style={[
              styles.sendBtn,
              {
                backgroundColor: smsText.trim() ? colors.primary : colors.muted,
                opacity: uploadSmsMutation.isPending ? 0.7 : 1,
              },
            ]}
            onPress={handleSend}
            disabled={!smsText.trim() || uploadSmsMutation.isPending}
            testID="button-send-sms"
          >
            {uploadSmsMutation.isPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Feather
                  name="send"
                  size={18}
                  color={smsText.trim() ? "#fff" : colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.sendBtnText,
                    { color: smsText.trim() ? "#fff" : colors.mutedForeground },
                  ]}
                >
                  Добавить транзакцию
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          Примеры SMS — нажми чтобы попробовать
        </Text>

        {EXAMPLE_SMS.map((ex, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.exampleCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => handleExample(ex)}
            testID={`button-example-${i}`}
          >
            <Feather name="message-square" size={16} color={colors.primary} />
            <Text style={[styles.exampleText, { color: colors.foreground }]} numberOfLines={2}>
              {ex}
            </Text>
          </TouchableOpacity>
        ))}

        <View style={[styles.infoCard, { backgroundColor: colors.secondary, borderColor: colors.accent }]}>
          <Feather name="info" size={16} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.foreground }]}>
            Поддерживаются SMS от Kaspi, Halyk, BCC, Freedom Bank и других казахстанских банков. Суммы в тенге (₸) определяются автоматически.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: "700", letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: 2 },
  card: {
    marginHorizontal: 20,
    marginVertical: 12,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    gap: 12,
  },
  cardLabel: { fontSize: 13, fontWeight: "500" },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    fontSize: 14,
    minHeight: 110,
    lineHeight: 20,
  },
  resultBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  resultText: { fontSize: 13, flex: 1, fontWeight: "500" },
  sendBtn: {
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  sendBtnText: { fontSize: 16, fontWeight: "600" },
  sectionTitle: { fontSize: 13, fontWeight: "500", marginHorizontal: 20, marginTop: 8, marginBottom: 8 },
  exampleCard: {
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  exampleText: { fontSize: 13, flex: 1, lineHeight: 18 },
  infoCard: {
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  infoText: { fontSize: 13, flex: 1, lineHeight: 18 },
});
