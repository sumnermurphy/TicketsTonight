import { galleryExhibitions } from "../data/galleryCatalog";
import { galleryQuizArtworks } from "../data/galleryQuizArtworks";
import type { GalleryExhibition, GalleryLogEntry, GalleryMedium } from "../types";
import {
  createGalleryWalkPlan,
  getDaysUntilGalleryCloses,
  getGalleryInventoryTrust,
  getGalleryVisitStatus,
  isGalleryOpeningTonight,
  type GalleryWalkMode,
  type GalleryWalkPlan
} from "./galleryDiscovery";
import type { GalleryWalkSession } from "./galleryWalkSession";

export type GalleryQuizResponse = "love" | "curious" | "not-for-me";

export type GalleryTasteSignalKind =
  | "medium"
  | "style"
  | "classification"
  | "subject"
  | "material"
  | "period"
  | "mood"
  | "neighborhood";

export type GalleryTasteSignal = {
  id: string;
  kind: GalleryTasteSignalKind;
  label: string;
  weight: number;
  matchedCount: number;
  source: "quiz" | "behavior" | "combined";
};

export type GalleryTastePassport = {
  version: 1;
  createdAt: string;
  updatedAt: string;
  completedQuizAt?: string;
  confidence: "empty" | "starter" | "learning";
  summary: string;
  signals: GalleryTasteSignal[];
  likedMediums: GalleryMedium[];
  avoidedMediums: GalleryMedium[];
  styleLabels: string[];
  subjectLabels: string[];
};

export type GalleryTasteFeedbackKind = "more-like-this" | "less-like-this";

export type GalleryTasteFeedback = {
  exhibitionId: string;
  kind: GalleryTasteFeedbackKind;
  createdAt: string;
};

export type GalleryEditableTastePreference = {
  preferredMediums: GalleryMedium[];
  avoidedMediums: GalleryMedium[];
  preferredNeighborhoods: string[];
  preferredTags: string[];
};

export type GalleryQuizArtwork = {
  id: string;
  source: "artic";
  sourceArtworkId: number;
  title: string;
  artist: string;
  dateDisplay: string;
  imageUrl: string;
  sourceUrl: string;
  mediums: GalleryMedium[];
  styleTitles: string[];
  classificationTitles: string[];
  subjectTitles: string[];
  materialTitles: string[];
  periodLabels: string[];
  moodTags: string[];
};

export type GalleryQuizAnswer = {
  artworkId: string;
  response: GalleryQuizResponse;
  answeredAt: string;
};

export type GalleryPersonalizedPick = {
  exhibition: GalleryExhibition;
  score: number;
  reasons: string[];
  matchedSignals: GalleryTasteSignal[];
  trustLabel: string;
};

export type GalleryPassportBadge = {
  id: string;
  label: string;
  description: string;
  earnedAt: string;
  earnedFromSessionId?: string;
};

export type GalleryPassportStamp = {
  id: string;
  label: string;
  neighborhood: string;
  earnedAt: string;
};

export type GalleryQuest = {
  id: string;
  title: string;
  description: string;
  progressCount: number;
  targetCount: number;
  completed: boolean;
  market: GalleryExhibition["areaId"];
  reason: string;
};

export type GallerySavedAlertSignals = {
  artists?: string[];
  galleries?: string[];
  neighborhoods?: string[];
  mediums?: GalleryMedium[];
};

export type CreatePersonalizedGalleryWalkPlanInput = {
  areaId: GalleryExhibition["areaId"];
  passport: GalleryTastePassport;
  neighborhood?: string;
  savedIds?: string[];
  referenceNow?: string;
  exhibitions?: GalleryExhibition[];
  timeBudgetMinutes?: number;
  feedback?: GalleryTasteFeedback[];
  preferences?: GalleryEditableTastePreference;
};

export type GalleryConciergeContext = {
  feedback?: GalleryTasteFeedback[];
  preferences?: GalleryEditableTastePreference;
  logEntries?: GalleryLogEntry[];
  activeRouteStopIds?: string[];
  sourceArtworkTitles?: string[];
};

const defaultNow = "2026-07-09T15:30:00-04:00";

const mediumLabels: Record<GalleryMedium, string> = {
  painting: "painting",
  photography: "photography",
  sculpture: "sculpture",
  installation: "installation",
  video: "video",
  performance: "performance",
  design: "design",
  prints: "prints",
  "mixed-media": "mixed media"
};

const responseWeights: Record<GalleryQuizResponse, number> = {
  love: 3,
  curious: 1.35,
  "not-for-me": -2
};

function normalizeSignal(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function signalId(kind: GalleryTasteSignalKind, label: string): string {
  return `${kind}:${normalizeSignal(label)}`;
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ");
}

function addSignal(
  map: Map<string, GalleryTasteSignal>,
  kind: GalleryTasteSignalKind,
  label: string,
  weight: number,
  source: GalleryTasteSignal["source"]
): void {
  const cleanLabel = label.trim();

  if (!cleanLabel || Number.isNaN(weight) || weight === 0) {
    return;
  }

  const id = signalId(kind, cleanLabel);
  const existing = map.get(id);

  if (existing) {
    map.set(id, {
      ...existing,
      weight: Number((existing.weight + weight).toFixed(3)),
      matchedCount: existing.matchedCount + 1,
      source: existing.source === source ? source : "combined"
    });
    return;
  }

  map.set(id, {
    id,
    kind,
    label: cleanLabel,
    weight: Number(weight.toFixed(3)),
    matchedCount: 1,
    source
  });
}

function buildPassportFromSignalMap(input: {
  signalMap: Map<string, GalleryTasteSignal>;
  now: string;
  createdAt?: string;
  completedQuizAt?: string;
}): GalleryTastePassport {
  const signals = Array.from(input.signalMap.values()).sort((left, right) => {
    const weightDelta = right.weight - left.weight;

    if (weightDelta !== 0) {
      return weightDelta;
    }

    return left.label.localeCompare(right.label);
  });
  const positiveSignals = signals.filter((signal) => signal.weight > 0);
  const mediumSignals = signals.filter((signal) => signal.kind === "medium");
  const likedMediums = mediumSignals
    .filter((signal) => signal.weight > 0)
    .map((signal) => normalizeSignal(signal.label) as GalleryMedium)
    .filter((medium): medium is GalleryMedium => medium in mediumLabels)
    .slice(0, 4);
  const avoidedMediums = mediumSignals
    .filter((signal) => signal.weight < 0)
    .map((signal) => normalizeSignal(signal.label) as GalleryMedium)
    .filter((medium): medium is GalleryMedium => medium in mediumLabels)
    .slice(0, 4);
  const styleLabels = positiveSignals
    .filter((signal) => signal.kind === "style" || signal.kind === "mood")
    .map((signal) => signal.label)
    .slice(0, 4);
  const subjectLabels = positiveSignals
    .filter((signal) => signal.kind === "subject" || signal.kind === "neighborhood")
    .map((signal) => signal.label)
    .slice(0, 4);
  const summaryParts = [
    likedMediums[0] ? `${mediumLabels[likedMediums[0]]}-leaning` : undefined,
    styleLabels[0],
    subjectLabels[0]
  ].filter(Boolean);

  return {
    version: 1,
    createdAt: input.createdAt ?? input.now,
    updatedAt: input.now,
    completedQuizAt: input.completedQuizAt,
    confidence:
      positiveSignals.length >= 8 ? "learning" : positiveSignals.length >= 3 ? "starter" : "empty",
    summary:
      summaryParts.length > 0
        ? summaryParts.join(" / ")
        : "Take the quiz to tune tonight's picks.",
    signals: signals.slice(0, 24),
    likedMediums,
    avoidedMediums,
    styleLabels,
    subjectLabels
  };
}

function addPreferenceSignals(
  signalMap: Map<string, GalleryTasteSignal>,
  preferences: GalleryEditableTastePreference | undefined
): void {
  if (!preferences) {
    return;
  }

  for (const medium of preferences.preferredMediums) {
    addSignal(signalMap, "medium", medium, 2.8, "behavior");
  }

  for (const medium of preferences.avoidedMediums) {
    addSignal(signalMap, "medium", medium, -2.8, "behavior");
  }

  for (const neighborhood of preferences.preferredNeighborhoods) {
    addSignal(signalMap, "neighborhood", neighborhood, 1.8, "behavior");
  }

  for (const tag of preferences.preferredTags) {
    addSignal(signalMap, "mood", tag, 1.5, "behavior");
  }
}

function addArtworkSignals(
  signalMap: Map<string, GalleryTasteSignal>,
  artwork: GalleryQuizArtwork,
  weight: number
): void {
  for (const medium of artwork.mediums) {
    addSignal(signalMap, "medium", medium, weight * 1.6, "quiz");
  }

  for (const label of artwork.styleTitles) {
    addSignal(signalMap, "style", label, weight, "quiz");
  }

  for (const label of artwork.classificationTitles) {
    addSignal(signalMap, "classification", label, weight * 0.8, "quiz");
  }

  for (const label of artwork.subjectTitles.slice(0, 5)) {
    addSignal(signalMap, "subject", label, weight * 0.7, "quiz");
  }

  for (const label of artwork.materialTitles.slice(0, 4)) {
    addSignal(signalMap, "material", label, weight * 0.45, "quiz");
  }

  for (const label of artwork.periodLabels) {
    addSignal(signalMap, "period", label, weight * 0.55, "quiz");
  }

  for (const label of artwork.moodTags) {
    addSignal(signalMap, "mood", label, weight * 0.9, "quiz");
  }
}

export function deriveTastePassportFromQuiz(
  answers: GalleryQuizAnswer[],
  artworks: GalleryQuizArtwork[] = galleryQuizArtworks,
  now: string = defaultNow
): GalleryTastePassport {
  const artworkById = new Map(artworks.map((artwork) => [artwork.id, artwork]));
  const signalMap = new Map<string, GalleryTasteSignal>();

  for (const answer of answers) {
    const artwork = artworkById.get(answer.artworkId);

    if (artwork) {
      addArtworkSignals(signalMap, artwork, responseWeights[answer.response]);
    }
  }

  return buildPassportFromSignalMap({
    signalMap,
    now,
    completedQuizAt: answers.length > 0 ? answers[answers.length - 1]?.answeredAt : undefined
  });
}

function getExhibitionHaystack(exhibition: GalleryExhibition): string {
  return normalizeText(
    [
      exhibition.title,
      exhibition.galleryName,
      exhibition.neighborhood,
      exhibition.artists.join(" "),
      exhibition.mediums.join(" "),
      exhibition.description,
      exhibition.whyGoSignals.join(" ")
    ].join(" ")
  );
}

function getBehaviorWeight(status: GalleryLogEntry["status"]): number {
  if (status === "visited") {
    return 2.6;
  }

  if (status === "saved" || status === "want-to-see") {
    return 1.4;
  }

  return -1.7;
}

export function deriveTastePassportFromBehavior(
  logEntries: GalleryLogEntry[] = [],
  completedWalks: GalleryWalkSession[] = [],
  savedAlerts: GallerySavedAlertSignals = {},
  exhibitions: GalleryExhibition[] = galleryExhibitions,
  now: string = defaultNow
): GalleryTastePassport {
  const exhibitionById = new Map(exhibitions.map((exhibition) => [exhibition.id, exhibition]));
  const signalMap = new Map<string, GalleryTasteSignal>();

  for (const entry of logEntries) {
    const exhibition = exhibitionById.get(entry.exhibitionId);

    if (!exhibition) {
      continue;
    }

    const weight = getBehaviorWeight(entry.status);

    for (const medium of exhibition.mediums) {
      addSignal(signalMap, "medium", medium, weight * 1.4, "behavior");
    }

    addSignal(signalMap, "neighborhood", exhibition.neighborhood, weight * 0.8, "behavior");

    for (const signal of exhibition.whyGoSignals.slice(0, 4)) {
      addSignal(signalMap, "mood", signal, weight * 0.5, "behavior");
    }
  }

  for (const session of completedWalks.filter((walk) => walk.status === "completed")) {
    for (const stopId of session.visitedStopIds) {
      const exhibition = exhibitionById.get(stopId);

      if (!exhibition) {
        continue;
      }

      for (const medium of exhibition.mediums) {
        addSignal(signalMap, "medium", medium, 0.9, "behavior");
      }

      addSignal(signalMap, "neighborhood", exhibition.neighborhood, 0.8, "behavior");
    }
  }

  for (const medium of savedAlerts.mediums ?? []) {
    addSignal(signalMap, "medium", medium, 1, "behavior");
  }

  for (const neighborhood of savedAlerts.neighborhoods ?? []) {
    addSignal(signalMap, "neighborhood", neighborhood, 0.8, "behavior");
  }

  return buildPassportFromSignalMap({ signalMap, now });
}

export function mergeGalleryTastePassports(
  quizPassport: GalleryTastePassport,
  behaviorPassport?: GalleryTastePassport,
  now: string = defaultNow,
  preferences?: GalleryEditableTastePreference
): GalleryTastePassport {
  if (!behaviorPassport || behaviorPassport.signals.length === 0) {
    if (preferences) {
      const signalMap = new Map<string, GalleryTasteSignal>();

      for (const signal of quizPassport.signals) {
        addSignal(signalMap, signal.kind, signal.label, signal.weight, signal.source);
      }

      addPreferenceSignals(signalMap, preferences);

      return buildPassportFromSignalMap({
        signalMap,
        now,
        createdAt: quizPassport.createdAt,
        completedQuizAt: quizPassport.completedQuizAt
      });
    }

    return quizPassport;
  }

  const signalMap = new Map<string, GalleryTasteSignal>();

  for (const signal of [...quizPassport.signals, ...behaviorPassport.signals]) {
    addSignal(signalMap, signal.kind, signal.label, signal.weight, signal.source);
  }

  addPreferenceSignals(signalMap, preferences);

  return buildPassportFromSignalMap({
    signalMap,
    now,
    createdAt: quizPassport.createdAt,
    completedQuizAt: quizPassport.completedQuizAt
  });
}

export function applyGalleryTasteFeedback(
  passport: GalleryTastePassport,
  feedback: GalleryTasteFeedback[],
  exhibitions: GalleryExhibition[] = galleryExhibitions,
  now: string = defaultNow
): GalleryTastePassport {
  if (feedback.length === 0) {
    return passport;
  }

  const signalMap = new Map<string, GalleryTasteSignal>();
  const exhibitionById = new Map(exhibitions.map((exhibition) => [exhibition.id, exhibition]));

  for (const signal of passport.signals) {
    addSignal(signalMap, signal.kind, signal.label, signal.weight, signal.source);
  }

  for (const item of feedback) {
    const exhibition = exhibitionById.get(item.exhibitionId);
    const weight = item.kind === "more-like-this" ? 2.2 : -2.2;

    if (!exhibition) {
      continue;
    }

    for (const medium of exhibition.mediums) {
      addSignal(signalMap, "medium", medium, weight * 1.4, "behavior");
    }

    addSignal(signalMap, "neighborhood", exhibition.neighborhood, weight * 0.7, "behavior");

    for (const signal of exhibition.whyGoSignals.slice(0, 4)) {
      addSignal(signalMap, "mood", signal, weight * 0.6, "behavior");
    }
  }

  return buildPassportFromSignalMap({
    signalMap,
    now,
    createdAt: passport.createdAt,
    completedQuizAt: passport.completedQuizAt
  });
}

function getSignalMatchScore(exhibition: GalleryExhibition, passport: GalleryTastePassport): {
  score: number;
  matchedSignals: GalleryTasteSignal[];
} {
  const haystack = getExhibitionHaystack(exhibition);
  const matchedSignals: GalleryTasteSignal[] = [];
  let score = 0;

  for (const signal of passport.signals) {
    const normalizedLabel = normalizeSignal(signal.label);
    let matches = false;

    if (signal.kind === "medium") {
      matches = exhibition.mediums.some((medium) => normalizeSignal(medium) === normalizedLabel);
    } else {
      matches = haystack.includes(normalizeText(signal.label));
    }

    if (!matches) {
      continue;
    }

    matchedSignals.push(signal);
    score += signal.kind === "medium" ? signal.weight * 14 : signal.weight * 4;
  }

  return { score, matchedSignals };
}

function getPickReasons(
  exhibition: GalleryExhibition,
  matchedSignals: GalleryTasteSignal[],
  referenceNow: string,
  context: GalleryConciergeContext = {}
): string[] {
  const trust = getGalleryInventoryTrust(exhibition);
  const status = getGalleryVisitStatus(exhibition, referenceNow);
  const reasons: string[] = [];
  const mediumMatch = matchedSignals.find(
    (signal) => signal.kind === "medium" && signal.weight > 0
  );
  const styleMatch = matchedSignals.find(
    (signal) => signal.kind !== "medium" && signal.weight > 0
  );

  if (mediumMatch) {
    reasons.push(`Matches your ${mediumMatch.label.replace("-", " ")} taste`);
  } else if (styleMatch) {
    reasons.push(`Matches ${styleMatch.label}`);
  }

  const positiveFeedback = context.feedback?.some(
    (item) => item.exhibitionId === exhibition.id && item.kind === "more-like-this"
  );
  const negativeFeedback = context.feedback?.some(
    (item) => item.exhibitionId === exhibition.id && item.kind === "less-like-this"
  );

  if (positiveFeedback) {
    reasons.push("You asked for more like this");
  }

  if (negativeFeedback) {
    reasons.push("Tuned down by you");
  }

  if (context.activeRouteStopIds?.includes(exhibition.id)) {
    reasons.push("Already in your walk");
  }

  if (context.preferences?.preferredNeighborhoods.includes(exhibition.neighborhood)) {
    reasons.push(`Near your ${exhibition.neighborhood} preference`);
  }

  if (status === "open-now") {
    reasons.push("Open now");
  }

  if (isGalleryOpeningTonight(exhibition, referenceNow)) {
    reasons.push("Opening tonight");
  }

  if (getDaysUntilGalleryCloses(exhibition, referenceNow) <= 7) {
    reasons.push("Closing soon");
  }

  if (trust.isVerified) {
    reasons.push("Verified official source");
  } else if (trust.isFixture) {
    reasons.push("Fixture/demo");
  }

  return Array.from(new Set(reasons)).slice(0, 4);
}

export function getGalleryConciergeReasons(
  exhibition: GalleryExhibition,
  passport: GalleryTastePassport,
  referenceNow: string = defaultNow,
  context: GalleryConciergeContext = {}
): string[] {
  const { matchedSignals } = getSignalMatchScore(exhibition, passport);

  return getPickReasons(exhibition, matchedSignals, referenceNow, context);
}

export function rankGalleryExhibitionsForTaste(
  exhibitions: GalleryExhibition[],
  passport: GalleryTastePassport,
  referenceNow: string = defaultNow,
  context: GalleryConciergeContext = {}
): GalleryPersonalizedPick[] {
  const feedbackById = new Map((context.feedback ?? []).map((item) => [item.exhibitionId, item]));
  const logEntryById = new Map((context.logEntries ?? []).map((entry) => [entry.exhibitionId, entry]));

  return exhibitions
    .map((exhibition): GalleryPersonalizedPick => {
      const trust = getGalleryInventoryTrust(exhibition);
      const status = getGalleryVisitStatus(exhibition, referenceNow);
      const { score: signalScore, matchedSignals } = getSignalMatchScore(exhibition, passport);
      const avoidedPenalty = exhibition.mediums.some((medium) => passport.avoidedMediums.includes(medium))
        ? -24
        : 0;
      const trustScore = trust.isVerified ? 34 : trust.kind === "partner-submitted" ? 16 : trust.isFixture ? -16 : -8;
      const statusScore = status === "open-now" ? 14 : status === "opens-later" ? 8 : -18;
      const eventScore = isGalleryOpeningTonight(exhibition, referenceNow) ? 10 : 0;
      const lastChanceScore =
        getDaysUntilGalleryCloses(exhibition, referenceNow) <= 7 ? 7 : 0;
      const distanceScore = Math.max(0, 8 - exhibition.distanceMiles * 5);
      const feedback = feedbackById.get(exhibition.id);
      const feedbackScore =
        feedback?.kind === "more-like-this" ? 34 : feedback?.kind === "less-like-this" ? -42 : 0;
      const logStatus = logEntryById.get(exhibition.id)?.status;
      const behaviorScore =
        logStatus === "visited"
          ? 10
          : logStatus === "saved" || logStatus === "want-to-see"
            ? 8
            : logStatus === "skipped"
              ? -28
              : 0;
      const preferenceScore =
        (context.preferences?.preferredNeighborhoods.includes(exhibition.neighborhood) ? 10 : 0) +
        exhibition.mediums.reduce((score, medium) => {
          if (context.preferences?.preferredMediums.includes(medium)) {
            return score + 12;
          }

          if (context.preferences?.avoidedMediums.includes(medium)) {
            return score - 22;
          }

          return score;
        }, 0);
      const score = Number(
        (
          signalScore +
          avoidedPenalty +
          trustScore +
          statusScore +
          eventScore +
          lastChanceScore +
          distanceScore +
          feedbackScore +
          behaviorScore +
          preferenceScore
        ).toFixed(3)
      );

      return {
        exhibition,
        score,
        reasons: getPickReasons(exhibition, matchedSignals, referenceNow, context),
        matchedSignals,
        trustLabel: trust.label
      };
    })
    .sort((left, right) => {
      const scoreDelta = right.score - left.score;

      if (scoreDelta !== 0) {
        return scoreDelta;
      }

      const trustDelta =
        Number(getGalleryInventoryTrust(right.exhibition).isVerified) -
        Number(getGalleryInventoryTrust(left.exhibition).isVerified);

      if (trustDelta !== 0) {
        return trustDelta;
      }

      return left.exhibition.distanceMiles - right.exhibition.distanceMiles;
    });
}

export function createPersonalizedGalleryWalkPlan(
  input: CreatePersonalizedGalleryWalkPlanInput
): GalleryWalkPlan {
  const sourceExhibitions = input.exhibitions ?? galleryExhibitions;
  const rankedPicks = rankGalleryExhibitionsForTaste(
    sourceExhibitions,
    input.passport,
    input.referenceNow,
    {
      feedback: input.feedback,
      preferences: input.preferences
    }
  );
  const rankedExhibitions = rankedPicks.map((pick) => pick.exhibition);
  const personalizedScores = rankedPicks.reduce<Record<string, number>>((scores, pick) => {
    scores[pick.exhibition.id] = pick.score;

    return scores;
  }, {});
  const personalizedReasons = rankedPicks.reduce<Record<string, string[]>>((reasons, pick) => {
    reasons[pick.exhibition.id] = pick.reasons;

    return reasons;
  }, {});

  return createGalleryWalkPlan({
    areaId: input.areaId,
    mode: "for-you" as GalleryWalkMode,
    neighborhood: input.neighborhood,
    savedIds: input.savedIds,
    referenceNow: input.referenceNow,
    exhibitions: rankedExhibitions,
    timeBudgetMinutes: input.timeBudgetMinutes,
    personalizedScores,
    personalizedReasons
  });
}

function getCompletedWalkExhibitions(
  completedWalks: GalleryWalkSession[],
  exhibitions: GalleryExhibition[]
): GalleryExhibition[] {
  const exhibitionById = new Map(exhibitions.map((exhibition) => [exhibition.id, exhibition]));

  return completedWalks
    .filter((session) => session.status === "completed")
    .flatMap((session) => session.visitedStopIds)
    .map((stopId) => exhibitionById.get(stopId))
    .filter((exhibition): exhibition is GalleryExhibition => Boolean(exhibition));
}

export function getGalleryPassportBadges(
  completedWalks: GalleryWalkSession[] = [],
  logEntries: GalleryLogEntry[] = [],
  exhibitions: GalleryExhibition[] = galleryExhibitions,
  referenceNow: string = defaultNow
): GalleryPassportBadge[] {
  const badges: GalleryPassportBadge[] = [];
  const completedSessions = completedWalks.filter((session) => session.status === "completed");
  const visitedWalkExhibitions = getCompletedWalkExhibitions(completedSessions, exhibitions);
  const exhibitionById = new Map(exhibitions.map((exhibition) => [exhibition.id, exhibition]));
  const positiveLogExhibitions = logEntries
    .filter((entry) => entry.status === "visited" || entry.status === "saved" || entry.status === "want-to-see")
    .map((entry) => exhibitionById.get(entry.exhibitionId))
    .filter((exhibition): exhibition is GalleryExhibition => Boolean(exhibition));
  const positiveExhibitions = [...visitedWalkExhibitions, ...positiveLogExhibitions];
  const earnedAt = completedSessions[completedSessions.length - 1]?.completedAt ?? referenceNow;
  const sourceSessionId = completedSessions[completedSessions.length - 1]?.id;

  function award(id: string, label: string, description: string): void {
    badges.push({ id, label, description, earnedAt, earnedFromSessionId: sourceSessionId });
  }

  if (completedSessions.length > 0) {
    award("first-walk", "First Walk", "Completed a gallery walk.");
  }

  if (completedSessions.some((session) => session.neighborhood === "Chelsea")) {
    award("chelsea-loop", "Chelsea Loop", "Completed a Chelsea walk.");
  }

  if (completedSessions.some((session) => session.mode === "opening-night")) {
    award("opening-night", "Opening Night", "Finished an opening-night route.");
  }

  if (
    completedSessions.some((session) => session.mode === "last-chance") ||
    positiveExhibitions.some((exhibition) => getDaysUntilGalleryCloses(exhibition, referenceNow) <= 7)
  ) {
    award("last-chance", "Last Chance", "Prioritized a show near the end of its run.");
  }

  if (positiveExhibitions.filter((exhibition) => exhibition.mediums.includes("photography")).length >= 2) {
    award("photo-eye", "Photo Eye", "Saved or visited two photography-led shows.");
  }

  if (positiveExhibitions.filter((exhibition) => exhibition.mediums.includes("sculpture")).length >= 2) {
    award("sculpture-run", "Sculpture Run", "Built a pattern around sculpture.");
  }

  if (positiveExhibitions.filter((exhibition) => getGalleryInventoryTrust(exhibition).isVerified).length >= 2) {
    award("verified-explorer", "Verified Explorer", "Visited or saved two official-source shows.");
  }

  return badges;
}

export function getGalleryPassportStamps(
  completedWalks: GalleryWalkSession[] = []
): GalleryPassportStamp[] {
  return completedWalks
    .filter((session) => session.status === "completed" && session.neighborhood)
    .map((session) => ({
      id: `${session.areaId}:${session.neighborhood}`,
      label: `${session.neighborhood} stamp`,
      neighborhood: session.neighborhood ?? "Gallery district",
      earnedAt: session.completedAt ?? session.updatedAt
    }))
    .filter(
      (stamp, index, stamps) => stamps.findIndex((candidate) => candidate.id === stamp.id) === index
    );
}

export function createGalleryQuests(input: {
  areaId: GalleryExhibition["areaId"];
  exhibitions?: GalleryExhibition[];
  logEntries?: GalleryLogEntry[];
  passport?: GalleryTastePassport;
  completedWalks?: GalleryWalkSession[];
  referenceNow?: string;
}): GalleryQuest[] {
  const exhibitions = input.exhibitions ?? galleryExhibitions;
  const logEntries = input.logEntries ?? [];
  const completedWalks = input.completedWalks ?? [];
  const referenceNow = input.referenceNow ?? defaultNow;
  const marketExhibitions = exhibitions.filter((exhibition) => exhibition.areaId === input.areaId);
  const exhibitionById = new Map(exhibitions.map((exhibition) => [exhibition.id, exhibition]));
  const visitedExhibitions = logEntries
    .filter((entry) => entry.status === "visited")
    .map((entry) => exhibitionById.get(entry.exhibitionId))
    .filter((exhibition): exhibition is GalleryExhibition => Boolean(exhibition));
  const completedMarketWalks = completedWalks.filter(
    (session) => session.status === "completed" && session.areaId === input.areaId
  );
  const targetNeighborhood = input.areaId === "hudson" ? "Warren Street" : "Chelsea";
  const verifiedTarget = marketExhibitions.filter(
    (exhibition) =>
      exhibition.neighborhood === targetNeighborhood && getGalleryInventoryTrust(exhibition).isVerified
  );
  const verifiedVisitedCount = visitedExhibitions.filter(
    (exhibition) =>
      exhibition.neighborhood === targetNeighborhood && getGalleryInventoryTrust(exhibition).isVerified
  ).length;
  const openingVisitedCount = visitedExhibitions.filter((exhibition) =>
    isGalleryOpeningTonight(exhibition, referenceNow)
  ).length;
  const lastChanceVisitedCount = visitedExhibitions.filter(
    (exhibition) => getDaysUntilGalleryCloses(exhibition, referenceNow) <= 7
  ).length;
  const preferredMediums = input.passport?.likedMediums ?? [];
  const outsideTasteVisitedCount =
    preferredMediums.length === 0
      ? 0
      : visitedExhibitions.filter(
          (exhibition) => !exhibition.mediums.some((medium) => preferredMediums.includes(medium))
        ).length;

  return [
    {
      id: `verified-${targetNeighborhood.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      title:
        input.areaId === "hudson"
          ? "Complete a Warren Street walk"
          : "See 2 verified shows in Chelsea",
      description:
        verifiedTarget.length >= 2
          ? `Use official-source listings in ${targetNeighborhood}.`
          : `${targetNeighborhood} is thinner today; count one official-source stop honestly.`,
      progressCount: Math.min(verifiedVisitedCount, Math.min(2, Math.max(1, verifiedTarget.length))),
      targetCount: Math.min(2, Math.max(1, verifiedTarget.length)),
      completed: verifiedVisitedCount >= Math.min(2, Math.max(1, verifiedTarget.length)),
      market: input.areaId,
      reason: "Anchors personalization in verified inventory."
    },
    {
      id: "opening-and-last-chance",
      title: "Opening plus last chance",
      description: "Visit one opening signal and one show near closing.",
      progressCount: Math.min(2, Number(openingVisitedCount > 0) + Number(lastChanceVisitedCount > 0)),
      targetCount: 2,
      completed: openingVisitedCount > 0 && lastChanceVisitedCount > 0,
      market: input.areaId,
      reason: "Balances social energy with urgency."
    },
    {
      id: "outside-your-lane",
      title: "Try one outside your taste",
      description:
        preferredMediums.length > 0
          ? `Step outside ${preferredMediums.map((medium) => mediumLabels[medium]).join(", ")}.`
          : "Take the quiz, then try a show outside your top medium.",
      progressCount: Math.min(1, outsideTasteVisitedCount),
      targetCount: 1,
      completed: outsideTasteVisitedCount > 0,
      market: input.areaId,
      reason: "Keeps the app from becoming a filter bubble."
    },
    {
      id: "complete-market-walk",
      title:
        input.areaId === "hudson"
          ? "Finish a small-market walk"
          : `Finish a ${input.areaId === "la" ? "LA" : "NYC"} personalized walk`,
      description: "Start and complete any walk in this market.",
      progressCount: Math.min(1, completedMarketWalks.length),
      targetCount: 1,
      completed: completedMarketWalks.length > 0,
      market: input.areaId,
      reason: "Turns planning into real movement."
    }
  ];
}
