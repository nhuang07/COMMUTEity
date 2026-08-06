import { useState } from "react";
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { Link, router } from "expo-router";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleLogin() {
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    // TODO: call lib/auth.ts sign-in, then route based on onboarding status
    router.replace("/(tabs)/home");
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-background px-6 justify-center"
    >
      <Text className="text-3xl font-bold text-text-primary mb-2">Welcome back</Text>
      <Text className="text-base text-text-secondary mb-8">
        Sign in with your UBC email.
      </Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="you@student.ubc.ca"
        placeholderTextColor="#64748B"
        autoCapitalize="none"
        keyboardType="email-address"
        className="bg-surface border border-slate-200 rounded-xl px-4 py-3 mb-3 text-text-primary"
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        placeholderTextColor="#64748B"
        secureTextEntry
        className="bg-surface border border-slate-200 rounded-xl px-4 py-3 mb-2 text-text-primary"
      />

      {error ? <Text className="text-red-600 text-sm mb-2">{error}</Text> : null}

      <Pressable
        onPress={handleLogin}
        className="bg-primary rounded-xl py-4 items-center mt-4"
      >
        <Text className="text-white font-semibold text-base">Sign In</Text>
      </Pressable>

      <View className="flex-row justify-center mt-6">
        <Text className="text-text-secondary">Don't have an account? </Text>
        <Link href="/(auth)/signup" className="text-primary font-semibold">
          Sign Up
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}