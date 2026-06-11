import { Coins, Trash2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import type { Reward } from "../../../features/gamification/types";
import { useGamificationStore } from "../../../store/gamificationStore";
import { showPurchaseToast } from "../../../store/toastStore";

function RewardRow({
  reward,
  coins,
  onUpdate,
  onRemove,
  onBuy,
}: {
  reward: Reward;
  coins: number;
  onUpdate: (id: string, title: string, cost: number) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  onBuy: (cost: number, title: string) => Promise<void>;
}) {
  const [title, setTitle] = useState(reward.title);
  const [cost, setCost] = useState(String(reward.cost));

  useEffect(() => {
    setTitle(reward.title);
    setCost(String(reward.cost));
  }, [reward.title, reward.cost]);

  const commit = () => {
    const parsedCost = Number(cost);
    if (!title.trim() || !Number.isFinite(parsedCost) || parsedCost <= 0) {
      setTitle(reward.title);
      setCost(String(reward.cost));
      return;
    }
    if (title.trim() !== reward.title || parsedCost !== reward.cost) {
      void onUpdate(reward.id, title.trim(), parsedCost);
    }
  };

  return (
    <div className="flex items-center gap-2 rounded border border-border bg-surface-primary p-2">
      <input
        type="text"
        className="min-w-0 flex-1 rounded border border-transparent bg-transparent px-1 py-0.5 text-sm text-text-normal outline-none hover:border-border focus:border-accent"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.currentTarget.blur();
          }
        }}
      />
      <input
        type="number"
        min={1}
        className="w-14 rounded border border-transparent bg-transparent px-1 py-0.5 text-right text-sm tabular-nums text-text-normal outline-none hover:border-border focus:border-accent"
        value={cost}
        onChange={(event) => setCost(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.currentTarget.blur();
          }
        }}
      />
      <button
        type="button"
        disabled={coins < reward.cost}
        onClick={() => void onBuy(reward.cost, reward.title)}
        className="rounded bg-accent/20 px-2 py-1 text-xs font-medium tabular-nums text-accent hover:bg-accent/30 disabled:cursor-not-allowed disabled:bg-surface-secondary disabled:text-text-emphasis"
        title={
          coins < reward.cost
            ? `Need ${reward.cost - coins} more coins`
            : `Buy for ${reward.cost} coins`
        }
      >
        {reward.cost} C
      </button>
      <button
        type="button"
        onClick={() => void onRemove(reward.id)}
        className="text-text-muted hover:text-text-danger"
        aria-label={`Remove ${reward.title}`}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

export function RewardsSection() {
  const coins = useGamificationStore((s) => s.coins);
  const rewards = useGamificationStore((s) => s.rewards);
  const addReward = useGamificationStore((s) => s.addReward);
  const updateReward = useGamificationStore((s) => s.updateReward);
  const removeReward = useGamificationStore((s) => s.removeReward);
  const spendCoins = useGamificationStore((s) => s.spendCoins);
  const [newTitle, setNewTitle] = useState("");
  const [newCost, setNewCost] = useState("");

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    const cost = Number(newCost);
    if (!newTitle.trim() || !Number.isFinite(cost) || cost <= 0) {
      return;
    }
    await addReward(newTitle.trim(), cost);
    setNewTitle("");
    setNewCost("");
  };

  const handleBuy = async (cost: number, title: string) => {
    const success = await spendCoins(cost);
    if (success) {
      showPurchaseToast(title);
    }
  };

  return (
    <div className="mt-4 flex flex-col gap-4">
      <div className="flex items-center gap-1 font-bold text-accent">
        <Coins size={16} />
        {coins} Coins
      </div>

      <form onSubmit={(event) => void handleCreate(event)} className="flex gap-2 text-sm">
        <input
          type="text"
          placeholder="Reward (e.g. 1 hour of gaming)"
          className="min-w-0 flex-1 rounded border border-border bg-surface-primary px-2 py-1 text-text-normal placeholder:text-text-muted outline-none focus:border-accent"
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
        />
        <input
          type="number"
          placeholder="Cost"
          min={1}
          className="w-16 rounded border border-border bg-surface-primary px-2 py-1 text-text-normal placeholder:text-text-muted outline-none focus:border-accent"
          value={newCost}
          onChange={(event) => setNewCost(event.target.value)}
        />
        <button
          type="submit"
          disabled={!newTitle.trim() || !newCost}
          className="rounded bg-accent/20 px-2 py-1 text-accent hover:bg-accent/30 disabled:cursor-not-allowed disabled:bg-surface-secondary disabled:text-text-muted"
        >
          Add
        </button>
      </form>

      <div className="flex flex-col gap-2">
        {rewards.map((reward) => (
          <RewardRow
            key={reward.id}
            reward={reward}
            coins={coins}
            onUpdate={updateReward}
            onRemove={removeReward}
            onBuy={handleBuy}
          />
        ))}
      </div>
    </div>
  );
}
