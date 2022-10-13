# TeamDAO Voting Program

TeamDAO voting program is a Solana smart contract written by using Anchor framework.
Smart contract features:

-   You can create a team.
-   You can invite players to an existent team.
-   You can create a proposal that players can vote for tournament selection.
-   You can create a proposal that players can vote for prize distribution on a tournament.
-   Players can vote on existent proposals.
-   Players can claim their prize from tournaments.
-   Team captain can transfer his ownership to other team player.
-   Players can leave the team.

# Functions

| Name               | Accounts                                  | Parameters                                                                                                                      |
| ------------------ | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| create_team        | `Team PDA Account`                        | `name: String` `player_capacity: u32`                                                                                           |
| create_proposal    | `Team PDA Account` `Proposal PDA Account` | `title: String` ,`description: String`, `proposal_type: String`, `prize_distribution: Vec<u32>`, `tournament_selection: String` |
| invite_player      | `Team PDA Account`                        | `invited_player: Pubkey`                                                                                                        |
| join_the_team      | `Team PDA Account`                        | No parameter                                                                                                                    |
| give_vote          | `Team PDA Account` `Proposal PDA Account` | `vote: String`                                                                                                                  |
| transfer_ownership | `Team PDA Account`                        | `new_captain: Pubkey`                                                                                                           |
| claim_the_prize    | `Team PDA Account` `Proposal PDA Account` | `tournament_prize: u64`                                                                                                         |
| leave_the_team     | `Team PDA Account`                        | No parameter                                                                                                                    |
