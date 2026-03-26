import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import AuthTextField from '../components/AuthTextField';
import { useAppTheme } from '../components/AppThemeProvider';
import PrimaryButton from '../components/PrimaryButton';
import { APP_NAME } from '../constants/branding';
import { AuthServiceError } from '../services/authHelpers';
import { loadUserProfile, saveUserProfile } from '../services/userProfileService';
import type { RootStackParamList } from '../navigation/types';

type ProfileDetailsScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'ProfileDetails'
>;

export default function ProfileDetailsScreen({
  navigation,
}: ProfileDetailsScreenProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    void loadUserProfile().then((profile) => {
      if (!profile || !isMounted) {
        return;
      }

      setEmail(profile.email);
      setName(profile.name);
      setAge(profile.age ? String(profile.age) : '');
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const parsedAge = age.trim() ? Number(age.trim()) : null;

      if (parsedAge !== null && (!Number.isFinite(parsedAge) || parsedAge <= 0)) {
        throw new AuthServiceError('Enter a valid age or leave it blank.');
      }

      await saveUserProfile({
        age: parsedAge,
        countryCode: null,
        name,
      });

      setMessage('Profile updated.');
    } catch (error) {
      setMessage(
        error instanceof AuthServiceError
          ? error.message
          : 'We could not save your profile right now.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Profile</Text>
          <Text style={styles.title}>Update your {APP_NAME} details</Text>
          <Text style={styles.subtitle}>
            Email comes from your sign-in account. Name and age can be updated anytime.
          </Text>
        </View>

        <View style={styles.card}>
          <AuthTextField
            editable={false}
            label="Email"
            onChangeText={setEmail}
            placeholder="you@example.com"
            value={email}
          />
          <AuthTextField
            label="Name"
            onChangeText={setName}
            placeholder="How should we address you?"
            value={name}
          />
          <AuthTextField
            keyboardType="number-pad"
            label="Age (Optional)"
            onChangeText={setAge}
            placeholder="Leave blank if you prefer"
            value={age}
          />
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <PrimaryButton
            disabled={isSaving}
            label={isSaving ? 'Saving...' : 'Save Profile'}
            onPress={() => void handleSave()}
          />
          <PrimaryButton label="Back to Settings" onPress={() => navigation.goBack()} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (
  colors: ReturnType<typeof useAppTheme>['colors']
) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 24,
      borderWidth: 1,
      gap: 16,
      padding: 20,
    },
    content: {
      gap: 24,
      padding: 24,
    },
    eyebrow: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: '800',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    header: {
      gap: 10,
    },
    message: {
      color: colors.primary,
      fontSize: 14,
      lineHeight: 21,
    },
    safeArea: {
      backgroundColor: colors.background,
      flex: 1,
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 15,
      lineHeight: 22,
    },
    title: {
      color: colors.text,
      fontSize: 30,
      fontWeight: '800',
      lineHeight: 36,
    },
  });
