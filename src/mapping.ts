import {
  SquidGameFactory,
  OwnershipTransferred,
  SquidCreated,
} from "../generated/SquidGameFactory/SquidGameFactory";
import { Game } from "../generated/schema";
import { SquidGame as SquidGameTemplate } from "../generated/templates";
import { SquidGame as SquidGameContract } from "../generated/templates/SquidGame/SquidGame";
import { BigInt } from "@graphprotocol/graph-ts";
import { ZERO_BI } from "./helpers";

export function handleOwnershipTransferred(event: OwnershipTransferred): void {}

export function handleSquidCreated(event: SquidCreated): void {
  SquidGameTemplate.create(event.params.game_address);

  let squidContract = SquidGameContract.bind(event.params.game_address);

  let game = new Game(event.params.game_address.toHexString());

  game.currentRound = BigInt.zero();
  // All the games by default have a 1 hour timeframe
  game.duration = BigInt.fromString("3600");
  game.createdAt = event.block.timestamp;
  game.createdBy = event.transaction.from;
  game.entry = squidContract.pot();
  game.startsAt = event.params.start_timestamp;
  game.status = "Joining";
  game.intId = event.params.id;
  game.currentRoundTotalPlayers = ZERO_BI;

  game.save();
}
