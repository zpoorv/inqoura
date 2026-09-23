import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  InteractionManager,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import ViewShot from 'react-native-view-shot';

import { useI18n } from '../../components/AppLanguageProvider';
import { useAppTheme } from '../../components/AppThemeProvider';
import EnvironmentalImpactCard from '../../components/EnvironmentalImpactCard';
import HouseholdFitCard from '../../components/HouseholdFitCard';
import IngredientExplanationModal from '../../components/IngredientExplanationModal';
import PremiumGuidanceCard from '../../components/PremiumGuidanceCard';
import ProductTimelineCard from '../../components/ProductTimelineCard';
import ProductRestrictionCard from '../../components/ProductRestrictionCard';
import ProductSuggestionsCard from '../../components/ProductSuggestionsCard';
import ReportProductIssueModal from '../../components/ReportProductIssueModal';
import ResultCardSkeleton from '../../components/ResultCardSkeleton';
import ResultTrustCard from '../../components/ResultTrustCard';
import ShareCardPickerModal from '../../components/ShareCardPickerModal';
import ShareResultCard from '../../components/ShareResultCard';
import { ComponentErrorBoundary } from '../../components/common/ComponentErrorBoundary';
import { StatusGlyphBadge, type StatusGlyphType } from '../../components/common/StatusGlyphBadge';
import FoodPurityMedallion from '../../components/result/FoodPurityMedallion';
import IngredientConstellation from '../../components/result/IngredientConstellation';
import ServingSizeAdjuster from '../../components/result/ServingSizeAdjuster';
import { triggerCautionHaptic, triggerDangerHaptic, triggerSafeHaptic } from '../../utils/haptics';
import { generateVoiceVerdict } from '../../utils/voiceVerdict';
import MetricChip from './result/MetricChip';
import { createStyles } from './result/resultScreenStyles';
import type { AppColors } from '../../constants/theme';
import {
  DEFAULT_DIET_PROFILE_ID,
  type DietProfileId,
} from '../../constants/dietProfiles';
import type { PremiumEntitlement } from '../../models/premium';
import type { RestrictionId, RestrictionSeverity } from '../../models/restrictions';
import type { ShareCardStyleId } from '../../models/shareCardStyle';
import type { RootStackParamList } from '../../navigation/types';
import type { ScanResultSource } from '../../types/scanner';
import { loadAdminAppConfig } from '../../services/adminAppConfigService';
import {
  buildCorrectionReportSummary,
  submitCorrectionReport,
  submitTrustConfirmation,
} from '../../services/correctionReportService';
import {
  consumeFeatureQuota,
  loadFeatureQuotaSnapshot,
  type FeatureQuotaSnapshot,
} from '../../services/featureUsageStorage';
import {
  hasPremiumFeatureAccess,
} from '../../services/premiumEntitlementService';
import { resolveProductByBarcode } from '../../services/productLookup';
import { saveScanToHistory } from '../../services/scanHistoryStorage';
import { trackAnalyticsEvent } from '../../services/analyticsService';
import {
  loadSessionEffectiveShoppingProfile,
  loadSessionPremiumEntitlement,
  loadSessionScanHistory,
  loadSessionUserProfile,
} from '../../services/sessionDataService';
import {
  saveShareCardStyleId,
  syncShareCardStyleForCurrentUser,
} from '../../services/shareCardPreferenceStorage';
import {
  loadProductTrustConfirmation,
  recordProductTrustConfirmation,
  type ProductTrustConfirmation,
} from '../../services/productTrustConfirmationStorage';
import {
  subscribeScanHistoryChanges,
  type ScanHistoryEntry,
} from '../../services/scanHistoryStorage';
import { getPremiumSession, subscribePremiumSession } from '../../store';
import {
  markPerformanceTrace,
  measurePerformanceTrace,
} from '../../services/performanceTrace';
import { getRestrictionDefinition } from '../../constants/restrictions';
import {
  SHARE_CARD_STYLE_DEFINITIONS,
} from '../../constants/shareCardStyles';
import type { HouseholdFitResult } from '../../models/householdFit';
import { getGradeTone } from '../../utils/gradeTone';
import {
  type IngredientExplanationLookup,
} from '../../utils/ingredientExplanations';
import {
  type HighlightedIngredient,
} from '../../utils/ingredientHighlighting';
import { formatProductName } from '../../utils/productDisplay';
import type { ProductMetric } from '../../utils/productInsights';
import {
  type DecisionVerdict,
  buildResultAnalysis,
  type ExplainedIngredient,
  type ResultConfidence,
  type ResultAnalysis,
} from '../../utils/resultAnalysis';
import { buildHouseholdFitResult } from '../../utils/householdFit';
import { assessProductRestrictions } from '../../utils/restrictionMatching';
import { buildShareableResultCaption } from '../../utils/shareableResult';
import { buildEnvironmentalImpactInsight } from '../../utils/environmentalImpact';
import type { UserProfile } from '../../models/userProfile';

type ResultScreenProps = NativeStackScreenProps<RootStackParamList, 'Result'>;

import {
  getToneColor,
  getIngredientToneColor,
  getIngredientToneBackground,
  getIngredientRiskLabel,
  getOffScoreTone,
  getHealthScoreTheme,
  getScanCompletionCopy,
  getQuickUseGuidance,
  getConfidenceTone,
  getConfidenceBackground,
  getConfidenceLabel,
  type TranslateFn,
} from './result/resultScreenHelpers';

export default function ResultScreen({ navigation, route }: ResultScreenProps) {
  const { t } = useI18n();
  const { colors, typography } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);
  const {
    barcode,
    barcodeType,
    persistToHistory,
    product: initialProduct,
    productSnapshotSource,
    revalidateOnOpen,
    resultSource = 'barcode',
  } = route.params;
  const shareCardRef = useRef<ViewShot | null>(null);
  const shareCardImageReadyRef = useRef(false);
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [isShareCaptureMounted, setIsShareCaptureMounted] = useState(false);
  const [, setShareCardImageReady] = useState(false);
  const [isSharePickerVisible, setIsSharePickerVisible] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [hasResolvedProfile, setHasResolvedProfile] = useState(
    Boolean(route.params.profileId)
  );
  const [adminConfig, setAdminConfig] = useState<{
    enableRuleBasedSuggestions: boolean;
    resultDisclaimer: string | null;
    shareFooterText: string | null;
  } | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ResultAnalysis | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<DietProfileId>(
    route.params.profileId || DEFAULT_DIET_PROFILE_ID
  );
  const [selectedIngredient, setSelectedIngredient] =
    useState<ExplainedIngredient | null>(null);
  const [premiumEntitlement, setPremiumEntitlement] = useState<PremiumEntitlement>(
    getPremiumSession()
  );
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [product, setProduct] = useState(initialProduct);
  const [shareCardStyleId, setShareCardStyleId] =
    useState<ShareCardStyleId>('classic');
  const [draftShareCardStyleId, setDraftShareCardStyleId] =
    useState<ShareCardStyleId>('classic');
  const [captureShareCardStyleId, setCaptureShareCardStyleId] =
    useState<ShareCardStyleId>('classic');
  const [shareQuotaSnapshot, setShareQuotaSnapshot] =
    useState<FeatureQuotaSnapshot | null>(null);
  const [activeRestrictionIds, setActiveRestrictionIds] = useState<RestrictionId[]>([]);
  const [restrictionSeverity, setRestrictionSeverity] =
    useState<RestrictionSeverity>('strict');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [historyEntry, setHistoryEntry] = useState<ScanHistoryEntry | null>(null);
  const [trustConfirmation, setTrustConfirmation] =
    useState<ProductTrustConfirmation | null>(null);
  const [isSubmittingTrustConfirmation, setIsSubmittingTrustConfirmation] =
    useState(false);
  const [isSecondaryStageReady, setIsSecondaryStageReady] = useState(false);
  const displayProductName = useMemo(
    () => formatProductName(product?.name),
    [product?.name]
  );
  const scanCompletionCopy = getScanCompletionCopy(resultSource, t);
  const insights = analysisResult?.insights ?? null;
  const confidence = analysisResult?.confidence ?? null;
  const confidenceReason = analysisResult?.confidenceReason ?? null;
  const decisionSummary = analysisResult?.decisionSummary ?? null;
  const decisionVerdict = analysisResult?.decisionVerdict ?? null;
  const foodStatus = analysisResult?.foodStatus ?? null;
  const ingredientAnalysis = analysisResult?.ingredientAnalysis ?? null;
  const topConcern = analysisResult?.topConcern ?? null;
  const trustSnapshot = analysisResult?.trustSnapshot ?? null;
  const alternativeSuggestions = useMemo(
    () => analysisResult?.suggestions ?? [],
    [analysisResult?.suggestions]
  );
  const displayedSuggestions = useMemo(() => {
    if (
      adminConfig &&
      adminConfig.enableRuleBasedSuggestions === false &&
      !product.adminMetadata?.hasCustomAlternatives
    ) {
      return [];
    }

    return alternativeSuggestions;
  }, [
    adminConfig,
    alternativeSuggestions,
    product.adminMetadata?.hasCustomAlternatives,
  ]);
  const healthScoreTheme = useMemo(
    () => getHealthScoreTheme(colors, insights?.smartScore ?? null, t),
    [colors, insights?.smartScore, t]
  );
  const gradeTone = useMemo(
    () => getGradeTone(insights?.gradeLabel),
    [insights?.gradeLabel]
  );
  const selectedIngredientExplanation: IngredientExplanationLookup | null =
    selectedIngredient?.explanationLookup ?? null;
  const shareableResult = analysisResult?.shareableResult ?? null;
  const premiumGuidance = analysisResult?.premiumGuidance ?? null;
  const shareCardWidth = useMemo(
    () => Math.min(windowWidth - 64, 360),
    [windowWidth]
  );
  const environmentalInsight = useMemo(
    () => buildEnvironmentalImpactInsight(product),
    [product]
  );
  const recipeText = product.recipe?.trim() || null;
  const timelinePreview = useMemo(
    () => historyEntry?.productTimeline.slice(0, 2) ?? [],
    [historyEntry?.productTimeline]
  );
  const selectedRestrictionLabels = useMemo(
    () =>
      activeRestrictionIds
        .map((restrictionId) => getRestrictionDefinition(restrictionId)?.label ?? null)
        .filter((label): label is string => Boolean(label)),
    [activeRestrictionIds]
  );
  const restrictionAssessment = useMemo(
    () => assessProductRestrictions(product, activeRestrictionIds, restrictionSeverity),
    [activeRestrictionIds, product, restrictionSeverity]
  );
  const restrictionSummary = useMemo(() => {
    if (activeRestrictionIds.length === 0) {
      return null;
    }

    if (restrictionAssessment.summary) {
      return restrictionAssessment.summary;
    }

    if (selectedRestrictionLabels.length === 0) {
      return t('No strong matches found for your selected filters.');
    }

    return t('No strong matches found for {labels}.', {
      labels: selectedRestrictionLabels.join(', '),
    });
  }, [activeRestrictionIds.length, restrictionAssessment.summary, selectedRestrictionLabels, t]);
  const householdFit = useMemo<HouseholdFitResult | null>(
    () =>
      hasResolvedProfile
        ? buildHouseholdFitResult(product, userProfile, selectedProfileId)
        : null,
    [hasResolvedProfile, product, selectedProfileId, userProfile]
  );
  const canShowPremiumGuidance = hasPremiumFeatureAccess(
    'deeper-result-guidance',
    premiumEntitlement
  );
  const renderedPremiumGuidance =
    canShowPremiumGuidance && premiumGuidance
      ? { ...premiumGuidance, confidenceAssist: null }
      : null;
  const quickUseGuidance = useMemo(
    () =>
      getQuickUseGuidance(
        decisionVerdict,
        insights?.smartScore ?? null,
        foodStatus,
        confidence,
        t
      ),
    [confidence, decisionVerdict, foodStatus, insights?.smartScore, t]
  );
  const statusGlyph = useMemo<StatusGlyphType>(() => {
    const hasHouseholdAvoid = householdFit?.members.some((m) => m.status === 'avoid');
    const isDanger =
      restrictionAssessment.tone === 'avoid' ||
      Boolean(hasHouseholdAvoid) ||
      insights?.gradeLabel === 'F' ||
      insights?.gradeLabel === 'D';

    if (isDanger) return 'danger';

    const isSafe =
      restrictionAssessment.tone === 'clear' &&
      (!householdFit || householdFit.verdict === 'works-for-everyone') &&
      (insights?.smartScore == null || insights.smartScore >= 75);

    if (isSafe) return 'safe';
    return 'caution';
  }, [
    householdFit,
    restrictionAssessment.tone,
    insights?.gradeLabel,
    insights?.smartScore,
  ]);

  const voiceVerdictText = useMemo(() => {
    if (!analysisResult) return '';
    return generateVoiceVerdict({
      productName: displayProductName,
      healthScore: insights?.smartScore,
      status: statusGlyph,
      flaggedRestrictions: selectedRestrictionLabels,
      unmetMemberNames:
        householdFit?.members
          .filter((m) => m.status === 'avoid')
          .map((m) => m.name) || [],
    });
  }, [
    analysisResult,
    displayProductName,
    insights?.smartScore,
    statusGlyph,
    selectedRestrictionLabels,
    householdFit,
  ]);

  useEffect(() => {
    if (!analysisResult) return;
    if (statusGlyph === 'danger') {
      void triggerDangerHaptic();
    } else if (statusGlyph === 'safe') {
      void triggerSafeHaptic();
    } else {
      void triggerCautionHaptic();
    }
  }, [analysisResult, statusGlyph]);
  const disclaimerText =
    adminConfig?.resultDisclaimer ||
    t('Quick guide only.');
  const activeSharePreviewStyleId = premiumEntitlement.isPremium
    ? draftShareCardStyleId
    : 'classic';
  const shareLimitText = useMemo(() => {
    if (shareQuotaSnapshot?.isUnlimited) {
      return t('Premium sharing is unlimited and ad-free.');
    }

    if (shareQuotaSnapshot) {
      return t('{remaining} of 5 basic share exports left today.', {
        remaining: shareQuotaSnapshot.remaining,
      });
    }

    return t('Checking your daily share allowance.');
  }, [shareQuotaSnapshot, t]);

  useLayoutEffect(() => {
    navigation.setOptions({ title: displayProductName });
  }, [displayProductName, navigation]);

  useEffect(() => {
    markPerformanceTrace('result-open', { barcode });
    setIsSecondaryStageReady(false);
    setProduct(initialProduct);

    const interactionHandle = InteractionManager.runAfterInteractions(() => {
      requestAnimationFrame(() => {
        setIsSecondaryStageReady(true);
      });
    });

    return () => {
      interactionHandle.cancel();
    };
  }, [barcode, initialProduct]);

  useEffect(() => {
    trackAnalyticsEvent('result_opened', {
      barcode,
      barcodeType: barcodeType ?? 'unknown',
      source: resultSource,
    });
  }, [barcode, barcodeType, resultSource]);

  useEffect(() => {
    if (
      !revalidateOnOpen ||
      (productSnapshotSource !== 'search-index' &&
        productSnapshotSource !== 'search-cache')
    ) {
      return;
    }

    let isMounted = true;

    void resolveProductByBarcode(barcode, barcodeType)
      .then((nextProduct) => {
        if (isMounted && nextProduct) {
          setProduct(nextProduct);
        }
      })
      .catch(() => null);

    return () => {
      isMounted = false;
    };
  }, [barcode, barcodeType, productSnapshotSource, revalidateOnOpen]);

  useEffect(() => {
    if (route.params.profileId) {
      setSelectedProfileId(route.params.profileId);
      setHasResolvedProfile(true);
      return;
    }

    let isMounted = true;

    const restoreProfile = async () => {
      const effectiveProfile = await loadSessionEffectiveShoppingProfile('cache-first');

      if (isMounted) {
        setSelectedProfileId(effectiveProfile.dietProfileId);
        setHasResolvedProfile(true);
      }
    };

    void restoreProfile();

    return () => {
      isMounted = false;
    };
  }, [route.params.profileId]);

  useEffect(() => {
    if (!isSecondaryStageReady) {
      return;
    }

    let isMounted = true;

    const restoreRestrictions = async () => {
      const [profile, effectiveProfile] = await Promise.all([
        loadSessionUserProfile('stale-while-revalidate'),
        loadSessionEffectiveShoppingProfile('stale-while-revalidate'),
      ]);

      if (!isMounted) {
        return;
      }

      setUserProfile(profile);
      setActiveRestrictionIds(effectiveProfile.restrictionIds ?? profile?.restrictionIds ?? []);
      setRestrictionSeverity(
        effectiveProfile.restrictionSeverity ?? profile?.restrictionSeverity ?? 'strict'
      );
    };

    void restoreRestrictions();

    return () => {
      isMounted = false;
    };
  }, [isSecondaryStageReady]);

  useEffect(() => {
    if (!isSecondaryStageReady) {
      return;
    }

    let isMounted = true;

    const restoreHistoryContext = async () => {
      const [historyEntries, confirmation] = await Promise.all([
        loadSessionScanHistory('stale-while-revalidate'),
        loadProductTrustConfirmation(barcode),
      ]);
      const matchingHistoryEntry =
        historyEntries.find((entry) => entry.barcode === barcode || entry.id === barcode) ??
        null;

      if (!isMounted) {
        return;
      }

      setHistoryEntry(matchingHistoryEntry);
      setTrustConfirmation(confirmation);
    };

    const unsubscribe = subscribeScanHistoryChanges(() => {
      void restoreHistoryContext();
    });

    void restoreHistoryContext();

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [barcode, isSecondaryStageReady]);

  useEffect(() => {
    if (!isSecondaryStageReady) {
      return;
    }

    let isMounted = true;

    const restoreShareAccess = async () => {
      const entitlement = await loadSessionPremiumEntitlement('stale-while-revalidate');
      const [quotaSnapshot, syncedShareCardStyleId] = await Promise.all([
        loadFeatureQuotaSnapshot('share-result-card', entitlement),
        syncShareCardStyleForCurrentUser(),
      ]);

      if (!isMounted) {
        return;
      }

      setPremiumEntitlement(entitlement);
      setShareQuotaSnapshot(quotaSnapshot);
      setShareCardStyleId(entitlement.isPremium ? syncedShareCardStyleId : 'classic');
      setDraftShareCardStyleId(
        entitlement.isPremium ? syncedShareCardStyleId : 'classic'
      );
    };

    const unsubscribe = subscribePremiumSession((entitlement) => {
      setPremiumEntitlement(entitlement);
      if (!isMounted) {
        return;
      }

      if (!entitlement.isPremium) {
        setShareCardStyleId('classic');
        setDraftShareCardStyleId('classic');
      }

      void loadFeatureQuotaSnapshot('share-result-card', entitlement).then((quotaSnapshot) => {
        if (isMounted) {
          setShareQuotaSnapshot(quotaSnapshot);
        }
      });
    });
    void restoreShareAccess();

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [isSecondaryStageReady]);

  useEffect(() => {
    if (!isSecondaryStageReady) {
      return;
    }

    let isMounted = true;

    const restoreAdminConfig = async () => {
      const config = await loadAdminAppConfig();

      if (!isMounted) {
        return;
      }

      setAdminConfig({
        enableRuleBasedSuggestions: config.enableRuleBasedSuggestions,
        resultDisclaimer: config.resultDisclaimer,
        shareFooterText: config.shareFooterText,
      });
    };

    void restoreAdminConfig();

    return () => {
      isMounted = false;
    };
  }, [isSecondaryStageReady]);

  useEffect(() => {
    setAnalysisResult(null);
    setSelectedIngredient(null);

    // Heavy ingredient parsing and score synthesis run after the first frame so
    // the product screen can paint quickly on slower Android devices.
    const interactionHandle = InteractionManager.runAfterInteractions(() => {
      setAnalysisResult(buildResultAnalysis(product, selectedProfileId));
    });

    return () => {
      interactionHandle.cancel();
    };
  }, [product, selectedProfileId]);

  useEffect(() => {
    if (!analysisResult) {
      return;
    }

    measurePerformanceTrace('result-open', 'result-analysis-complete', {
      barcode,
    });
  }, [analysisResult, barcode]);

  useEffect(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  useEffect(() => {
    if (persistToHistory === false || !hasResolvedProfile) {
      return;
    }

    let isMounted = true;
    const interactionHandle = InteractionManager.runAfterInteractions(() => {
      void (async () => {
        try {
          const nextEntry = await saveScanToHistory({
            barcode,
            barcodeType,
            profileId: selectedProfileId,
            product,
          });

          if (isMounted) {
            setHistoryEntry(nextEntry);
          }
        } catch (error) {
          if (__DEV__ && isMounted) {
            console.warn('Failed to save scan history entry', error);
          }
        }
      })();
    });

    return () => {
      isMounted = false;
      interactionHandle.cancel();
    };
  }, [
    barcode,
    barcodeType,
    hasResolvedProfile,
    persistToHistory,
    product,
    selectedProfileId,
  ]);

  const updateShareCardImageReady = (ready: boolean) => {
    shareCardImageReadyRef.current = ready;
    setShareCardImageReady(ready);
  };

  const handleOpenSharePicker = () => {
    if (!shareableResult || isSharing) {
      return;
    }

    setDraftShareCardStyleId(premiumEntitlement.isPremium ? shareCardStyleId : 'classic');
    updateShareCardImageReady(!Boolean(shareableResult.imageUrl));
    setIsSharePickerVisible(true);
  };

  const handleSelectShareCardStyle = (styleId: ShareCardStyleId) => {
    if (!premiumEntitlement.isPremium && styleId !== 'classic') {
      return;
    }

    setDraftShareCardStyleId(styleId);
  };

  const waitForShareCardToRender = async (needsRemoteImage: boolean) => {
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    await new Promise((resolve) => setTimeout(resolve, 40));

    if (!needsRemoteImage) {
      return;
    }

    for (let attempt = 0; attempt < 15; attempt += 1) {
      if (shareCardImageReadyRef.current) {
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 80));
    }
  };

  const handleShareResult = async () => {
    if (!shareableResult || isSharing) {
      return;
    }

    const entitlement = premiumEntitlement;
    const selectedStyleId = entitlement.isPremium ? draftShareCardStyleId : 'classic';
    const quotaResult = await consumeFeatureQuota('share-result-card', entitlement);
    setShareQuotaSnapshot(quotaResult.snapshot);

    if (!quotaResult.allowed) {
      Alert.alert(
        t('Daily share limit reached'),
        t(
          'Basic includes 5 result-card exports per day. Premium adds unlimited sharing and five extra share-card styles.'
        ),
        [
          { style: 'cancel', text: t('Not now') },
          {
            text: t('View Premium'),
            onPress: () => navigation.navigate('Premium', { featureId: 'share-result-card' }),
          },
        ]
      );
      return;
    }

    if (!entitlement.isPremium && selectedStyleId !== 'classic') {
      setIsSharePickerVisible(false);
      navigation.navigate('Premium', { featureId: 'share-result-card' });
      return;
    }

    setIsSharing(true);
    setIsSharePickerVisible(false);
    setCaptureShareCardStyleId(selectedStyleId);
    setIsShareCaptureMounted(true);
    updateShareCardImageReady(!Boolean(shareableResult.imageUrl));

    try {
      if (entitlement.isPremium && selectedStyleId !== shareCardStyleId) {
        setShareCardStyleId(selectedStyleId);
        void saveShareCardStyleId(selectedStyleId).catch(() => {
          // Sharing should stay responsive even if preference sync lags.
        });
      }

      // Keep the off-screen capture surface unmounted until the user shares so
      // we do not hold a second large product image in memory during normal browsing.
      if (shareableResult.imageUrl) {
        await Image.prefetch(shareableResult.imageUrl);
      }

      await waitForShareCardToRender(Boolean(shareableResult.imageUrl));

      const imageUri = await shareCardRef.current?.capture?.();
      const shareMessage = buildShareableResultCaption(shareableResult);

      if (imageUri && (await Sharing.isAvailableAsync())) {
        try {
          await Sharing.shareAsync(imageUri, {
            dialogTitle: `Share ${shareableResult.productName}`,
            mimeType: 'image/png',
          });

          return;
        } catch (shareImageError) {
          if (__DEV__) {
            console.warn('Image share failed, falling back to text share', shareImageError);
          }
        }
      }

      await Share.share({
        message: shareMessage,
        title: shareableResult.productName,
      });
    } catch (error) {
      if (__DEV__) {
        console.warn('Failed to share result card', error);
      }

      Alert.alert(
        t('Share unavailable'),
        t('Could not open the share sheet right now. Please try again.')
      );
    } finally {
      updateShareCardImageReady(false);
      setIsShareCaptureMounted(false);
      setIsSharing(false);
    }
  };

  const handleSubmitCorrectionReport = async (
    reason: Parameters<typeof buildCorrectionReportSummary>[0]
  ) => {
    if (!analysisResult) {
      return;
    }

    setIsReportModalVisible(false);

    try {
      await submitCorrectionReport({
        barcode,
        confirmationCount:
          (trustConfirmation?.differentCount ?? 0) + (trustConfirmation?.matchCount ?? 0),
        confidence: analysisResult.confidence,
        foodStatus: analysisResult.foodStatus,
        priorityScore:
          product.adminMetadata?.adminPriorityScore ??
          (analysisResult.confidence === 'low' ? 90 : 55),
        productName: displayProductName,
        reason,
        repeatBuyWeight: historyEntry?.scanCount ?? 0,
        resultSource,
        summary: buildCorrectionReportSummary(reason, analysisResult.topConcern),
        timelineSeverity: timelinePreview[0]?.severity ?? null,
        topConcern: analysisResult.topConcern,
      });
      Alert.alert(
        t('Review request sent'),
        t('We queued this product for a manual trust check.')
      );
    } catch {
      Alert.alert(
        t('Could not send request'),
        t('Try again in a moment if this product still looks off.')
      );
    }
  };

  const handleTrustConfirmation = async (
    trustConfirmationType: 'looks-different' | 'matches-pack'
  ) => {
    if (!analysisResult || isSubmittingTrustConfirmation) {
      return;
    }

    setIsSubmittingTrustConfirmation(true);

    try {
      const nextConfirmation = await recordProductTrustConfirmation(
        barcode,
        trustConfirmationType
      );
      const confirmationCount =
        trustConfirmationType === 'looks-different'
          ? nextConfirmation.differentCount
          : nextConfirmation.matchCount;

      setTrustConfirmation(nextConfirmation);

      await submitTrustConfirmation({
        barcode,
        confirmationCount,
        confidence: analysisResult.confidence,
        foodStatus: analysisResult.foodStatus,
        productName: displayProductName,
        repeatBuyWeight: historyEntry?.scanCount ?? 0,
        resultSource,
        timelineSeverity: timelinePreview[0]?.severity ?? null,
        topConcern: analysisResult.topConcern,
        trustConfirmationType,
      });

      Alert.alert(
        t('Thanks for the check'),
        trustConfirmationType === 'looks-different'
          ? t('We flagged this product for a closer review.')
          : t('We saved your pack confirmation for future trust checks.')
      );
    } catch {
      Alert.alert(
        t('Could not save that right now'),
        t('Try again in a moment if this pack still needs a review.')
      );
    } finally {
      setIsSubmittingTrustConfirmation(false);
    }
  };

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: Math.max(insets.bottom + 136, 160) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {voiceVerdictText ? (
          <View
            accessible={true}
            accessibilityLiveRegion="assertive"
            accessibilityLabel={voiceVerdictText}
            style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}
          />
        ) : null}
        {shareableResult && (isSharePickerVisible || isShareCaptureMounted) ? (
          <View style={styles.hiddenShareCapture}>
            <View collapsable={false}>
              <ViewShot
                options={{
                  fileName: `scan-result-${barcode}`,
                  format: 'png',
                  quality: 1,
                  result: 'tmpfile',
                }}
                ref={shareCardRef}
                style={{ width: shareCardWidth }}
              >
                <ShareResultCard
                  data={shareableResult}
                  footerText={adminConfig?.shareFooterText ?? null}
                  onImageLoadEnd={() => updateShareCardImageReady(true)}
                  variantId={
                    isShareCaptureMounted ? captureShareCardStyleId : activeSharePreviewStyleId
                  }
                />
              </ViewShot>
            </View>
          </View>
        ) : null}

        <View style={styles.scoreHeroCard}>
          <View style={styles.scoreHeroHeaderRow}>
            {product?.imageUrl ? (
              <Image
                source={{ uri: product.imageUrl }}
                resizeMode="contain"
                style={styles.scoreHeroImage}
              />
            ) : null}
            <View style={styles.scoreHeroHeaderText}>
              <Text style={styles.scoreHeroProductName}>{displayProductName}</Text>
              <Text style={styles.scoreHeroSubtext}>
                {[product?.brand, product?.quantity].filter(Boolean).join(' • ') ||
                  scanCompletionCopy.body}
              </Text>
              <View style={styles.scoreHeroMetaRow}>
                <StatusGlyphBadge status={statusGlyph} size="sm" />
                {confidence ? (
                  <View
                    style={[
                      styles.confidencePill,
                      {
                        backgroundColor: getConfidenceBackground(colors, confidence),
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.confidencePillText,
                        { color: getConfidenceTone(colors, confidence) },
                      ]}
                    >
                      {getConfidenceLabel(confidence, t)}
                    </Text>
                  </View>
                ) : null}
                {insights?.profileLabel ? (
                  <View style={styles.profileChip}>
                    <Text style={styles.profileChipText}>{insights.profileLabel}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          {!analysisResult ? (
            <ResultCardSkeleton />
          ) : insights && foodStatus !== 'non-food' && foodStatus !== 'unclear' ? (
            <>
              <FoodPurityMedallion
                score={insights.smartScore ?? 60}
                gradeLabel={insights.gradeLabel}
                novaGroup={product?.novaGroup}
                nutriScoreGrade={product?.nutriScore}
                additivesCount={product?.additiveCount ?? 0}
              />
              <View style={styles.scoreHeroMainRow}>
                <View
                  style={[
                    styles.scoreHeroBadge,
                    {
                      backgroundColor:
                        insights.smartScore === null
                          ? colors.surface
                          : healthScoreTheme.accent,
                      borderColor:
                        insights.smartScore === null
                          ? colors.border
                          : healthScoreTheme.accent,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.scoreHeroValue,
                      {
                        color:
                          insights.smartScore === null
                            ? colors.text
                            : colors.surface,
                      },
                    ]}
                  >
                    {insights.smartScore === null ? t('N/A') : insights.smartScore}
                  </Text>
                  <Text
                    style={[
                      styles.scoreHeroSuffix,
                      {
                        color:
                          insights.smartScore === null
                            ? colors.textMuted
                            : colors.surface,
                      },
                    ]}
                  >
                    /100
                  </Text>
                </View>

                <View style={styles.scoreHeroTextBlock}>
                  <Text
                    style={[
                      styles.scoreHeroGrade,
                      { color: gradeTone.color },
                    ]}
                  >
                    {t('Grade {grade} • {label}', {
                      grade: insights.gradeLabel,
                      label: healthScoreTheme.label,
                    })}
                  </Text>
                  <Text style={styles.scoreHeroVerdict}>{quickUseGuidance}</Text>
                  <Text style={styles.scoreHeroSummary}>
                    {decisionSummary || insights.summary}
                  </Text>
                  {confidence && confidenceReason ? (
                    <Text
                      style={[
                        styles.scoreHeroConfidence,
                        { color: getConfidenceTone(colors, confidence) },
                      ]}
                    >
                      {confidenceReason}
                    </Text>
                  ) : null}
                  {topConcern ? (
                    <Text style={styles.topConcernText}>
                      {t('Main issue: {topConcern}', { topConcern })}
                    </Text>
                  ) : null}
                </View>
              </View>

              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: healthScoreTheme.accent,
                      width: `${healthScoreTheme.progress}%`,
                    },
                  ]}
                />
              </View>

              {insights.cautions.length > 0 ? (
                <View style={styles.messageGroup}>
                  {insights.cautions.slice(0, 2).map((caution) => (
                    <Text key={caution} style={styles.cautionText}>
                      • {t(caution)}
                    </Text>
                  ))}
                </View>
              ) : insights.highlights.length > 0 ? (
                <View style={styles.messageGroup}>
                  {insights.highlights.slice(0, 2).map((highlight) => (
                    <Text key={highlight} style={styles.goodText}>
                      • {t(highlight)}
                    </Text>
                  ))}
                </View>
              ) : null}

              {confidence === 'low' ? (
                <View style={styles.trustBlock}>
                  <Text style={styles.disclaimerText}>{disclaimerText}</Text>
                </View>
              ) : null}
            </>
          ) : (
            <View style={styles.trustBlock}>
              <Text style={styles.scoreHeroVerdict}>{quickUseGuidance}</Text>
              <Text style={styles.scoreHeroSummary}>
                {confidenceReason || insights?.summary || t('We need clearer product details before scoring this.')}
              </Text>
              <Text style={styles.disclaimerText}>{disclaimerText}</Text>
            </View>
          )}
        </View>

        <ComponentErrorBoundary fallbackTitle={t('Household fit temporarily unavailable')}>
          {householdFit ? <HouseholdFitCard fit={householdFit} /> : null}
        </ComponentErrorBoundary>

        <View style={styles.infoCard}>
          <Text style={styles.label}>{t('Quick actions')}</Text>
          {product.adminMetadata?.reviewStatus &&
          product.adminMetadata.reviewStatus !== 'draft' ? (
            <View style={styles.reviewBadge}>
              <Text style={styles.reviewBadgeText}>
                {t(
                  product.adminMetadata.reviewBadgeCopy ||
                  (product.adminMetadata.reviewStatus === 'reviewed'
                    ? 'Reviewed by Inqoura'
                    : 'Improved by Inqoura')
                )}
              </Text>
            </View>
          ) : null}
          {product ? (
            <>
              {product.categories.length > 0 ? (
                <View style={styles.tagWrap}>
                  {product.categories.slice(0, 2).map((category) => (
                    <View key={category} style={styles.tagChip}>
                      <Text style={styles.tagText}>{category}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
              <View style={styles.savedActionRow}>
                <Pressable
                  onPress={() => navigation.navigate('Scanner')}
                  style={styles.savedActionChip}
                >
                  <Text style={styles.savedActionText}>{t('Scan another')}</Text>
                </Pressable>
                <Pressable
                  onPress={() => navigation.navigate('Scanner')}
                  style={styles.savedActionChip}
                >
                  <Text style={styles.savedActionText}>{t('⚔️ Duel Item')}</Text>
                </Pressable>
                <Pressable
                  onPress={() => setIsReportModalVisible(true)}
                  style={styles.savedActionChip}
                >
                  <Text style={styles.savedActionText}>{t('Report')}</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <Text style={styles.statusText}>{t('No product details yet.')}</Text>
          )}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.label}>{t('Trust check')}</Text>
          <Text style={styles.statusText}>
            {historyEntry?.scanCount && historyEntry.scanCount >= 2
              ? historyEntry.scanCount === 2
                ? t('You have scanned this before.')
                : t('You have scanned this {count} times.', {
                    count: historyEntry.scanCount,
                  })
              : t('Confirm whether this pack still matches what you are holding.')}
          </Text>
          <ComponentErrorBoundary fallbackTitle={t('Timeline temporarily unavailable')}>
            {timelinePreview.length > 0 ? (
              <ProductTimelineCard entries={timelinePreview} title={t('Changed since last buy')} />
            ) : (
              <Text style={styles.statusText}>{t('No meaningful pack changes seen yet.')}</Text>
            )}
          </ComponentErrorBoundary>
          <View style={styles.savedActionRow}>
            <Pressable
              disabled={isSubmittingTrustConfirmation}
              onPress={() => void handleTrustConfirmation('matches-pack')}
              style={styles.savedActionChip}
            >
              <Text style={styles.savedActionText}>{t('Matches pack today')}</Text>
            </Pressable>
            <Pressable
              disabled={isSubmittingTrustConfirmation}
              onPress={() => void handleTrustConfirmation('looks-different')}
              style={styles.savedActionChip}
            >
              <Text style={styles.savedActionText}>{t('Looks different today')}</Text>
            </Pressable>
          </View>
          {trustConfirmation ? (
            <Text style={styles.statusText}>
              {trustConfirmation.matchCount} match check
              {trustConfirmation.matchCount === 1 ? '' : 's'} •{' '}
              {trustConfirmation.differentCount} difference report
              {trustConfirmation.differentCount === 1 ? '' : 's'}
            </Text>
          ) : null}
        </View>

        {trustSnapshot && confidence === 'low' ? (
          <ResultTrustCard trust={trustSnapshot} />
        ) : null}

        <ComponentErrorBoundary fallbackTitle={t('Restrictions check temporarily unavailable')}>
          {restrictionSummary ? (
            <ProductRestrictionCard
              matches={restrictionAssessment.matches}
              selectedLabels={selectedRestrictionLabels}
              summary={restrictionSummary}
              tone={restrictionAssessment.tone}
            />
          ) : null}
        </ComponentErrorBoundary>

        <ComponentErrorBoundary fallbackTitle={t('Suggestions temporarily unavailable')}>
          {!analysisResult ? (
            <ResultCardSkeleton />
          ) : (
            <ProductSuggestionsCard suggestions={displayedSuggestions} />
          )}
        </ComponentErrorBoundary>

        {renderedPremiumGuidance ? (
          <PremiumGuidanceCard guidance={renderedPremiumGuidance} />
        ) : null}

        <View style={styles.infoCard}>
          <Text style={styles.label}>{t('What&apos;s inside')}</Text>
          {!ingredientAnalysis ? (
            <ResultCardSkeleton />
          ) : ingredientAnalysis.explainedIngredients.length > 0 ? (
            <>
              <IngredientConstellation
                ingredients={ingredientAnalysis.explainedIngredients.map((i) => ({
                  text: i.displayName,
                  isAllergen: i.risk === 'high-risk',
                  isAdditive: i.risk === 'caution',
                }))}
              />
              <View style={styles.ingredientWrap}>
                {ingredientAnalysis.explainedIngredients.map((ingredient) => (
                  <Pressable
                    key={ingredient.id}
                    accessibilityHint={t('Shows a short explanation for this ingredient')}
                    accessibilityRole="button"
                    onPress={() => setSelectedIngredient(ingredient)}
                    style={[
                      styles.ingredientRow,
                      {
                        backgroundColor: getIngredientToneBackground(colors, ingredient.risk),
                        borderColor: getIngredientToneColor(colors, ingredient.risk),
                      },
                    ]}
                  >
                    <View style={styles.ingredientRowTextBlock}>
                      <Text
                        style={[
                          styles.ingredientRowText,
                          {
                            color: getIngredientToneColor(colors, ingredient.risk),
                            fontWeight: ingredient.risk === 'safe' ? '600' : '700',
                          },
                        ]}
                      >
                        {ingredient.displayName}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.ingredientRiskBadge,
                        {
                          backgroundColor: getIngredientToneColor(colors, ingredient.risk),
                        },
                      ]}
                    >
                      <Text style={styles.ingredientRiskBadgeText}>
                        {getIngredientRiskLabel(t, ingredient.risk)}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.statusText}>
                {t('Tap any ingredient to learn more.')}
              </Text>
            </>
          ) : (
            <Text style={styles.statusText}>{t('No ingredient list available.')}</Text>
          )}

          {ingredientAnalysis?.highRiskIngredients.length ? (
            <Text style={styles.highRiskText}>
              {t('High-risk: {items}', {
                items: ingredientAnalysis.highRiskIngredients.join(', '),
              })}
            </Text>
          ) : null}

          {ingredientAnalysis?.cautionIngredients.length ? (
            <Text style={styles.cautionText}>
              {t('Caution: {items}', {
                items: ingredientAnalysis.cautionIngredients.join(', '),
              })}
            </Text>
          ) : product?.ingredientsText ? (
            <Text style={styles.safeText}>
              {t('Current rule set marks the listed ingredients as safe.')}
            </Text>
          ) : (
            <Text style={styles.statusText}>{t('No ingredient flags found.')}</Text>
          )}

          {product?.allergens.length ? (
            <Text style={styles.highRiskText}>
              {t('Allergens: {items}', { items: product.allergens.join(', ') })}
            </Text>
          ) : null}
          {product && product.additiveCount > 0 ? (
            <Text style={styles.statusText}>
              {t('Additives listed: {count}', { count: product.additiveCount })}
            </Text>
          ) : null}
        </View>
        {recipeText ? (
          <View style={styles.infoCard}>
            <Text style={styles.label}>{t('Recipe')}</Text>
            <Text style={styles.bodyText}>{recipeText}</Text>
          </View>
        ) : null}

        <View style={styles.infoCard}>
          <Text style={styles.label}>{t('Nutrition')}</Text>
          {!analysisResult ? (
            <ResultCardSkeleton compact />
          ) : insights?.metrics.length ? (
            <View style={styles.metricWrap}>
              {insights.metrics.map((metric) => (
                <MetricChip key={metric.label} metric={metric} />
              ))}
            </View>
          ) : (
            <Text style={styles.statusText}>{t('Nutrition details not available.')}</Text>
          )}

          {insights?.processingLabel ? (
            <Text style={styles.statusText}>
              {t('Processing level: {label}', { label: insights.processingLabel })}
            </Text>
          ) : null}

          {product?.nutriScore ? (
            <View style={styles.scoreRow}>
              <Text style={styles.statusText}>{t('Nutrition grade')}</Text>
              <View
                style={[
                  styles.gradeBadge,
                  {
                    backgroundColor: getOffScoreTone(product.nutriScore).backgroundColor,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.gradeText,
                    {
                      color: getOffScoreTone(product.nutriScore).color,
                    },
                  ]}
                >
                  {product.nutriScore}
                </Text>
              </View>
            </View>
          ) : null}

        {foodStatus === 'unclear' ? (
          <Text style={styles.statusText}>
            {t('This item needs clearer ingredient or nutrition details before we score it fully.')}
          </Text>
        ) : null}
      </View>

      <ComponentErrorBoundary fallbackTitle={t('Portion adjuster unavailable')}>
        <ServingSizeAdjuster nutrition={product?.nutrition} />
      </ComponentErrorBoundary>

      {environmentalInsight ? <EnvironmentalImpactCard insight={environmentalInsight} /> : null}

      </ScrollView>
      {shareableResult ? (
        <Pressable
          accessibilityLabel={t('Share result card')}
          accessibilityRole="button"
          disabled={isSharing}
          onPress={handleOpenSharePicker}
          style={({ pressed }) => [
            styles.floatingShareButton,
            { bottom: Math.max(insets.bottom + 96, 112) },
            isSharing && styles.floatingShareButtonDisabled,
            pressed && !isSharing && styles.floatingShareButtonPressed,
          ]}
        >
          <Ionicons
            color={colors.surface}
            name={
              isSharing
                ? 'hourglass-outline'
                : 'share-social-outline'
            }
            size={24}
          />
        </Pressable>
      ) : null}
      <IngredientExplanationModal
        dietProfileId={selectedProfileId}
        lookup={selectedIngredientExplanation}
        onClose={() => setSelectedIngredient(null)}
        restrictionIds={activeRestrictionIds}
        visible={selectedIngredient !== null}
      />
      <ReportProductIssueModal
        onClose={() => setIsReportModalVisible(false)}
        onSelectReason={(reason) => void handleSubmitCorrectionReport(reason)}
        visible={isReportModalVisible}
      />
      {shareableResult ? (
        <ShareCardPickerModal
          dailyLimitText={shareLimitText}
          footerText={adminConfig?.shareFooterText ?? null}
          isPremium={premiumEntitlement.isPremium}
          isSharing={isSharing}
          onClose={() => setIsSharePickerVisible(false)}
          onSelectStyle={handleSelectShareCardStyle}
          onShare={() => {
            void handleShareResult();
          }}
          onUpgrade={() => {
            setIsSharePickerVisible(false);
            navigation.navigate('Premium', { featureId: 'share-result-card' });
          }}
          selectedStyleId={premiumEntitlement.isPremium ? draftShareCardStyleId : 'classic'}
          shareData={shareableResult}
          styleDefinitions={SHARE_CARD_STYLE_DEFINITIONS}
          visible={isSharePickerVisible}
        />
      ) : null}
    </SafeAreaView>
  );
}
