import { useCallback, useEffect, useState } from 'react';
import { AdminDashboard } from './components/AdminDashboard';
import { ContributionForm } from './components/ContributionForm';
import { DetailModal } from './components/DetailModal';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ScrapbookWall } from './components/ScrapbookWall';
import { ShareModal } from './components/ShareModal';
import { SuccessScreen } from './components/SuccessScreen';
import { isSupabaseConfigured } from './lib/supabase';
import { fetchWallAndPosts, subscribeWallEvents, togglePostLike } from './services/api';
import { DEFAULT_WALL_ID, type ScrapbookPost, type Wall } from './types/scrapbook';

interface RouteState {
  view: 'public' | 'admin';
  wallId: string;
}

function parseRoute(pathname: string): RouteState {
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const parts = pathname.split('/').filter(Boolean);
    return { view: 'admin', wallId: parts[1] || DEFAULT_WALL_ID };
  }
  if (pathname.startsWith('/wall/')) {
    const rawSlug = pathname.slice('/wall/'.length).split('/')[0] || '';
    let slug = rawSlug;
    try {
      slug = decodeURIComponent(rawSlug);
    } catch {
      slug = rawSlug;
    }
    return { view: 'public', wallId: slug || DEFAULT_WALL_ID };
  }
  return { view: 'public', wallId: DEFAULT_WALL_ID };
}

export default function App() {
  // Deterministic initial route so first render never reads window.location synchronously
  const [route, setRoute] = useState<RouteState>({
    view: 'public',
    wallId: DEFAULT_WALL_ID,
  });
  const [isRouteReady, setIsRouteReady] = useState(false);
  const [wall, setWall] = useState<Wall | null>(null);
  const [posts, setPosts] = useState<ScrapbookPost[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(
    isSupabaseConfigured
      ? null
      : 'Chưa cấu hình kết nối Supabase. Vui lòng thiết lập VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY.',
  );

  const [formOpen, setFormOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // Sync route from browser pathname after mount & listen to back/forward navigation
  useEffect(() => {
    const syncRoute = () => {
      setRoute(parseRoute(window.location.pathname));
      setIsRouteReady(true);
    };
    syncRoute();
    window.addEventListener('popstate', syncRoute);
    return () => window.removeEventListener('popstate', syncRoute);
  }, []);

  const navigateTo = useCallback((path: string) => {
    window.history.pushState({}, '', path);
    setRoute(parseRoute(path));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const loadPublicWall = useCallback(async (wallId: string, silent = false) => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      setError(
        'Chưa cấu hình kết nối Supabase. Vui lòng thiết lập VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY.',
      );
      return;
    }
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const data = await fetchWallAndPosts(wallId);
      setWall(data.wall);
      setPosts(data.posts);
    } catch (err) {
      if (!silent) {
        setError(
          err instanceof Error ? err.message : 'Không thể tải bức tường lưu bút lúc này.',
        );
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Load wall data and subscribe to Supabase Realtime updates once mounted on public view
  useEffect(() => {
    if (!isRouteReady || route.view !== 'public') return;
    loadPublicWall(route.wallId);

    if (!isSupabaseConfigured) return;

    const unsubscribe = subscribeWallEvents(route.wallId, (evt) => {
      if (evt.type === 'post-created') {
        const incoming = evt.payload;
        setPosts((prev) => {
          if (prev.some((p) => p.postId === incoming.postId)) return prev;
          return [incoming, ...prev];
        });
      } else if (evt.type === 'post-updated') {
        const { post: updated, isHidden } = evt.payload;
        if (isHidden) {
          setPosts((prev) => prev.filter((p) => p.postId !== updated.postId));
        } else {
          setPosts((prev) => {
            const exists = prev.some((p) => p.postId === updated.postId);
            if (!exists) {
              // Post was restored by admin — insert and sort newest-first
              return [updated, ...prev].sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
              );
            }
            // Preserve local visitor's likedByMe state while syncing live likeCount/content
            return prev.map((p) =>
              p.postId === updated.postId
                ? { ...updated, likedByMe: p.likedByMe }
                : p,
            );
          });
        }
      } else if (evt.type === 'post-deleted') {
        const { postId } = evt.payload;
        setPosts((prev) => prev.filter((p) => p.postId !== postId));
      } else if (evt.type === 'wall-updated') {
        setWall(evt.payload);
      }
    });

    return () => unsubscribe();
  }, [route.view, route.wallId, loadPublicWall]);

  const handleToggleLike = useCallback(
    async (postId: string) => {
      // Optimistic toggle
      setPosts((prev) =>
        prev.map((p) =>
          p.postId === postId
            ? {
                ...p,
                likedByMe: !p.likedByMe,
                likeCount: Math.max(0, p.likeCount + (p.likedByMe ? -1 : 1)),
              }
            : p,
        ),
      );
      try {
        const result = await togglePostLike(route.wallId, postId);
        setPosts((prev) =>
          prev.map((p) =>
            p.postId === postId
              ? { ...p, likeCount: result.likeCount, likedByMe: result.likedByMe }
              : p,
          ),
        );
      } catch (err) {
        loadPublicWall(route.wallId, true);
        showToast(err instanceof Error ? err.message : 'Chưa thả tim được, bạn thử lại nha!');
      }
    },
    [route.wallId, loadPublicWall, showToast],
  );

  const handleSubmitted = useCallback((created: ScrapbookPost) => {
    setPosts((prev) => {
      if (prev.some((p) => p.postId === created.postId)) return prev;
      return [created, ...prev];
    });
    setFormOpen(false);
    setSuccessOpen(true);
  }, []);

  const handleScrollToWall = useCallback(() => {
    const el = document.getElementById('scrapbook-wall');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const selectedPost = selectedPostId
    ? posts.find((p) => p.postId === selectedPostId) ?? null
    : null;

  const canSubmit = isSupabaseConfigured && (wall ? wall.isOpen : true);

  return (
    <div className="min-h-screen flex flex-col text-[#543E43]">
      {route.view === 'admin' ? (
        <AdminDashboard
          initialWallId={route.wallId}
          onNavigateWall={(wallId) =>
            navigateTo(wallId === DEFAULT_WALL_ID ? '/' : `/wall/${encodeURIComponent(wallId)}`)
          }
          onShowToast={showToast}
        />
      ) : (
        <>
          <Header
            onOpenForm={() => setFormOpen(true)}
            onScrollToWall={handleScrollToWall}
            onOpenShare={() => setShareOpen(true)}
            onNavigateHome={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            isOpenForSubmissions={canSubmit}
          />

          <main className="flex-1">
            <Hero
              wallTitle={wall?.title}
              wallDescription={wall?.description}
              isOpen={canSubmit}
              onOpenForm={() => setFormOpen(true)}
              onScrollToWall={handleScrollToWall}
            />

            <ScrapbookWall
              posts={posts}
              loading={loading}
              error={error}
              isOpen={canSubmit}
              onSelectPost={(post) => setSelectedPostId(post.postId)}
              onToggleLike={handleToggleLike}
              onOpenForm={() => setFormOpen(true)}
              onOpenShare={() => setShareOpen(true)}
              onRetry={() => loadPublicWall(route.wallId)}
            />
          </main>

          {/* Clean quiet footer */}
          <footer className="border-t border-[#E6C0CA]/45 bg-[#FFFCFA]/85 py-6">
            <div className="mx-auto flex max-w-6xl flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 text-xs sm:text-sm text-[#7A5E64]">
              <p className="font-semibold text-[#543E43]">
                THIÊN THẦN GỬI THÂN CHỦ · Lưu xá Nam Hòa
              </p>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setShareOpen(true)}
                  className="font-semibold hover:text-[#543E43] underline-offset-4 hover:underline"
                >
                  Rủ thêm bạn bè
                </button>
                <span aria-hidden="true" className="text-[#D8A5B1]">
                  ·
                </span>
                <button
                  type="button"
                  onClick={() => navigateTo('/admin')}
                  className="font-semibold hover:text-[#543E43] underline-offset-4 hover:underline"
                >
                  Quản lý bức tường
                </button>
              </div>
            </div>
          </footer>

          {/* Screen 2: Contribution Form Modal */}
          <ContributionForm
            open={formOpen}
            wallId={route.wallId}
            onClose={() => setFormOpen(false)}
            onSubmitted={handleSubmitted}
          />

          {/* Screen 3: Post Detail Modal */}
          <DetailModal
            post={selectedPost}
            onClose={() => setSelectedPostId(null)}
            onToggleLike={handleToggleLike}
          />

          {/* Screen 4: Success Confirmation Screen */}
          <SuccessScreen
            open={successOpen}
            onViewWall={() => {
              setSuccessOpen(false);
              handleScrollToWall();
            }}
            onShare={() => {
              setSuccessOpen(false);
              setShareOpen(true);
            }}
          />

          {/* Screen 6: Share Modal */}
          <ShareModal
            open={shareOpen}
            wallId={route.wallId}
            wallTitle={wall?.title || 'THIÊN THẦN GỬI THÂN CHỦ'}
            onClose={() => setShareOpen(false)}
            onCopiedToast={showToast}
          />
        </>
      )}

      {/* Subtle Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 rounded-2xl border border-[#E5BBC6]/60 bg-[#6A4B53] px-5 py-3 text-sm font-bold text-[#FFFFFF] shadow-xl max-w-[90vw] text-center"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
