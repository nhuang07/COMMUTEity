import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { createProfile } from "@/lib/api";
import { getUserId, getUserEmail, setProfile } from "@/lib/storage";

const YEARS = ["1st year", "2nd year", "3rd year", "4th year", "5th+ year", "Grad student"];
const CAMPUSES = ["UBC Vancouver", "UBC Okanagan"];

type Step = "welcome" | "about" | "commute" | "socials";

export default function ProfileSetup() {
  const [step, setStep] = useState<Step>("welcome");

  // About you
  const [name, setName] = useState("");
  const [major, setMajor] = useState("");
  const [year, setYear] = useState<string | null>(null);

  // Commute info
  const [homeArea, setHomeArea] = useState("");
  const [campus, setCampus] = useState<string | null>(null);

  // Socials
  const [instagram, setInstagram] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [discord, setDiscord] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleNextFromAbout() {
    if (!name.trim()) {
      setError("What should we call you?");
      return;
    }
    setError("");
    setStep("commute");
  }

  function handleNextFromCommute() {
    if (!homeArea.trim()) {
      setError("Where do you commute from?");
      return;
    }
    if (!campus) {
      setError("Which campus are you heading to?");
      return;
    }
    setError("");
    setStep("socials");
  }

  async function handleFinish() {
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
        destination: campus!,
        socials,
      });

      setProfile({
        displayName: name.trim(),
        homeArea: homeArea.trim(),
        destination: campus!,
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

  // Step indicator
  const steps: Step[] = ["welcome", "about", "commute", "socials"];
  const currentIndex = steps.indexOf(step);

  function StepDots() {
    return (
      <View className="flex-row justify-center gap-2 mb-8">
        {steps.map((s, i) => (
          <View
            key={s}
            className={`h-2 rounded-full ${
              i <= currentIndex ? "bg-primary w-6" : "bg-slate-200 w-2"
            }`}
          />
        ))}
      </View>
    );
  }

  if (step === "welcome") {
    return (
      <View className="flex-1 bg-background px-6 justify-center">
        <Text className="text-4xl font-bold text-text-primary mb-3">
          Welcome to Commuteity
        </Text>
        <Text className="text-lg text-text-secondary mb-4 leading-7">
          Find people who share your commute to UBC. Match with fellow students on the same bus, train, or route — and turn your commute into a community.
        </Text>
        <Text className="text-base text-text-secondary mb-10">
          Let's set up your profile so we can start matching you.
        </Text>

        <Pressable
          onPress={() => setStep("about")}
          className="bg-primary rounded-xl py-4 items-center"
        >
          <Text className="text-white font-semibold text-base">Get Started</Text>
        </Pressable>
      </View>
    );
  }

  if (step === "about") {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 bg-background"
      >
        <ScrollView
          contentContainerClassName="px-6 pt-16 pb-10"
          keyboardShouldPersistTaps="handled"
        >
          <StepDots />
          <Text className="text-2xl font-bold text-text-primary mb-2">About you</Text>
          <Text className="text-base text-text-secondary mb-8">
            This is what your matches will see.
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
            placeholder="e.g. Computer Science (optional)"
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

          {error ? <Text className="text-red-600 text-sm mb-2">{error}</Text> : null}

          <Pressable
            onPress={handleNextFromAbout}
            className="bg-primary rounded-xl py-4 items-center mt-4"
          >
            <Text className="text-white font-semibold text-base">Next</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  if (step === "commute") {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 bg-background"
      >
        <ScrollView
          contentContainerClassName="px-6 pt-16 pb-10"
          keyboardShouldPersistTaps="handled"
        >
          <StepDots />
          <Text className="text-2xl font-bold text-text-primary mb-2">Your commute</Text>
          <Text className="text-base text-text-secondary mb-8">
            We use this to find people on the same route as you.
          </Text>

          <Text className="text-sm font-semibold text-text-primary mb-2">Where do you commute from?</Text>
          <TextInput
            value={homeArea}
            onChangeText={setHomeArea}
            placeholder="e.g. Burnaby, Richmond, Surrey"
            placeholderTextColor="#64748B"
            className="bg-surface border border-slate-200 rounded-xl px-4 py-3 mb-5 text-text-primary"
          />

          <Text className="text-sm font-semibold text-text-primary mb-2">Which campus?</Text>
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

          {error ? <Text className="text-red-600 text-sm mb-2">{error}</Text> : null}

          <View className="flex-row gap-3 mt-4">
            <Pressable
              onPress={() => { setError(""); setStep("about"); }}
              className="flex-1 border border-slate-200 rounded-xl py-4 items-center"
            >
              <Text className="text-text-primary font-semibold text-base">Back</Text>
            </Pressable>
            <Pressable
              onPress={handleNextFromCommute}
              className="flex-1 bg-primary rounded-xl py-4 items-center"
            >
              <Text className="text-white font-semibold text-base">Next</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // step === "socials"
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-background"
    >
      <ScrollView
        contentContainerClassName="px-6 pt-16 pb-10"
        keyboardShouldPersistTaps="handled"
      >
        <StepDots />
        <Text className="text-2xl font-bold text-text-primary mb-2">Connect with matches</Text>
        <Text className="text-base text-text-secondary mb-8">
          Add socials so your matches can reach out. You can always update these later.
        </Text>

        <Text className="text-sm font-semibold text-text-primary mb-2">Instagram</Text>
        <TextInput
          value={instagram}
          onChangeText={setInstagram}
          placeholder="@yourhandle"
          placeholderTextColor="#64748B"
          autoCapitalize="none"
          className="bg-surface border border-slate-200 rounded-xl px-4 py-3 mb-4 text-text-primary"
        />

        <Text className="text-sm font-semibold text-text-primary mb-2">LinkedIn</Text>
        <TextInput
          value={linkedin}
          onChangeText={setLinkedin}
          placeholder="linkedin.com/in/you"
          placeholderTextColor="#64748B"
          autoCapitalize="none"
          className="bg-surface border border-slate-200 rounded-xl px-4 py-3 mb-4 text-text-primary"
        />

        <Text className="text-sm font-semibold text-text-primary mb-2">Discord</Text>
        <TextInput
          value={discord}
          onChangeText={setDiscord}
          placeholder="username#1234"
          placeholderTextColor="#64748B"
          autoCapitalize="none"
          className="bg-surface border border-slate-200 rounded-xl px-4 py-3 mb-2 text-text-primary"
        />

        {error ? <Text className="text-red-600 text-sm mb-2">{error}</Text> : null}

        <View className="flex-row gap-3 mt-6">
          <Pressable
            onPress={() => { setError(""); setStep("commute"); }}
            className="flex-1 border border-slate-200 rounded-xl py-4 items-center"
          >
            <Text className="text-text-primary font-semibold text-base">Back</Text>
          </Pressable>
          <Pressable
            onPress={handleFinish}
            disabled={loading}
            className="flex-1 bg-primary rounded-xl py-4 items-center"
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-base">Finish</Text>
            )}
          </Pressable>
        </View>

        <Pressable
          onPress={handleFinish}
          disabled={loading}
          className="items-center mt-4"
        >
          <Text className="text-text-secondary text-sm">Skip socials for now</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
