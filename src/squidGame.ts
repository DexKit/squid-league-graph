import { BigInt } from "@graphprotocol/graph-ts";
import { Earning, Game, Player, PlayerGame } from "../generated/schema";
import {
  PlayerJoined,
  PlayerJoinedRound,
  ChallengeStarted,
  ChallengeFinished,
  VoteToQuit,
  GameQuitted,
  Withdrawed,
  WithdrawedHouse,
  ChallengeSetup,
} from "../generated/templates/SquidGame/SquidGame";
import { DAY_BI, HOUR_BI, ONE_BI } from "./helpers";
import { SquidGame as SquidGameContract } from "../generated/templates/SquidGame/SquidGame";

export function handlePlayerJoinedGame(event: PlayerJoined): void {
  let player = Player.load(event.transaction.from.toHexString());
  let game = Game.load(event.address.toHexString());
  if (!player && game) {
    player = new Player(event.transaction.from.toHexString());
    player.totalFinishedGames = BigInt.zero();
    player.totalJoinedGames = ONE_BI;
    player.totalSpent = game.entry as BigInt;
    player.totalEarned = BigInt.zero();
    player.EarnedMinusSpent = player.totalEarned.minus(player.totalSpent);
    game.currentRoundTotalPlayers = game.currentRoundTotalPlayers.plus(ONE_BI);
    game.save();
    player.save();
    const playerGame = new PlayerGame(`${game.id}-${player.id}`);
    playerGame.player = player.id;
    playerGame.game = game.id;
    playerGame.save();
  }
  if (player && game) {
    player.totalJoinedGames = player.totalJoinedGames.plus(ONE_BI);
    player.totalSpent = player.totalSpent.plus(game.entry as BigInt);
    player.EarnedMinusSpent = player.totalEarned.minus(player.totalSpent);
    game.currentRoundTotalPlayers = game.currentRoundTotalPlayers.plus(ONE_BI);
    game.save();
    player.save();
    const playerGame = new PlayerGame(`${game.id}-${player.id}`);
    playerGame.player = player.id;
    playerGame.game = game.id;
    playerGame.save();
  }
}

export function handlePlayerJoinedRound(event: PlayerJoinedRound): void {
  let game = Game.load(event.address.toHexString());
  let player = Player.load(event.params.player.toHexString());
  if (game) {
    game.currentRoundTotalPlayers = game.currentRoundTotalPlayers.plus(ONE_BI);
    game.save();
  }
  if (player) {
    player.playCurrentRound = event.params.play;
    player.save();
  }
}

export function handleChallengeSetup(event: ChallengeSetup): void {
  let game = Game.load(event.address.toHexString());
  let squidContract = SquidGameContract.bind(event.address);
  if (game) {
    game.status = "Setup";
    game.currentRoundStartsAt = squidContract.CoinRound(
      event.params.round
    ).value2;
    game.save();
  }
}

export function handleChallengeStarted(event: ChallengeStarted): void {
  let game = Game.load(event.address.toHexString());
  if (game) {
    game.status = "Started";
    if (game.currentRoundStartsAt) {
      game.currentRoundEndsAt = (game.currentRoundStartsAt as BigInt).plus(
        HOUR_BI
      );
    }
    game.save();
  }
}

export function handleChallengeFinished(event: ChallengeFinished): void {
  let game = Game.load(event.address.toHexString());
  if (game) {
    game.status = "Finished";
    game.endedAt = event.block.timestamp;
    game.currentRoundTotalPlayers = BigInt.zero();
    game.currentRound = game.currentRound.plus(ONE_BI);
    game.currentRoundSetupAt = event.block.timestamp.plus(DAY_BI);
    game.pastRoundChallengeResult = event.params.result;
    game.save();
  }
}

export function handleVoteToQuit(event: VoteToQuit): void { }

export function handleGameQuitted(event: GameQuitted): void { }

export function handleWithdrawed(event: Withdrawed): void {
  let game = Game.load(event.address.toHexString()) as Game;
  let player = Player.load(event.params.player.toHexString()) as Player;
  let earning = new Earning(`${game.id}-${player.id}`);
  earning.game = game.id;
  earning.player = player.id;
  earning.amount = event.params.amount;
  earning.claimed = true;
  earning.save();
}

export function handleWithdrawedHouse(event: WithdrawedHouse): void { }
