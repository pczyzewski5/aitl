import { useSyncExternalStore } from 'react';
import { DEFAULT_ACCOUNT_OPTIONS, MAX_FAILED_ATTEMPTS } from './fixtures';
import type { AccountNameStyle, AccountOptions, SharedAccountCount, UserId } from './fixtures';

export type LoginOutcome = 'ok' | 'wrong-password' | 'unknown-email' | 'locked' | 'network' | 'server';
export type SessionStatus = 'none' | 'active' | 'expired-30' | 'expired-90' | 'logged-out';
export type ListScenario = 'loaded' | 'loading' | 'empty' | 'error';
export type IdProbeKind = 'own' | 'foreign' | 'no-session';
export type LoginDecision = 'success' | 'invalid-credentials' | 'too-many-attempts' | 'network' | 'server';

export interface ScenarioState {
  sessionUserId: UserId | null;
  sessionStatus: SessionStatus;
  loginUserId: UserId;
  loginOutcome: LoginOutcome;
  failedAttempts: number;
  listScenario: ListScenario;
  accountOptions: AccountOptions;
  openedAccountId: string | null;
  twoSessions: boolean;
  signedOutPairMembers: readonly UserId[];
  idProbeResult: string | null;
  loginFormEpoch: number;
}

const INITIAL_LOGIN_USER: UserId = 'pawel';

function createInitialState(loginFormEpoch: number): ScenarioState {
  return {
    sessionUserId: null,
    sessionStatus: 'none',
    loginUserId: INITIAL_LOGIN_USER,
    loginOutcome: 'ok',
    failedAttempts: 0,
    listScenario: 'loaded',
    accountOptions: DEFAULT_ACCOUNT_OPTIONS,
    openedAccountId: null,
    twoSessions: false,
    signedOutPairMembers: [],
    idProbeResult: null,
    loginFormEpoch,
  };
}

let state: ScenarioState = createInitialState(0);
const listeners = new Set<() => void>();

function update(next: ScenarioState): void {
  state = next;
  listeners.forEach((listener) => listener());
}

export function getState(): ScenarioState {
  return state;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function useScenario(): ScenarioState {
  return useSyncExternalStore(subscribe, getState);
}

export function setLoginUser(loginUserId: UserId): void {
  update({ ...state, loginUserId });
}

export function setLoginOutcome(loginOutcome: LoginOutcome): void {
  update({ ...state, loginOutcome });
}

export function setListScenario(listScenario: ListScenario): void {
  update({ ...state, listScenario });
}

export function setNameStyle(nameStyle: AccountNameStyle): void {
  update({ ...state, accountOptions: { ...state.accountOptions, nameStyle } });
}

export function setSharedCount(sharedCount: SharedAccountCount): void {
  update({ ...state, accountOptions: { ...state.accountOptions, sharedCount } });
}

export function setTwoSessions(twoSessions: boolean): void {
  update({ ...state, twoSessions, signedOutPairMembers: [] });
}

export function signOutPairMember(userId: UserId): void {
  if (!state.signedOutPairMembers.includes(userId)) {
    update({ ...state, signedOutPairMembers: [...state.signedOutPairMembers, userId] });
  }
}

export function setIdProbeResult(idProbeResult: string | null): void {
  update({ ...state, idProbeResult });
}

export function attemptLogin(): LoginDecision {
  const { loginOutcome, failedAttempts } = state;
  if (failedAttempts >= MAX_FAILED_ATTEMPTS || loginOutcome === 'locked') {
    return 'too-many-attempts';
  }
  if (loginOutcome === 'wrong-password' || loginOutcome === 'unknown-email') {
    const nextFailedAttempts = failedAttempts + 1;
    update({ ...state, failedAttempts: nextFailedAttempts });

    return nextFailedAttempts >= MAX_FAILED_ATTEMPTS ? 'too-many-attempts' : 'invalid-credentials';
  }
  if (loginOutcome === 'network' || loginOutcome === 'server') {
    return loginOutcome;
  }

  return 'success';
}

export function logIn(): void {
  update({ ...state, sessionUserId: state.loginUserId, sessionStatus: 'active', failedAttempts: 0, openedAccountId: null });
}

export function logOut(): void {
  update({
    ...state,
    sessionUserId: null,
    sessionStatus: 'logged-out',
    failedAttempts: 0,
    openedAccountId: null,
    loginFormEpoch: state.loginFormEpoch + 1,
  });
}

export function expireSession(reason: 'expired-30' | 'expired-90'): void {
  if (state.sessionUserId === null) {
    return;
  }
  update({ ...state, sessionUserId: null, sessionStatus: reason, openedAccountId: null, loginFormEpoch: state.loginFormEpoch + 1 });
}

export function openAccount(openedAccountId: string): void {
  update({ ...state, openedAccountId });
}

export function resetSimulation(): void {
  update(createInitialState(state.loginFormEpoch + 1));
}
