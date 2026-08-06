import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { createProfile } from "@/lib/api";
import { getUserId, getUserEmail, setProfile } from "@/lib/storage";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";

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
            className={`h-1.5 rounded-full ${
              i <= currentIndex ? "bg-primary w-6" : "bg-border w-1.5"
            }`}
          />
        ))}
      </View>
    );
  }

  function Chip({
    label,
    selected,
    onPress,
  }: {
    label: string;
    selected: boolean;
    onPress: () => void;
  }) {
    return (
      <Pressable
        onPress={onPress}
        className={`px-4 py-2.5 rounded-md border ${
          selected ? "bg-accent-muted border-accent-muted" : "bg-surface border-border"
        }`}
      >
        <Text className={selected ? "font-sans-semibold text-accent-muted-foreground" : "font-sans text-text-primary"}>
          {label}
        </Text>
      </Pressable>
    );
  }

  if (step === "welcome") {
    return (
      <View className="flex-1 bg-background px-6 justify-center">
        <View className="w-12 h-12 rounded-md bg-primary items-center justify-center mb-6">
          <Text className="text-primary-foreground font-sans-bold text-xl">C</Text>
        </View>
        <Text className="font-display text-4xl text-text-primary mb-3 tracking-tight">
          Welcome to Commuteity
        </Text>
        <Text className="font-sans text-lg text-text-secondary mb-4 leading-7">
          Find people who share your commute to UBC. Match with fellow students on the same bus, train, or route — and turn your commute into a community.
        </Text>
        <Text className="font-sans text-base text-text-secondary mb-10">
          Let's set up your profile so we can start matching you.
        </Text>

        <Button label="Get Started" onPress={() => setStep("about")} variant="primary" />
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
          <Text className="font-display text-2xl text-text-primary mb-2 tracking-tight">About you</Text>
          <Text className="font-sans text-base text-text-secondary mb-8">
            This is what your matches will see.
          </Text>

          <Text className="font-sans-semibold text-sm text-text-primary mb-2">Display name</Text>
          <Input
            value={name}
            onChangeText={setName}
            placeholder="e.g. Jessi"
            className="mb-5"
          />

          <Text className="font-sans-semibold text-sm text-text-primary mb-2">Major</Text>
          <Input
            value={major}
            onChangeText={setMajor}
            placeholder="e.g. Computer Science (optional)"
            className="mb-5"
          />

          <Text className="font-sans-semibold text-sm text-text-primary mb-2">Year</Text>
          <View className="flex-row flex-wrap gap-2 mb-5">
            {YEARS.map((y) => (
              <Chip key={y} label={y} selected={year === y} onPress={() => setYear(y)} />
            ))}
          </View>

          {error ? <Text className="font-sans text-destructive text-sm mb-2">{error}</Text> : null}

          <View className="mt-4">
            <Button label="Next" onPress={handleNextFromAbout} variant="primary" />
          </View>
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
          <Text className="font-display text-2xl text-text-primary mb-2 tracking-tight">Your commute</Text>
          <Text className="font-sans text-base text-text-secondary mb-8">
            We use this to find people on the same route as you.
          </Text>

          <Text className="font-sans-semibold text-sm text-text-primary mb-2">Where do you commute from?</Text>
          <Input
            value={homeArea}
            onChangeText={setHomeArea}
            placeholder="e.g. Burnaby, Richmond, Surrey"
            className="mb-5"
          />

          <Text className="font-sans-semibold text-sm text-text-primary mb-2">Which campus?</Text>
          <View className="flex-row gap-2 mb-5">
            {CAMPUSES.map((c) => (
              <Chip key={c} label={c} selected={campus === c} onPress={() => setCampus(c)} />
            ))}
          </View>

          {error ? <Text className="font-sans text-destructive text-sm mb-2">{error}</Text> : null}

          <View className="flex-row gap-3 mt-4">
            <View className="flex-1">
              <Button
                label="Back"
                onPress={() => { setError(""); setStep("about"); }}
                variant="secondary"
              />
            </View>
            <View className="flex-1">
              <Button label="Next" onPress={handleNextFromCommute} variant="primary" />
            </View>
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
        <Text className="font-display text-2xl text-text-primary mb-2 tracking-tight">Connect with matches</Text>
        <Text className="font-sans text-base text-text-secondary mb-8">
          Add socials so your matches can reach out. You can always update these later.
        </Text>

        <Text className="font-sans-semibold text-sm text-text-primary mb-2">Instagram</Text>
        <Input
          value={instagram}
          onChangeText={setInstagram}
          placeholder="@yourhandle"
          autoCapitalize="none"
          className="mb-4"
        />

        <Text className="font-sans-semibold text-sm text-text-primary mb-2">LinkedIn</Text>
        <Input
          value={linkedin}
          onChangeText={setLinkedin}
          placeholder="linkedin.com/in/you"
          autoCapitalize="none"
          className="mb-4"
        />

        <Text className="font-sans-semibold text-sm text-text-primary mb-2">Discord</Text>
        <Input
          value={discord}
          onChangeText={setDiscord}
          placeholder="username#1234"
          autoCapitalize="none"
          className="mb-2"
        />

        {error ? <Text className="font-sans text-destructive text-sm mb-2">{error}</Text> : null}

        <View className="flex-row gap-3 mt-6">
          <View className="flex-1">
            <Button
              label="Back"
              onPress={() => { setError(""); setStep("commute"); }}
              variant="secondary"
            />
          </View>
          <View className="flex-1">
            <Button label="Finish" onPress={handleFinish} variant="primary" loading={loading} />
          </View>
        </View>

        <Pressable onPress={handleFinish} disabled={loading} className="items-center mt-4">
          <Text className="font-sans text-text-secondary text-sm">Skip socials for now</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
