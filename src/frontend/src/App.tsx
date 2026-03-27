import { Progress } from "@/components/ui/progress";
import { useCallback, useEffect, useRef, useState } from "react";
import { useActor } from "./hooks/useActor";

// ─── Types ──────────────────────────────────────────────────────────────────
type GameStatus = "unlocked" | "locked" | "completed";
type Screen = "landing" | "game" | "completion";
type SwipeFeedback = null | "match" | "miss";

interface GameState {
  gameId: number;
  status: GameStatus;
  voteCount: number;
  correctVotes: number;
  incorrectVotes: number;
  coinsEarned: number;
}

// ─── Data ────────────────────────────────────────────────────────────────────
const products = [
  {
    id: 1,
    image:
      "https://assets.myntassets.com/w_414,q_50,,dpr_2,fl_progressive,f_webp/assets/images/2024/SEPTEMBER/3/t3UiNunY_87023e9335584a50b18e88b0a54e65ec.jpg",
  },
  {
    id: 2,
    image:
      "https://assets.myntassets.com/w_414,q_50,,dpr_2,fl_progressive,f_webp/assets/images/2025/AUGUST/21/H49dWPQf_cf89796791834a70882a2873200405b2.jpg",
  },
  {
    id: 3,
    image:
      "https://assets.myntassets.com/w_414,q_50,,dpr_2,fl_progressive,f_webp/assets/images/2026/JANUARY/20/7duEYq6u_b5829844623742a1a35d6706e060d2d6.jpg",
  },
  {
    id: 4,
    image:
      "https://assets.myntassets.com/w_414,q_50,,dpr_2,fl_progressive,f_webp/assets/images/2026/FEBRUARY/9/rZpOaBIP_b50ab1a6b0bd404ab6dd214c39a7e191.jpg",
  },
  {
    id: 5,
    image:
      "https://assets.myntassets.com/w_414,q_50,,dpr_2,fl_progressive,f_webp/assets/images/2025/AUGUST/22/Z2ouOzLh_0d49de8368754a2e8a983867d18ea67c.jpg",
  },
  {
    id: 6,
    image:
      "https://assets.myntassets.com/w_414,q_50,,dpr_2,fl_progressive,f_webp/assets/images/2024/SEPTEMBER/26/vn5w2D9n_72bfaa0d54aa4fffaa65c21b664ad003.jpg",
  },
  {
    id: 7,
    image:
      "https://assets.myntassets.com/w_414,q_50,,dpr_2,fl_progressive,f_webp/assets/images/2025/AUGUST/21/cnDuAOv0_2057747e9d0f4cb9b4122e13e01708b4.jpg",
  },
  {
    id: 8,
    image:
      "https://assets.myntassets.com/w_414,q_50,,dpr_2,fl_progressive,f_webp/assets/images/2026/JANUARY/28/nPQke109_5ea3ec40833943ac8ec079de2bcf54db.jpg",
  },
  {
    id: 9,
    image:
      "https://assets.myntassets.com/w_414,q_50,,dpr_2,fl_progressive,f_webp/assets/images/2026/FEBRUARY/22/uaViGpB3_5f99692ed9474c97a0ebe289901a3143.jpg",
  },
  {
    id: 10,
    image:
      "https://assets.myntassets.com/w_414,q_50,,dpr_2,fl_progressive,f_webp/assets/images/2024/SEPTEMBER/3/AAR4ixOJ_0aa8ee038fe544b4ae69e08eb553a7ac.jpg",
  },
];

const TOTAL_PRODUCTS = products.length; // 10

const COLORS = {
  cream: "#F5EDD8",
  creamAlt: "#F7F0DA",
  creamDark: "#EFE2C1",
  divider: "#D8CDB2",
  gold: "#C9A24A",
  goldDark: "#B78C33",
  teal: "#8F2A53",
  text: "#1A1A1A",
  textSec: "#4F4F4F",
};

const initialGames: GameState[] = [
  {
    gameId: 0,
    status: "unlocked",
    voteCount: 0,
    correctVotes: 0,
    incorrectVotes: 0,
    coinsEarned: 0,
  },
  {
    gameId: 1,
    status: "locked",
    voteCount: 0,
    correctVotes: 0,
    incorrectVotes: 0,
    coinsEarned: 0,
  },
  {
    gameId: 2,
    status: "locked",
    voteCount: 0,
    correctVotes: 0,
    incorrectVotes: 0,
    coinsEarned: 0,
  },
];

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const { actor } = useActor();

  const [screen, setScreen] = useState<Screen>("landing");
  const [activeGameId, setActiveGameId] = useState(0);
  const [games, setGames] = useState<GameState[]>(initialGames);
  const [walletCoins, setWalletCoins] = useState(0);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [swipeFeedback, setSwipeFeedback] = useState<SwipeFeedback>(null);
  const [liveScore, setLiveScore] = useState(0);
  const [swipeDir, setSwipeDir] = useState<"left" | "right" | null>(null);
  const [cardKey, setCardKey] = useState(0);
  const [sessionVotes, setSessionVotes] = useState(0);
  const [coinBounce, setCoinBounce] = useState(false);
  const finishCalledRef = useRef(false);

  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [dragX, setDragX] = useState(0);
  const isDragging = useRef(false);

  useEffect(() => {
    if (!actor) return;
    (async () => {
      try {
        const registered = await actor.isRegistered();
        if (!registered) await actor.register();
        const state = await actor.getUserState();
        if (state.gameStates.length > 0) {
          const mapped = state.gameStates.map((g) => ({
            gameId: Number(g.gameId),
            status: g.status as GameStatus,
            voteCount: Number(g.voteCount),
            correctVotes: Number(g.correctVotes),
            incorrectVotes: Number(g.incorrectVotes),
            coinsEarned: Number(g.coinsEarned),
          }));
          setGames(mapped);
          setWalletCoins(Number(state.wallet));
        }
      } catch (_) {}
    })();
  }, [actor]);

  const triggerCoinBounce = useCallback(() => {
    setCoinBounce(true);
    setTimeout(() => setCoinBounce(false), 500);
  }, []);

  const finishGame = useCallback(async () => {
    if (finishCalledRef.current) return;
    finishCalledRef.current = true;
    try {
      if (actor) {
        await actor.completeGame(BigInt(activeGameId));
        if (activeGameId < 2) await actor.unlockGame(BigInt(activeGameId + 1));
      }
    } catch (_) {}

    setGames((prev) =>
      prev.map((g) => {
        if (g.gameId === activeGameId)
          return { ...g, status: "completed" as GameStatus };
        if (g.gameId === activeGameId + 1 && g.status === "locked")
          return { ...g, status: "unlocked" as GameStatus };
        return g;
      }),
    );
    setScreen("completion");
  }, [actor, activeGameId]);

  const handleVote = useCallback(
    async (liked: boolean) => {
      if (swipeFeedback !== null) return;
      const isMatch = Math.random() < 0.7;
      setSwipeDir(liked ? "right" : "left");
      setSwipeFeedback(isMatch ? "match" : "miss");

      try {
        if (actor) await actor.vote(BigInt(activeGameId), isMatch);
      } catch (_) {}

      setGames((prev) =>
        prev.map((g) =>
          g.gameId === activeGameId
            ? {
                ...g,
                voteCount: g.voteCount + 1,
                correctVotes: isMatch ? g.correctVotes + 1 : g.correctVotes,
                incorrectVotes: !isMatch
                  ? g.incorrectVotes + 1
                  : g.incorrectVotes,
                coinsEarned: isMatch
                  ? g.coinsEarned + 1
                  : Math.max(0, g.coinsEarned - 1),
              }
            : g,
        ),
      );

      if (isMatch) {
        setLiveScore((s) => s + 1);
        setWalletCoins((w) => w + 1);
        triggerCoinBounce();
      } else {
        setWalletCoins((w) => Math.max(0, w - 1));
      }

      setSessionVotes((v) => {
        const next = v + 1;
        if (next >= TOTAL_PRODUCTS) {
          // Auto-finish after animation plays
          setTimeout(() => finishGame(), 700);
        }
        return next;
      });

      setTimeout(() => {
        setSwipeFeedback(null);
        setSwipeDir(null);
        setDragX(0);
        setCurrentCardIndex((i) => (i + 1) % products.length);
        setCardKey((k) => k + 1);
      }, 600);
    },
    [swipeFeedback, activeGameId, actor, triggerCoinBounce, finishGame],
  );

  const onPointerDown = (e: React.PointerEvent) => {
    pointerStart.current = { x: e.clientX, y: e.clientY };
    isDragging.current = true;
    cardRef.current?.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || !pointerStart.current) return;
    const dx = e.clientX - pointerStart.current.x;
    setDragX(dx);
  };

  const onPointerUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (Math.abs(dragX) > 60) {
      handleVote(dragX > 0);
    } else {
      setDragX(0);
    }
    pointerStart.current = null;
  };

  const startGame = (gameId: number) => {
    finishCalledRef.current = false;
    setActiveGameId(gameId);
    setLiveScore(0);
    setSessionVotes(0);
    setCurrentCardIndex(0);
    setCardKey(0);
    setSwipeFeedback(null);
    setSwipeDir(null);
    setDragX(0);
    setScreen("game");
  };

  const currentGame = games[activeGameId];

  if (screen === "landing") {
    return (
      <LandingScreen
        games={games}
        walletCoins={walletCoins}
        onStart={startGame}
      />
    );
  }

  if (screen === "game") {
    return (
      <GameScreen
        game={currentGame}
        liveScore={liveScore}
        sessionVotes={sessionVotes}
        currentCardIndex={currentCardIndex}
        swipeFeedback={swipeFeedback}
        swipeDir={swipeDir}
        dragX={dragX}
        cardKey={cardKey}
        cardRef={cardRef}
        coinBounce={coinBounce}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onVote={handleVote}
        onBack={() => setScreen("landing")}
      />
    );
  }

  return (
    <CompletionScreen
      game={currentGame}
      activeGameId={activeGameId}
      onPlayNext={() => {
        const nextId = activeGameId + 1;
        if (nextId < 3) startGame(nextId);
        else setScreen("landing");
      }}
      onHome={() => setScreen("landing")}
    />
  );
}

// ─── Landing Screen ──────────────────────────────────────────────────────────
function LandingScreen({
  games,
  walletCoins,
  onStart,
}: {
  games: GameState[];
  walletCoins: number;
  onStart: (id: number) => void;
}) {
  return (
    <MobileShell>
      <style>{`
        @keyframes coinGlow {
          0%, 100% { box-shadow: 0 0 8px 2px rgba(143,42,83,0.45); }
          50% { box-shadow: 0 0 18px 6px rgba(143,42,83,0.8); }
        }
        .coin-glow { animation: coinGlow 1.8s ease-in-out infinite; }
      `}</style>
      <div
        className="flex flex-col min-h-screen"
        style={{ background: COLORS.cream }}
      >
        {/* Centered Logo */}
        <div className="flex justify-center pt-10 pb-4">
          <img
            src="/assets/uploads/screenshot_2026-03-26_at_10.03.36_pm-removebg-preview-019d2b01-e07c-70a8-b34d-9a6a8d113c7a-1.png"
            alt="Aramya Star Panel"
            style={{ height: 160, objectFit: "contain" }}
          />
        </div>

        {/* Centered Balance Card */}
        <div className="flex justify-center px-5 pb-5">
          <div
            className="coin-glow flex items-center gap-3 px-6 py-3 rounded-2xl"
            style={{
              background: "#fff",
              boxShadow: "0 4px 20px rgba(143,42,83,0.15)",
              border: "1.5px solid rgba(143,42,83,0.12)",
            }}
            data-ocid="wallet.card"
          >
            <span style={{ fontSize: 26 }}>🪙</span>
            <div className="flex flex-col">
              <span
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: COLORS.textSec }}
              >
                Your Balance
              </span>
              <span
                className="text-2xl font-black leading-tight"
                style={{ color: COLORS.teal }}
              >
                {walletCoins}
              </span>
            </div>
          </div>
        </div>

        {/* Heading & subtitle */}
        <div className="px-5 pb-5 text-center">
          <h1
            className="text-2xl font-black tracking-tight"
            style={{ color: COLORS.text }}
          >
            Play &amp; Earn Coins ⭐
          </h1>
          <p className="mt-1 text-sm" style={{ color: COLORS.textSec }}>
            Complete all 3 games to win prizes
          </p>
        </div>

        {/* Game Cards */}
        <div className="flex flex-col gap-4 px-5 flex-1">
          {games.map((game, idx) => (
            <GameCard
              key={game.gameId}
              game={game}
              index={idx}
              onStart={onStart}
            />
          ))}
        </div>

        <CaffeineFooter />
      </div>
    </MobileShell>
  );
}

function GameCard({
  game,
  index,
  onStart,
}: { game: GameState; index: number; onStart: (id: number) => void }) {
  const isLocked = game.status === "locked";
  const isCompleted = game.status === "completed";
  const hasProgress = game.voteCount > 0 && !isCompleted;
  const gameNum = index + 1;

  return (
    <div
      className="rounded-2xl p-4 relative overflow-hidden"
      style={{
        background: "#fff",
        boxShadow: "0 2px 16px rgba(30,20,10,0.08)",
        opacity: isLocked ? 0.75 : 1,
      }}
      data-ocid={`game.item.${gameNum}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          {isCompleted ? (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0"
              style={{ background: "#22c55e", color: "#fff" }}
            >
              ✓
            </div>
          ) : isLocked ? (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-base flex-shrink-0"
              style={{ background: COLORS.creamDark, color: COLORS.textSec }}
            >
              🔒
            </div>
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-base font-black flex-shrink-0"
              style={{ background: COLORS.teal, color: "#fff" }}
            >
              {gameNum}
            </div>
          )}

          <div className="flex-1">
            <h3
              className="text-sm font-black uppercase tracking-tight"
              style={{ color: isLocked ? COLORS.textSec : COLORS.text }}
            >
              Game {gameNum}
            </h3>
            <p className="text-xs mt-0.5" style={{ color: COLORS.textSec }}>
              {isLocked ? (
                <span className="flex items-center gap-1">
                  <span>🔒</span>
                  <span>Complete Game {index} to unlock</span>
                </span>
              ) : isCompleted ? (
                `${game.correctVotes} correct · ${game.coinsEarned} coins earned`
              ) : hasProgress ? (
                `Resume (${game.voteCount}/10)`
              ) : (
                "Vote on 10 products"
              )}
            </p>
          </div>
        </div>

        <div className="flex-shrink-0">
          {isLocked ? null : isCompleted ? (
            <div
              className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest"
              style={{ background: "rgba(34,197,94,0.15)", color: "#16a34a" }}
            >
              ✓ DONE
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onStart(game.gameId)}
              className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-opacity hover:opacity-90 active:scale-95"
              style={{
                background: COLORS.teal,
                color: "#fff",
                boxShadow: "0 2px 8px rgba(143,42,83,0.35)",
              }}
              data-ocid={`game.primary_button.${gameNum}`}
            >
              {hasProgress ? "RESUME" : "Start"}
            </button>
          )}
        </div>
      </div>

      {hasProgress && (
        <div className="mt-3">
          <Progress
            value={(game.voteCount / 10) * 100}
            className="h-1.5"
            style={{ background: COLORS.creamDark }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Game Screen ─────────────────────────────────────────────────────────────
function GameScreen({
  game,
  liveScore,
  sessionVotes,
  currentCardIndex,
  swipeFeedback,
  swipeDir,
  dragX,
  cardKey,
  cardRef,
  coinBounce,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onVote,
  onBack,
}: {
  game: GameState;
  liveScore: number;
  sessionVotes: number;
  currentCardIndex: number;
  swipeFeedback: SwipeFeedback;
  swipeDir: "left" | "right" | null;
  dragX: number;
  cardKey: number;
  cardRef: React.RefObject<HTMLDivElement | null>;
  coinBounce: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: () => void;
  onVote: (liked: boolean) => void;
  onBack: () => void;
}) {
  const product = products[currentCardIndex];
  const totalVotes = game.voteCount + sessionVotes;

  const cardStyle: React.CSSProperties = {
    transform:
      swipeDir === "right"
        ? "translateX(120%) rotate(15deg)"
        : swipeDir === "left"
          ? "translateX(-120%) rotate(-15deg)"
          : `translateX(${dragX}px) rotate(${dragX * 0.06}deg)`,
    transition: swipeDir ? "transform 0.4s ease-out, opacity 0.4s" : "none",
    opacity: swipeDir ? 0 : 1,
  };

  const swipeIndicatorLeft = dragX < -30;
  const swipeIndicatorRight = dragX > 30;

  return (
    <MobileShell>
      <style>{`
        @keyframes heartPop {
          0% { transform: scale(0.5); opacity: 0; }
          60% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes missPop {
          0% { transform: scale(0.5) rotate(-10deg); opacity: 0; }
          60% { transform: scale(1.2) rotate(5deg); opacity: 1; }
          100% { transform: scale(1) rotate(0); opacity: 1; }
        }
        @keyframes coinGlow {
          0%, 100% { text-shadow: 0 0 8px rgba(143,42,83,0.6); }
          50% { text-shadow: 0 0 20px rgba(143,42,83,1); }
        }
        .coin-glow-text { animation: coinGlow 1.8s ease-in-out infinite; }
        .heart-pop { animation: heartPop 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .miss-pop { animation: missPop 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards; }
      `}</style>
      <div
        className="flex flex-col min-h-screen"
        style={{ background: COLORS.cream }}
      >
        {/* Sticky top bar */}
        <div
          className="sticky top-0 z-10 px-5"
          style={{ background: COLORS.teal }}
        >
          <div className="flex items-center justify-between pt-10 pb-3">
            <button
              type="button"
              onClick={onBack}
              className="text-white text-xl p-1 rounded-full"
              data-ocid="game.link"
            >
              ←
            </button>
            <span className="text-sm font-bold text-white tracking-wide">
              Game {game.gameId + 1}
            </span>
            <div
              className={`flex flex-col items-center px-4 py-1.5 rounded-xl ${coinBounce ? "coin-glow-text" : ""}`}
              style={{ background: "rgba(0,0,0,0.2)" }}
            >
              <span className="text-xl font-black text-white">
                🪙 {liveScore}
              </span>
              <span
                className="text-[9px] font-bold uppercase tracking-widest"
                style={{ color: COLORS.gold }}
              >
                Coins earned
              </span>
            </div>
          </div>
        </div>

        {/* Product card area */}
        <div className="flex-1 flex flex-col items-center px-4 pt-4 pb-2">
          <div className="relative w-full" style={{ height: 440 }}>
            {swipeIndicatorLeft && (
              <div
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 px-3 py-2 rounded-xl font-black text-lg text-white"
                style={{ background: "rgba(100,20,50,0.85)" }}
              >
                ✗
              </div>
            )}
            {swipeIndicatorRight && (
              <div
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 px-3 py-2 rounded-xl font-black text-lg text-white"
                style={{ background: "rgba(143,42,83,0.85)" }}
              >
                ♥
              </div>
            )}

            <div
              key={cardKey}
              ref={cardRef}
              style={cardStyle}
              className="absolute inset-0 rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing select-none"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              data-ocid="game.canvas_target"
            >
              <img
                src={product.image}
                alt="Fashion product"
                className="w-full h-full object-cover"
                draggable={false}
              />
            </div>

            {swipeFeedback === "match" && (
              <div
                className="absolute inset-0 rounded-2xl z-30 flex flex-col items-center justify-center pointer-events-none"
                style={{ background: "rgba(199,60,120,0.78)" }}
              >
                <div className="heart-pop flex flex-col items-center gap-3">
                  <span style={{ fontSize: 72, lineHeight: 1 }}>♥️</span>
                  <p className="text-xl font-black text-white">
                    Matched! +1 🪙
                  </p>
                </div>
              </div>
            )}

            {swipeFeedback === "miss" && (
              <div
                className="absolute inset-0 rounded-2xl z-30 flex flex-col items-center justify-center pointer-events-none"
                style={{ background: "rgba(80,20,50,0.78)" }}
              >
                <div className="miss-pop flex flex-col items-center gap-3">
                  <span style={{ fontSize: 72, lineHeight: 1 }}>❌</span>
                  <p className="text-xl font-black text-white">Missed! −1</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-12 mt-4">
            <button
              type="button"
              onClick={() => onVote(false)}
              className="w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-transform active:scale-90 hover:scale-105"
              style={{
                background: "rgba(100,20,50,0.12)",
                border: "2px solid rgba(100,20,50,0.5)",
              }}
              data-ocid="game.secondary_button"
            >
              ✗
            </button>
            <button
              type="button"
              onClick={() => onVote(true)}
              className="w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-transform active:scale-90 hover:scale-105"
              style={{
                background: `linear-gradient(135deg, ${COLORS.teal}, #c0356e)`,
                boxShadow: "0 2px 12px rgba(143,42,83,0.5)",
              }}
              data-ocid="game.primary_button"
            >
              <span style={{ color: "#fff" }}>♥</span>
            </button>
          </div>
        </div>

        <div className="px-5 pb-6">
          <div className="flex items-center justify-between mb-1">
            <span
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: COLORS.textSec }}
            >
              Progress
            </span>
            <span className="text-xs font-bold" style={{ color: COLORS.teal }}>
              {totalVotes} / 10
            </span>
          </div>
          <Progress
            value={Math.min((totalVotes / 10) * 100, 100)}
            className="h-2"
            style={{ background: COLORS.divider }}
          />
        </div>
      </div>
    </MobileShell>
  );
}

// ─── Completion Screen ───────────────────────────────────────────────────────
function CompletionScreen({
  game,
  activeGameId,
  onPlayNext,
  onHome,
}: {
  game: GameState;
  activeGameId: number;
  onPlayNext: () => void;
  onHome: () => void;
}) {
  const nextGameNum = activeGameId + 2;
  const hasNext = activeGameId < 2;

  return (
    <MobileShell>
      <div
        className="flex flex-col min-h-screen items-center justify-center px-6 relative"
        style={{ background: COLORS.cream }}
        data-ocid="completion.modal"
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 50% 30%, rgba(143,42,83,0.12) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 w-full max-w-sm">
          <div className="text-center mb-4">
            <span style={{ fontSize: 64 }}>🎉</span>
          </div>

          <h1
            className="text-4xl font-black uppercase tracking-tighter text-center mb-1"
            style={{ color: COLORS.text }}
          >
            GAME COMPLETE!
          </h1>
          <p
            className="text-center text-base mb-6"
            style={{ color: COLORS.textSec }}
          >
            You scored{" "}
            <span className="font-black" style={{ color: COLORS.teal }}>
              {game.coinsEarned} coins
            </span>
          </p>

          <div
            className="rounded-2xl p-5 mb-5"
            style={{
              background: "#fff",
              border: `1.5px solid ${COLORS.divider}`,
              boxShadow: "0 2px 12px rgba(30,20,10,0.08)",
            }}
            data-ocid="completion.card"
          >
            <div
              className="flex justify-between items-center py-2"
              style={{ borderBottom: `1px solid ${COLORS.divider}` }}
            >
              <span className="text-sm" style={{ color: COLORS.textSec }}>
                ✅ Correct matches
              </span>
              <span
                className="font-black text-sm"
                style={{ color: COLORS.text }}
              >
                {game.correctVotes}
              </span>
            </div>
            <div
              className="flex justify-between items-center py-2"
              style={{ borderBottom: `1px solid ${COLORS.divider}` }}
            >
              <span className="text-sm" style={{ color: COLORS.textSec }}>
                ❌ Missed
              </span>
              <span
                className="font-black text-sm"
                style={{ color: COLORS.text }}
              >
                {game.incorrectVotes}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-sm" style={{ color: COLORS.textSec }}>
                🪙 Coins earned
              </span>
              <span
                className="font-black text-sm"
                style={{ color: COLORS.teal }}
              >
                {game.coinsEarned}
              </span>
            </div>
          </div>

          {hasNext && (
            <div
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full mb-6 mx-auto w-fit"
              style={{
                background: `linear-gradient(135deg, ${COLORS.teal}, #c0356e)`,
                color: "#fff",
              }}
              data-ocid="completion.success_state"
            >
              <span>🔓</span>
              <span className="text-sm font-bold">
                Game {nextGameNum} is now unlocked!
              </span>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {hasNext && (
              <button
                type="button"
                onClick={onPlayNext}
                className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-opacity hover:opacity-90"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.teal}, #c0356e)`,
                  color: "#fff",
                  boxShadow: "0 2px 16px rgba(143,42,83,0.35)",
                }}
                data-ocid="completion.primary_button"
              >
                PLAY GAME {nextGameNum}
              </button>
            )}
            <button
              type="button"
              onClick={onHome}
              className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-opacity hover:opacity-80"
              style={{
                border: `2px solid ${COLORS.teal}`,
                color: COLORS.teal,
                background: "transparent",
              }}
              data-ocid="completion.secondary_button"
            >
              BACK TO HOME
            </button>
          </div>
        </div>

        <CaffeineFooter />
      </div>
    </MobileShell>
  );
}

// ─── Mobile Shell ─────────────────────────────────────────────────────────────
function MobileShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "#2a2a2a" }}>
      <div
        className="mx-auto relative overflow-hidden"
        style={{
          maxWidth: 390,
          minHeight: "100vh",
          background: COLORS.cream,
          boxShadow: "0 0 40px rgba(0,0,0,0.5)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function CaffeineFooter() {
  const year = new Date().getFullYear();
  const utm = `utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
    typeof window !== "undefined" ? window.location.hostname : "",
  )}`;
  return (
    <p className="text-center text-xs py-4" style={{ color: COLORS.textSec }}>
      © {year}.{" "}
      <a
        href={`https://caffeine.ai?${utm}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: COLORS.gold }}
      >
        Built with ♥ using caffeine.ai
      </a>
    </p>
  );
}
