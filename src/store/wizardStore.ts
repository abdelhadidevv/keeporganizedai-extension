import { create } from 'zustand';
import type { Category, BookmarkAssignment, LockType } from '@/types';

interface WizardState {
  currentStep: number;
  selectedFolderId: string | null;
  categories: Category[];
  assignments: BookmarkAssignment[];
  isProcessing: boolean;
  error: string | null;
  lockStates: Record<string, LockType>;
  applyPhase: 'collect' | 'assign' | 'apply' | 'success' | null;
}

interface WizardActions {
  setLockStates: (lockStates: Record<string, LockType>) => void;
  setCategories: (categories: Category[]) => void;
  setAssignments: (assignments: BookmarkAssignment[]) => void;
  setIsProcessing: (isProcessing: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedFolder: (folderId: string | null) => void;
  setApplyPhase: (phase: 'collect' | 'assign' | 'apply' | 'success' | null) => void;
  goToStep: (step: number) => void;
  goNext: () => void;
  goBack: () => void;
  resetWizard: () => void;
}

const TOTAL_STEPS = 3;

const initialState: WizardState = {
  currentStep: 1,
  selectedFolderId: null,
  categories: [],
  assignments: [],
  isProcessing: false,
  error: null,
  lockStates: {},
  applyPhase: null,
};

export const useWizardStore = create<WizardState & WizardActions>()((set, get) => ({
  ...initialState,

  setLockStates: (lockStates) => set({ lockStates }),

  setCategories: (categories) => set({ categories }),

  setAssignments: (assignments) => set({ assignments }),

  setIsProcessing: (isProcessing) => set({ isProcessing }),

  setError: (error) => set({ error }),

  setSelectedFolder: (selectedFolderId) => set({ selectedFolderId }),

  setApplyPhase: (applyPhase) => set({ applyPhase }),

  goToStep: (step) => {
    if (step >= 1 && step <= TOTAL_STEPS) {
      set({ currentStep: step });
    }
  },

  goNext: () => {
    const { currentStep, categories } = get();
    if (currentStep < TOTAL_STEPS) {
      if (currentStep === 2 && categories.length === 0) {
        return;
      }
      set({ currentStep: currentStep + 1 });
    }
  },

  goBack: () => {
    const { currentStep } = get();
    if (currentStep > 1) {
      set({ currentStep: currentStep - 1 });
    }
  },

  resetWizard: () => set(initialState),
}));

export const isStepValid = (step: number, categories: Category[]): boolean => {
  switch (step) {
    case 1:
      return true;
    case 2:
      return categories.length > 0;
    case 3:
      return true;
    default:
      return false;
  }
};

export const useCanProceed = (): boolean => {
  const currentStep = useWizardStore((s) => s.currentStep);
  const categories = useWizardStore((s) => s.categories);
  return isStepValid(currentStep, categories);
};
