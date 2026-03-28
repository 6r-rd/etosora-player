import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Info, ChevronsRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SimpleDatePicker } from "@/components/ui/simple-date-picker";
import { HoverPopover } from "@/components/ui/hover-popover";
import { createChildLogger, createNamespacedLogger } from "@/lib/debug";
import { getDescriptionPreview } from "@/lib/descriptionPreview";
import { registerSwipeCallback } from "@/lib/swipeDetection";

const logger = createNamespacedLogger("ui:sidebar");
const searchLogger = createChildLogger(logger, "search");
const sortLogger = createChildLogger(logger, "sort");

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;
const sidebarCacheKey = "etosora-player-sidebar-data-v1";

interface SongItem {
  song_id: string;
  title: string;
  artist_ids: string[];
  artist_name?: string;
  artist_names?: string[];
  count?: number;
  description?: string;
}

interface VideoItem {
  video_id: string;
  title: string;
  start_datetime: string;
  thumbnail_url: string;
  timestamps?: Array<{
    song_id: string;
    time: number;
    original_time: string;
  }>;
}

interface SidebarData {
  songs: SongItem[];
  videos: VideoItem[];
  artists: Record<string, string>;
}

interface SidebarProps {
  dataUrl: string;
  onSelectVideo?: (videoId: string) => void;
  onSelectSong?: (songId: string) => void;
  defaultTab?: "archives" | "songs";
}

export function Sidebar({
  dataUrl,
  onSelectVideo,
  onSelectSong,
  defaultTab = "archives",
}: SidebarProps) {
  const [data, setData] = useState<SidebarData | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [archivesSortOption, setArchivesSortOption] =
    useState<string>("newest");
  const [songsSortOption, setSongsSortOption] =
    useState<string>("most-played");
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);

  useIsomorphicLayoutEffect(() => {
    if (data || typeof window === "undefined") {
      return;
    }

    const cached = sessionStorage.getItem(sidebarCacheKey);
    if (!cached) {
      return;
    }

    try {
      const payload = JSON.parse(cached) as SidebarData;
      setData(payload);
    } catch (error) {
      sessionStorage.removeItem(sidebarCacheKey);
      logger.warn("Failed to parse cached sidebar data", error);
    }
  }, [data]);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const response = await fetch(dataUrl, { cache: "no-cache" });
        if (!response.ok) {
          throw new Error(`Failed to load sidebar data: ${response.status}`);
        }

        const payload = (await response.json()) as SidebarData;
        if (!isMounted) {
          return;
        }

        setData(payload);
        setDataError(null);

        if (typeof window !== "undefined") {
          sessionStorage.setItem(sidebarCacheKey, JSON.stringify(payload));
        }
      } catch (error) {
        logger.error("Failed to load sidebar data", error);
        if (!isMounted) {
          return;
        }

        setDataError("サイドバーのデータ読み込みに失敗しました。");
        setData({ songs: [], videos: [], artists: {} });
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [dataUrl]);

  const songs = data?.songs ?? [];
  const videos = data?.videos ?? [];
  const artists = data?.artists ?? {};
  const isLoading = !data && !dataError;

  const handleSheetOpenChange = (open: boolean) => {
    setIsOpen(open);

    if (open) {
      setTimeout(() => {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      }, 100);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setHasHydrated(true);

    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const updateIsMobile = (event?: MediaQueryListEvent) => {
      const matches = event ? event.matches : mediaQuery.matches;
      setIsMobile(matches);
      if (!matches) {
        setIsOpen(false);
      }
    };

    updateIsMobile();
    mediaQuery.addEventListener("change", updateIsMobile);

    return () => {
      mediaQuery.removeEventListener("change", updateIsMobile);
    };
  }, []);

  useEffect(() => {
    if (!isMobile) {
      return;
    }

    const unregister = registerSwipeCallback(() =>
      handleSheetOpenChange(true),
    );
    return unregister;
  }, [isMobile]);

  const normalizeText = (text: string) => {
    if (!text) {
      return "";
    }

    return text.normalize("NFC").toLocaleLowerCase("ja");
  };

  const filteredVideos = videos.filter((video) => {
    if (searchQuery) {
      const normalizedQuery = normalizeText(searchQuery);
      if (!normalizeText(video.title).includes(normalizedQuery)) {
        return false;
      }
    }

    if (fromDate || toDate) {
      const videoDate = new Date(video.start_datetime);

      if (fromDate && videoDate < fromDate) {
        return false;
      }

      if (toDate) {
        const endOfDay = new Date(toDate);
        endOfDay.setHours(23, 59, 59, 999);

        if (videoDate > endOfDay) {
          return false;
        }
      }
    }

    return true;
  });

  const filteredSongs = songs.filter((song) => {
    if (searchQuery) {
      const normalizedQuery = normalizeText(searchQuery);
      const artistNames =
        song.artist_ids?.map((id) => artists[id] || "").filter(Boolean) || [];
      const artistNamesString = artistNames.join(", ");

      if (
        !normalizeText(song.title).includes(normalizedQuery) &&
        !normalizeText(artistNamesString).includes(normalizedQuery)
      ) {
        return false;
      }
    }

    if (fromDate || toDate) {
      const songVideos = videos.filter(
        (video) =>
          video.timestamps?.some((timestamp) => timestamp.song_id === song.song_id) ||
          false,
      );

      const inDateRange = songVideos.some((video) => {
        const videoDate = new Date(video.start_datetime);

        if (fromDate && videoDate < fromDate) {
          return false;
        }

        if (toDate) {
          const endOfDay = new Date(toDate);
          endOfDay.setHours(23, 59, 59, 999);

          if (videoDate > endOfDay) {
            return false;
          }
        }

        return true;
      });

      if (!inDateRange) {
        return false;
      }
    }

    return true;
  });

  useEffect(() => {
    const songsWithDesc = songs.filter((song) => song.description);
    logger.log("Songs with descriptions:", songsWithDesc);

    if (searchQuery) {
      searchLogger.log("Search query:", searchQuery);
      searchLogger.log("Filtered songs:", filteredSongs);
    }
  }, [filteredSongs, searchQuery, songs]);

  const filteredSongCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    videos.forEach((video) => {
      if (fromDate || toDate) {
        const videoDate = new Date(video.start_datetime);

        if (fromDate && videoDate < fromDate) {
          return;
        }

        if (toDate) {
          const endOfDay = new Date(toDate);
          endOfDay.setHours(23, 59, 59, 999);

          if (videoDate > endOfDay) {
            return;
          }
        }
      }

      video.timestamps?.forEach((timestamp) => {
        const songId = timestamp.song_id;
        counts[songId] = (counts[songId] || 0) + 1;
      });
    });

    return counts;
  }, [fromDate, toDate, videos]);

  const songLastSungTimes = useMemo(() => {
    const map: Record<string, number> = {};

    videos.forEach((video) => {
      const videoDate = new Date(video.start_datetime);

      if (fromDate && videoDate < fromDate) {
        return;
      }

      if (toDate) {
        const endOfDay = new Date(toDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (videoDate > endOfDay) {
          return;
        }
      }

      const startTime = videoDate.getTime();
      if (Number.isNaN(startTime)) {
        return;
      }

      video.timestamps?.forEach((timestamp) => {
        const offsetSeconds =
          typeof timestamp.time === "number" ? timestamp.time : 0;
        const absoluteTime = startTime + offsetSeconds * 1000;
        const existing = map[timestamp.song_id];

        if (existing === undefined || absoluteTime > existing) {
          map[timestamp.song_id] = absoluteTime;
        }
      });
    });

    return map;
  }, [fromDate, toDate, videos]);

  const sortedSongs = [...filteredSongs].sort((a, b) => {
    const aCount = filteredSongCounts[a.song_id] || 0;
    const bCount = filteredSongCounts[b.song_id] || 0;
    const aLast = songLastSungTimes[a.song_id];
    const bLast = songLastSungTimes[b.song_id];

    switch (songsSortOption) {
      case "least-played":
        return aCount - bCount;
      case "last-sung-newest":
        return (
          (bLast ?? Number.NEGATIVE_INFINITY) -
          (aLast ?? Number.NEGATIVE_INFINITY)
        );
      case "last-sung-oldest":
        return (
          (aLast ?? Number.POSITIVE_INFINITY) -
          (bLast ?? Number.POSITIVE_INFINITY)
        );
      case "most-played":
      default:
        return bCount - aCount;
    }
  });

  useEffect(() => {
    sortLogger.log("Sorted songs:", sortedSongs);
    sortLogger.log("Filtered song counts:", filteredSongCounts);

    if (sortedSongs.length > 0) {
      const firstFewSongs = sortedSongs.slice(0, 5);
      sortLogger.log("First few songs with counts:");
      firstFewSongs.forEach((song) => {
        sortLogger.log(
          `Song: ${song.title}, ID: ${song.song_id}, Count: ${filteredSongCounts[song.song_id] || 0}`,
        );
      });
    }
  }, [filteredSongCounts, sortedSongs]);

  const sortedVideos = [...filteredVideos].sort((a, b) => {
    if (archivesSortOption === "newest") {
      return (
        new Date(b.start_datetime).getTime() -
        new Date(a.start_datetime).getTime()
      );
    }

    return (
      new Date(a.start_datetime).getTime() -
      new Date(b.start_datetime).getTime()
    );
  });

  const sidebarContent = (
    <>
      <div className="px-4 py-4 space-y-4">
        {dataError && <p className="text-sm text-destructive">{dataError}</p>}
        <Input
          placeholder="検索..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="w-full bg-popover dark:bg-card"
          autoFocus={false}
          tabIndex={-1}
        />

        <div className="flex gap-2 items-center w-full">
          <div className="flex-1">
            <SimpleDatePicker
              date={fromDate}
              setDate={setFromDate}
              placeholder="From"
              className="w-full"
            />
          </div>
          <span className="text-muted-foreground px-1">-</span>
          <div className="flex-1">
            <SimpleDatePicker
              date={toDate}
              setDate={setToDate}
              placeholder="To"
              className="w-full"
              mobileAlign="right"
            />
          </div>
        </div>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full mt-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="archives">Archives</TabsTrigger>
          <TabsTrigger value="songs">Songs</TabsTrigger>
        </TabsList>

        <TabsContent value="archives" className="mt-2">
          <div className="px-4 py-2">
            <Select
              value={archivesSortOption}
              onValueChange={setArchivesSortOption}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="並び替え" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">日時 - 降順</SelectItem>
                <SelectItem value="oldest">日時 - 昇順</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="h-[calc(100vh-16rem)]">
            <div className="space-y-2 p-2">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={`video-skeleton-${index}`}
                    className="h-28 rounded-md border bg-muted/40 animate-pulse"
                  />
                ))
              ) : (
                sortedVideos.map((video) => (
                  <div
                    key={video.video_id}
                    onClick={() =>
                      onSelectVideo
                        ? onSelectVideo(video.video_id)
                        : (window.location.href = `${import.meta.env.BASE_URL}/video/${video.video_id}`)
                    }
                    className="block cursor-pointer"
                  >
                    <Card className="overflow-hidden transition-colors hover:bg-muted/50">
                      <div className="w-full h-auto overflow-hidden">
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="w-full object-contain"
                          loading="lazy"
                        />
                      </div>
                      <CardContent className="p-3">
                        <h3 className="line-clamp-2 text-sm font-medium">
                          {video.title}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {new Date(video.start_datetime).toLocaleDateString(
                            "ja-JP",
                          )}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                ))
              )}

              {!isLoading && filteredVideos.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  動画が見つかりませんでした
                </p>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="songs" className="mt-2">
          <div className="px-4 py-2">
            <Select value={songsSortOption} onValueChange={setSongsSortOption}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="並び替え" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="most-played">歌った回数 - 降順</SelectItem>
                <SelectItem value="least-played">歌った回数 - 昇順</SelectItem>
                <SelectItem value="last-sung-newest">
                  最後に歌った日時 - 降順
                </SelectItem>
                <SelectItem value="last-sung-oldest">
                  最後に歌った日時 - 昇順
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="h-[calc(100vh-16rem)]">
            <div className="p-2">
              <div className="border-b mb-2">
                <div className="grid grid-cols-[1fr_60px] gap-2 px-4 py-2 font-medium">
                  <div>曲名</div>
                  <div className="text-right">歌った回数</div>
                </div>
              </div>

              {isLoading ? (
                Array.from({ length: 12 }).map((_, index) => (
                  <div
                    key={`song-skeleton-${index}`}
                    className="h-12 rounded-md border bg-muted/40 animate-pulse mb-2"
                  />
                ))
              ) : (
                sortedSongs.map((song) => {
                  const descriptionPreview = song.description
                    ? getDescriptionPreview(song.description)
                    : null;
                  const descriptionText = descriptionPreview?.text || "関連リンク";
                  const thumbnailCandidates =
                    descriptionPreview?.youtubeThumbnailCandidates || [];
                  const hasExternalLink = Boolean(descriptionPreview?.firstUrl);

                  return (
                    <div
                      key={song.song_id}
                      className="grid grid-cols-[1fr_60px] gap-2 px-4 py-2 hover:bg-muted/50 cursor-pointer border-b"
                      onClick={() =>
                        onSelectSong
                          ? onSelectSong(song.song_id)
                          : (window.location.href = `${import.meta.env.BASE_URL}/song/${song.song_id}`)
                      }
                    >
                      <div>
                        <div className="font-medium flex items-center">
                          {song.title}
                          {song.description && descriptionPreview && (
                            <HoverPopover
                              side="right"
                              align="start"
                              contentClassName={`w-[320px] max-w-[calc(100vw-2rem)] p-0 overflow-hidden ${hasExternalLink ? "" : "cursor-default"}`}
                              onContentClick={(event: ReactMouseEvent) => {
                                event.stopPropagation();
                                if (descriptionPreview.firstUrl) {
                                  window.open(
                                    descriptionPreview.firstUrl,
                                    "_blank",
                                    "noopener,noreferrer",
                                  );
                                }
                              }}
                              content={
                                <div className="w-full">
                                  <p className="px-3 py-2 text-sm whitespace-pre-wrap break-words">
                                    {descriptionText}
                                  </p>
                                  {thumbnailCandidates.length > 0 && (
                                    <div className="aspect-video w-full overflow-hidden bg-muted">
                                      <img
                                        src={thumbnailCandidates[0]}
                                        alt="YouTube cover thumbnail"
                                        className="h-full w-full object-cover"
                                        loading="lazy"
                                        data-thumbnail-index="0"
                                        onError={(event) => {
                                          const image = event.currentTarget;
                                          const currentIndex = Number(
                                            image.dataset.thumbnailIndex || "0",
                                          );
                                          const nextIndex = currentIndex + 1;

                                          if (
                                            nextIndex < thumbnailCandidates.length
                                          ) {
                                            image.dataset.thumbnailIndex = `${nextIndex}`;
                                            image.src =
                                              thumbnailCandidates[nextIndex];
                                            return;
                                          }

                                          const thumbnailWrapper =
                                            image.parentElement;
                                          if (thumbnailWrapper) {
                                            thumbnailWrapper.classList.add(
                                              "hidden",
                                            );
                                          }
                                        }}
                                      />
                                    </div>
                                  )}
                                </div>
                              }
                            >
                              <span className="inline-block ml-2 cursor-pointer">
                                <Info className="h-4 w-4 text-blue-500" />
                              </span>
                            </HoverPopover>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {(() => {
                            if (song.artist_ids && song.artist_ids.length > 0) {
                              const names = song.artist_ids
                                .map((id) => artists[id] || "")
                                .filter(Boolean);
                              return names.length > 0 ? names.join(", ") : "";
                            }

                            if (song.artist_names && song.artist_names.length > 0) {
                              return song.artist_names.join(", ");
                            }

                            if (song.artist_name) {
                              return song.artist_name;
                            }

                            return "";
                          })()}
                        </div>
                      </div>
                      <div className="text-right self-center">
                        {filteredSongCounts[song.song_id] || 0}
                      </div>
                    </div>
                  );
                })
              )}

              {!isLoading && filteredSongs.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  曲が見つかりませんでした
                </p>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </>
  );

  if (!isMobile) {
    return <div className={hasHydrated ? "" : "hidden md:block"}>{sidebarContent}</div>;
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={handleSheetOpenChange}>
        <SheetContent side="left" className="w-[80vw] sm:w-[350px]">
          {sidebarContent}
        </SheetContent>
      </Sheet>

      {hasHydrated && (
        <div
          className="fixed left-0 top-16 bottom-0 w-10 z-10"
          onClick={() => handleSheetOpenChange(true)}
        >
          <div className="absolute top-1/2 -translate-y-1/2 left-0 bg-primary/90 rounded-r-lg p-2 shadow-md">
            <ChevronsRight className="h-6 w-6 text-background" />
          </div>
        </div>
      )}
    </>
  );
}
