import { useState } from "react";
import { View, Text, KeyboardAvoidingView, Platform } from "react-native";
import { Link, router } from "expo-router";
import { signIn } from "@/lib/auth";
import { setUserId, setUserEmail, setProfile } from "@/lib/storage";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const result = await signIn(email.trim(), password);
      setUserId(result.userId);
      setUserEmail(email.trim());
      // Set a minimal profile using the email prefix as display name
      const displayName = email.trim().split("@")[0];
      setProfile({ displayName, homeArea: "", destination: "UBC Vancouver" });
      router.replace("/(tabs)/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-background px-6 justify-center"
    >
      <View className="mb-10">
        <Text className="font-display text-2xl text-primary tracking-tight mb-6 text-center">COMMUTEity</Text>
        <Text className="font-display text-3xl text-text-primary mb-2 tracking-tight">Welcome back</Text>
        <Text className="font-sans text-base text-text-secondary">Sign in with your UBC email.</Text>
      </View>

      <View className="gap-3">
        <Input
          value={email}
          onChangeText={setEmail}
          placeholder="you@student.ubc.ca"
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <Input
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
          autoComplete="password"
        />
      </View>

      {error ? <Text className="font-sans text-destructive text-sm mt-3">{error}</Text> : null}

      <View className="mt-6">
        <Button label="Sign In" onPress={handleLogin} variant="primary" loading={loading} />
      </View>

      <View className="flex-row justify-center mt-6">
        <Text className="font-sans text-text-secondary">Don't have an account? </Text>
        <Link href="/(auth)/signup" className="font-sans-semibold text-primary">
          Sign Up
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}
