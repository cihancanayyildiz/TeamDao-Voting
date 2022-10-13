import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { TeamDaoVoting } from "../target/types/team_dao_voting";

describe("TeamDao-Voting", () => {
    // Configure the client to use the local cluster.
    const provider = anchor.AnchorProvider.env();

    anchor.setProvider(provider);

    const program = anchor.workspace.TeamDaoVoting as Program<TeamDaoVoting>;
    const player1 = anchor.web3.Keypair.generate();
    const player2 = anchor.web3.Keypair.generate();

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

        const ix = program.methods.createTeam("Cihan's Team", 3).accounts({
            teamAccount: team,
        });
        const tx = await ix.rpc().catch(console.error);
        console.log(`Transaction id: ${tx}`);
        const acc = (await ix.pubkeys()).teamAccount;
        const data = await program.account.team.fetch(acc);
        console.log(data.teamCaptain.toBase58());
    });

    it("Invite player1 and player2 to the Team", async () => {
        const [team] = await anchor.web3.PublicKey.findProgramAddress(
            [
                anchor.utils.bytes.utf8.encode("team_account"),
                anchor.utils.bytes.utf8.encode("Cihan's Team"),
            ],
            program.programId
        );

        console.log(`Invited player1 = ${player1.publicKey}`);
        const tx = await program.methods
            .invitePlayer(player1.publicKey)
            .accounts({
                teamAccount: team,
            })
            .rpc();

        console.log(`Invited player2 = ${player2.publicKey}`);
        console.log(`Transaction id: ${tx}`);

        const tx2 = await program.methods
            .invitePlayer(player2.publicKey)
            .accounts({
                teamAccount: team,
            })
            .rpc();

        console.log(`Transaction id: ${tx2}`);
    });

    it("Player1 and Player2 joined to the team", async () => {
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
                signer: player1.publicKey,
            })
            .signers([player1])
            .rpc();

        console.log(`player1 joined= ${player1.publicKey}`);
        console.log(`Transaction id: ${tx}`);

        const tx2 = await program.methods
            .joinTheTeam()
            .accounts({
                teamAccount: team,
                signer: player2.publicKey,
            })
            .signers([player2])
            .rpc();

        console.log(`player2 joined= ${player2.publicKey}`);
        console.log(`Transaction id: ${tx2}`);

        const accData = await program.account.team.fetch(team);
        console.log("Team Members:");
        console.log(accData.players.map((player) => player.toBase58()));
    });

    it("Create a proposal for tournament selection", async () => {
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
                anchor.utils.bytes.utf8.encode("TournamentX Selection"),
            ],
            program.programId
        );

        /*
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

        console.log(`Proposal user: ${proposal_user.publicKey}`);*/
        console.log(`Proposal acc: ${proposal.toBase58()}`);

        const ix = program.methods
            .createProposal(
                "TournamentX Selection",
                "Voting",
                "Tournament Selection",
                [],
                "Tournament X"
            )
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

    it("Players give their votes for proposal", async () => {
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
                anchor.utils.bytes.utf8.encode("TournamentX Selection"),
            ],
            program.programId
        );

        await program.methods
            .giveVote("yes")
            .accounts({
                teamAccount: team,
                proposalAccount: proposal,
            })
            .rpc();

        await program.methods
            .giveVote("yes")
            .accounts({
                teamAccount: team,
                proposalAccount: proposal,
                signer: player1.publicKey,
            })
            .signers([player1])
            .rpc();

        await program.methods
            .giveVote("no")
            .accounts({
                teamAccount: team,
                proposalAccount: proposal,
                signer: player2.publicKey,
            })
            .signers([player2])
            .rpc();

        const proposalacc = await program.account.proposal.fetch(proposal);

        console.log(proposalacc);

        const accs = await program.account.team.all();
        console.log(accs);
    });

    it("Create a proposal for prize distribution", async () => {
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
                anchor.utils.bytes.utf8.encode("TournamentX PrizeDistribution"),
            ],
            program.programId
        );

        /*
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

        console.log(`Proposal user: ${proposal_user.publicKey}`);*/
        console.log(`Proposal acc: ${proposal.toBase58()}`);

        const ix = program.methods
            .createProposal(
                "TournamentX PrizeDistribution",
                "Voting",
                "Prize Distribution",
                [40, 30, 30],
                "Tournament X"
            )
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

    it("Players give their votes for proposal", async () => {
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
                anchor.utils.bytes.utf8.encode("TournamentX PrizeDistribution"),
            ],
            program.programId
        );

        await program.methods
            .giveVote("yes")
            .accounts({
                teamAccount: team,
                proposalAccount: proposal,
            })
            .rpc();

        await program.methods
            .giveVote("yes")
            .accounts({
                teamAccount: team,
                proposalAccount: proposal,
                signer: player1.publicKey,
            })
            .signers([player1])
            .rpc();

        await program.methods
            .giveVote("no")
            .accounts({
                teamAccount: team,
                proposalAccount: proposal,
                signer: player2.publicKey,
            })
            .signers([player2])
            .rpc();

        const proposalacc = await program.account.proposal.fetch(proposal);

        console.log(proposalacc);
    });

    it("Distribute the prize", async () => {
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
                anchor.utils.bytes.utf8.encode("TournamentX PrizeDistribution"),
            ],
            program.programId
        );

        // Airdropping sol for team account.
        let dropsig2 = await program.provider.connection.requestAirdrop(
            team,
            10 * anchor.web3.LAMPORTS_PER_SOL
        );
        await program.provider.connection.confirmTransaction(dropsig2);

        let team_pda_account_balance =
            (await program.provider.connection.getBalance(team)) /
            anchor.web3.LAMPORTS_PER_SOL;
        let player0_balance =
            (await program.provider.connection.getBalance(
                provider.wallet.publicKey
            )) / anchor.web3.LAMPORTS_PER_SOL;
        let player1_balance =
            (await program.provider.connection.getBalance(player1.publicKey)) /
            anchor.web3.LAMPORTS_PER_SOL;
        let player2_balance =
            (await program.provider.connection.getBalance(player2.publicKey)) /
            anchor.web3.LAMPORTS_PER_SOL;

        console.log(
            `Team balance: ${team_pda_account_balance} \n Player0 balance: ${player0_balance} \n Player1 balance: ${player1_balance} \n Player2 balance: ${player2_balance}`
        );

        const tx = await program.methods
            .claimThePrize(new anchor.BN(10 * anchor.web3.LAMPORTS_PER_SOL))
            .accounts({
                teamAccount: team,
                proposalAccount: proposal,
            })
            .rpc()
            .catch(console.error);

        const tx2 = await program.methods
            .claimThePrize(new anchor.BN(10 * anchor.web3.LAMPORTS_PER_SOL))
            .accounts({
                teamAccount: team,
                proposalAccount: proposal,
                signer: player1.publicKey,
            })
            .signers([player1])
            .rpc()
            .catch(console.error);

        const tx3 = await program.methods
            .claimThePrize(new anchor.BN(10 * anchor.web3.LAMPORTS_PER_SOL))
            .accounts({
                teamAccount: team,
                proposalAccount: proposal,
                signer: player2.publicKey,
            })
            .signers([player2])
            .rpc()
            .catch(console.error);

        team_pda_account_balance =
            (await program.provider.connection.getBalance(team)) /
            anchor.web3.LAMPORTS_PER_SOL;
        player0_balance =
            (await program.provider.connection.getBalance(
                provider.wallet.publicKey
            )) / anchor.web3.LAMPORTS_PER_SOL;
        player1_balance =
            (await program.provider.connection.getBalance(player1.publicKey)) /
            anchor.web3.LAMPORTS_PER_SOL;
        player2_balance =
            (await program.provider.connection.getBalance(player2.publicKey)) /
            anchor.web3.LAMPORTS_PER_SOL;

        console.log(
            `Team balance: ${team_pda_account_balance} \n Player0 balance: ${player0_balance} \n Player1 balance: ${player1_balance} \n Player2 balance: ${player2_balance}`
        );
    });

    it("Transfer ownership", async () => {
        const [team] = await anchor.web3.PublicKey.findProgramAddress(
            [
                anchor.utils.bytes.utf8.encode("team_account"),
                anchor.utils.bytes.utf8.encode("Cihan's Team"),
            ],
            program.programId
        );
        let oldTeamData = await program.account.team.fetch(team);

        console.log(`Old team captain ${oldTeamData.teamCaptain.toBase58()}`);

        await program.methods
            .transferOwnership(player1.publicKey)
            .accounts({
                teamAccount: team,
            })
            .rpc();

        let teamData = await program.account.team.fetch(team);

        console.log(`New team captain ${teamData.teamCaptain.toBase58()}`);
    });

    it("Leave the team", async () => {
        const [team] = await anchor.web3.PublicKey.findProgramAddress(
            [
                anchor.utils.bytes.utf8.encode("team_account"),
                anchor.utils.bytes.utf8.encode("Cihan's Team"),
            ],
            program.programId
        );
        let oldPlayers = (await program.account.team.fetch(team)).players;
        console.log(`Players before player1 leaving: ${oldPlayers}`);

        await program.methods
            .leaveTheTeam()
            .accounts({
                teamAccount: team,
                signer: player1.publicKey,
            })
            .signers([player1])
            .rpc();

        let players = (await program.account.team.fetch(team)).players;
        console.log(`Players before player1 leaving: ${players}`);
    });
});
