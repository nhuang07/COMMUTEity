import { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { confirmSignUp, resendConfirmationCode } from "@/lib/auth";

export default function Verify() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendDone, setResendDone] = useState(false);

  async function handleVerify() {
    if (code.trim().length !== 6) {
      setError("Enter the 6-digit code we sent you.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await confirmSignUp(email ?? "", code.trim());
      router.replace("/(auth)/profile-setup");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!email) return;
    setResendLoading(true);
    try {
      await resendConfirmationCode(email);
      setResendDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not resend code.");
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-background px-6 justify-center">
      <Text className="text-3xl font-bold text-text-primary mb-2">Check your email</Text>
      <Text className="text-base text-text-secondary mb-8">
        We sent a 6-digit code to {email ?? "your UBC email"}.
      </Text>

      <TextInput
        value={code}
        onChangeText={setCode}
        placeholder="123456"
        placeholderTextColor="#64748B"
        keyboardType="number-pad"
        maxLength={6}
        className="bg-surface border border-slate-200 rounded-xl px-4 py-3 mb-2 text-text-primary text-center text-2xl tracking-widest"
      />

      {error ? <Text className="text-red-600 text-sm mb-2">{error}</Text> : null}

      <Pressable
        onPress={handleVerify}
        disabled={loading}
        className="bg-primary rounded-xl py-4 items-center mt-4"
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-semibold text-base">Verify</Text>
        )}
      </Pressable>

      <Pressable onPress={handleResend} disabled={resendLoading} className="items-center mt-4">
        {resendDone ? (
          <Text className="text-text-secondary font-medium">Code resent!</Text>
        ) : resendLoading ? (
          <ActivityIndicator size="small" />
        ) : (
          <Text className="text-primary font-medium">Resend code</Text>
        )}
      </Pressable>
    </View>
  );
}
