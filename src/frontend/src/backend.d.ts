import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface UserState {
    gameStates: Array<GameProgress>;
    wallet: bigint;
}
export interface GameProgress {
    status: GameStatus;
    voteCount: bigint;
    gameId: bigint;
    incorrectVotes: bigint;
    correctVotes: bigint;
    coinsEarned: bigint;
}
export interface VoteResult {
    coins: bigint;
    isMatch: boolean;
}
export enum GameStatus {
    completed = "completed",
    locked = "locked",
    unlocked = "unlocked"
}
export interface backendInterface {
    completeGame(gameId: bigint): Promise<void>;
    getGameProgress(gameId: bigint): Promise<GameProgress>;
    getUserState(): Promise<UserState>;
    getWallet(): Promise<bigint>;
    isRegistered(): Promise<boolean>;
    register(): Promise<void>;
    resetGame(gameId: bigint): Promise<void>;
    unlockGame(gameId: bigint): Promise<string>;
    updateGameStatus(gameId: bigint, status: GameStatus): Promise<void>;
    vote(gameId: bigint, isMatch: boolean): Promise<VoteResult>;
}
