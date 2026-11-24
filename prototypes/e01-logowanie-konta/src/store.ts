import { useSyncExternalStore } from 'react';
import type { UserId } from './fixtures';

export interface ScenarioState {
  sessionUserId: UserId | null;
  loginUserId: UserId;
  openedAccountId: string | null;
  loginFormEpoch: number;
}

const INITIAL_LOGIN_USER: UserId = 'pawel';

function createInitialState(loginFormEpoch: number): ScenarioState {
  return { sessionUserId: null, loginUserId: INITIAL_LOGIN_USER, openedAccountId: null, loginFormEpoch };
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

export function logIn(): void {
  update({ ...state, sessionUserId: state.loginUserId, openedAccountId: null });
}

export function logOut(): void {
  update({ ...state, sessionUserId: null, openedAccountId: null, loginFormEpoch: state.loginFormEpoch + 1 });
}

export function openAccount(openedAccountId: string): void {
  update({ ...state, openedAccountId });
}

export function resetSimulation(): void {
  update(createInitialState(state.loginFormEpoch + 1));
}
