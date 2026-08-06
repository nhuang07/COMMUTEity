import { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { createProfile } from "@/lib/api";
import { getUserId, getUserEmail, setProfile } from "@/lib/storage";

const YEARS = ["1st year", "2nd year", "3rd year", "4th year", "5th+ year", "Grad student"];
const CAMPUSES = ["UBC Vancouver", "UBC Okanagan"];

export default function ProfileSetup() {
  const [name, setName] = useState("");
  const [homeArea, setHomeArea] = useState("");
  const [campus, setCampus] = useState<string | null>(null);
  const [major, setMajor] = useState("");
  const [year, setYear] = useState<string | null>(null);
  const [instagram, setInstagram] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [discord, setDiscord] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleComplete() {
    if (!name.trim()) { setError("Enter your display name."); return; }
    if (!homeArea.trim()) { setError("Enter your home area (e.g. Burnaby)."); return; }
    if (!campus) { setError("Select your campus."); return; }
    setError("");
    setLoading(true);
    try {
      const userId = await getUserId();
      const email = getUserEmail();
      if (!userId || !email) throw new Error("Session expired. Please sign in again.");

      const socials = {
        ...(instagram.trim() && { instagram: instagram.trim() }),
        ...(linkedin.trim() && { linkedin: linkedin.trim() }),
        ...(discord.trim() && { discord: discord.trim() }),
      };

      await createProfile({
        userId,
        email,
        homeArea: homeArea.trim(),
        destination: campus,
        socials,
      });

      setProfile({
        displayName: name.trim(),
        homeArea: homeArea.trim(),
        destination: campus,
        ...(major.trim() && { faculty: major.trim() }),
        ...(year && { year }),
        socials,
      });

      router.replace("/(tabs)/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Setup failed.");
    } finally {
      setLoading(false);
    }
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

        <Text className="text-sm font-semibold text-text-primary mb-2">Home area</Text>
        <TextInput
          value={homeArea}
          onChangeText={setHomeArea}
          placeholder="e.g. Burnaby, Richmond, Surrey"
          placeholderTextColor="#64748B"
          className="bg-surface border border-slate-200 rounded-xl px-4 py-3 mb-5 text-text-primary"
        />

        <Text className="text-sm font-semibold text-text-primary mb-2">Campus</Text>
        <View className="flex-row gap-2 mb-5">
          {CAMPUSES.map((c) => (
            <Pressable
              key={c}
              onPress={() => setCampus(c)}
              className={`px-4 py-2 rounded-full border ${
                campus === c ? "bg-primary border-primary" : "bg-surface border-slate-200"
              }`}
            >
              <Text className={campus === c ? "text-white font-medium" : "text-text-primary"}>
                {c}
              </Text>
            </Pressable>
          ))}
        </View>

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
                year === y ? "bg-primary border-primary" : "bg-surface border-slate-200"
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
          disabled={loading}
          className="bg-primary rounded-xl py-4 items-center mt-6"
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold text-base">Finish Setup</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
