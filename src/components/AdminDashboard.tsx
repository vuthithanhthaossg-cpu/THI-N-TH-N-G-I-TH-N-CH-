import {
  ArrowLeft,
  Copy,
  Eye,
  EyeOff,
  Heart,
  Lock,
  LogOut,
  Plus,
  ShieldCheck,
  Trash2,
  Unlock,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  adminCheckSession,
  adminCreateWall,
  adminDeletePost,
  adminFetchWallData,
  adminListWalls,
  adminLogin,
  adminLogout,
  adminSetPostHidden,
  adminSetWallOpen,
} from '../services/api';
import type { AdminStats, ScrapbookPost, Wall } from '../types/scrapbook';
import { DEFAULT_WALL_ID } from '../types/scrapbook';
import {
  formatVietnameseDateTime,
  getPublicWallUrl,
  getSavedAdminToken,
  saveAdminToken,
} from '../utils/visitor';
import { DetailModal } from './DetailModal';

interface AdminDashboardProps {
  initialWallId: string;
  onNavigateWall: (wallId: string) => void;
  onShowToast: (message: string) => void;
}

type AdminTab = 'all' | 'visible' | 'hidden';

interface PendingConfirm {
  type: 'hide' | 'delete';
  post: ScrapbookPost;
}

const CARD_STYLE_LABELS: Record<ScrapbookPost['cardStyle'], string> = {
  memory: 'Ảnh kỷ niệm',
  wish: 'Giấy note',
  letter: 'Thư tay',
  secret: 'Thư bí mật',
};

export function AdminDashboard({
  initialWallId,
  onNavigateWall,
  onShowToast,
}: AdminDashboardProps) {
  const [token, setToken] = useState<string | null>(() => getSavedAdminToken());
  const [checkingAuth, setCheckingAuth] = useState<boolean>(Boolean(getSavedAdminToken()));
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const [walls, setWalls] = useState<Wall[]>([]);
  const [activeWallId, setActiveWallId] = useState<string>(initialWallId || DEFAULT_WALL_ID);
  const [wall, setWall] = useState<Wall | null>(null);
  const [posts, setPosts] = useState<ScrapbookPost[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalPosts: 0,
    visibleCount: 0,
    hiddenCount: 0,
    totalLikes: 0,
  });
  const [loadingData, setLoadingData] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('all');
  const [selectedPost, setSelectedPost] = useState<ScrapbookPost | null>(null);
  const [confirmState, setConfirmState] = useState<PendingConfirm | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  // Create new wall modal state
  const [showNewWallModal, setShowNewWallModal] = useState(false);
  const [newWallTitle, setNewWallTitle] = useState('');
  const [newWallSlug, setNewWallSlug] = useState('');
  const [newWallDesc, setNewWallDesc] = useState('');
  const [newWallError, setNewWallError] = useState<string | null>(null);

  const loadDashboard = useCallback(
    async (authToken: string, targetWallId: string) => {
      setLoadingData(true);
      try {
        const [{ walls: wallList }, wallData] = await Promise.all([
          adminListWalls(authToken),
          adminFetchWallData(authToken, targetWallId),
        ]);
        setWalls(wallList);
        setWall(wallData.wall);
        setPosts(wallData.posts);
        setStats(wallData.stats);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Không thể tải dữ liệu quản trị.';
        if (msg.includes('đăng nhập')) {
          saveAdminToken(null);
          setToken(null);
        } else {
          onShowToast(msg);
        }
      } finally {
        setLoadingData(false);
      }
    },
    [onShowToast],
  );

  // Verify saved session token on mount
  useEffect(() => {
    if (!token) {
      setCheckingAuth(false);
      return;
    }
    let active = true;
    adminCheckSession(token)
      .then((res) => {
        if (!active) return;
        if (res.authenticated) {
          loadDashboard(token, activeWallId);
        } else {
          saveAdminToken(null);
          setToken(null);
        }
      })
      .catch(() => {
        if (!active) return;
        saveAdminToken(null);
        setToken(null);
      })
      .finally(() => {
        if (active) setCheckingAuth(false);
      });
    return () => {
      active = false;
    };
  }, [token, activeWallId, loadDashboard]);

  const filteredPosts = useMemo(() => {
    if (activeTab === 'visible') return posts.filter((p) => !p.isHidden);
    if (activeTab === 'hidden') return posts.filter((p) => p.isHidden);
    return posts;
  }, [posts, activeTab]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim() || loggingIn) return;
    setLoggingIn(true);
    setLoginError(null);
    try {
      const res = await adminLogin(password);
      saveAdminToken(res.token);
      setToken(res.token);
      setPassword('');
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Đăng nhập không thành công.');
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleLogout() {
    if (token) {
      await adminLogout(token).catch(() => {});
    }
    saveAdminToken(null);
    setToken(null);
    onShowToast('Đã đăng xuất khỏi trang quản trị.');
  }

  async function handleToggleWallOpen() {
    if (!token || !wall || actionBusy) return;
    setActionBusy(true);
    try {
      const nextOpen = !wall.isOpen;
      const res = await adminSetWallOpen(token, wall.wallId, nextOpen);
      setWall(res.wall);
      setWalls((prev) => prev.map((w) => (w.wallId === res.wall.wallId ? res.wall : w)));
      onShowToast(
        nextOpen
          ? 'Bức tường đã mở nhận lời nhắn.'
          : 'Bức tường hiện đã tạm đóng nhận lời nhắn.',
      );
    } catch (err) {
      onShowToast(err instanceof Error ? err.message : 'Không thể thay đổi trạng thái.');
    } finally {
      setActionBusy(false);
    }
  }

  async function handleRestorePost(post: ScrapbookPost) {
    if (!token || actionBusy) return;
    setActionBusy(true);
    try {
      await adminSetPostHidden(token, post.postId, false);
      await loadDashboard(token, activeWallId);
      onShowToast('Đã hiển thị lại lời nhắn trên bức tường.');
    } catch (err) {
      onShowToast(err instanceof Error ? err.message : 'Không thể hiển thị lại bài đăng.');
    } finally {
      setActionBusy(false);
    }
  }

  async function handleConfirmModeration() {
    if (!token || !confirmState || actionBusy) return;
    setActionBusy(true);
    try {
      if (confirmState.type === 'hide') {
        await adminSetPostHidden(token, confirmState.post.postId, true);
        onShowToast('Đã ẩn lời nhắn khỏi bức tường công khai.');
      } else {
        await adminDeletePost(token, confirmState.post.postId);
        onShowToast('Đã xóa lời nhắn vĩnh viễn.');
      }
      setConfirmState(null);
      await loadDashboard(token, activeWallId);
    } catch (err) {
      onShowToast(err instanceof Error ? err.message : 'Thao tác chưa hoàn tất.');
    } finally {
      setActionBusy(false);
    }
  }

  async function handleCopyWallLink() {
    const url = getPublicWallUrl(activeWallId);
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    onShowToast('Đã sao chép đường dẫn rồi nha!');
  }

  async function handleCreateWall(e: React.FormEvent) {
    e.preventDefault();
    if (!token || actionBusy) return;
    setNewWallError(null);
    setActionBusy(true);
    try {
      const created = await adminCreateWall(token, {
        wallId: newWallSlug,
        title: newWallTitle,
        description: newWallDesc,
      });
      setShowNewWallModal(false);
      setNewWallTitle('');
      setNewWallSlug('');
      setNewWallDesc('');
      setActiveWallId(created.wall.wallId);
      await loadDashboard(token, created.wall.wallId);
      onShowToast('Đã tạo bức tường sự kiện mới thành công!');
    } catch (err) {
      setNewWallError(err instanceof Error ? err.message : 'Không thể tạo bức tường mới.');
    } finally {
      setActionBusy(false);
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <p className="font-semibold text-[#543E43]">Đang kiểm tra phiên quản trị...</p>
      </div>
    );
  }

  // Admin Login View
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-3xl border-2 border-[#49363A]/20 bg-[#FFFCFA] p-7 sm:p-8 scrapbook-shadow">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FCEBF0] text-[#543E43]">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <div>
              <h1 className="font-display text-2xl font-extrabold text-[#543E43]">
                Quản lý bức tường lưu bút
              </h1>
              <p className="text-xs font-semibold text-[#8B636B]">
                Khu vực dành riêng cho Ban Tổ Chức Nam Hòa
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="admin-password"
                className="block text-sm font-bold text-[#543E43]"
              >
                Mật khẩu quản trị
              </label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu quản trị..."
                autoFocus
                className="mt-1.5 w-full min-h-11 rounded-xl border border-[#E5BBC6]/50 bg-[#FFFFFF] px-4 py-2.5 text-base text-[#543E43] focus:border-[#49363A] focus:outline-none focus:ring-2 focus:ring-[#E8B6C2]"
              />
            </div>

            {loginError && (
              <p
                role="alert"
                className="rounded-xl border border-[#C77082] bg-[#FDECEF] px-3.5 py-2.5 text-sm font-semibold text-[#8A2E42]"
              >
                {loginError}
              </p>
            )}

            <button
              type="submit"
              disabled={loggingIn || !password.trim()}
              className="w-full min-h-12 rounded-2xl border border-[#D493A3] bg-[#F5C7D4] px-5 py-2.5 text-base font-extrabold text-[#543E43] shadow-[0_4px_14px_-3px_rgba(201,126,144,0.45)] hover:bg-[#EEB5C5] disabled:opacity-55"
            >
              {loggingIn ? 'Đang xác thực...' : 'Đăng nhập quản trị'}
            </button>

            <button
              type="button"
              onClick={() => onNavigateWall(activeWallId)}
              className="w-full inline-flex min-h-10 items-center justify-center gap-1.5 text-sm font-bold text-[#6E565B] hover:text-[#543E43]"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay về bức tường công khai
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-30 border-b border-[#E5BBC6]/25 bg-[#FFFCFA]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => onNavigateWall(activeWallId)}
              aria-label="Về bức tường công khai"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#E5BBC6]/35 bg-[#FDF1F4] text-[#543E43] hover:bg-[#FCEBF0] shrink-0"
            >
              <ArrowLeft className="h-4.5 w-4.5" />
            </button>
            <div className="min-w-0">
              <h1 className="font-display text-lg sm:text-xl font-extrabold text-[#543E43] truncate">
                Quản lý bức tường lưu bút
              </h1>
              <p className="text-xs font-semibold text-[#8B636B] truncate">
                {wall ? wall.title : 'THIÊN THẦN GỬI THÂN CHỦ'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyWallLink}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-[#E5BBC6]/45 bg-[#FFFCFA] px-3.5 py-2 text-xs sm:text-sm font-bold text-[#543E43] hover:bg-[#FDF1F4] whitespace-nowrap"
            >
              <Copy className="h-4 w-4 text-[#9E5D68]" />
              Sao chép đường dẫn
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-[#49363A]/25 bg-[#FCEBF0] px-3.5 py-2 text-xs sm:text-sm font-bold text-[#543E43] hover:bg-[#F5C7D4] whitespace-nowrap"
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 space-y-8">
        {/* Wall Selector & Future Event Wall Creator */}
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E5BBC6]/25 bg-[#FFFCFA] p-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <label htmlFor="wall-switcher" className="text-sm font-bold text-[#543E43]">
              Bức tường đang quản lý:
            </label>
            <select
              id="wall-switcher"
              value={activeWallId}
              onChange={(e) => setActiveWallId(e.target.value)}
              className="min-h-10 rounded-xl border border-[#E5BBC6]/45 bg-[#FFFFFF] px-3 py-1.5 text-sm font-bold text-[#543E43] focus:outline-none focus:ring-2 focus:ring-[#E8B6C2]"
            >
              {walls.map((w) => (
                <option key={w.wallId} value={w.wallId}>
                  {w.title} ({w.wallId})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setShowNewWallModal(true)}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-[#E5BBC6]/45 bg-[#FDF1F4] px-3.5 py-2 text-xs sm:text-sm font-bold text-[#543E43] hover:bg-[#FCEBF0] whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            Tạo bức tường mới
          </button>
        </section>

        {/* TỔNG QUAN & QUẢN LÝ NHẬN BÀI */}
        <section aria-labelledby="admin-overview-heading" className="space-y-4">
          <h2
            id="admin-overview-heading"
            className="font-display text-xl font-extrabold text-[#543E43]"
          >
            Tổng quan
          </h2>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="rounded-2xl border border-[#E5BBC6]/25 bg-[#FFFCFA] p-5 scrapbook-shadow">
              <p className="text-xs font-bold text-[#8B636B]">Tất cả lời nhắn</p>
              <p className="mt-2 font-display text-3xl font-extrabold text-[#543E43] tabular-nums">
                {stats.totalPosts}
              </p>
            </div>
            <div className="rounded-2xl border border-[#E5BBC6]/25 bg-[#FFFCFA] p-5 scrapbook-shadow">
              <p className="text-xs font-bold text-[#8B636B]">Đang hiển thị</p>
              <p className="mt-2 font-display text-3xl font-extrabold text-[#3D6B52] tabular-nums">
                {stats.visibleCount}
              </p>
            </div>
            <div className="rounded-2xl border border-[#E5BBC6]/25 bg-[#FFFCFA] p-5 scrapbook-shadow">
              <p className="text-xs font-bold text-[#8B636B]">Đã ẩn</p>
              <p className="mt-2 font-display text-3xl font-extrabold text-[#9A4E5F] tabular-nums">
                {stats.hiddenCount}
              </p>
            </div>
            <div className="rounded-2xl border border-[#E5BBC6]/25 bg-[#FFFCFA] p-5 scrapbook-shadow">
              <p className="text-xs font-bold text-[#8B636B]">Tổng lượt thả tim</p>
              <p className="mt-2 font-display text-3xl font-extrabold text-[#B8576B] tabular-nums">
                {stats.totalLikes}
              </p>
            </div>
          </div>

          {/* Quản lý nhận bài */}
          {wall && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[#E5BBC6]/30 bg-[#FFFCFA] p-5 scrapbook-shadow">
              <div>
                <h3 className="font-display text-lg font-extrabold text-[#543E43]">
                  Quản lý nhận bài
                </h3>
                <p className="mt-1 text-sm text-[#6E565B]">
                  {wall.isOpen
                    ? 'Bức tường đã mở nhận lời nhắn.'
                    : 'Bức tường hiện đã tạm đóng nhận lời nhắn.'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleToggleWallOpen}
                disabled={actionBusy}
                className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#D493A3] px-5 py-2.5 text-sm font-extrabold text-[#543E43] transition-colors whitespace-nowrap shrink-0 ${
                  wall.isOpen
                    ? 'bg-[#FCEBF0] hover:bg-[#F5C7D4]'
                    : 'bg-[#DDEBF1] hover:bg-[#CBE0EA]'
                }`}
              >
                {wall.isOpen ? (
                  <>
                    <Lock className="h-4 w-4" />
                    Đóng nhận lời nhắn
                  </>
                ) : (
                  <>
                    <Unlock className="h-4 w-4" />
                    Mở nhận lời nhắn
                  </>
                )}
              </button>
            </div>
          )}
        </section>

        {/* DANH SÁCH LỜI NHẮN & KIỂM DUYỆT */}
        <section aria-labelledby="admin-posts-heading" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2
              id="admin-posts-heading"
              className="font-display text-xl font-extrabold text-[#543E43]"
            >
              Kiểm duyệt lời nhắn
            </h2>

            <div
              role="tablist"
              className="flex items-center gap-1.5 rounded-xl bg-[#FFFCFA] p-1 border border-[#E5BBC6]/25"
            >
              {(
                [
                  { key: 'all', label: `Tất cả lời nhắn (${stats.totalPosts})` },
                  { key: 'visible', label: `Đang hiển thị (${stats.visibleCount})` },
                  { key: 'hidden', label: `Đã ẩn (${stats.hiddenCount})` },
                ] as { key: AdminTab; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`min-h-9 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-bold transition-colors whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'bg-[#9A5164] text-[#FFFFFF]'
                      : 'text-[#543E43]/80 hover:text-[#543E43]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {loadingData ? (
            <div className="rounded-2xl border border-[#E5BBC6]/25 bg-[#FFFCFA] p-8 text-center text-sm font-semibold text-[#6E565B]">
              Đang tải danh sách lời nhắn...
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="rounded-2xl border border-[#E5BBC6]/25 bg-[#FFFCFA] p-10 text-center text-sm font-semibold text-[#6E565B]">
              Chưa có lời nhắn nào trong mục này.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPosts.map((post) => (
                <div
                  key={post.postId}
                  className={`rounded-2xl border bg-[#FFFCFA] p-4 sm:p-5 transition-colors ${
                    post.isHidden
                      ? 'border-[#C77082]/45 bg-[#FFFCFA]/75 opacity-90'
                      : 'border-[#E5BBC6]/25'
                  }`}
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      {post.imageUrls[0] && (
                        <img
                          src={post.imageUrls[0]}
                          alt="Ảnh đính kèm"
                          className="h-16 w-16 rounded-xl border border-[#E5BBC6]/25 object-cover bg-[#FFFFFF] shrink-0"
                        />
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#6E565B]">
                          <span className="font-extrabold text-sm text-[#543E43]">
                            {post.senderDisplay}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{CARD_STYLE_LABELS[post.cardStyle]}</span>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums">
                            {formatVietnameseDateTime(post.createdAt)}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 font-bold text-[#9E4E5E] tabular-nums">
                            <Heart className="h-3.5 w-3.5 fill-[#E8B6C2]" />
                            {post.likeCount}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span
                            className={`font-bold ${
                              post.isHidden ? 'text-[#9A4E5F]' : 'text-[#3D6B52]'
                            }`}
                          >
                            {post.isHidden ? 'Đã ẩn' : 'Đang hiển thị'}
                          </span>
                        </div>

                        <p className="mt-2 text-sm leading-relaxed text-[#543E43] line-clamp-3">
                          {post.message || '(Bài đăng chỉ có hình ảnh)'}
                        </p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setSelectedPost(post)}
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-[#E5BBC6]/40 bg-[#FFFFFF] px-3 py-1.5 text-xs font-bold text-[#543E43] hover:bg-[#FDF1F4] whitespace-nowrap"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Xem chi tiết
                      </button>

                      {post.isHidden ? (
                        <button
                          type="button"
                          onClick={() => handleRestorePost(post)}
                          disabled={actionBusy}
                          className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-[#3D6B52]/35 bg-[#E6F3EC] px-3 py-1.5 text-xs font-bold text-[#2D553F] hover:bg-[#D5ECDF] whitespace-nowrap"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Hiển thị lại
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmState({ type: 'hide', post })}
                          disabled={actionBusy}
                          className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-[#E5BBC6]/45 bg-[#FDF1F4] px-3 py-1.5 text-xs font-bold text-[#543E43] hover:bg-[#FCEBF0] whitespace-nowrap"
                        >
                          <EyeOff className="h-3.5 w-3.5" />
                          Ẩn bài đăng
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setConfirmState({ type: 'delete', post })}
                        disabled={actionBusy}
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-[#C77082]/50 bg-[#FDECEF] px-3 py-1.5 text-xs font-bold text-[#8A2E42] hover:bg-[#FAD6DD] whitespace-nowrap"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Xóa bài đăng
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Post Detail Modal */}
      <DetailModal
        post={selectedPost}
        onClose={() => setSelectedPost(null)}
        readOnlyLike
      />

      {/* Confirmation Dialog (Hide or Delete) */}
      {confirmState && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#49363A]/50 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-3xl border border-[#D493A3]/20 bg-[#FFFCFA] p-6 shadow-2xl">
            <h3 className="font-display text-xl font-extrabold text-[#543E43]">
              {confirmState.type === 'hide' ? 'Xác nhận ẩn bài đăng' : 'Xác nhận xóa bài đăng'}
            </h3>
            <p className="mt-2.5 text-sm leading-relaxed text-[#543E43]/85">
              {confirmState.type === 'hide'
                ? 'Bạn có chắc muốn ẩn lời nhắn này không?'
                : 'Bạn có chắc muốn xóa lời nhắn này? Thao tác này không thể hoàn tác.'}
            </p>
            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmState(null)}
                disabled={actionBusy}
                className="min-h-10 rounded-xl border border-[#E5BBC6]/45 bg-[#FFFCFA] px-4 py-2 text-sm font-bold text-[#543E43] hover:bg-[#FDF1F4]"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmModeration}
                disabled={actionBusy}
                className={`min-h-10 rounded-xl border border-[#D493A3] px-4 py-2 text-sm font-extrabold text-[#543E43] ${
                  confirmState.type === 'delete'
                    ? 'bg-[#F5BCC8] hover:bg-[#EEA4B4]'
                    : 'bg-[#F5C7D4] hover:bg-[#DFA3B2]'
                }`}
              >
                {actionBusy
                  ? 'Đang xử lý...'
                  : confirmState.type === 'hide'
                    ? 'Ẩn bài đăng'
                    : 'Xóa bài đăng'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Event Wall Modal */}
      {showNewWallModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#49363A]/50 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-3xl border border-[#D493A3]/20 bg-[#FFFCFA] p-6 shadow-2xl">
            <h3 className="font-display text-xl font-extrabold text-[#543E43]">
              Tạo bức tường sự kiện mới
            </h3>
            <form onSubmit={handleCreateWall} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#543E43]">Tên bức tường</label>
                <input
                  type="text"
                  required
                  value={newWallTitle}
                  onChange={(e) => setNewWallTitle(e.target.value)}
                  placeholder="Ví dụ: Nam Hòa Mùa Hè 2026"
                  className="mt-1 w-full min-h-10 rounded-xl border border-[#E5BBC6]/45 bg-[#FFFFFF] px-3.5 py-2 text-sm text-[#543E43]"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#543E43]">
                  Mã đường dẫn (không dấu, viết liền)
                </label>
                <input
                  type="text"
                  required
                  value={newWallSlug}
                  onChange={(e) => setNewWallSlug(e.target.value)}
                  placeholder="vi-du: nam-hoa-he-2026"
                  className="mt-1 w-full min-h-10 rounded-xl border border-[#E5BBC6]/45 bg-[#FFFFFF] px-3.5 py-2 text-sm text-[#543E43]"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#543E43]">Mô tả ngắn</label>
                <textarea
                  rows={3}
                  value={newWallDesc}
                  onChange={(e) => setNewWallDesc(e.target.value)}
                  placeholder="Lời giới thiệu ngắn cho bức tường..."
                  className="mt-1 w-full rounded-xl border border-[#E5BBC6]/45 bg-[#FFFFFF] px-3.5 py-2 text-sm text-[#543E43]"
                />
              </div>
              {newWallError && (
                <p className="text-sm font-semibold text-[#8A2E42]">{newWallError}</p>
              )}
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewWallModal(false)}
                  className="min-h-10 rounded-xl border border-[#E5BBC6]/45 bg-[#FFFCFA] px-4 py-2 text-sm font-bold text-[#543E43]"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={actionBusy}
                  className="min-h-10 rounded-xl border border-[#D493A3] bg-[#F5C7D4] px-4 py-2 text-sm font-extrabold text-[#543E43]"
                >
                  Tạo bức tường
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
