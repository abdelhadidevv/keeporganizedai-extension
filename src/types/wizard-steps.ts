import type { WizardStep } from './index';

export const WIZARD_STEPS: WizardStep[] = [
  {
    step: 1,
    title: 'Select Folder',
    description: 'Choose the bookmark folder to organize',
    isComplete: false,
  },
  {
    step: 2,
    title: 'Review Locks',
    description: 'Review and manage folder locks',
    isComplete: false,
  },
  {
    step: 3,
    title: 'AI Categorization',
    description: 'AI categorizes your bookmarks',
    isComplete: false,
  },
  {
    step: 4,
    title: 'Review & Confirm',
    description: 'Review AI suggestions and make changes',
    isComplete: false,
  },
  {
    step: 5,
    title: 'Apply Changes',
    description: 'Apply the organization changes',
    isComplete: false,
  },
];
