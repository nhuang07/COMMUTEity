import { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

export default function Verify() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  function handleVerify() {
    if (code.trim().length !== 6) {
      setError("Enter the 6-digit code we sent you.");
      return;
    }
    setError("");
    // TODO: call lib/auth.ts confirmSignUp with email + code
    router.replace("/(auth)/profile-setup");
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
        className="bg-primary rounded-xl py-4 items-center mt-4"
      >
        <Text className="text-white font-semibold text-base">Verify</Text>
      </Pressable>

      <Pressable className="items-center mt-4">
        <Text className="text-primary font-medium">Resend code</Text>
      </Pressable>
    </View>
  );
}