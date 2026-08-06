import { useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { confirmSignUp, signIn, resendConfirmationCode } from "@/lib/auth";
import { setUserId, setUserEmail, getPendingEmail } from "@/lib/storage";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { theme } from "@/constants/theme";

export default function Verify() {
  const { email: emailParam, password: passwordParam } = useLocalSearchParams<{ email: string; password: string }>();
  const email = emailParam || getPendingEmail() || "";
  const [code, setCode] = useState("");
  const [password, setPassword] = useState(passwordParam || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendDone, setResendDone] = useState(false);

  async function handleVerify() {
    if (code.trim().length !== 6) {
      setError("Enter the 6-digit code we sent you.");
      return;
    }
    if (!password) {
      setError("Enter your password to complete sign-in.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await confirmSignUp(email, code.trim());
      // Auto sign-in after successful verification
      const result = await signIn(email, password);
      setUserId(result.userId);
      setUserEmail(email);
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
      <Text className="font-display text-3xl text-text-primary mb-2 tracking-tight">Check your email</Text>
      <Text className="font-sans text-base text-text-secondary mb-8">
        We sent a 6-digit code to {email || "your UBC email"}.
      </Text>

      <View className="gap-3">
        <Input
          value={code}
          onChangeText={setCode}
          placeholder="123456"
          keyboardType="number-pad"
          maxLength={6}
          className="font-sans-semibold text-center text-2xl tracking-[8px]"
        />

        <Input
          value={password}
          onChangeText={setPassword}
          placeholder="Re-enter your password"
          secureTextEntry
        />
      </View>

      {error ? <Text className="font-sans text-destructive text-sm mt-3">{error}</Text> : null}

      <View className="mt-6">
        <Button label="Verify" onPress={handleVerify} variant="primary" loading={loading} />
      </View>

      <Pressable onPress={handleResend} disabled={resendLoading} className="items-center mt-4">
        {resendDone ? (
          <Text className="font-sans-medium text-text-secondary">Code resent!</Text>
        ) : resendLoading ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
          <Text className="font-sans-medium text-primary">Resend code</Text>
        )}
      </Pressable>
    </View>
  );
}
