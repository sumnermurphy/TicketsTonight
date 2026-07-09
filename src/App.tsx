import { StatusBar } from "expo-status-bar";
import * as WebBrowser from "expo-web-browser";
import {
  BadgePercent,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  Heart,
  MapPin,
  Music2,
  Search,
  SlidersHorizontal,
  Sparkles,
  Ticket,
  X
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

import { areas, categoryLabels } from "./data/catalog";
import { GalleryApp } from "./GalleryApp";
import {
  createDealAlert,
  getDealAlertMatches,
  toggleDealAlertStatus
} from "./services/dealAlerts";
import {
  createCoverageAudit,
  getCoverageAuditActionCopy,
  getCoverageAuditStatusCopy
} from "./services/coverageAudit";
import {
  getCuratedDiscoveryResult,
  getDiscoverySeriesSummaryCopy
} from "./services/discoveryCuration";
import {
  getDateWindowFacets,
  getCategoryFacets,
  getMarketDiscoverySummary,
  getNeighborhoodFacets,
  type CategoryFacet,
  type DateWindowFacet,
  type MarketDiscoverySummary,
  type NeighborhoodFacet
} from "./services/discoveryFacets";
import { getDiscoveryFilterSummary } from "./services/discoveryFilterSummary";
import {
  getDealInsights,
  getDealSummary,
  getOfferSavings,
  type DealInsight
} from "./services/dealDiscovery";
import {
  getDiscoveryPicks,
  type DiscoveryPick
} from "./services/discoveryRanking";
import { getDiscoveryResultSections } from "./services/discoveryResultSections";
import {
  discoveryVisibleIncrement,
  getDiscoveryInventoryStatus,
  getDiscoveryResultCountCopy,
  getNextVisibleDiscoveryCount,
  getRemainingDiscoveryCount,
  initialDiscoveryVisibleCount
} from "./services/discoveryVisibility";
import {
  filterShows,
  getBestOffer,
  getRecommendedShowsFromCatalog,
  getShowById
} from "./services/eventCatalog";
import {
  eventProvider,
  readPublicDiscoveryConfig
} from "./services/eventProviderFactory";
import { findNearestArea, locationProvider } from "./services/location";
import {
  markNotificationRead,
  mergeNotifications,
  notificationProvider
} from "./services/notifications";
import { tasteProfileProvider } from "./services/personalization";
import { appRepository } from "./services/storage";
import {
  getBestTicketLinkIntent,
  getTicketLinkIntent,
  type TicketLinkIntent
} from "./services/ticketLinks";
import { colors, radii, shadows, spacing } from "./theme";
import type {
  Area,
  DateWindow,
  DealAlert,
  DealAlertMatch,
  DiscoverySortMode,
  InventorySource,
  MusicAccountConnection,
  NotificationMessage,
  OfferAccess,
  Recommendation,
  Show,
  ShowCategory,
  ShowSearchFilters,
  TicketOffer
} from "./types";
import { formatDistance, formatMoney, formatShowDate } from "./utils/format";

WebBrowser.maybeCompleteAuthSession();

const categories = Object.keys(categoryLabels) as ShowCategory[];
const dateWindowLabels: Record<DateWindow, string> = {
  all: "All",
  tonight: "Tonight",
  week: "This week",
  weekend: "Weekend"
};
const dateWindows = Object.keys(dateWindowLabels) as DateWindow[];
const sortModeLabels: Record<DiscoverySortMode, string> = {
  soonest: "Soonest",
  cheapest: "Cheapest",
  nearby: "Nearby"
};
const sortModes = Object.keys(sortModeLabels) as DiscoverySortMode[];
const ticketmasterConfigured = Boolean(
  readPublicDiscoveryConfig().ticketmasterApiKey?.trim()
);
const priceOptions: Array<{ label: string; value?: number }> = [
  { label: "Any price" },
  { label: "Under $35", value: 3500 },
  { label: "Under $50", value: 5000 },
  { label: "Under $75", value: 7500 }
];
const galleryWalkExperienceEnabled = Boolean("gallery-walk-v1");

const sourceLabels: Record<InventorySource, string> = {
  "calendar-feed": "Calendar",
  "venue-direct": "Venue direct",
  promoter: "Promoter",
  "partner-feed": "Partner feed",
  "primary-marketplace": "Primary",
  "verified-resale": "Verified resale"
};

const accessLabels: Record<OfferAccess, string> = {
  "mobile-entry": "Mobile entry",
  "will-call": "Will call",
  "external-transfer": "External transfer"
};

export default function App() {
  if (galleryWalkExperienceEnabled) {
    return <GalleryApp />;
  }

  const [selectedAreaId, setSelectedAreaId] = useState(areas[0]?.id ?? "nyc");
  const [query, setQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<ShowCategory[]>([]);
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>([]);
  const [dateWindow, setDateWindow] = useState<DateWindow>("all");
  const [discoverySortMode, setDiscoverySortMode] = useState<DiscoverySortMode>("soonest");
  const [onlyDeals, setOnlyDeals] = useState(false);
  const [maxPriceCents, setMaxPriceCents] = useState<number | undefined>();
  const [dealAlertMaxPriceCents, setDealAlertMaxPriceCents] = useState<number | undefined>();
  const [locationStatus, setLocationStatus] = useState("Manual area");
  const [locating, setLocating] = useState(false);
  const [areaMenuOpen, setAreaMenuOpen] = useState(false);
  const [selectedShow, setSelectedShow] = useState<Show | null>(null);
  const [tasteEnabled, setTasteEnabled] = useState(false);
  const [musicConnection, setMusicConnection] = useState<MusicAccountConnection | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [tasteLoading, setTasteLoading] = useState(false);
  const [tasteError, setTasteError] = useState<string | null>(null);
  const [visibleResultLimit, setVisibleResultLimit] = useState(initialDiscoveryVisibleCount);
  const [savedShowIds, setSavedShowIds] = useState<string[]>([]);
  const [dealAlerts, setDealAlerts] = useState<DealAlert[]>([]);
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);
  const [areaInventory, setAreaInventory] = useState<Show[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const selectedArea = areas.find((area) => area.id === selectedAreaId) ?? areas[0];

  useEffect(() => {
    let mounted = true;

    appRepository
      .loadPreferences()
      .then((preferences) => {
        if (!mounted) {
          return;
        }

        if (preferences) {
          setSelectedAreaId(preferences.selectedAreaId);
          setSelectedCategories(preferences.selectedCategories);
          setSelectedNeighborhoods(preferences.selectedNeighborhoods ?? []);
          setDateWindow(preferences.dateWindow ?? "all");
          setDiscoverySortMode(preferences.discoverySortMode ?? "soonest");
          setOnlyDeals(preferences.onlyDeals);
          setMaxPriceCents(preferences.maxPriceCents);
          setDealAlertMaxPriceCents(preferences.dealAlertMaxPriceCents);
          setTasteEnabled(preferences.tasteEnabled);
          setMusicConnection(preferences.musicConnection ?? null);
          setSavedShowIds(preferences.savedShowIds);
          setDealAlerts(preferences.dealAlerts ?? []);
          setNotifications(preferences.notifications ?? []);
          setLocationStatus(preferences.locationStatus);
        }
      })
      .finally(() => {
        if (mounted) {
          setHydrated(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    void appRepository.savePreferences({
      selectedAreaId,
      selectedCategories,
      selectedNeighborhoods,
      dateWindow,
      discoverySortMode,
      onlyDeals,
      maxPriceCents,
      dealAlertMaxPriceCents,
      tasteEnabled,
      savedShowIds,
      dealAlerts,
      notifications,
      userSession: null,
      musicConnection,
      locationStatus,
      updatedAt: new Date().toISOString()
    });
  }, [
    hydrated,
    dateWindow,
    dealAlertMaxPriceCents,
    dealAlerts,
    discoverySortMode,
    locationStatus,
    maxPriceCents,
    musicConnection,
    notifications,
    onlyDeals,
    savedShowIds,
    selectedAreaId,
    selectedCategories,
    selectedNeighborhoods,
    tasteEnabled
  ]);

  const discoveryFilters = useMemo<ShowSearchFilters>(
    () => ({
      areaId: selectedAreaId,
      categories: selectedCategories,
      neighborhoods: selectedNeighborhoods,
      query,
      onlyDeals,
      maxPriceCents,
      dateWindow,
      sortMode: discoverySortMode
    }),
    [
      dateWindow,
      discoverySortMode,
      maxPriceCents,
      onlyDeals,
      query,
      selectedAreaId,
      selectedCategories,
      selectedNeighborhoods
    ]
  );

  const areaInventoryFilters = useMemo<ShowSearchFilters>(
    () => ({
      areaId: selectedAreaId,
      categories: [],
      query: "",
      onlyDeals: false,
      dateWindow: "all",
      sortMode: "soonest"
    }),
    [selectedAreaId]
  );

  useEffect(() => {
    let mounted = true;

    setInventoryLoading(true);
    setInventoryError(null);

    eventProvider
      .listShows(areaInventoryFilters)
      .then((shows) => {
        if (mounted) {
          setAreaInventory(shows);
        }
      })
      .catch((error) => {
        if (mounted) {
          setAreaInventory([]);
          setInventoryError(
            error instanceof Error
              ? `${error.message}. Local fallback inventory may still be limited.`
              : "Provider refresh failed. Local fallback inventory may still be limited."
          );
        }
      })
      .finally(() => {
        if (mounted) {
          setInventoryLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [areaInventoryFilters]);

  useEffect(() => {
    setVisibleResultLimit(initialDiscoveryVisibleCount);
  }, [discoveryFilters]);

  const filteredDiscoveryShows = useMemo(
    () => filterShows(areaInventory, discoveryFilters),
    [areaInventory, discoveryFilters]
  );
  const curatedDiscoveryResult = useMemo(
    () =>
      getCuratedDiscoveryResult(filteredDiscoveryShows, {
        filters: discoveryFilters,
        visibleCount: visibleResultLimit,
        referenceNow: new Date().toISOString()
      }),
    [discoveryFilters, filteredDiscoveryShows, visibleResultLimit]
  );
  const visibleShows = curatedDiscoveryResult.shows;
  const remainingDiscoveryCount = useMemo(
    () => getRemainingDiscoveryCount(filteredDiscoveryShows.length, visibleShows.length),
    [filteredDiscoveryShows.length, visibleShows.length]
  );
  const discoveryResultCountCopy = useMemo(
    () =>
      getDiscoveryResultCountCopy({
        loading: inventoryLoading,
        totalCount: filteredDiscoveryShows.length,
        visibleCount: visibleShows.length,
        dateWindowLabel: dateWindowLabels[dateWindow]
      }),
    [dateWindow, filteredDiscoveryShows.length, inventoryLoading, visibleShows.length]
  );
  const discoveryInventoryStatus = useMemo(
    () =>
      getDiscoveryInventoryStatus({
        areaId: selectedAreaId,
        shows: areaInventory,
        ticketmasterConfigured,
        inventoryError
      }),
    [areaInventory, inventoryError, selectedAreaId]
  );
  const loadMoreCopy = `Show ${Math.min(
    discoveryVisibleIncrement,
    remainingDiscoveryCount
  )} more`;

  const dealAlertInventory = useMemo(
    () =>
      filterShows(areaInventory, {
        areaId: selectedAreaId,
        categories: [],
        query: "",
        onlyDeals: true,
        dateWindow: "all"
      }),
    [areaInventory, selectedAreaId]
  );

  const dealInsights = useMemo(
    () => getDealInsights(dealAlertInventory).slice(0, 4),
    [dealAlertInventory]
  );
  const discoveryPicks = useMemo(
    () =>
      getDiscoveryPicks(filteredDiscoveryShows, new Date().toISOString(), 4, {
        areaId: selectedAreaId
      }),
    [filteredDiscoveryShows, selectedAreaId]
  );
  const resultSections = useMemo(
    () =>
      getDiscoveryResultSections(visibleShows, {
        sortMode: discoverySortMode,
        includeBestPicks: curatedDiscoveryResult.defaultCurated
      }),
    [curatedDiscoveryResult.defaultCurated, discoverySortMode, visibleShows]
  );
  const dealSummary = useMemo(() => getDealSummary(dealAlertInventory), [dealAlertInventory]);
  const categoryFacets = useMemo(
    () => getCategoryFacets(areaInventory, categories),
    [areaInventory]
  );
  const marketSummary = useMemo(
    () => getMarketDiscoverySummary(areaInventory, categories),
    [areaInventory]
  );
  const coverageAudit = useMemo(
    () =>
      createCoverageAudit(areaInventory, {
        areaId: selectedAreaId,
        referenceNow: new Date().toISOString(),
        windowDays: 30
      }),
    [areaInventory, selectedAreaId]
  );
  const categoryFacetsByCategory = useMemo(
    () => new Map(categoryFacets.map((facet) => [facet.category, facet])),
    [categoryFacets]
  );
  const neighborhoodFacetInventory = useMemo(
    () =>
      filterShows(areaInventory, {
        areaId: selectedAreaId,
        categories: selectedCategories,
        query,
        onlyDeals,
        maxPriceCents,
        dateWindow
      }),
    [areaInventory, dateWindow, maxPriceCents, onlyDeals, query, selectedAreaId, selectedCategories]
  );
  const neighborhoodFacets = useMemo(
    () => getNeighborhoodFacets(neighborhoodFacetInventory),
    [neighborhoodFacetInventory]
  );
  const visibleNeighborhoodFacets = useMemo(
    () => mergeSelectedNeighborhoodFacets(neighborhoodFacets, selectedNeighborhoods),
    [neighborhoodFacets, selectedNeighborhoods]
  );
  const dateFacetInventory = useMemo(
    () =>
      filterShows(areaInventory, {
        areaId: selectedAreaId,
        categories: selectedCategories,
        neighborhoods: selectedNeighborhoods,
        query,
        onlyDeals,
        maxPriceCents,
        dateWindow: "all"
      }),
    [
      areaInventory,
      maxPriceCents,
      onlyDeals,
      query,
      selectedAreaId,
      selectedCategories,
      selectedNeighborhoods
    ]
  );
  const dateWindowFacets = useMemo(
    () => getDateWindowFacets(dateFacetInventory, dateWindows),
    [dateFacetInventory]
  );
  const dateWindowFacetsByWindow = useMemo(
    () => new Map(dateWindowFacets.map((facet) => [facet.dateWindow, facet])),
    [dateWindowFacets]
  );
  const filterSummary = useMemo(
    () =>
      getDiscoveryFilterSummary({
        categories: selectedCategories,
        neighborhoods: selectedNeighborhoods,
        query,
        onlyDeals,
        maxPriceCents,
        dateWindow,
        sortMode: discoverySortMode
      }),
    [
      dateWindow,
      discoverySortMode,
      maxPriceCents,
      onlyDeals,
      query,
      selectedCategories,
      selectedNeighborhoods
    ]
  );
  const dealAlertMatches = useMemo(
    () => getDealAlertMatches(dealAlerts, dealAlertInventory).slice(0, 4),
    [dealAlertInventory, dealAlerts]
  );
  const knownShowsById = useMemo(() => {
    const showsById = new Map<string, Show>();

    for (const show of [...areaInventory, ...visibleShows]) {
      showsById.set(show.id, show);
    }

    return showsById;
  }, [areaInventory, visibleShows]);
  const unreadNotifications = useMemo(
    () => notifications.filter((notification) => notification.status === "unread"),
    [notifications]
  );
  const currentDealAlert = useMemo(() => {
    const currentCategories = [...selectedCategories].sort().join("|");

    return dealAlerts.find(
      (alert) =>
        alert.areaId === selectedAreaId &&
        alert.dateWindow === dateWindow &&
        alert.categories.join("|") === currentCategories &&
        (alert.maxPriceCents ?? null) === (dealAlertMaxPriceCents ?? null)
    );
  }, [dateWindow, dealAlertMaxPriceCents, dealAlerts, selectedAreaId, selectedCategories]);
  const savedShows = useMemo(
    () =>
      savedShowIds
        .map((showId) => knownShowsById.get(showId) ?? getShowById(showId))
        .filter((show): show is Show => Boolean(show)),
    [knownShowsById, savedShowIds]
  );

  useEffect(() => {
    let mounted = true;

    if (!tasteEnabled || musicConnection?.status !== "connected") {
      setRecommendations([]);
      return () => {
        mounted = false;
      };
    }

    setTasteLoading(true);

    tasteProfileProvider
      .getRecommendationContext(selectedAreaId, musicConnection)
      .then((context) => {
        if (mounted) {
          setRecommendations(getRecommendedShowsFromCatalog(areaInventory, context).slice(0, 5));
          setTasteError(null);
        }
      })
      .catch((error) => {
        if (mounted) {
          setRecommendations([]);
          setTasteError(error instanceof Error ? error.message : "Spotify recommendations unavailable.");
        }
      })
      .finally(() => {
        if (mounted) {
          setTasteLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [areaInventory, musicConnection, selectedAreaId, tasteEnabled]);

  const toggleCategory = (category: ShowCategory) => {
    setSelectedCategories((current) =>
      current.includes(category)
        ? current.filter((candidate) => candidate !== category)
        : [...current, category]
    );
  };

  const toggleNeighborhood = (neighborhood: string) => {
    setSelectedNeighborhoods((current) =>
      current.includes(neighborhood)
        ? current.filter((candidate) => candidate !== neighborhood)
        : [...current, neighborhood]
    );
  };

  const clearDiscoveryFilters = () => {
    setQuery("");
    setSelectedCategories([]);
    setSelectedNeighborhoods([]);
    setDateWindow("all");
    setDiscoverySortMode("soonest");
    setOnlyDeals(false);
    setMaxPriceCents(undefined);
  };

  const useNearbyArea = async () => {
    setLocating(true);

    try {
      const fix = await locationProvider.getCurrentLocation();
      const nearest = findNearestArea(fix.coordinates);

      if (!nearest) {
        setLocationStatus("No supported area nearby");
        return;
      }

      setSelectedAreaId(nearest.area.id);
      setSelectedNeighborhoods([]);
      setAreaMenuOpen(false);
      setLocationStatus(
        `${nearest.area.name} · ${formatDistance(nearest.distanceMiles)} from ${locationProvider.label}`
      );
    } catch (error) {
      setLocationStatus(error instanceof Error ? error.message : "Location unavailable");
    } finally {
      setLocating(false);
    }
  };

  const toggleSavedShow = (showId: string) => {
    setSavedShowIds((current) =>
      current.includes(showId) ? current.filter((candidate) => candidate !== showId) : [showId, ...current]
    );
  };

  const toggleCurrentDealAlert = () => {
    const now = new Date().toISOString();

    if (currentDealAlert) {
      setDealAlerts((current) =>
        current.map((alert) =>
          alert.id === currentDealAlert.id ? toggleDealAlertStatus(alert, now) : alert
        )
      );
      return;
    }

    setDealAlerts((current) => [
      createDealAlert(
        {
          areaId: selectedAreaId,
          categories: selectedCategories,
          dateWindow,
          maxPriceCents: dealAlertMaxPriceCents
        },
        now
      ),
      ...current
    ]);
  };

  const toggleMusicConnection = async () => {
    setTasteLoading(true);
    setTasteError(null);

    try {
      if (musicConnection?.status === "connected") {
        const disconnectedConnection = await tasteProfileProvider.disconnectAccount(musicConnection);

        setMusicConnection(disconnectedConnection);
        setTasteEnabled(false);
        setRecommendations([]);
        return;
      }

      const connectedAccount = await tasteProfileProvider.connectAccount();

      setMusicConnection(connectedAccount);
      setTasteEnabled(true);
    } catch (error) {
      setTasteError(error instanceof Error ? error.message : "Spotify connection unavailable.");
    } finally {
      setTasteLoading(false);
    }
  };

  const openShowDetails = (show: Show) => {
    setSelectedShow(show);
  };

  const resolveKnownShow = (showId: string) => knownShowsById.get(showId) ?? getShowById(showId);

  useEffect(() => {
    if (!hydrated || !dealAlertMatches.length) {
      return;
    }

    let mounted = true;

    notificationProvider.createDealAlertNotifications(dealAlertMatches).then((incoming) => {
      if (mounted) {
        setNotifications((current) => mergeNotifications(current, incoming));
      }
    });

    return () => {
      mounted = false;
    };
  }, [dealAlertMatches, hydrated]);

  const openNotification = (notification: NotificationMessage) => {
    setNotifications((current) => markNotificationRead(current, notification.id));
    const show = resolveKnownShow(notification.showId);

    if (show) {
      openShowDetails(show);
    }
  };
  const showSpotifyEmptyState =
    tasteEnabled &&
    musicConnection?.status === "connected" &&
    !tasteLoading &&
    !recommendations.length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.appShell}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topBar}>
            <View>
              <Text style={styles.kicker}>Tickets Tonight · {selectedArea?.discoveryLabel}</Text>
              <Text style={styles.title}>Find a seat, a floor, or a stage nearby.</Text>
              <Text style={styles.marketNote}>{selectedArea?.discoveryNote}</Text>
            </View>
            <View style={styles.logoMark}>
              <Ticket color={colors.paper} size={24} strokeWidth={2.4} />
            </View>
          </View>

          <View style={styles.controls}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setAreaMenuOpen((open) => !open)}
              style={styles.areaButton}
            >
              <MapPin color={colors.teal} size={19} />
              <View style={styles.areaButtonCopy}>
                <Text style={styles.areaButtonText}>
                  {selectedArea?.name}, {selectedArea?.region}
                </Text>
                <Text numberOfLines={1} style={styles.areaButtonMeta}>
                  {selectedArea?.discoveryLabel}
                </Text>
              </View>
              <ChevronDown color={colors.mutedInk} size={18} />
            </Pressable>

            {areaMenuOpen ? (
              <View style={styles.areaMenu}>
                {areas.map((area) => (
                  <AreaOption
                    area={area}
                    key={area.id}
                    selected={area.id === selectedAreaId}
                    onPress={() => {
                      setSelectedAreaId(area.id);
                      setSelectedNeighborhoods([]);
                      setLocationStatus("Manual area");
                      setAreaMenuOpen(false);
                    }}
                  />
                ))}
              </View>
            ) : null}

            <Pressable
              accessibilityRole="button"
              disabled={locating}
              onPress={useNearbyArea}
              style={[styles.nearMeButton, locating ? styles.nearMeButtonLoading : undefined]}
            >
              <MapPin color={colors.paper} size={18} />
              <View style={styles.nearMeCopy}>
                <Text style={styles.nearMeTitle}>{locating ? "Finding area" : "Use near me"}</Text>
                <Text numberOfLines={1} style={styles.nearMeMeta}>
                  {locationStatus}
                </Text>
              </View>
            </Pressable>

            <View style={styles.searchBox}>
              <Search color={colors.mutedInk} size={18} />
              <TextInput
                accessibilityLabel="Search shows"
                onChangeText={setQuery}
                placeholder="Search artist, venue, vibe"
                placeholderTextColor="#8A8F98"
                returnKeyType="search"
                style={styles.searchInput}
                value={query}
              />
              {query ? (
                <Pressable
                  accessibilityLabel="Clear search"
                  hitSlop={10}
                  onPress={() => setQuery("")}
                >
                  <X color={colors.mutedInk} size={18} />
                </Pressable>
              ) : null}
            </View>
          </View>

          <View style={styles.marketSnapshot}>
            <View style={styles.marketSnapshotHeader}>
              <Text style={styles.marketSnapshotTitle}>{selectedArea?.name} snapshot</Text>
              <Text style={styles.marketSnapshotMeta}>
                {inventoryLoading ? "Refreshing" : getMarketNextCopy(marketSummary)}
              </Text>
            </View>
            <View style={styles.marketSnapshotStats}>
              <MarketSnapshotStat
                label="Upcoming"
                loading={inventoryLoading}
                value={String(marketSummary.showCount)}
              />
              <MarketSnapshotStat
                label="Deals"
                loading={inventoryLoading}
                value={String(marketSummary.dealCount)}
              />
              <MarketSnapshotStat
                label="Links"
                loading={inventoryLoading}
                value={String(marketSummary.ticketLinkCount)}
              />
              <MarketSnapshotStat
                label="Types"
                loading={inventoryLoading}
                value={String(marketSummary.activeCategoryCount)}
              />
              <MarketSnapshotStat
                label="Sources"
                loading={inventoryLoading}
                value={String(marketSummary.sourceCount)}
              />
            </View>
            <View
              style={[
                styles.providerStatus,
                discoveryInventoryStatus.tone === "live" ? styles.providerStatusLive : undefined,
                discoveryInventoryStatus.tone === "warning" ? styles.providerStatusWarning : undefined
              ]}
            >
              <Text style={styles.providerStatusText}>
                {inventoryLoading ? "Refreshing provider inventory" : discoveryInventoryStatus.copy}
              </Text>
            </View>
          </View>

          <View style={styles.coverageAuditPanel}>
            <View style={styles.coverageAuditHeader}>
              <Text style={styles.coverageAuditTitle}>Coverage audit</Text>
              <Text style={styles.coverageAuditStatus}>
                {inventoryLoading ? "Measuring" : getCoverageAuditStatusCopy(coverageAudit)}
              </Text>
            </View>
            <View style={styles.marketSnapshotStats}>
              <MarketSnapshotStat
                label="30 days"
                loading={inventoryLoading}
                value={`${coverageAudit.eventCount}/${coverageAudit.targetEventCount}`}
              />
              <MarketSnapshotStat
                label="Links"
                loading={inventoryLoading}
                value={`${coverageAudit.ticketLinkCoveragePercent}%`}
              />
              <MarketSnapshotStat
                label="Link-only"
                loading={inventoryLoading}
                value={String(coverageAudit.linkOnlyOfferCount)}
              />
              <MarketSnapshotStat
                label="Weak lanes"
                loading={inventoryLoading}
                value={String(coverageAudit.weakCategoryGroups.length)}
              />
            </View>
            <Text numberOfLines={2} style={styles.coverageAuditCopy}>
              {inventoryLoading ? "Checking provider inventory" : getCoverageAuditActionCopy(coverageAudit)}
            </Text>
          </View>

          {savedShows.length ? (
            <View style={styles.savedPanel}>
              <View style={styles.walletHeader}>
                <View style={styles.inlineTitle}>
                  <Heart color={colors.coral} size={18} />
                  <Text style={styles.sectionTitle}>Saved shows</Text>
                </View>
                <Text style={styles.walletCount}>
                  {savedShows.length} {savedShows.length === 1 ? "show" : "shows"}
                </Text>
              </View>
              <ScrollView
                contentContainerStyle={styles.savedRail}
                horizontal
                showsHorizontalScrollIndicator={false}
              >
                {savedShows.map((show) => (
                  <SavedShowCard key={show.id} onBuy={() => openShowDetails(show)} show={show} />
                ))}
              </ScrollView>
            </View>
          ) : null}

          <View style={styles.filterHeader}>
            <View style={styles.inlineTitle}>
              <SlidersHorizontal color={colors.ink} size={18} />
              <Text style={styles.sectionTitle}>Browse by type</Text>
            </View>
            {selectedCategories.length ? (
              <Pressable onPress={() => setSelectedCategories([])}>
                <Text style={styles.clearFilters}>Clear</Text>
              </Pressable>
            ) : null}
          </View>

          <ScrollView
            contentContainerStyle={styles.categoryRail}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {categories.map((category) => (
              <CategoryChip
                active={selectedCategories.includes(category)}
                category={category}
                facet={categoryFacetsByCategory.get(category)}
                key={category}
                loading={inventoryLoading}
                onPress={() => toggleCategory(category)}
              />
            ))}
          </ScrollView>

          <ScrollView
            contentContainerStyle={styles.dateWindowRail}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {dateWindows.map((window) => (
              <DateWindowChip
                active={dateWindow === window}
                dateWindow={window}
                facet={dateWindowFacetsByWindow.get(window)}
                key={window}
                loading={inventoryLoading}
                onPress={() => setDateWindow(window)}
              />
            ))}
          </ScrollView>

          {visibleNeighborhoodFacets.length ? (
            <>
              <View style={styles.neighborhoodHeader}>
                <View style={styles.inlineTitle}>
                  <MapPin color={colors.ink} size={18} />
                  <Text style={styles.sectionTitle}>Neighborhoods</Text>
                </View>
                {selectedNeighborhoods.length ? (
                  <Pressable onPress={() => setSelectedNeighborhoods([])}>
                    <Text style={styles.clearFilters}>Clear</Text>
                  </Pressable>
                ) : null}
              </View>
              <ScrollView
                contentContainerStyle={styles.neighborhoodRail}
                horizontal
                showsHorizontalScrollIndicator={false}
              >
                {visibleNeighborhoodFacets.map((facet) => (
                  <NeighborhoodChip
                    active={selectedNeighborhoods.includes(facet.neighborhood)}
                    facet={facet}
                    key={facet.neighborhood}
                    loading={inventoryLoading}
                    onPress={() => toggleNeighborhood(facet.neighborhood)}
                  />
                ))}
              </ScrollView>
            </>
          ) : null}

          <View style={styles.priceFilterHeader}>
            <Text style={styles.priceFilterTitle}>Budget</Text>
            <Text style={styles.priceFilterMeta}>{getPriceLabel(maxPriceCents)}</Text>
          </View>

          <ScrollView
            contentContainerStyle={styles.priceFilterRail}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {priceOptions.map((option) => (
              <PriceChip
                active={(option.value ?? null) === (maxPriceCents ?? null)}
                key={option.label}
                label={option.label}
                onPress={() => setMaxPriceCents(option.value)}
              />
            ))}
          </ScrollView>

          <View style={styles.sortModeHeader}>
            <Text style={styles.sortModeTitle}>Sort</Text>
            <Text style={styles.sortModeMeta}>{sortModeLabels[discoverySortMode]}</Text>
          </View>

          <ScrollView
            contentContainerStyle={styles.sortModeRail}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {sortModes.map((mode) => (
              <PriceChip
                active={mode === discoverySortMode}
                key={mode}
                label={sortModeLabels[mode]}
                onPress={() => setDiscoverySortMode(mode)}
              />
            ))}
          </ScrollView>

          <View style={styles.signalPanel}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setOnlyDeals((current) => !current)}
              style={[styles.signalButton, onlyDeals ? styles.signalButtonActive : undefined]}
            >
              <BadgePercent color={onlyDeals ? colors.paper : colors.coralDark} size={18} />
              <View style={styles.signalCopy}>
                <Text style={[styles.signalTitle, onlyDeals ? styles.signalTitleActive : undefined]}>
                  Deals only
                </Text>
                <Text style={[styles.signalMeta, onlyDeals ? styles.signalMetaActive : undefined]}>
                  {inventoryLoading
                    ? "Checking deals"
                    : getDealSummaryCopy(dealSummary, selectedArea?.name ?? "area")}
                </Text>
              </View>
            </Pressable>

            <View style={styles.signalButton}>
              <Sparkles color={colors.teal} size={18} />
              <View style={styles.signalCopy}>
                <Text style={styles.signalTitle}>Curated scope</Text>
                <Text style={styles.signalMeta}>Discovery and discounts first</Text>
              </View>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={tasteLoading}
            onPress={toggleMusicConnection}
            style={[
              styles.musicConnectionPanel,
              musicConnection?.status === "connected" ? styles.musicConnectionPanelActive : undefined,
              tasteLoading ? styles.musicConnectionPanelLoading : undefined
            ]}
          >
            <View style={styles.musicIconBadge}>
              <Music2 color={colors.paper} size={18} />
            </View>
            <View style={styles.musicConnectionCopy}>
              <Text style={styles.musicConnectionTitle}>Spotify taste</Text>
              <Text
                numberOfLines={1}
                style={[
                  styles.musicConnectionMeta,
                  tasteError ? styles.musicConnectionMetaError : undefined
                ]}
              >
                {getMusicConnectionCopy({
                  connection: musicConnection,
                  configured: tasteProfileProvider.isConfigured(),
                  error: tasteError,
                  loading: tasteLoading
                })}
              </Text>
            </View>
            <Text style={styles.musicConnectionAction}>
              {getMusicConnectionActionCopy(musicConnection, tasteLoading)}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={toggleCurrentDealAlert}
            style={[
              styles.dealAlertPanel,
              currentDealAlert?.status === "active" ? styles.dealAlertPanelActive : undefined
            ]}
          >
            <View
              style={[
                styles.dealAlertIconBadge,
                currentDealAlert?.status === "active" ? styles.dealAlertIconBadgeActive : undefined
              ]}
            >
              <Bell color={currentDealAlert?.status === "active" ? colors.paper : colors.coralDark} size={18} />
            </View>
            <View style={styles.dealAlertCopy}>
              <Text
                style={[
                  styles.dealAlertTitle,
                  currentDealAlert?.status === "active" ? styles.dealAlertTitleActive : undefined
                ]}
              >
                Deal alerts
              </Text>
              <Text
                numberOfLines={1}
                style={[
                  styles.dealAlertMeta,
                  currentDealAlert?.status === "active" ? styles.dealAlertMetaActive : undefined
                ]}
              >
                {currentDealAlert?.status === "active"
                  ? inventoryLoading
                    ? "Checking discounts"
                    : `${dealAlertMatches.length} matching ${getPriceLabel(
                        dealAlertMaxPriceCents
                      ).toLowerCase()} deals`
                  : currentDealAlert?.status === "paused"
                    ? "Paused for current filters"
                    : `Track ${getPriceLabel(dealAlertMaxPriceCents).toLowerCase()} deals`}
              </Text>
            </View>
            <Text
              style={[
                styles.dealAlertAction,
                currentDealAlert?.status === "active" ? styles.dealAlertActionActive : undefined
              ]}
            >
              {currentDealAlert ? (currentDealAlert.status === "active" ? "Pause" : "Resume") : "Create"}
            </Text>
          </Pressable>

          <View style={styles.dealAlertRuleHeader}>
            <Text style={styles.dealAlertRuleTitle}>Alert price</Text>
            <Text style={styles.dealAlertRuleMeta}>{getPriceLabel(dealAlertMaxPriceCents)}</Text>
          </View>

          <ScrollView
            contentContainerStyle={styles.dealAlertPriceRail}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {priceOptions.map((option) => (
              <PriceChip
                active={(option.value ?? null) === (dealAlertMaxPriceCents ?? null)}
                key={option.label}
                label={option.label}
                onPress={() => setDealAlertMaxPriceCents(option.value)}
              />
            ))}
          </ScrollView>

          {dealAlertMatches.length ? (
            <View style={styles.alertMatchPanel}>
              <View style={styles.walletHeader}>
                <View style={styles.inlineTitle}>
                  <Bell color={colors.coral} size={18} />
                  <Text style={styles.sectionTitle}>Alert matches</Text>
                </View>
                <Text style={styles.walletCount}>
                  {dealAlertMatches.length} {dealAlertMatches.length === 1 ? "deal" : "deals"}
                </Text>
              </View>
              <ScrollView
                contentContainerStyle={styles.alertMatchRail}
                horizontal
                showsHorizontalScrollIndicator={false}
              >
                {dealAlertMatches.map((match) => (
                  <DealAlertMatchCard
                    key={`${match.alert.id}-${match.show.id}-${match.offer.id}`}
                    match={match}
                    onBuy={() => openShowDetails(match.show)}
                  />
                ))}
              </ScrollView>
            </View>
          ) : null}

          {notifications.length ? (
            <View style={styles.notificationPanel}>
              <View style={styles.walletHeader}>
                <View style={styles.inlineTitle}>
                  <Bell color={colors.teal} size={18} />
                  <Text style={styles.sectionTitle}>Inbox</Text>
                </View>
                <Text style={styles.walletCount}>
                  {unreadNotifications.length} unread
                </Text>
              </View>
              <ScrollView
                contentContainerStyle={styles.notificationRail}
                horizontal
                showsHorizontalScrollIndicator={false}
              >
                {notifications.slice(0, 4).map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    onPress={() => openNotification(notification)}
                  />
                ))}
              </ScrollView>
            </View>
          ) : null}

          {dealInsights.length ? (
            <View style={styles.dealPanel}>
              <View style={styles.inlineTitle}>
                <BadgePercent color={colors.coral} size={18} />
                <Text style={styles.sectionTitle}>Best deals right now</Text>
              </View>
              <ScrollView
                contentContainerStyle={styles.dealRail}
                horizontal
                showsHorizontalScrollIndicator={false}
              >
                {dealInsights.map((insight) => (
                  <DealCard
                    insight={insight}
                    key={insight.show.id}
                    onPress={() => openShowDetails(insight.show)}
                  />
                ))}
              </ScrollView>
            </View>
          ) : null}

          {discoveryPicks.length ? (
            <View style={styles.discoveryPickPanel}>
              <View style={styles.inlineTitlePadded}>
                <Sparkles color={colors.teal} size={18} />
                <Text style={styles.sectionTitle}>Best bets</Text>
              </View>
              <ScrollView
                contentContainerStyle={styles.discoveryPickRail}
                horizontal
                showsHorizontalScrollIndicator={false}
              >
                {discoveryPicks.map((pick) => (
                  <DiscoveryPickCard
                    key={pick.show.id}
                    onPress={() => openShowDetails(pick.show)}
                    pick={pick}
                  />
                ))}
              </ScrollView>
            </View>
          ) : null}

          {recommendations.length ? (
            <View style={styles.recommendationPanel}>
              <View style={styles.inlineTitlePadded}>
                <Music2 color={colors.plum} size={18} />
                <Text style={styles.sectionTitle}>Spotify picks</Text>
              </View>
              <ScrollView
                contentContainerStyle={styles.recommendationRail}
                horizontal
                showsHorizontalScrollIndicator={false}
              >
                {recommendations.map((recommendation) => (
                  <RecommendationCard
                    key={recommendation.show.id}
                    onPress={() => openShowDetails(recommendation.show)}
                    recommendation={recommendation}
                  />
                ))}
              </ScrollView>
            </View>
          ) : showSpotifyEmptyState ? (
            <View style={styles.recommendationEmptyPanel}>
              <View style={styles.inlineTitlePadded}>
                <Music2 color={colors.plum} size={18} />
                <Text style={styles.sectionTitle}>Spotify picks</Text>
              </View>
              <Text style={styles.recommendationEmptyCopy}>
                No strong Spotify matches in {selectedArea?.name} yet. More local inventory will make this smarter.
              </Text>
            </View>
          ) : null}

          {filterSummary.hasActiveFilters ? (
            <View style={styles.activeFilterPanel}>
              <View style={styles.activeFilterHeader}>
                <Text style={styles.activeFilterTitle}>
                  {filterSummary.activeCount} active {filterSummary.activeCount === 1 ? "filter" : "filters"}
                </Text>
                <Pressable accessibilityRole="button" onPress={clearDiscoveryFilters}>
                  <Text style={styles.activeFilterReset}>Reset</Text>
                </Pressable>
              </View>
              <ScrollView
                contentContainerStyle={styles.activeFilterRail}
                horizontal
                showsHorizontalScrollIndicator={false}
              >
                {filterSummary.labels.map((label) => (
                  <View key={label} style={styles.activeFilterChip}>
                    <Text numberOfLines={1} style={styles.activeFilterChipText}>
                      {label}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : null}

          <View style={styles.resultsHeader}>
            <View>
              <Text style={styles.sectionTitle}>Upcoming near you</Text>
              <Text style={styles.resultCount}>
                {discoveryResultCountCopy}
              </Text>
            </View>
            <View style={styles.discountBadge}>
              <Text style={styles.discountBadgeText}>Deals-ready</Text>
            </View>
          </View>

          {inventoryError ? (
            <View style={styles.providerNotice}>
              <Text style={styles.providerNoticeText}>{inventoryError}</Text>
            </View>
          ) : null}

          {inventoryLoading && visibleShows.length ? (
            <Text style={styles.refreshingText}>Refreshing provider inventory</Text>
          ) : null}

          <View style={styles.showList}>
            {inventoryLoading && !visibleShows.length ? (
              <View style={styles.loadingState}>
                <ActivityIndicator color={colors.teal} />
                <Text style={styles.loadingTitle}>Loading local inventory</Text>
              </View>
            ) : null}

            {resultSections.map((section) => (
              <View key={section.id} style={styles.resultSection}>
                <View style={styles.resultSectionHeader}>
                  <Text style={styles.resultSectionTitle}>{section.title}</Text>
                  <Text style={styles.resultSectionCount}>
                    {section.showCount} {section.showCount === 1 ? "show" : "shows"}
                  </Text>
                </View>
                <View style={styles.resultSectionList}>
                  {section.shows.map((show) => (
                    <ShowCard
                      key={show.id}
                      onOpenDetails={() => openShowDetails(show)}
                      onToggleSaved={() => toggleSavedShow(show.id)}
                      saved={savedShowIds.includes(show.id)}
                      seriesSummary={getDiscoverySeriesSummaryCopy(
                        curatedDiscoveryResult.seriesByShowId.get(show.id)
                      )}
                      show={show}
                    />
                  ))}
                </View>
              </View>
            ))}

            {remainingDiscoveryCount > 0 ? (
              <Pressable
                accessibilityRole="button"
                disabled={inventoryLoading}
                onPress={() =>
                  setVisibleResultLimit((current) =>
                    getNextVisibleDiscoveryCount(current, filteredDiscoveryShows.length)
                  )
                }
                style={[
                  styles.loadMoreButton,
                  inventoryLoading ? styles.loadMoreButtonDisabled : undefined
                ]}
              >
                <Text style={styles.loadMoreButtonText}>{loadMoreCopy}</Text>
                <Text style={styles.loadMoreButtonMeta}>
                  {remainingDiscoveryCount} still available
                </Text>
              </Pressable>
            ) : null}

            {!inventoryLoading && !visibleShows.length ? (
              <View style={styles.emptyState}>
                <Music2 color={colors.teal} size={30} />
                <Text style={styles.emptyTitle}>No shows match that mix.</Text>
                <Text style={styles.emptyCopy}>
                  Try a nearby city, clear a filter, or search for a venue or artist.
                </Text>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </View>

      <ShowDetailModal
        onClose={() => setSelectedShow(null)}
        onToggleSaved={(showId) => toggleSavedShow(showId)}
        saved={selectedShow ? savedShowIds.includes(selectedShow.id) : false}
        show={selectedShow}
      />
    </SafeAreaView>
  );
}

function AreaOption({
  area,
  selected,
  onPress
}: {
  area: Area;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.areaOption}>
      <View style={styles.areaOptionCopy}>
        <View style={styles.areaOptionHeader}>
          <Text style={styles.areaOptionName}>{area.name}</Text>
          <Text style={styles.areaOptionBadge}>{area.discoveryLabel}</Text>
        </View>
        <Text style={styles.areaOptionRegion}>{area.region}</Text>
        <Text numberOfLines={2} style={styles.areaOptionNote}>
          {area.discoveryNote}
        </Text>
      </View>
      {selected ? <Check color={colors.teal} size={20} /> : null}
    </Pressable>
  );
}

function CategoryChip({
  active,
  category,
  facet,
  loading,
  onPress
}: {
  active: boolean;
  category: ShowCategory;
  facet: CategoryFacet | undefined;
  loading: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.categoryChip, active ? styles.categoryChipActive : undefined]}
    >
      <Text style={[styles.categoryChipText, active ? styles.categoryChipTextActive : undefined]}>
        {categoryLabels[category]}
      </Text>
      <Text
        numberOfLines={1}
        style={[styles.categoryChipMeta, active ? styles.categoryChipMetaActive : undefined]}
      >
        {getCategoryFacetCopy(facet, loading)}
      </Text>
    </Pressable>
  );
}

function DateWindowChip({
  active,
  dateWindow,
  facet,
  loading,
  onPress
}: {
  active: boolean;
  dateWindow: DateWindow;
  facet: DateWindowFacet | undefined;
  loading: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.dateWindowChip, active ? styles.dateWindowChipActive : undefined]}
    >
      <Text style={[styles.dateWindowText, active ? styles.dateWindowTextActive : undefined]}>
        {dateWindowLabels[dateWindow]}
      </Text>
      <Text
        numberOfLines={1}
        style={[styles.dateWindowMeta, active ? styles.dateWindowMetaActive : undefined]}
      >
        {getDateWindowFacetCopy(facet, loading)}
      </Text>
    </Pressable>
  );
}

function NeighborhoodChip({
  active,
  facet,
  loading,
  onPress
}: {
  active: boolean;
  facet: NeighborhoodFacet;
  loading: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.neighborhoodChip, active ? styles.neighborhoodChipActive : undefined]}
    >
      <Text style={[styles.neighborhoodText, active ? styles.neighborhoodTextActive : undefined]}>
        {facet.neighborhood}
      </Text>
      <Text style={[styles.neighborhoodMeta, active ? styles.neighborhoodMetaActive : undefined]}>
        {getNeighborhoodFacetCopy(facet, loading)}
      </Text>
    </Pressable>
  );
}

function MarketSnapshotStat({
  label,
  loading,
  value
}: {
  label: string;
  loading: boolean;
  value: string;
}) {
  return (
    <View style={styles.marketSnapshotStat}>
      <Text style={styles.marketSnapshotValue}>{loading ? "..." : value}</Text>
      <Text style={styles.marketSnapshotLabel}>{label}</Text>
    </View>
  );
}

function PriceChip({
  active,
  label,
  onPress
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.dealAlertPriceChip, active ? styles.dealAlertPriceChipActive : undefined]}
    >
      <Text
        style={[
          styles.dealAlertPriceChipText,
          active ? styles.dealAlertPriceChipTextActive : undefined
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function DealAlertMatchCard({ match, onBuy }: { match: DealAlertMatch; onBuy: () => void }) {
  return (
    <Pressable onPress={onBuy} style={styles.alertMatchCard}>
      <View style={[styles.alertMatchStripe, { backgroundColor: match.show.imageTone }]} />
      <Text numberOfLines={1} style={styles.alertMatchLabel}>
        {match.offer.deal?.label ?? "Deal found"}
      </Text>
      <Text numberOfLines={2} style={styles.alertMatchTitle}>
        {match.show.title}
      </Text>
      <Text numberOfLines={1} style={styles.alertMatchMeta}>
        {match.show.neighborhood} · {formatShowDate(match.show.startsAt)}
      </Text>
      <View style={styles.alertMatchFooter}>
        <Text style={styles.alertMatchPrice}>{getOfferPriceCopy(match.offer)}</Text>
        {match.savingsCents > 0 ? (
          <Text style={styles.alertMatchSavings}>Save {formatMoney(match.savingsCents)}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function NotificationCard({
  notification,
  onPress
}: {
  notification: NotificationMessage;
  onPress: () => void;
}) {
  const unread = notification.status === "unread";

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.notificationCard, unread ? styles.notificationCardUnread : undefined]}
    >
      <View style={styles.notificationTopLine}>
        <Text style={[styles.notificationStatus, unread ? styles.notificationStatusUnread : undefined]}>
          {unread ? "New" : "Read"}
        </Text>
        <Text numberOfLines={1} style={styles.notificationChannel}>
          {notification.channels.join(", ")}
        </Text>
      </View>
      <Text numberOfLines={2} style={styles.notificationTitle}>
        {notification.title}
      </Text>
      <Text numberOfLines={2} style={styles.notificationBody}>
        {notification.body}
      </Text>
    </Pressable>
  );
}

function getDealSummaryCopy(dealSummary: ReturnType<typeof getDealSummary>, areaName: string): string {
  if (!dealSummary.dealCount) {
    return `No deals in ${areaName}`;
  }

  if (dealSummary.topSavingsCents > 0) {
    return `${dealSummary.dealCount} deals · top save ${formatMoney(dealSummary.topSavingsCents)}`;
  }

  return `${dealSummary.dealCount} active in ${areaName}`;
}

function getPriceLabel(maxPriceCents: number | undefined): string {
  return maxPriceCents ? `Under ${formatMoney(maxPriceCents)}` : "Any price";
}

function getOfferPriceCopy(offer: TicketOffer | undefined, fallback = "Soon"): string {
  if (!offer) {
    return fallback;
  }

  return offer.priceCents === undefined ? "Price on provider" : formatMoney(offer.priceCents);
}

function getCompactOfferPriceCopy(offer: TicketOffer | undefined): string {
  if (!offer) {
    return "Soon";
  }

  return offer.priceCents === undefined ? "Tickets" : formatMoney(offer.priceCents);
}

function getOfferMetaCopy(offer: TicketOffer): string {
  const availability = offer.priceCents === undefined ? "Provider checkout" : `${offer.remaining} left`;

  return `${availability} · ${accessLabels[offer.access]} · ${sourceLabels[offer.source]}`;
}

function getCategoryFacetCopy(facet: CategoryFacet | undefined, loading: boolean): string {
  if (loading) {
    return "Checking";
  }

  if (!facet || facet.showCount === 0) {
    return "0 shows";
  }

  const showCopy = `${facet.showCount} ${facet.showCount === 1 ? "show" : "shows"}`;

  if (!facet.dealCount) {
    return showCopy;
  }

  return `${showCopy} · ${facet.dealCount} ${facet.dealCount === 1 ? "deal" : "deals"}`;
}

function getDateWindowFacetCopy(facet: DateWindowFacet | undefined, loading: boolean): string {
  if (loading) {
    return "Checking";
  }

  if (!facet || facet.showCount === 0) {
    return "0 shows";
  }

  if (facet.dealCount > 0) {
    return `${facet.showCount} · ${facet.dealCount} deals`;
  }

  return `${facet.showCount} ${facet.showCount === 1 ? "show" : "shows"}`;
}

function getNeighborhoodFacetCopy(facet: NeighborhoodFacet, loading: boolean): string {
  if (loading) {
    return "Checking";
  }

  const showCopy = `${facet.showCount} ${facet.showCount === 1 ? "show" : "shows"}`;

  if (!facet.dealCount) {
    return showCopy;
  }

  return `${showCopy} · ${facet.dealCount} ${facet.dealCount === 1 ? "deal" : "deals"}`;
}

function mergeSelectedNeighborhoodFacets(
  facets: NeighborhoodFacet[],
  selectedNeighborhoods: string[]
): NeighborhoodFacet[] {
  const facetsByNeighborhood = new Map(facets.map((facet) => [facet.neighborhood, facet]));

  for (const neighborhood of selectedNeighborhoods) {
    if (!facetsByNeighborhood.has(neighborhood)) {
      facetsByNeighborhood.set(neighborhood, {
        neighborhood,
        showCount: 0,
        dealCount: 0
      });
    }
  }

  return Array.from(facetsByNeighborhood.values());
}

function getMusicConnectionCopy({
  connection,
  configured,
  error,
  loading
}: {
  connection: MusicAccountConnection | null;
  configured: boolean;
  error: string | null;
  loading: boolean;
}): string {
  if (loading) {
    return connection?.status === "connected" ? "Refreshing listening taste" : "Opening Spotify";
  }

  if (error) {
    return error;
  }

  if (!configured) {
    return "Client ID needed";
  }

  if (connection?.status === "connected") {
    const tasteCopy = [
      ...connection.topArtists.slice(0, 2),
      ...connection.topGenres.slice(0, 1)
    ].join(" · ");

    return tasteCopy || `Connected as ${connection.displayName}`;
  }

  return "Not connected";
}

function getMusicConnectionActionCopy(
  connection: MusicAccountConnection | null,
  loading: boolean
): string {
  if (loading) {
    return "Syncing";
  }

  return connection?.status === "connected" ? "Disconnect" : "Connect";
}

function getMarketNextCopy(summary: MarketDiscoverySummary): string {
  return summary.nextStartsAt ? `Next ${formatShowDate(summary.nextStartsAt)}` : "No upcoming shows";
}

function DealCard({ insight, onPress }: { insight: DealInsight; onPress: () => void }) {
  const { offer, savingsCents, show } = insight;

  return (
    <Pressable onPress={onPress} style={[styles.dealCard, { backgroundColor: show.imageTone }]}>
      <View style={styles.dealCardTop}>
        <Text style={styles.dealCardBadge}>{insight.strengthLabel}</Text>
        {savingsCents > 0 ? (
          <Text style={styles.dealCardSavings}>Save {formatMoney(savingsCents)}</Text>
        ) : null}
      </View>
      <Text numberOfLines={2} style={styles.dealCardTitle}>
        {show.title}
      </Text>
      <Text numberOfLines={1} style={styles.dealCardMeta}>
        {insight.urgencyLabel} · {show.neighborhood}
      </Text>
      <Text style={styles.dealCardPrice}>{getOfferPriceCopy(offer)}</Text>
    </Pressable>
  );
}

function DiscoveryPickCard({ pick, onPress }: { pick: DiscoveryPick; onPress: () => void }) {
  const { offer, show } = pick;

  return (
    <Pressable onPress={onPress} style={styles.discoveryPickCard}>
      <View style={[styles.discoveryPickStripe, { backgroundColor: show.imageTone }]} />
      <View style={styles.discoveryPickTop}>
        <Text numberOfLines={1} style={styles.discoveryPickLabel}>
          {pick.label}
        </Text>
        <Text numberOfLines={1} style={styles.discoveryPickSource}>
          {sourceLabels[show.source]}
        </Text>
      </View>
      <Text numberOfLines={2} style={styles.discoveryPickTitle}>
        {show.title}
      </Text>
      <Text numberOfLines={2} style={styles.discoveryPickReason}>
        {pick.reason}
      </Text>
      <View style={styles.discoveryPickFooter}>
        <Text numberOfLines={1} style={styles.discoveryPickDate}>
          {formatShowDate(show.startsAt)}
        </Text>
        <Text style={styles.discoveryPickPrice}>
          {getCompactOfferPriceCopy(offer)}
        </Text>
      </View>
    </Pressable>
  );
}

function RecommendationCard({
  recommendation,
  onPress
}: {
  recommendation: Recommendation;
  onPress: () => void;
}) {
  const { show } = recommendation;
  const offer = getBestOffer(show);

  return (
    <Pressable onPress={onPress} style={styles.recommendationCard}>
      <Text numberOfLines={1} style={styles.recommendationCategory}>
        {categoryLabels[show.category]}
      </Text>
      <Text numberOfLines={2} style={styles.recommendationTitle}>
        {show.title}
      </Text>
      <Text numberOfLines={2} style={styles.recommendationMeta}>
        {recommendation.reason || show.neighborhood}
      </Text>
      <Text style={styles.discoveryPickPrice}>{getCompactOfferPriceCopy(offer)}</Text>
    </Pressable>
  );
}

function SavedShowCard({ show, onBuy }: { show: Show; onBuy: () => void }) {
  const offer = getBestOffer(show);

  return (
    <Pressable onPress={onBuy} style={styles.savedShowCard}>
      <View style={[styles.savedShowStripe, { backgroundColor: show.imageTone }]} />
      <Text numberOfLines={1} style={styles.savedShowCategory}>
        {categoryLabels[show.category]}
      </Text>
      <Text numberOfLines={2} style={styles.savedShowTitle}>
        {show.title}
      </Text>
      <Text numberOfLines={1} style={styles.savedShowMeta}>
        {show.neighborhood} · {formatShowDate(show.startsAt)}
      </Text>
      <Text style={styles.savedShowPrice}>{getCompactOfferPriceCopy(offer)}</Text>
    </Pressable>
  );
}

function ShowCard({
  show,
  onOpenDetails,
  onToggleSaved,
  saved,
  seriesSummary
}: {
  show: Show;
  onOpenDetails: () => void;
  onToggleSaved: () => void;
  saved: boolean;
  seriesSummary?: string;
}) {
  const bestOffer = getBestOffer(show);
  const savings = getOfferSavings(bestOffer);

  return (
    <View style={styles.showCard}>
      <View style={[styles.showAccent, { backgroundColor: show.imageTone }]}>
        <Text style={styles.showAccentText}>{categoryLabels[show.category].slice(0, 3)}</Text>
      </View>
      <View style={styles.showBody}>
        <View style={styles.showMetaRow}>
          <View style={styles.inlineMeta}>
            <CalendarDays color={colors.teal} size={16} />
            <Text style={styles.showMetaText}>{formatShowDate(show.startsAt)}</Text>
          </View>
          <Text style={styles.distance}>{formatDistance(show.distanceMiles)}</Text>
        </View>

        <View style={styles.sourceRow}>
          <View style={styles.sourcePill}>
            <Text style={styles.sourceText}>{sourceLabels[show.source]}</Text>
          </View>
          {bestOffer?.deal ? (
            <View style={styles.dealPill}>
              <BadgePercent color={colors.coralDark} size={13} />
              <Text style={styles.dealPillText}>{bestOffer.deal.label}</Text>
            </View>
          ) : null}
          {seriesSummary ? (
            <View style={styles.seriesPill}>
              <Text style={styles.seriesPillText}>{seriesSummary}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.showTitleRow}>
          <Text style={styles.showTitle}>{show.title}</Text>
          <Pressable
            accessibilityLabel={saved ? "Remove saved show" : "Save show"}
            onPress={onToggleSaved}
            style={[styles.saveButton, saved ? styles.saveButtonActive : undefined]}
          >
            <Heart
              color={saved ? colors.paper : colors.coralDark}
              fill={saved ? colors.paper : "transparent"}
              size={17}
            />
          </Pressable>
        </View>
        <Text style={styles.showCompany}>{show.artistOrCompany}</Text>
        <Text style={styles.showVenue}>
          {show.venue} · {show.neighborhood}
        </Text>
        <Text style={styles.showDescription}>{show.description}</Text>

        <View style={styles.vibeRow}>
          {show.vibe.slice(0, 3).map((vibe) => (
            <View key={vibe} style={styles.vibePill}>
              <Text style={styles.vibeText}>{vibe}</Text>
            </View>
          ))}
        </View>

        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.fromLabel}>
              {bestOffer?.deal ? "Deal from" : bestOffer?.priceCents === undefined ? "Tickets" : "From"}
            </Text>
            <View style={styles.priceRow}>
              {bestOffer?.priceCents !== undefined && bestOffer.listPriceCents ? (
                <Text style={styles.listPriceText}>{formatMoney(bestOffer.listPriceCents)}</Text>
              ) : null}
              <Text style={styles.priceText}>
                {getOfferPriceCopy(bestOffer)}
              </Text>
            </View>
            {savings > 0 ? <Text style={styles.savingsText}>Save {formatMoney(savings)}</Text> : null}
          </View>
          <View style={styles.cardActions}>
            <Pressable accessibilityRole="button" onPress={onOpenDetails} style={styles.detailsButton}>
              <Text style={styles.detailsButtonText}>Details</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

async function openExternalTicketLink(intent: TicketLinkIntent) {
  try {
    const canOpen = await Linking.canOpenURL(intent.url);

    if (!canOpen && Platform.OS !== "web") {
      throw new Error("Unsupported ticket link");
    }

    await Linking.openURL(intent.url);
  } catch {
    Alert.alert("Ticket link unavailable", "Try again from the venue or ticket provider site.");
  }
}

function ShowDetailModal({
  show,
  saved,
  onClose,
  onToggleSaved
}: {
  show: Show | null;
  saved: boolean;
  onClose: () => void;
  onToggleSaved: (showId: string) => void;
}) {
  const bestOffer = show ? getBestOffer(show) : undefined;
  const savings = getOfferSavings(bestOffer);
  const bestTicketLink = show ? getBestTicketLinkIntent(show) : undefined;

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={Boolean(show)}>
      <View style={styles.modalBackdrop}>
        <View style={styles.detailSheet}>
          {show ? (
            <>
              <View style={[styles.detailHero, { backgroundColor: show.imageTone }]}>
                <View style={styles.detailHeroTop}>
                  <Text style={styles.detailCategory}>{categoryLabels[show.category]}</Text>
                  <Pressable accessibilityLabel="Close details" onPress={onClose} style={styles.detailCloseButton}>
                    <X color={colors.paper} size={20} />
                  </Pressable>
                </View>
                <Text style={styles.detailTitle}>{show.title}</Text>
                <Text style={styles.detailCompany}>{show.artistOrCompany}</Text>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.detailContent}>
                  <View style={styles.detailMetaGrid}>
                    <View style={styles.detailMetaItem}>
                      <CalendarDays color={colors.teal} size={18} />
                      <Text style={styles.detailMetaText}>{formatShowDate(show.startsAt)}</Text>
                    </View>
                    <View style={styles.detailMetaItem}>
                      <MapPin color={colors.teal} size={18} />
                      <Text style={styles.detailMetaText}>
                        {show.venue} · {show.neighborhood}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.detailDescription}>{show.description}</Text>

                  <View style={styles.detailPillRow}>
                    <View style={styles.sourcePill}>
                      <Text style={styles.sourceText}>{sourceLabels[show.source]}</Text>
                    </View>
                    {show.vibe.map((vibe) => (
                      <View key={vibe} style={styles.vibePill}>
                        <Text style={styles.vibeText}>{vibe}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.detailSectionHeader}>
                    <Text style={styles.sectionTitle}>Price and deal signals</Text>
                    {bestOffer?.deal ? (
                      <View style={styles.dealPill}>
                        <BadgePercent color={colors.coralDark} size={13} />
                        <Text style={styles.dealPillText}>{bestOffer.deal.label}</Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.detailOfferList}>
                    {show.ticketOffers.map((offer) => {
                      const ticketLink = getTicketLinkIntent(show, offer);

                      return (
                        <Pressable
                          accessibilityRole={ticketLink ? "link" : undefined}
                          disabled={!ticketLink}
                          key={offer.id}
                          onPress={() => {
                            if (ticketLink) {
                              void openExternalTicketLink(ticketLink);
                            }
                          }}
                          style={[
                            styles.detailOfferRow,
                            ticketLink ? styles.detailOfferRowLinked : undefined
                          ]}
                        >
                          <View style={styles.detailOfferCopy}>
                            <Text style={styles.offerLabel}>{offer.label}</Text>
                            <Text style={styles.offerMeta}>
                              {getOfferMetaCopy(offer)}
                            </Text>
                            {offer.deal ? <Text style={styles.offerDealText}>{offer.deal.description}</Text> : null}
                          </View>
                          <View style={styles.offerPriceStack}>
                            {offer.priceCents !== undefined && offer.listPriceCents ? (
                              <Text style={styles.offerListPrice}>{formatMoney(offer.listPriceCents)}</Text>
                            ) : null}
                            <Text style={styles.offerPrice}>{getOfferPriceCopy(offer)}</Text>
                            {ticketLink ? <Text style={styles.offerActionText}>Tickets</Text> : null}
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </ScrollView>

              <View style={styles.detailFooter}>
                <View>
                  <Text style={styles.fromLabel}>
                    {bestOffer?.deal ? "Best deal" : bestOffer?.priceCents === undefined ? "Ticket link" : "From"}
                  </Text>
                  <View style={styles.priceRow}>
                    {bestOffer?.priceCents !== undefined && bestOffer.listPriceCents ? (
                      <Text style={styles.listPriceText}>{formatMoney(bestOffer.listPriceCents)}</Text>
                    ) : null}
                    <Text style={styles.priceText}>
                      {getOfferPriceCopy(bestOffer)}
                    </Text>
                  </View>
                  {savings > 0 ? <Text style={styles.savingsText}>Save {formatMoney(savings)}</Text> : null}
                </View>
                <View style={styles.detailFooterActions}>
                  {bestTicketLink ? (
                    <Pressable
                      accessibilityRole="link"
                      onPress={() => void openExternalTicketLink(bestTicketLink)}
                      style={styles.externalTicketButton}
                    >
                      <Ticket color={colors.paper} size={16} />
                      <Text style={styles.externalTicketButtonText}>Tickets</Text>
                    </Pressable>
                  ) : null}
                  <Pressable
                    accessibilityLabel={saved ? "Remove saved show" : "Save show"}
                    onPress={() => onToggleSaved(show.id)}
                    style={[styles.saveButton, saved ? styles.saveButtonActive : undefined]}
                  >
                    <Heart
                      color={saved ? colors.paper : colors.coralDark}
                      fill={saved ? colors.paper : "transparent"}
                      size={17}
                    />
                  </Pressable>
                </View>
              </View>
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.fog
  },
  appShell: {
    flex: 1,
    alignSelf: "center",
    width: "100%",
    maxWidth: 620,
    backgroundColor: colors.fog
  },
  content: {
    paddingBottom: 36
  },
  topBar: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingTop: Platform.OS === "android" ? spacing.xl : spacing.lg,
    paddingBottom: spacing.lg
  },
  kicker: {
    color: colors.coralDark,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0,
    textTransform: "uppercase"
  },
  title: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: 0,
    lineHeight: 35,
    maxWidth: 420,
    marginTop: spacing.xs
  },
  marketNote: {
    color: colors.mutedInk,
    fontSize: 13,
    lineHeight: 19,
    maxWidth: 420,
    marginTop: spacing.sm
  },
  logoMark: {
    alignItems: "center",
    justifyContent: "center",
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.ink
  },
  controls: {
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    zIndex: 4
  },
  areaButton: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 58,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.lg
  },
  areaButtonCopy: {
    flex: 1,
    minWidth: 0
  },
  areaButtonText: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "700"
  },
  areaButtonMeta: {
    color: colors.mutedInk,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 2
  },
  areaMenu: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    overflow: "hidden",
    ...shadows.card
  },
  areaOption: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 82,
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line
  },
  areaOptionCopy: {
    flex: 1,
    minWidth: 0
  },
  areaOptionHeader: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  areaOptionName: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "800"
  },
  areaOptionBadge: {
    color: colors.teal,
    borderRadius: radii.pill,
    backgroundColor: colors.tealSoft,
    fontSize: 11,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    textTransform: "uppercase"
  },
  areaOptionRegion: {
    color: colors.mutedInk,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 2
  },
  areaOptionNote: {
    color: colors.mutedInk,
    fontSize: 12,
    lineHeight: 17,
    marginTop: spacing.xs
  },
  nearMeButton: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 56,
    borderRadius: radii.md,
    backgroundColor: colors.teal,
    paddingHorizontal: spacing.lg
  },
  nearMeButtonLoading: {
    opacity: 0.72
  },
  nearMeCopy: {
    flex: 1,
    minWidth: 0
  },
  nearMeTitle: {
    color: colors.paper,
    fontSize: 15,
    fontWeight: "900"
  },
  nearMeMeta: {
    color: "#DFF1EE",
    fontSize: 12,
    marginTop: 2
  },
  searchBox: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 50,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.lg
  },
  searchInput: {
    flex: 1,
    color: colors.ink,
    fontSize: 16,
    minWidth: 0,
    paddingVertical: spacing.sm
  },
  marketSnapshot: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.line,
    paddingVertical: spacing.md
  },
  marketSnapshotHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md
  },
  marketSnapshotTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "900"
  },
  marketSnapshotMeta: {
    flexShrink: 1,
    color: colors.mutedInk,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right"
  },
  marketSnapshotStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.md
  },
  marketSnapshotStat: {
    flexGrow: 1,
    flexBasis: 92,
    minHeight: 56,
    justifyContent: "center",
    borderRadius: radii.sm,
    backgroundColor: colors.fog,
    paddingHorizontal: spacing.md
  },
  marketSnapshotValue: {
    color: colors.ink,
    fontSize: 19,
    fontWeight: "900"
  },
  marketSnapshotLabel: {
    color: colors.mutedInk,
    fontSize: 11,
    fontWeight: "800",
    marginTop: 2,
    textTransform: "uppercase"
  },
  providerStatus: {
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.fog,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  providerStatusLive: {
    borderColor: colors.teal,
    backgroundColor: colors.tealSoft
  },
  providerStatusWarning: {
    borderColor: "#F0C6B9",
    backgroundColor: "#FFF1EC"
  },
  providerStatusText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "900"
  },
  coverageAuditPanel: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.sm,
    borderBottomWidth: 1,
    borderColor: colors.line,
    paddingBottom: spacing.md
  },
  coverageAuditHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md
  },
  coverageAuditTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "900"
  },
  coverageAuditStatus: {
    flexShrink: 1,
    color: colors.teal,
    fontSize: 12,
    fontWeight: "900",
    textAlign: "right"
  },
  coverageAuditCopy: {
    color: colors.mutedInk,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
    marginTop: spacing.sm
  },
  accountPanel: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 66,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg
  },
  accountIconBadge: {
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.ink
  },
  accountCopy: {
    flex: 1,
    minWidth: 0
  },
  accountTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "900"
  },
  accountMeta: {
    color: colors.mutedInk,
    fontSize: 12,
    marginTop: 3
  },
  accountAction: {
    color: colors.teal,
    fontSize: 13,
    fontWeight: "900"
  },
  walletPanel: {
    marginTop: spacing.xl
  },
  walletHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingHorizontal: spacing.xl
  },
  walletCount: {
    color: colors.mutedInk,
    fontSize: 13,
    fontWeight: "800"
  },
  walletRail: {
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md
  },
  ticketWalletCard: {
    width: 276,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    padding: spacing.lg,
    ...shadows.card
  },
  ticketWalletTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md
  },
  ticketStub: {
    alignItems: "center",
    justifyContent: "center",
    width: 42,
    height: 42,
    borderRadius: radii.md,
    backgroundColor: colors.ink
  },
  ticketWalletCopy: {
    flex: 1,
    minWidth: 0
  },
  ticketWalletTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "900"
  },
  ticketWalletMeta: {
    color: colors.mutedInk,
    fontSize: 12,
    marginTop: 2
  },
  ticketWalletDetails: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    marginTop: spacing.lg
  },
  ticketWalletCode: {
    color: colors.teal,
    fontSize: 16,
    fontWeight: "900"
  },
  ticketWalletQuantity: {
    color: colors.mutedInk,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "right"
  },
  ticketHolderText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "800",
    marginTop: spacing.sm
  },
  barcodeBox: {
    borderRadius: radii.sm,
    backgroundColor: colors.fog,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.md
  },
  barcodeText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0
  },
  savedPanel: {
    marginTop: spacing.md
  },
  savedRail: {
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md
  },
  savedShowCard: {
    width: 188,
    minHeight: 146,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    padding: spacing.lg,
    overflow: "hidden"
  },
  savedShowStripe: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 5
  },
  savedShowCategory: {
    color: colors.coralDark,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  savedShowTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 21,
    marginTop: spacing.sm
  },
  savedShowMeta: {
    color: colors.mutedInk,
    fontSize: 12,
    marginTop: spacing.sm
  },
  savedShowPrice: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900",
    marginTop: spacing.md
  },
  filterHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xl
  },
  inlineTitle: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  inlineTitlePadded: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "800"
  },
  clearFilters: {
    color: colors.coralDark,
    fontSize: 14,
    fontWeight: "800"
  },
  categoryRail: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md
  },
  categoryChip: {
    alignItems: "flex-start",
    justifyContent: "center",
    minWidth: 112,
    minHeight: 54,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm
  },
  categoryChipActive: {
    borderColor: colors.teal,
    backgroundColor: colors.tealSoft
  },
  categoryChipText: {
    color: colors.mutedInk,
    fontSize: 14,
    fontWeight: "800"
  },
  categoryChipTextActive: {
    color: colors.teal
  },
  categoryChipMeta: {
    color: colors.mutedInk,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2
  },
  categoryChipMetaActive: {
    color: colors.teal
  },
  dateWindowRail: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md
  },
  dateWindowChip: {
    alignItems: "flex-start",
    justifyContent: "center",
    minWidth: 102,
    minHeight: 50,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm
  },
  dateWindowChipActive: {
    borderColor: colors.ink,
    backgroundColor: colors.ink
  },
  dateWindowText: {
    color: colors.mutedInk,
    fontSize: 13,
    fontWeight: "900"
  },
  dateWindowTextActive: {
    color: colors.paper
  },
  dateWindowMeta: {
    color: colors.mutedInk,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2
  },
  dateWindowMetaActive: {
    color: "#F8F3EA"
  },
  neighborhoodHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xs,
    marginBottom: spacing.sm
  },
  neighborhoodRail: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md
  },
  neighborhoodChip: {
    alignItems: "flex-start",
    justifyContent: "center",
    minWidth: 134,
    minHeight: 52,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm
  },
  neighborhoodChipActive: {
    borderColor: colors.teal,
    backgroundColor: colors.teal
  },
  neighborhoodText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "900"
  },
  neighborhoodTextActive: {
    color: colors.paper
  },
  neighborhoodMeta: {
    color: colors.mutedInk,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2
  },
  neighborhoodMetaActive: {
    color: "#F8F3EA"
  },
  priceFilterHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xl
  },
  priceFilterTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "900"
  },
  priceFilterMeta: {
    color: colors.mutedInk,
    fontSize: 12,
    fontWeight: "800"
  },
  priceFilterRail: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md
  },
  sortModeHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xl
  },
  sortModeTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "900"
  },
  sortModeMeta: {
    color: colors.mutedInk,
    fontSize: 12,
    fontWeight: "800"
  },
  sortModeRail: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md
  },
  signalPanel: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md
  },
  signalButton: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 60,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.md
  },
  signalButtonActive: {
    borderColor: colors.coral,
    backgroundColor: colors.coral
  },
  tasteButtonActive: {
    borderColor: colors.teal,
    backgroundColor: colors.teal
  },
  signalCopy: {
    flex: 1,
    minWidth: 0
  },
  signalTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "900"
  },
  signalTitleActive: {
    color: colors.paper
  },
  signalMeta: {
    color: colors.mutedInk,
    fontSize: 12,
    marginTop: 2
  },
  signalMetaActive: {
    color: "#F8F3EA"
  },
  dealAlertPanel: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 66,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg
  },
  dealAlertPanelActive: {
    borderColor: colors.coral,
    backgroundColor: colors.coral
  },
  dealAlertIconBadge: {
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8E6DC"
  },
  dealAlertIconBadgeActive: {
    backgroundColor: colors.coralDark
  },
  dealAlertCopy: {
    flex: 1,
    minWidth: 0
  },
  dealAlertTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "900"
  },
  dealAlertTitleActive: {
    color: colors.paper
  },
  dealAlertMeta: {
    color: colors.mutedInk,
    fontSize: 12,
    marginTop: 3
  },
  dealAlertMetaActive: {
    color: "#F8F3EA"
  },
  dealAlertAction: {
    color: colors.teal,
    fontSize: 13,
    fontWeight: "900"
  },
  dealAlertActionActive: {
    color: colors.paper
  },
  dealAlertRuleHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xl
  },
  dealAlertRuleTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "900"
  },
  dealAlertRuleMeta: {
    color: colors.mutedInk,
    fontSize: 12,
    fontWeight: "800"
  },
  dealAlertPriceRail: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md
  },
  dealAlertPriceChip: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 34,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.md
  },
  dealAlertPriceChipActive: {
    borderColor: colors.coral,
    backgroundColor: "#F8E6DC"
  },
  dealAlertPriceChipText: {
    color: colors.mutedInk,
    fontSize: 12,
    fontWeight: "900"
  },
  dealAlertPriceChipTextActive: {
    color: colors.coralDark
  },
  alertMatchPanel: {
    marginTop: spacing.xs
  },
  alertMatchRail: {
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md
  },
  alertMatchCard: {
    width: 202,
    minHeight: 142,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    padding: spacing.lg,
    overflow: "hidden"
  },
  alertMatchStripe: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 5
  },
  alertMatchLabel: {
    color: colors.coralDark,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  alertMatchTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 21,
    marginTop: spacing.sm
  },
  alertMatchMeta: {
    color: colors.mutedInk,
    fontSize: 12,
    marginTop: spacing.sm
  },
  alertMatchFooter: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginTop: spacing.md
  },
  alertMatchPrice: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900"
  },
  alertMatchSavings: {
    color: colors.coralDark,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "900",
    textAlign: "right"
  },
  notificationPanel: {
    marginTop: spacing.xs
  },
  notificationRail: {
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md
  },
  notificationCard: {
    width: 224,
    minHeight: 142,
    justifyContent: "space-between",
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    padding: spacing.lg
  },
  notificationCardUnread: {
    borderColor: colors.teal,
    backgroundColor: colors.tealSoft
  },
  notificationTopLine: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm
  },
  notificationStatus: {
    color: colors.mutedInk,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  notificationStatusUnread: {
    color: colors.teal
  },
  notificationChannel: {
    color: colors.mutedInk,
    flexShrink: 1,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  notificationTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 21,
    marginTop: spacing.md
  },
  notificationBody: {
    color: colors.mutedInk,
    fontSize: 13,
    lineHeight: 18,
    marginTop: spacing.sm
  },
  musicConnectionPanel: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 66,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg
  },
  musicConnectionPanelActive: {
    borderColor: colors.teal,
    backgroundColor: colors.tealSoft
  },
  musicConnectionPanelLoading: {
    opacity: 0.72
  },
  musicIconBadge: {
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.plum
  },
  musicConnectionCopy: {
    flex: 1,
    minWidth: 0
  },
  musicConnectionTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "900"
  },
  musicConnectionMeta: {
    color: colors.mutedInk,
    fontSize: 12,
    marginTop: 3
  },
  musicConnectionMetaError: {
    color: colors.coralDark,
    fontWeight: "800"
  },
  musicConnectionAction: {
    color: colors.teal,
    fontSize: 13,
    fontWeight: "900"
  },
  dealPanel: {
    marginTop: spacing.xs
  },
  dealRail: {
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md
  },
  dealCard: {
    width: 214,
    minHeight: 148,
    justifyContent: "space-between",
    borderRadius: radii.md,
    padding: spacing.lg
  },
  dealCardTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm
  },
  dealCardBadge: {
    color: colors.paper,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  dealCardSavings: {
    color: colors.paper,
    fontSize: 12,
    fontWeight: "900"
  },
  dealCardTitle: {
    color: colors.paper,
    fontSize: 19,
    fontWeight: "900",
    lineHeight: 23,
    marginTop: spacing.md
  },
  dealCardMeta: {
    color: "#F2ECE2",
    fontSize: 12,
    marginTop: spacing.sm
  },
  dealCardPrice: {
    color: colors.paper,
    fontSize: 24,
    fontWeight: "900",
    marginTop: spacing.sm
  },
  discoveryPickPanel: {
    marginTop: spacing.xs
  },
  discoveryPickRail: {
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md
  },
  discoveryPickCard: {
    width: 218,
    minHeight: 156,
    justifyContent: "space-between",
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    padding: spacing.lg,
    overflow: "hidden"
  },
  discoveryPickStripe: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 5
  },
  discoveryPickTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginTop: spacing.xs
  },
  discoveryPickLabel: {
    color: colors.teal,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  discoveryPickSource: {
    color: colors.mutedInk,
    flexShrink: 1,
    fontSize: 11,
    fontWeight: "800",
    textAlign: "right"
  },
  discoveryPickTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 22,
    marginTop: spacing.md
  },
  discoveryPickReason: {
    color: colors.mutedInk,
    fontSize: 12,
    lineHeight: 16,
    marginTop: spacing.sm
  },
  discoveryPickFooter: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    marginTop: spacing.md
  },
  discoveryPickDate: {
    color: colors.mutedInk,
    flex: 1,
    fontSize: 12,
    fontWeight: "800"
  },
  discoveryPickPrice: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "900"
  },
  recommendationPanel: {
    marginTop: spacing.sm
  },
  recommendationEmptyPanel: {
    marginTop: spacing.sm
  },
  recommendationEmptyCopy: {
    color: colors.mutedInk,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md
  },
  recommendationRail: {
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md
  },
  recommendationCard: {
    width: 196,
    minHeight: 126,
    justifyContent: "space-between",
    borderRadius: radii.md,
    backgroundColor: colors.ink,
    padding: spacing.lg
  },
  recommendationCategory: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  recommendationTitle: {
    color: colors.paper,
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 22,
    marginTop: spacing.sm
  },
  recommendationMeta: {
    color: "#D7D9D9",
    fontSize: 13,
    marginTop: spacing.sm
  },
  activeFilterPanel: {
    marginTop: spacing.md,
    marginBottom: spacing.xs
  },
  activeFilterHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm
  },
  activeFilterTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "900"
  },
  activeFilterReset: {
    color: colors.coralDark,
    fontSize: 13,
    fontWeight: "900"
  },
  activeFilterRail: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm
  },
  activeFilterChip: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 34,
    maxWidth: 180,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.teal,
    backgroundColor: colors.tealSoft,
    paddingHorizontal: spacing.md
  },
  activeFilterChipText: {
    color: colors.teal,
    fontSize: 12,
    fontWeight: "900"
  },
  resultsHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.md,
    marginBottom: spacing.sm
  },
  resultCount: {
    color: colors.mutedInk,
    fontSize: 13,
    marginTop: 3
  },
  discountBadge: {
    borderRadius: radii.pill,
    backgroundColor: "#F8E6DC",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  discountBadgeText: {
    color: colors.coralDark,
    fontSize: 12,
    fontWeight: "900"
  },
  providerNotice: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "#F0C6B9",
    backgroundColor: "#FFF1EC",
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  providerNoticeText: {
    color: colors.coralDark,
    fontSize: 13,
    fontWeight: "800"
  },
  refreshingText: {
    color: colors.mutedInk,
    fontSize: 12,
    fontWeight: "800",
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm
  },
  showList: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xl
  },
  loadMoreButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 58,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.teal,
    backgroundColor: colors.tealSoft,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  loadMoreButtonDisabled: {
    opacity: 0.65
  },
  loadMoreButtonText: {
    color: colors.teal,
    fontSize: 15,
    fontWeight: "900"
  },
  loadMoreButtonMeta: {
    color: colors.mutedInk,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 3
  },
  resultSection: {
    gap: spacing.sm
  },
  resultSectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md
  },
  resultSectionTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "900"
  },
  resultSectionCount: {
    color: colors.mutedInk,
    fontSize: 12,
    fontWeight: "800"
  },
  resultSectionList: {
    gap: spacing.md
  },
  loadingState: {
    alignItems: "center",
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    gap: spacing.sm,
    padding: spacing.xl
  },
  loadingTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "900"
  },
  showCard: {
    flexDirection: "row",
    borderRadius: radii.md,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: "hidden",
    ...shadows.card
  },
  showAccent: {
    width: 56,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.teal
  },
  showAccentText: {
    color: colors.paper,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    transform: [{ rotate: "-90deg" }]
  },
  showBody: {
    flex: 1,
    minWidth: 0,
    padding: spacing.lg
  },
  showMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md
  },
  inlineMeta: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: spacing.xs,
    minWidth: 0
  },
  showMetaText: {
    color: colors.teal,
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "800"
  },
  distance: {
    color: colors.mutedInk,
    fontSize: 13,
    fontWeight: "800"
  },
  sourceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.sm
  },
  sourcePill: {
    borderRadius: radii.pill,
    backgroundColor: colors.fog,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5
  },
  sourceText: {
    color: colors.mutedInk,
    fontSize: 11,
    fontWeight: "800"
  },
  dealPill: {
    alignItems: "center",
    flexDirection: "row",
    gap: 3,
    borderRadius: radii.pill,
    backgroundColor: "#F8E6DC",
    paddingHorizontal: spacing.sm,
    paddingVertical: 5
  },
  dealPillText: {
    color: colors.coralDark,
    fontSize: 11,
    fontWeight: "900"
  },
  seriesPill: {
    borderRadius: radii.pill,
    backgroundColor: colors.tealSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5
  },
  seriesPillText: {
    color: colors.teal,
    fontSize: 11,
    fontWeight: "900"
  },
  showTitleRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.sm
  },
  showTitle: {
    color: colors.ink,
    flex: 1,
    fontSize: 21,
    fontWeight: "900",
    lineHeight: 25
  },
  saveButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F8E6DC"
  },
  saveButtonActive: {
    backgroundColor: colors.coral
  },
  showCompany: {
    color: colors.plum,
    fontSize: 15,
    fontWeight: "800",
    marginTop: 2
  },
  showVenue: {
    color: colors.mutedInk,
    fontSize: 14,
    marginTop: spacing.xs
  },
  showDescription: {
    color: colors.ink,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.md
  },
  vibeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.md
  },
  vibePill: {
    borderRadius: radii.pill,
    backgroundColor: colors.fog,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5
  },
  vibeText: {
    color: colors.mutedInk,
    fontSize: 12,
    fontWeight: "700"
  },
  cardFooter: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    marginTop: spacing.lg
  },
  cardActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  fromLabel: {
    color: colors.mutedInk,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  priceRow: {
    alignItems: "baseline",
    flexDirection: "row",
    gap: spacing.xs
  },
  listPriceText: {
    color: colors.mutedInk,
    fontSize: 13,
    fontWeight: "800",
    textDecorationLine: "line-through"
  },
  priceText: {
    color: colors.ink,
    fontSize: 19,
    fontWeight: "900"
  },
  savingsText: {
    color: colors.coralDark,
    fontSize: 12,
    fontWeight: "900",
    marginTop: 2
  },
  detailsButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.md
  },
  detailsButtonText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "900"
  },
  buyButton: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.xs,
    minHeight: 44,
    borderRadius: radii.md,
    backgroundColor: colors.coral,
    paddingHorizontal: spacing.lg
  },
  buyButtonDisabled: {
    opacity: 0.45
  },
  buyButtonText: {
    color: colors.paper,
    fontSize: 15,
    fontWeight: "900"
  },
  emptyState: {
    alignItems: "center",
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    padding: spacing.xl
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900",
    marginTop: spacing.md
  },
  emptyCopy: {
    color: colors.mutedInk,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginTop: spacing.xs
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(23, 28, 36, 0.42)"
  },
  detailSheet: {
    maxHeight: "90%",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: colors.paper,
    overflow: "hidden"
  },
  detailHero: {
    padding: spacing.xl
  },
  detailHeroTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md
  },
  detailCategory: {
    color: colors.paper,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  detailCloseButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.18)"
  },
  detailTitle: {
    color: colors.paper,
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 33,
    marginTop: spacing.lg
  },
  detailCompany: {
    color: "#F8F3EA",
    fontSize: 15,
    fontWeight: "800",
    marginTop: spacing.xs
  },
  detailContent: {
    padding: spacing.xl
  },
  detailMetaGrid: {
    gap: spacing.sm
  },
  detailMetaItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  detailMetaText: {
    color: colors.ink,
    flex: 1,
    fontSize: 14,
    fontWeight: "800"
  },
  detailDescription: {
    color: colors.ink,
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.lg
  },
  detailPillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.lg
  },
  detailSectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    marginTop: spacing.xl
  },
  detailOfferList: {
    gap: spacing.sm,
    marginTop: spacing.md
  },
  detailOfferRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg
  },
  detailOfferRowLinked: {
    borderColor: colors.teal,
    backgroundColor: colors.tealSoft
  },
  detailOfferCopy: {
    flex: 1,
    minWidth: 0
  },
  detailFooter: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    backgroundColor: colors.paper,
    padding: spacing.xl
  },
  detailFooterActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  externalTicketButton: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.xs,
    minHeight: 38,
    borderRadius: radii.pill,
    backgroundColor: colors.teal,
    paddingHorizontal: spacing.md
  },
  externalTicketButtonText: {
    color: colors.paper,
    fontSize: 13,
    fontWeight: "900"
  },
  checkoutSheet: {
    maxHeight: "86%",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: colors.paper,
    padding: spacing.xl
  },
  sheetHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.lg
  },
  sheetEyebrow: {
    color: colors.teal,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  sheetTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 27,
    marginTop: spacing.xs
  },
  iconButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.fog
  },
  offerList: {
    gap: spacing.sm,
    marginTop: spacing.xl
  },
  offerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    minHeight: 64,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg
  },
  offerRowActive: {
    borderColor: colors.teal,
    backgroundColor: colors.tealSoft
  },
  offerLabel: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "900"
  },
  offerMeta: {
    color: colors.mutedInk,
    fontSize: 12,
    marginTop: 3
  },
  offerDealText: {
    color: colors.coralDark,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 5
  },
  offerPriceStack: {
    alignItems: "flex-end"
  },
  offerListPrice: {
    color: colors.mutedInk,
    fontSize: 12,
    fontWeight: "800",
    textDecorationLine: "line-through"
  },
  offerPrice: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "900"
  },
  offerActionText: {
    color: colors.teal,
    fontSize: 11,
    fontWeight: "900",
    marginTop: 4,
    textTransform: "uppercase"
  },
  quantityRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.xl
  },
  quantityLabel: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "900"
  },
  stepper: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md
  },
  stepperButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.fog
  },
  stepperButtonDisabled: {
    opacity: 0.38
  },
  plusText: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: "600",
    lineHeight: 28
  },
  quantityValue: {
    color: colors.ink,
    minWidth: 22,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "900"
  },
  totalsBox: {
    borderRadius: radii.md,
    backgroundColor: colors.fog,
    padding: spacing.lg,
    gap: spacing.sm,
    marginTop: spacing.xl
  },
  totalLine: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  totalLabel: {
    color: colors.mutedInk,
    fontSize: 14
  },
  totalValue: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800"
  },
  dealTotalLabel: {
    color: colors.coralDark,
    fontSize: 14,
    fontWeight: "900"
  },
  dealTotalValue: {
    color: colors.coralDark,
    fontSize: 14,
    fontWeight: "900"
  },
  totalDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.line,
    marginVertical: spacing.xs
  },
  grandTotalLabel: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "900"
  },
  grandTotalValue: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900"
  },
  errorText: {
    color: colors.coralDark,
    fontSize: 13,
    fontWeight: "700",
    marginTop: spacing.md
  },
  primaryCheckoutButton: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.sm,
    minHeight: 52,
    borderRadius: radii.md,
    backgroundColor: colors.ink,
    marginTop: spacing.xl
  },
  loadingButton: {
    opacity: 0.78
  },
  primaryCheckoutText: {
    color: colors.paper,
    fontSize: 16,
    fontWeight: "900"
  },
  confirmationBox: {
    alignItems: "center",
    borderRadius: radii.md,
    backgroundColor: colors.tealSoft,
    padding: spacing.xl,
    marginTop: spacing.xl
  },
  confirmationTitle: {
    color: colors.ink,
    fontSize: 21,
    fontWeight: "900",
    marginTop: spacing.md
  },
  confirmationCopy: {
    color: colors.mutedInk,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.xs,
    textAlign: "center"
  }
});
