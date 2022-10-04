import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { TeamDaoVoting } from "../target/types/team_dao_voting";

describe("TeamDao-Voting", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.TeamDaoVoting as Program<TeamDaoVoting>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });
});
