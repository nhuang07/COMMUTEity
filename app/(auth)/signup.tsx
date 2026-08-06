import { useState } from "react";
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { Link, router } from "expo-router";
import { signUp } from "@/lib/auth";
import { setPendingEmail } from "@/lib/storage";

const UBC_EMAIL_REGEX = /^[^\s@]+@(student\.)?ubc\.ca$/i;

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    if (!UBC_EMAIL_REGEX.test(email.trim())) {
      setError("Use your @student.ubc.ca or @ubc.ca email.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await signUp(email.trim(), password);
      setPendingEmail(email.trim());
      router.push({ pathname: "/(auth)/verify", params: { email: email.trim() } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-up failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-background px-6 justify-center"
    >
      <Text className="text-3xl font-bold text-text-primary mb-2">Create your account</Text>
      <Text className="text-base text-text-secondary mb-8">
        Only UBC students can join Commutity.
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
        className="bg-surface border border-slate-200 rounded-xl px-4 py-3 mb-3 text-text-primary"
      />
      <TextInput
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="Confirm password"
        placeholderTextColor="#64748B"
        secureTextEntry
        className="bg-surface border border-slate-200 rounded-xl px-4 py-3 mb-2 text-text-primary"
      />

      {error ? <Text className="text-red-600 text-sm mb-2">{error}</Text> : null}

      <Pressable
        onPress={handleSignup}
        disabled={loading}
        className="bg-primary rounded-xl py-4 items-center mt-4"
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-semibold text-base">Sign Up</Text>
        )}
      </Pressable>

      <View className="flex-row justify-center mt-6">
        <Text className="text-text-secondary">Already have an account? </Text>
        <Link href="/(auth)/login" className="text-primary font-semibold">
          Sign In
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}
