import { LockType, LockState, STORAGE_KEYS } from '@/types/index';
import { get, set, remove } from '@/services/storage';

type LockStatesMap = Record<string, LockType>;

async function getLockStates(): Promise<LockState[]> {
  const lockMap = await get<LockStatesMap>(STORAGE_KEYS.LOCK_STATES);
  if (!lockMap) {
    return [];
  }
  return Object.entries(lockMap).map(([folderId, lockType]) => ({
    folderId,
    lockType,
  }));
}

async function setLockState(folderId: string, lockType: LockType): Promise<void> {
  const lockMap = (await get<LockStatesMap>(STORAGE_KEYS.LOCK_STATES)) || {};

  if (lockType === 'none') {
    delete lockMap[folderId];
  } else {
    lockMap[folderId] = lockType;
  }

  await set(STORAGE_KEYS.LOCK_STATES, lockMap);
}

async function clearLockState(folderId: string): Promise<void> {
  await setLockState(folderId, 'none');
}

async function getLockedFolders(): Promise<LockState[]> {
  const lockStates = await getLockStates();
  return lockStates.filter((state) => state.lockType !== 'none');
}

async function getHardLockedFolders(): Promise<LockState[]> {
  const lockStates = await getLockStates();
  return lockStates.filter((state) => state.lockType === 'hard');
}

async function getSmartLockedFolders(): Promise<LockState[]> {
  const lockStates = await getLockStates();
  return lockStates.filter((state) => state.lockType === 'smart');
}

async function isFolderLocked(folderId: string): Promise<boolean> {
  const lockMap = await get<LockStatesMap>(STORAGE_KEYS.LOCK_STATES);
  if (!lockMap) {
    return false;
  }
  const lockType = lockMap[folderId];
  return lockType !== undefined && lockType !== 'none';
}

async function clearAllSmartLocks(): Promise<void> {
  const lockMap = (await get<LockStatesMap>(STORAGE_KEYS.LOCK_STATES)) || {};
  const updatedMap: LockStatesMap = {};

  Object.entries(lockMap).forEach(([folderId, lockType]) => {
    if (lockType !== 'smart') {
      updatedMap[folderId] = lockType;
    }
  });

  const hasEntries = Object.keys(updatedMap).length > 0;
  if (hasEntries) {
    await set(STORAGE_KEYS.LOCK_STATES, updatedMap);
  } else {
    await remove(STORAGE_KEYS.LOCK_STATES);
  }
}

export const lockStateService = {
  getLockStates,
  setLockState,
  clearLockState,
  getLockedFolders,
  getHardLockedFolders,
  getSmartLockedFolders,
  isFolderLocked,
  clearAllSmartLocks,
};
