import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Order "mo:core/Order";
import Nat "mo:core/Nat";
import Array "mo:core/Array";

actor {
  type GameStatus = { #locked; #unlocked; #completed };
  type VoteResult = { isMatch : Bool; coins : Nat };
  type GameProgress = {
    gameId : Nat;
    voteCount : Nat;
    status : GameStatus;
    correctVotes : Nat;
    incorrectVotes : Nat;
    coinsEarned : Nat;
  };

  module GameProgress {
    public func compare(game1 : GameProgress, game2 : GameProgress) : Order.Order {
      Nat.compare(game1.gameId, game2.gameId);
    };
  };

  type UserState = {
    wallet : Nat;
    gameStates : [GameProgress];
  };

  let users = Map.empty<Principal, UserState>();

  func getUserStateInternal(caller : Principal) : UserState {
    switch (users.get(caller)) {
      case (null) { Runtime.trap("User does not exist") };
      case (?userState) { userState };
    };
  };

  func getGameState(userState : UserState, gameId : Nat) : GameProgress {
    switch (userState.gameStates.find(func(game) { game.gameId == gameId })) {
      case (null) { Runtime.trap("Game does not exist") };
      case (?gameState) { gameState };
    };
  };

  func updateUserBalance(userState : UserState, coins : Nat) : UserState {
    {
      userState with
      wallet = coins;
    };
  };

  func updateUserStateGame(userState : UserState, progress : GameProgress) : UserState {
    {
      userState with
      gameStates = userState.gameStates.map(
        func(gameState) {
          if (gameState.gameId == progress.gameId) { progress } else { gameState };
        }
      );
    };
  };

  public query ({ caller }) func isRegistered() : async Bool {
    users.containsKey(caller);
  };

  public shared ({ caller }) func register() : async () {
    if (users.containsKey(caller)) { Runtime.trap("This user is already registered.") };

    let gameState1 : GameProgress = {
      gameId = 1;
      voteCount = 0;
      status = #unlocked;
      correctVotes = 0;
      incorrectVotes = 0;
      coinsEarned = 0;
    };
    let gameState2 : GameProgress = {
      gameId = 2;
      voteCount = 0;
      status = #locked;
      correctVotes = 0;
      incorrectVotes = 0;
      coinsEarned = 0;
    };
    let gameState3 : GameProgress = {
      gameId = 3;
      voteCount = 0;
      status = #locked;
      correctVotes = 0;
      incorrectVotes = 0;
      coinsEarned = 0;
    };

    let userState : UserState = {
      wallet = 0;
      gameStates = [gameState1, gameState2, gameState3];
    };
    users.add(caller, userState);
  };

  public shared ({ caller }) func vote(gameId : Nat, isMatch : Bool) : async VoteResult {
    if (not users.containsKey(caller)) { Runtime.trap("This user is not registered.") };
    let userState = getUserStateInternal(caller);
    let gameState = getGameState(userState, gameId);

    if (gameState.status != #unlocked) {
      Runtime.trap("Game is not unlocked");
    };

    if (gameState.voteCount >= 200) {
      Runtime.trap("Game is already completed");
    };

    let newCoins = if (isMatch) { userState.wallet + 1 } else { if (userState.wallet > 0) { userState.wallet - 1 : Nat } else {
      Runtime.trap("User cannot have negative coins in wallet");
    } };

    let newGameState = {
      gameState with
      voteCount = gameState.voteCount + 1;
      correctVotes = if (isMatch) { gameState.correctVotes + 1 } else { gameState.correctVotes };
      incorrectVotes = if (isMatch) { gameState.incorrectVotes } else { gameState.incorrectVotes + 1 };
      coinsEarned = if (isMatch) { gameState.coinsEarned + 1 } else {
        if (gameState.coinsEarned > 0) { gameState.coinsEarned - 1 : Nat } else {
          Runtime.trap("User cannot have negative coins");
        };
      };
    };

    let updatedUserState = updateUserBalance(userState, newCoins);
    let finalUserState = updateUserStateGame(updatedUserState, newGameState);

    users.add(caller, finalUserState);

    { isMatch; coins = newCoins };
  };

  public query ({ caller }) func getUserState() : async UserState {
    let userState = getUserStateInternal(caller);
    {
      userState with
      gameStates = userState.gameStates.sort();
    };
  };

  public query ({ caller }) func getGameProgress(gameId : Nat) : async GameProgress {
    if (not users.containsKey(caller)) { Runtime.trap("This user is not registered.") };
    let userState = getUserStateInternal(caller);
    getGameState(userState, gameId);
  };

  public query ({ caller }) func getWallet() : async Nat {
    if (not users.containsKey(caller)) { Runtime.trap("This user is not registered.") };
    let userState = getUserStateInternal(caller);
    userState.wallet;
  };

  public shared ({ caller }) func updateGameStatus(gameId : Nat, status : GameStatus) : async () {
    if (not users.containsKey(caller)) { Runtime.trap("This user is not registered.") };
    let userState = getUserStateInternal(caller);
    let gameState = getGameState(userState, gameId);
    let updatedGameState = { gameState with status };
    let updatedUserState = updateUserStateGame(userState, updatedGameState);
    users.add(caller, updatedUserState);
  };

  public shared ({ caller }) func resetGame(gameId : Nat) : async () {
    if (not users.containsKey(caller)) { Runtime.trap("This user is not registered.") };
    let userState = getUserStateInternal(caller);
    let gameState = getGameState(userState, gameId);
    let newGameState = {
      gameState with
      voteCount = 0;
      correctVotes = 0;
      incorrectVotes = 0;
      coinsEarned = 0;
    };
    let updatedUserState = updateUserStateGame(userState, newGameState);
    users.add(caller, updatedUserState);
  };

  public shared ({ caller }) func completeGame(gameId : Nat) : async () {
    if (not users.containsKey(caller)) { Runtime.trap("This user is not registered.") };
    let userState = getUserStateInternal(caller);
    let gameState = getGameState(userState, gameId);
    let updatedGameState = { gameState with status = #completed };
    let nextGameState = if (gameId < 3) {
      switch (userState.gameStates.find(func(game) { game.gameId == (gameId + 1 : Nat) })) {
        case (null) { Runtime.trap("Next game does not exist") };
        case (?gameState) { { gameState with status = #unlocked } };
      };
    } else { gameState };

    let updatedUserState1 = updateUserStateGame(userState, updatedGameState);
    let finalUserState = updateUserStateGame(updatedUserState1, nextGameState);

    users.add(caller, finalUserState);
  };

  public shared ({ caller }) func unlockGame(gameId : Nat) : async Text {
    if (not users.containsKey(caller)) { Runtime.trap("This user is not registered.") };
    let userState = getUserStateInternal(caller);
    let gameState = getGameState(userState, gameId);
    let unlockedGameState = { gameState with status = #unlocked };

    let updatedUserState = updateUserStateGame(userState, unlockedGameState);
    users.add(caller, updatedUserState);

    "Game unlocked successfully!";
  };
};
