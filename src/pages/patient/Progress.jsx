import React, { useEffect, useMemo, useState } from "react";
import {
  Brain,
  CheckCircle2,
  Clock3,
  Target,
  TrendingUp,
  Trophy,
} from "lucide-react";

function Progress() {
  const [serverData, setServerData] = useState(null);
  const [localHistory, setLocalHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("smriti-game-history") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    fetch("/api/patient/progress")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setServerData(data);
        }
      })
      .catch((err) => console.warn("Could not fetch server progress:", err));
  }, []);

  const gameHistory = serverData?.recentActivities?.length
    ? serverData.recentActivities
    : localHistory;

  const stats = useMemo(() => {
    if (serverData) {
      return {
        gamesPlayed: serverData.gamesPlayed,
        averageAccuracy: serverData.averageAccuracy,
        bestAccuracy: serverData.bestAccuracy,
        totalTime: serverData.totalTime,
      };
    }

    if (!gameHistory.length) {
      return {
        gamesPlayed: 0,
        averageAccuracy: 0,
        bestAccuracy: 0,
        totalTime: 0,
      };
    }

    const totalAccuracy = gameHistory.reduce(
      (sum, game) => sum + Number(game.accuracy || 0),
      0
    );

    const bestAccuracy = Math.max(
      ...gameHistory.map((game) => Number(game.accuracy || 0))
    );

    const totalTime = gameHistory.reduce(
      (sum, game) => sum + Number(game.elapsedTime || 0),
      0
    );

    return {
      gamesPlayed: gameHistory.length,
      averageAccuracy: Math.round(totalAccuracy / gameHistory.length),
      bestAccuracy,
      totalTime,
    };
  }, [serverData, gameHistory]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    if (mins === 0) {
      return `${secs}s`;
    }

    return `${mins}m ${secs}s`;
  };

  const formatGameName = (game) => {
    if (game.gameId === "spot-the-difference") {
      return "Spot the Difference";
    }

    if (game.category === "memory" || game.gameId === "memory-match") {
      return "Memory Match";
    }

    return game.gameId || "Cognitive Activity";
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">
          Your Journey
        </p>

        <h1 className="text-3xl md:text-4xl font-black text-[#0f3e3a] mt-1">
          My Progress
        </h1>

        <p className="text-sm text-gray-500 mt-2">
          See your recent activities and how you&apos;re doing.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-[#0f3e3a] flex items-center justify-center">
            <Brain size={21} />
          </div>

          <p className="text-xs text-gray-400 mt-4">
            Activities Completed
          </p>

          <p className="text-3xl font-black text-gray-900 mt-1">
            {stats.gamesPlayed}
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Target size={21} />
          </div>

          <p className="text-xs text-gray-400 mt-4">
            Average Accuracy
          </p>

          <p className="text-3xl font-black text-gray-900 mt-1">
            {stats.averageAccuracy}%
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Trophy size={21} />
          </div>

          <p className="text-xs text-gray-400 mt-4">
            Best Accuracy
          </p>

          <p className="text-3xl font-black text-gray-900 mt-1">
            {stats.bestAccuracy}%
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
          <div className="w-11 h-11 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center">
            <Clock3 size={21} />
          </div>

          <p className="text-xs text-gray-400 mt-4">
            Time Spent
          </p>

          <p className="text-2xl font-black text-gray-900 mt-1">
            {formatTime(stats.totalTime)}
          </p>
        </div>
      </div>

      {/* Encouragement */}
      <div className="bg-[#edf7f2] border border-emerald-100 rounded-[28px] p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shrink-0">
            <TrendingUp size={22} className="text-[#0f3e3a]" />
          </div>

          <div>
            <h2 className="font-bold text-[#0f3e3a]">
              Keep going at your own pace ❤️
            </h2>

            <p className="text-sm text-gray-600 mt-1">
              Your activity history helps ANVESHA personalize future
              activities. It is not a medical assessment.
            </p>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <section className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Recent Activities
            </h2>

            <p className="text-sm text-gray-400 mt-1">
              Your latest completed activities.
            </p>
          </div>

          <CheckCircle2 size={21} className="text-emerald-500" />
        </div>

        {gameHistory.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-50 mx-auto flex items-center justify-center">
              <Brain size={24} className="text-gray-300" />
            </div>

            <p className="font-semibold text-gray-700 mt-4">
              No activities completed yet
            </p>

            <p className="text-sm text-gray-400 mt-1">
              Complete an activity and your progress will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {gameHistory.slice(0, 10).map((game, index) => (
              <div
                key={`${game.completedAt || "game"}-${index}`}
                className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-gray-100 p-4"
              >
                <div className="w-11 h-11 rounded-2xl bg-[#f4f8f6] flex items-center justify-center shrink-0">
                  <Brain size={20} className="text-[#0f3e3a]" />
                </div>

                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">
                    {formatGameName(game)}
                  </h3>

                  <p className="text-xs text-gray-400 mt-1">
                    {game.difficulty
                      ? `${game.difficulty} difficulty`
                      : "Cognitive activity"}
                    {game.mistakes !== undefined
                      ? ` • ${game.mistakes} mistakes`
                      : ""}
                  </p>
                </div>

                <div className="flex items-center gap-5">
                  <div>
                    <p className="text-[11px] text-gray-400">
                      Accuracy
                    </p>

                    <p className="font-bold text-[#0f3e3a]">
                      {game.accuracy ?? 0}%
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] text-gray-400">
                      Time
                    </p>

                    <p className="font-bold text-gray-800">
                      {formatTime(Number(game.elapsedTime || 0))}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Note */}
      <p className="text-center text-xs text-gray-400 pb-3">
        Progress reflects activity performance for personalization and
        engagement, not diagnosis.
      </p>
    </div>
  );
}

export default Progress;