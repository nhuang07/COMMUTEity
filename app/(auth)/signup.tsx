import { useState } from "react";
import { View, Text, KeyboardAvoidingView, Platform } from "react-native";
import { Link, router } from "expo-router";
import { signUp } from "@/lib/auth";
import { setPendingEmail } from "@/lib/storage";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";

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
      router.push({ pathname: "/(auth)/verify", params: { email: email.trim(), password } });
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
      <View className="mb-10">
        <Text className="font-display text-2xl text-primary tracking-tight mb-6 text-center">COMMUTEity</Text>
        <Text className="font-display text-3xl text-text-primary mb-2 tracking-tight">Create your account</Text>
        <Text className="font-sans text-base text-text-secondary">
          Only UBC students can join Commuteity.
        </Text>
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
          autoComplete="password-new"
        />
        <Input
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm password"
          secureTextEntry
          autoComplete="password-new"
        />
      </View>

      {error ? <Text className="font-sans text-destructive text-sm mt-3">{error}</Text> : null}

      <View className="mt-6">
        <Button label="Sign Up" onPress={handleSignup} variant="primary" loading={loading} />
      </View>

      <View className="flex-row justify-center mt-6">
        <Text className="font-sans text-text-secondary">Already have an account? </Text>
        <Link href="/(auth)/login" className="font-sans-semibold text-primary">
          Sign In
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}
