/* eslint-disable react/jsx-one-expression-per-line */
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/Button/Button';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
} from '@/components/ui/Modal/Modal';
import { useWizardStore, useCanProceed } from '@/store';
import { backupService } from '@/services/backup';
import { Step1LockSelection } from './Step1LockSelection';
import { Step2CategoryGeneration } from './Step2CategoryGeneration';
import { Step3ApplyOrganization } from './Step3ApplyOrganization';

const TOTAL_STEPS = 3;

const STEP_TITLES: Record<number, string> = {
  1: 'Lock Folders',
  2: 'Generate Categories',
  3: 'Apply Organization',
};

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 50 : -50,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 50 : -50,
    opacity: 0,
  }),
};

interface StepWizardProps {
  onComplete: () => void;
  onCancel: () => void;
}

export function StepWizard({ onComplete, onCancel }: StepWizardProps) {
  const currentStep = useWizardStore((s) => s.currentStep);
  const applyPhase = useWizardStore((s) => s.applyPhase);
  const goNext = useWizardStore((s) => s.goNext);
  const goBack = useWizardStore((s) => s.goBack);
  const resetWizard = useWizardStore((s) => s.resetWizard);
  const setCategories = useWizardStore((s) => s.setCategories);
  const canProceed = useCanProceed();

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [direction, setDirection] = useState(1);

  const progress = ((currentStep - 1) / (TOTAL_STEPS - 1)) * 100;

  const handleGoNext = useCallback(async () => {
    if (currentStep === TOTAL_STEPS) return;
    setDirection(1);

    if (currentStep === 2) {
      try {
        await backupService.createBackup();
      } catch (err) {
        console.error('Failed to create backup before organization:', err);
      }
    }

    goNext();
  }, [currentStep, goNext]);

  const handleGoBack = useCallback(() => {
    if (currentStep === 2) {
      setCategories([]);
    }
    setDirection(-1);
    goBack();
  }, [currentStep, goBack, setCategories]);

  const handleCancelClick = useCallback(() => setShowCancelModal(true), []);
  const handleCloseCancelModal = useCallback(() => setShowCancelModal(false), []);
  const handleConfirmCancel = useCallback(() => {
    resetWizard();
    setShowCancelModal(false);
    onCancel();
  }, [resetWizard, onCancel]);
  const handleFinish = useCallback(() => {
    resetWizard();
    onComplete();
  }, [resetWizard, onComplete]);

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <Step1LockSelection />;
      case 2:
        return <Step2CategoryGeneration />;
      case 3:
        return <Step3ApplyOrganization onComplete={handleFinish} />;
      default:
        return null;
    }
  };

  const isLastStep = currentStep === TOTAL_STEPS;

  return (
    <div
      className={[
        'flex flex-col w-full h-screen p-6 transition-colors duration-300',
        'bg-background',
      ].join(' ')}
    >
      <div className="shrink-0 mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] font-medium text-muted uppercase tracking-widest font-mono">
            Step {currentStep} of {TOTAL_STEPS}
          </span>
          <span className="text-[12px] font-semibold tracking-tight text-foreground">
            {STEP_TITLES[currentStep]}
          </span>
        </div>
        <div className="h-[3px] bg-muted/20 rounded-full">
          <div
            className="h-full bg-[var(--color-primary)] rounded-full transition-[width] duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-muted/20 shrink-0">
        <button
          type="button"
          onClick={handleCancelClick}
          disabled={applyPhase === 'success'}
          className="text-sm font-medium px-5 py-2 rounded-[9px] border border-muted/20 bg-transparent text-muted hover:bg-muted/10 hover:text-foreground hover:border-muted/30 transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-muted/20"
        >
          Cancel
        </button>

        <div className="flex gap-2.5">
          {currentStep > 1 && !isLastStep && (
            <Button variant="outline" onClick={handleGoBack}>
              Back
            </Button>
          )}
          {!isLastStep && (
            <button
              type="button"
              onClick={handleGoNext}
              disabled={!canProceed}
              className={[
                'text-sm font-medium px-5 py-2 rounded-[9px] border transition-all duration-150',
                canProceed
                  ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] hover:border-[var(--color-primary-hover)] cursor-pointer'
                  : 'bg-muted/20 border-muted/20 text-muted/50 cursor-not-allowed opacity-60',
              ].join(' ')}
            >
              Next
            </button>
          )}
        </div>
      </div>

      <Modal open={showCancelModal} onOpenChange={(open) => !open && handleCloseCancelModal()}>
        <ModalContent
          className="min-w-80 max-w-[420px]"
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onFocusOutside={(e) => e.preventDefault()}
        >
          <ModalHeader>
            <ModalTitle>Cancel Organization?</ModalTitle>
            <ModalDescription className="mt-2">
              Are you sure you want to cancel? Your progress will be lost and you will need to start
              over.
            </ModalDescription>
          </ModalHeader>
          <ModalBody />
          <ModalFooter>
            <Button variant="outline" onClick={handleCloseCancelModal}>
              Continue
            </Button>
            <Button variant="destructive" onClick={handleConfirmCancel}>
              Cancel &amp; Exit
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
