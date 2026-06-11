import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetDbContext = vi.fn();
const mockGetGamificationProfile = vi.fn();
const mockSetGamificationProfile = vi.fn();
const mockEnsureDefaultGamificationProfile = vi.fn();
const mockGetCustomRewards = vi.fn();
const mockSetCustomRewards = vi.fn();
const mockCreateNodeId = vi.fn();
const mockGetTodayActivity = vi.fn();

vi.mock("./dbContext", () => ({
  getDbContext: () => mockGetDbContext(),
}));

vi.mock("../features/gamification/gamificationKv", () => ({
  getGamificationProfile: (...args: unknown[]) => mockGetGamificationProfile(...args),
  setGamificationProfile: (...args: unknown[]) => mockSetGamificationProfile(...args),
  ensureDefaultGamificationProfile: (...args: unknown[]) =>
    mockEnsureDefaultGamificationProfile(...args),
  getCustomRewards: (...args: unknown[]) => mockGetCustomRewards(...args),
  setCustomRewards: (...args: unknown[]) => mockSetCustomRewards(...args),
}));

vi.mock("../domain/outliner/seed", () => ({
  createNodeId: () => mockCreateNodeId(),
}));

vi.mock("../domain/outliner/todayActivity", () => ({
  getTodayActivity: (...args: unknown[]) => mockGetTodayActivity(...args),
  enrichTaskTitlesFromMemory: (
    tasks: unknown[],
    _nodesByRootId: Record<string, unknown[]>,
  ) => tasks,
}));

vi.mock("./outlinerStore", () => ({
  useOutlinerStore: {
    getState: () => ({
      nodesByRootId: {},
      linkedReferenceNodesById: {},
    }),
  },
}));

import { useGamificationStore } from "./gamificationStore";

const baseProfile = {
  totalXp: 100,
  coins: 50,
  dailyStats: {},
};

describe("useGamificationStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetDbContext.mockReturnValue({ db: {} });
    mockGetGamificationProfile.mockResolvedValue({ ...baseProfile });
    mockSetGamificationProfile.mockResolvedValue(undefined);
    mockEnsureDefaultGamificationProfile.mockResolvedValue({ ...baseProfile });
    mockGetCustomRewards.mockResolvedValue([]);
    mockSetCustomRewards.mockResolvedValue(undefined);
    mockCreateNodeId.mockReturnValue("reward-1");
    mockGetTodayActivity.mockResolvedValue({ tasks: [], projects: [] });
    useGamificationStore.setState({
      totalXp: 0,
      coins: 0,
      rewards: [],
      todayXpEarned: 0,
      todayCompleted: 0,
      todayTasks: [],
      todayProjects: [],
    });
  });

  it("loadXp refreshes today activity", async () => {
    mockGetTodayActivity.mockResolvedValue({
      tasks: [
        {
          id: "t1",
          title: "Ship feature",
          pageTitle: "Ruleon",
          pageRootId: "page-1",
          pageName: "Ruleon",
          completedAt: "",
        },
      ],
      projects: [{ rootId: "page-1", title: "Ruleon", pageName: "Ruleon" }],
    });

    await useGamificationStore.getState().loadXp();

    expect(useGamificationStore.getState().todayTasks).toEqual([
      {
        id: "t1",
        title: "Ship feature",
        pageTitle: "Ruleon",
        pageRootId: "page-1",
        pageName: "Ruleon",
        completedAt: "",
      },
    ]);
    expect(useGamificationStore.getState().todayProjects).toEqual([
      { rootId: "page-1", title: "Ruleon", pageName: "Ruleon" },
    ]);
  });

  it("addXp updates coins 1:1 with xp delta", async () => {
    await useGamificationStore.getState().addXp(10);

    expect(mockSetGamificationProfile).toHaveBeenCalledWith(
      {},
      expect.objectContaining({ totalXp: 110, coins: 60 }),
    );
    expect(useGamificationStore.getState().coins).toBe(60);
  });

  it("addXp allows coins to go negative on revoke", async () => {
    mockGetGamificationProfile.mockResolvedValue({
      totalXp: 10,
      coins: 5,
      dailyStats: {},
    });

    await useGamificationStore.getState().addXp(-20);

    expect(mockSetGamificationProfile).toHaveBeenCalledWith(
      {},
      expect.objectContaining({ totalXp: 0, coins: -15 }),
    );
    expect(useGamificationStore.getState().coins).toBe(-15);
  });

  it("spendCoins succeeds when balance is sufficient", async () => {
    useGamificationStore.setState({ coins: 50 });
    mockGetGamificationProfile.mockResolvedValue({ ...baseProfile, coins: 50 });

    const success = await useGamificationStore.getState().spendCoins(20);

    expect(success).toBe(true);
    expect(useGamificationStore.getState().coins).toBe(30);
    expect(mockSetGamificationProfile).toHaveBeenCalledWith(
      {},
      expect.objectContaining({ coins: 30 }),
    );
  });

  it("spendCoins fails when balance is insufficient", async () => {
    useGamificationStore.setState({ coins: 10 });

    const success = await useGamificationStore.getState().spendCoins(20);

    expect(success).toBe(false);
    expect(mockSetGamificationProfile).not.toHaveBeenCalled();
  });

  it("addReward persists a new reward", async () => {
    await useGamificationStore.getState().addReward("Coffee break", 5);

    expect(useGamificationStore.getState().rewards).toEqual([
      { id: "reward-1", title: "Coffee break", cost: 5 },
    ]);
    expect(mockSetCustomRewards).toHaveBeenCalledWith({}, [
      { id: "reward-1", title: "Coffee break", cost: 5 },
    ]);
  });

  it("updateReward changes title and cost", async () => {
    useGamificationStore.setState({
      rewards: [{ id: "r1", title: "Old", cost: 5 }],
    });

    await useGamificationStore.getState().updateReward("r1", "New title", 10);

    expect(useGamificationStore.getState().rewards).toEqual([
      { id: "r1", title: "New title", cost: 10 },
    ]);
    expect(mockSetCustomRewards).toHaveBeenCalledWith({}, [
      { id: "r1", title: "New title", cost: 10 },
    ]);
  });

  it("updateReward ignores invalid values", async () => {
    useGamificationStore.setState({
      rewards: [{ id: "r1", title: "Keep", cost: 5 }],
    });

    await useGamificationStore.getState().updateReward("r1", "", 10);
    await useGamificationStore.getState().updateReward("r1", "New", 0);

    expect(useGamificationStore.getState().rewards).toEqual([
      { id: "r1", title: "Keep", cost: 5 },
    ]);
    expect(mockSetCustomRewards).not.toHaveBeenCalled();
  });

  it("removeReward deletes the reward and persists", async () => {
    useGamificationStore.setState({
      rewards: [
        { id: "keep", title: "Keep", cost: 1 },
        { id: "drop", title: "Drop", cost: 2 },
      ],
    });

    await useGamificationStore.getState().removeReward("drop");

    expect(useGamificationStore.getState().rewards).toEqual([
      { id: "keep", title: "Keep", cost: 1 },
    ]);
    expect(mockSetCustomRewards).toHaveBeenCalledWith({}, [
      { id: "keep", title: "Keep", cost: 1 },
    ]);
  });
});
