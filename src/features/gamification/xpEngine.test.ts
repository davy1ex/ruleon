import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleTaskCompletion } from "./xpEngine";

const mockGetDbContext = vi.fn();
const mockAddXp = vi.fn();
const mockGetWorkspaceState = vi.fn();
const mockGetPomodoroRunning = vi.fn();
const mockShowXpToast = vi.fn();
const mockPatchNodeMetadataFields = vi.fn();
const mockGetOutlinerState = vi.fn();
const mockOutlinerSetState = vi.fn();

vi.mock("../../store/dbContext", () => ({
  getDbContext: () => mockGetDbContext(),
}));

vi.mock("../../domain/outliner/mutations/patchNodeMetadata", () => ({
  patchNodeMetadataFields: (...args: unknown[]) => mockPatchNodeMetadataFields(...args),
}));

vi.mock("../../store/gamificationStore", () => ({
  useGamificationStore: {
    getState: () => ({
      addXp: (...args: unknown[]) => mockAddXp(...args),
      loadXp: vi.fn(),
    }),
  },
  hydrateGamificationFromDB: vi.fn(),
}));

vi.mock("../../store/workspaceStore", () => ({
  useWorkspaceStore: {
    getState: () => mockGetWorkspaceState(),
  },
}));

vi.mock("../../store/pomodoroStore", () => ({
  isPomodoroRunning: () => mockGetPomodoroRunning(),
}));

vi.mock("../../store/toastStore", () => ({
  showXpToast: (...args: unknown[]) => mockShowXpToast(...args),
}));

vi.mock("../../store/outlinerStore", () => ({
  useOutlinerStore: Object.assign(
    (selector?: (state: unknown) => unknown) => {
      const state = mockGetOutlinerState();
      return selector ? selector(state) : state;
    },
    {
      getState: () => mockGetOutlinerState(),
      setState: (...args: unknown[]) => mockOutlinerSetState(...args),
    },
  ),
}));

describe("handleTaskCompletion", () => {
  const node = {
    id: "node-1",
    metadata: {},
    task_status: "TODO" as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetDbContext.mockReturnValue({ db: {} });
    mockGetWorkspaceState.mockReturnValue({
      plugins: { gamification: true },
    });
    mockGetPomodoroRunning.mockReturnValue(false);
    mockAddXp.mockResolvedValue(undefined);
    mockPatchNodeMetadataFields.mockResolvedValue({ awarded_xp: 10 });
    mockGetOutlinerState.mockReturnValue({
      nodesByRootId: { root: [node] },
      linkedReferenceNodesById: {},
    });
  });

  it("awards xp and stores awarded_xp when task is completed", async () => {
    await handleTaskCompletion("node-1", "DONE", "TODO");

    expect(mockAddXp).toHaveBeenCalledWith(10);
    expect(mockShowXpToast).toHaveBeenCalledWith(10);
    expect(mockPatchNodeMetadataFields).toHaveBeenCalledOnce();
    expect(mockOutlinerSetState).toHaveBeenCalledOnce();
  });

  it("applies pomodoro bonus when timer is running", async () => {
    mockGetPomodoroRunning.mockReturnValue(true);

    await handleTaskCompletion("node-1", "DONE", "TODO");

    expect(mockAddXp).toHaveBeenCalledWith(15);
    expect(mockShowXpToast).toHaveBeenCalledWith(15);
  });

  it("revokes xp when task completion is undone", async () => {
    mockGetOutlinerState.mockReturnValue({
      nodesByRootId: {
        root: [{ ...node, task_status: "TODO", metadata: { awarded_xp: 15 } }],
      },
      linkedReferenceNodesById: {},
    });
    mockPatchNodeMetadataFields.mockResolvedValue({});

    await handleTaskCompletion("node-1", "TODO", "DONE");

    expect(mockAddXp).toHaveBeenCalledWith(-15);
    expect(mockShowXpToast).toHaveBeenCalledWith(-15);
    expect(mockPatchNodeMetadataFields).toHaveBeenCalledOnce();
  });

  it("skips when gamification plugin is disabled", async () => {
    mockGetWorkspaceState.mockReturnValue({
      plugins: { gamification: false },
    });

    await handleTaskCompletion("node-1", "DONE", "TODO");

    expect(mockAddXp).not.toHaveBeenCalled();
  });

  it("skips when status is not a completion transition", async () => {
    await handleTaskCompletion("node-1", "TODO", null);

    expect(mockAddXp).not.toHaveBeenCalled();
  });

  it("applies penalty xp when task is marked failed", async () => {
    mockGetOutlinerState.mockReturnValue({
      nodesByRootId: {
        root: [{ ...node, task_status: "FAILED" }],
      },
      linkedReferenceNodesById: {},
    });

    await handleTaskCompletion("node-1", "FAILED", "TODO");

    expect(mockAddXp).toHaveBeenCalledWith(-15);
    expect(mockShowXpToast).toHaveBeenCalledWith(-15);
  });

  it("does not apply pomodoro bonus to failed tasks", async () => {
    mockGetPomodoroRunning.mockReturnValue(true);
    mockGetOutlinerState.mockReturnValue({
      nodesByRootId: {
        root: [{ ...node, task_status: "FAILED" }],
      },
      linkedReferenceNodesById: {},
    });

    await handleTaskCompletion("node-1", "FAILED", "TODO");

    expect(mockAddXp).toHaveBeenCalledWith(-15);
  });

  it("revokes penalty when failed status is cleared", async () => {
    mockGetOutlinerState.mockReturnValue({
      nodesByRootId: {
        root: [
          {
            ...node,
            task_status: null,
            metadata: { awarded_xp: -15 },
          },
        ],
      },
      linkedReferenceNodesById: {},
    });
    mockPatchNodeMetadataFields.mockResolvedValue({});

    await handleTaskCompletion("node-1", null, "FAILED");

    expect(mockAddXp).toHaveBeenCalledWith(15);
    expect(mockShowXpToast).toHaveBeenCalledWith(15);
  });

  it("swaps completion xp for penalty when done becomes failed", async () => {
    mockGetOutlinerState.mockReturnValue({
      nodesByRootId: {
        root: [{ ...node, task_status: "FAILED", metadata: { awarded_xp: 10 } }],
      },
      linkedReferenceNodesById: {},
    });
    mockPatchNodeMetadataFields
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ awarded_xp: -15 });

    await handleTaskCompletion("node-1", "FAILED", "DONE");

    expect(mockAddXp).toHaveBeenNthCalledWith(1, -10);
    expect(mockAddXp).toHaveBeenNthCalledWith(2, -15);
  });
});
