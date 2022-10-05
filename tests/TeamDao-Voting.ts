import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { TeamDaoVoting } from "../target/types/team_dao_voting";

describe("TeamDao-Voting", () => {
    // Configure the client to use the local cluster.
    const provider = anchor.AnchorProvider.env();

    anchor.setProvider(provider);

    const program = anchor.workspace.TeamDaoVoting as Program<TeamDaoVoting>;
    const newPlayer = anchor.web3.Keypair.generate();
    it("Create a Team.", async () => {
        const [team] = await anchor.web3.PublicKey.findProgramAddress(
            [
                anchor.utils.bytes.utf8.encode("team_account"),
                anchor.utils.bytes.utf8.encode("Cihan's Team"),
            ],
            program.programId
        );
        console.log(`User1 key: ${provider.wallet.publicKey.toBase58()}`);
        console.log(`Team1 acc: ${team.toBase58()}`);

        const ix = program.methods.createTeam("Cihan's Team", 10).accounts({
            teamAccount: team,
        });
        const tx = await ix.rpc().catch(console.error);
        console.log(`Transaction id: ${tx}`);
        const acc = (await ix.pubkeys()).teamAccount;
        const data = await program.account.team.fetch(acc);
        console.log(data.teamCaptain.toBase58());
    });

    it("Invite a player to the Team", async () => {
        const [team] = await anchor.web3.PublicKey.findProgramAddress(
            [
                anchor.utils.bytes.utf8.encode("team_account"),
                anchor.utils.bytes.utf8.encode("Cihan's Team"),
            ],
            program.programId
        );

        console.log(`Invited player = ${newPlayer.publicKey}`);
        const tx = await program.methods
            .invitePlayer(newPlayer.publicKey)
            .accounts({
                teamAccount: team,
            })
            .rpc();

        console.log(`Transaction id: ${tx}`);
    });

    it("Join the team", async () => {
        const [team] = await anchor.web3.PublicKey.findProgramAddress(
            [
                anchor.utils.bytes.utf8.encode("team_account"),
                anchor.utils.bytes.utf8.encode("Cihan's Team"),
            ],
            program.programId
        );

        const tx = await program.methods
            .joinTheTeam()
            .accounts({
                teamAccount: team,
                signer: newPlayer.publicKey,
            })
            .signers([newPlayer])
            .rpc();

        console.log(`Transaction id: ${tx}`);

        const accData = await program.account.team.fetch(team);
        console.log(accData.players.map((player) => player.toBase58()));
    });

    xit("Create a proposal for team", async () => {
        const [team] = await anchor.web3.PublicKey.findProgramAddress(
            [
                anchor.utils.bytes.utf8.encode("team_account"),
                anchor.utils.bytes.utf8.encode("Cihan's Team"),
            ],
            program.programId
        );
        const [proposal] = await anchor.web3.PublicKey.findProgramAddress(
            [
                anchor.utils.bytes.utf8.encode("proposal_account"),
                anchor.utils.bytes.utf8.encode("Cihan's Proposal"),
            ],
            program.programId
        );

        let proposal_user = anchor.web3.Keypair.generate();
        let dropsig = await program.provider.connection.requestAirdrop(
            proposal_user.publicKey,
            anchor.web3.LAMPORTS_PER_SOL
        );
        await program.provider.connection.confirmTransaction(dropsig);

        let dropsig2 = await program.provider.connection.requestAirdrop(
            proposal,
            5 * anchor.web3.LAMPORTS_PER_SOL
        );

        await program.provider.connection.confirmTransaction(dropsig2);

        console.log(`Proposal user: ${proposal_user.publicKey}`);
        console.log(`Proposal acc: ${proposal.toBase58()}`);

        const ix = program.methods
            .createProposal("Cihan's Proposal", "Voting")
            .accounts({
                teamAccount: team,
                proposalAccount: proposal,
            });

        const tx = await ix.rpc().catch(console.error);

        console.log(`Transaction: ${tx}`);

        const proposals = await program.account.proposal.all();
        const accs = await program.account.team.all();
        console.log(proposals);
        console.log(accs);
        /*
        const proposalacc = await program.account.proposal.fetch(proposal);
        console.log(
            proposalacc.lamports.toNumber() / anchor.web3.LAMPORTS_PER_SOL
        );*/
    });

    xit("Create second Team.", async () => {
        let user2 = anchor.web3.Keypair.generate();

        let dropsig = await program.provider.connection.requestAirdrop(
            user2.publicKey,
            anchor.web3.LAMPORTS_PER_SOL
        );

        await program.provider.connection.confirmTransaction(dropsig);
        const [team2] = await anchor.web3.PublicKey.findProgramAddress(
            [
                anchor.utils.bytes.utf8.encode("team_account"),
                anchor.utils.bytes.utf8.encode("Can's Team"),
            ],
            program.programId
        );
        console.log(`User2 key: ${user2.publicKey.toBase58()}`);
        console.log(`Team2 acc: ${team2.toBase58()}`);

        const ix = program.methods
            .createTeam("Can's Team", 10)
            .accounts({
                teamAccount: team2,
                signer: user2.publicKey,
            })
            .signers([user2]);

        const tx = await ix.rpc();
        /*
        const tx = await ix.transaction();
        const transaction = new anchor.web3.Transaction().add(tx);
        const signature = await provider.sendAndConfirm(transaction, [user2]);
        console.log(signature);*/

        console.log(`Transaction id: ${tx}`);
        const acc = (await ix.pubkeys()).teamAccount;
        const data = await program.account.team.fetch(acc);

        const allAccs = await program.account.team.all();
        console.log(allAccs);

        allAccs.map((accs) => {
            console.log(accs.account.teamCaptain.toBase58());
        });
    });
});
