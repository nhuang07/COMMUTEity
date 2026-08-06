import { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";

const YEARS = ["1st year", "2nd year", "3rd year", "4th year", "5th+ year", "Grad student"];

export default function ProfileSetup() {
  const [name, setName] = useState("");
  const [major, setMajor] = useState("");
  const [year, setYear] = useState<string | null>(null);
  const [instagram, setInstagram] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [discord, setDiscord] = useState("");
  const [error, setError] = useState("");

  function handleComplete() {
    if (!name.trim()) {
      setError("Enter your display name.");
      return;
    }
    if (!major.trim()) {
      setError("Enter your major.");
      return;
    }
    if (!year) {
      setError("Select your year.");
      return;
    }
    setError("");
    // TODO: call lib/api.ts to PUT /profile with { name, major, year, socials }
    router.replace("/(tabs)/home");
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-background"
    >
      <ScrollView contentContainerClassName="px-6 pt-16 pb-10" keyboardShouldPersistTaps="handled">
        <Text className="text-3xl font-bold text-text-primary mb-2">Set up your profile</Text>
        <Text className="text-base text-text-secondary mb-8">
          This is what your connections will see once you match.
        </Text>

        <Text className="text-sm font-semibold text-text-primary mb-2">Display name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Jessi"
          placeholderTextColor="#64748B"
          className="bg-surface border border-slate-200 rounded-xl px-4 py-3 mb-5 text-text-primary"
        />

        <Text className="text-sm font-semibold text-text-primary mb-2">Major</Text>
        <TextInput
          value={major}
          onChangeText={setMajor}
          placeholder="e.g. Computer Science"
          placeholderTextColor="#64748B"
          className="bg-surface border border-slate-200 rounded-xl px-4 py-3 mb-5 text-text-primary"
        />

        <Text className="text-sm font-semibold text-text-primary mb-2">Year</Text>
        <View className="flex-row flex-wrap gap-2 mb-5">
          {YEARS.map((y) => (
            <Pressable
              key={y}
              onPress={() => setYear(y)}
              className={`px-4 py-2 rounded-full border ${
                year === y
                  ? "bg-primary border-primary"
                  : "bg-surface border-slate-200"
              }`}
            >
              <Text className={year === y ? "text-white font-medium" : "text-text-primary"}>
                {y}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text className="text-sm font-semibold text-text-primary mb-2">
          Social handles <Text className="text-text-secondary font-normal">(optional)</Text>
        </Text>
        <TextInput
          value={instagram}
          onChangeText={setInstagram}
          placeholder="Instagram handle"
          placeholderTextColor="#64748B"
          autoCapitalize="none"
          className="bg-surface border border-slate-200 rounded-xl px-4 py-3 mb-3 text-text-primary"
        />
        <TextInput
          value={linkedin}
          onChangeText={setLinkedin}
          placeholder="LinkedIn handle"
          placeholderTextColor="#64748B"
          autoCapitalize="none"
          className="bg-surface border border-slate-200 rounded-xl px-4 py-3 mb-3 text-text-primary"
        />
        <TextInput
          value={discord}
          onChangeText={setDiscord}
          placeholder="Discord handle"
          placeholderTextColor="#64748B"
          autoCapitalize="none"
          className="bg-surface border border-slate-200 rounded-xl px-4 py-3 mb-2 text-text-primary"
        />

        {error ? <Text className="text-red-600 text-sm mb-2">{error}</Text> : null}

        <Pressable
          onPress={handleComplete}
          className="bg-primary rounded-xl py-4 items-center mt-6"
        >
          <Text className="text-white font-semibold text-base">Finish Setup</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}