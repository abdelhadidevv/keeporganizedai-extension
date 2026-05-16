import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'motion/react';
import { MainScreen } from '@/components/MainScreen';
import { SettingsScreen } from '@/components/SettingsScreen/SettingsScreen';
import { StepWizard } from '@/components/StepWizard/StepWizard';
import { Toaster } from '@/components/ui';
import { RTL_LANGS } from '@/i18n/config';

type Screen = 'main' | 'settings' | 'wizard';

function App() {
  const { i18n } = useTranslation();
  const [currentScreen, setCurrentScreen] = useState<Screen>('main');

  const handleLanguageChange = useCallback((lng: string) => {
    const newDir = RTL_LANGS.includes(lng) ? 'rtl' : 'ltr';
    document.documentElement.lang = lng;
    document.documentElement.dir = newDir;
  }, []);

  useEffect(() => {
    handleLanguageChange(i18n.language);
  }, [i18n.language, handleLanguageChange]);

  const handleAutoOrganizeClick = () => {
    setCurrentScreen('wizard');
  };

  const handleWizardComplete = () => {
    setCurrentScreen('main');
  };

  const handleWizardCancel = () => {
    setCurrentScreen('main');
  };

  const handleSettingsClick = () => {
    setCurrentScreen('settings');
  };

  const handleBackToMain = () => {
    setCurrentScreen('main');
  };

  return (
    <div className="relative overflow-hidden h-screen">
      <AnimatePresence mode="wait">
        {currentScreen === 'main' && (
          <motion.div
            key="main"
            initial={{ x: 0 }}
            animate={{ x: 0 }}
            exit={{ x: 0 }}
            transition={{ duration: 0 }}
            className="absolute inset-0"
          >
            <MainScreen
              onAutoOrganizeClick={handleAutoOrganizeClick}
              onSettingsClick={handleSettingsClick}
            />
          </motion.div>
        )}

        {currentScreen === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
          >
            <SettingsScreen onBack={handleBackToMain} />
          </motion.div>
        )}

        {currentScreen === 'wizard' && (
          <motion.div
            key="wizard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
          >
            <StepWizard onComplete={handleWizardComplete} onCancel={handleWizardCancel} />
          </motion.div>
        )}
      </AnimatePresence>
      <Toaster />
    </div>
  );
}

export default App;
