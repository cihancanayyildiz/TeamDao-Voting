use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod team_dao_voting {
    use super::*;
    pub fn create_team(ctx: Context<CreateTeam>, name: String, player_capacity: u32) -> Result<()> {
        let team = &mut ctx.accounts.team_account;
        team.bump = *ctx.bumps.get("team_account").unwrap();
        team.name = name;
        team.player_capacity = player_capacity;
        team.players = Vec::new();
        team.invited_players = Vec::new();
        team.prize_distribution = Vec::new();
        team.team_captain = ctx.accounts.signer.key();
        team.players.push(ctx.accounts.signer.key());
        team.current_tournament = String::from("");

        msg!("Team {} successfully created. Owner of the team : {}", team.name, team.team_captain);
        Ok(())
    }

    pub fn create_proposal(
        ctx: Context<CreateProposal>,
        title: String,
        description: String,
        proposal_type: String,
        prize_distribution: Vec<u32>,
        tournament_selection: String
    ) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal_account;
        proposal.bump = *ctx.bumps.get("proposal_account").unwrap();
        proposal.title = title;
        proposal.description = description;
        proposal.vote_yes = 0;
        proposal.vote_no = 0;
        proposal.status = ProposalStatus::Active;

        let team = &mut ctx.accounts.team_account;

        if proposal_type == "Tournament Selection" {
            if tournament_selection.is_empty() {
                return err!(ErrorCode::TournamentSelectionIsInvalid);
            }
            proposal.tournament_selection = tournament_selection;
        }

        if proposal_type == "Prize Distribution" {
            if prize_distribution.len() <= 0 || prize_distribution.len() != team.players.len() {
                return err!(ErrorCode::PrizeDistributionParametersNotValid);
            }
            proposal.prize_distribution = prize_distribution;
            proposal.proposal_type = proposal_type;
        }

        /* 
        let lmps: u64 = proposal.to_account_info().lamports();
        proposal.lamports = lmps;*/

        msg!(
            "Proposal {} successfully created. Owner of the proposal: {}",
            proposal.title,
            ctx.accounts.signer.key()
        );

        Ok(())
    }

    pub fn invite_player(ctx: Context<InvitePlayer>, invited_player: Pubkey) -> Result<()> {
        let team_account = &mut ctx.accounts.team_account;

        if team_account.invited_players.len() >= team_account.player_capacity.try_into().unwrap() {
            return err!(ErrorCode::TeamCapacityFullError);
        }
        if team_account.players.contains(&invited_player) {
            return err!(ErrorCode::PlayerAlreadyExistsError);
        }

        team_account.invited_players.push(invited_player);

        msg!("Player: {} invited to the team {}.", ctx.accounts.signer.key(), team_account.name);

        Ok(())
    }

    pub fn join_the_team(ctx: Context<JoinTheTeam>) -> Result<()> {
        let team_account = &mut ctx.accounts.team_account;

        if team_account.players.len() >= team_account.player_capacity.try_into().unwrap() {
            return err!(ErrorCode::TeamCapacityFullError);
        }

        if !team_account.invited_players.contains(&ctx.accounts.signer.key()) {
            return err!(ErrorCode::PlayerIsNotInTheInvitedList);
        }

        team_account.players.push(ctx.accounts.signer.key());

        //team_account.invited_players.retain(|&x| x == ctx.accounts.signer.key());

        msg!("Player: {} joined to the team {}.", ctx.accounts.signer.key(), team_account.name);

        Ok(())
    }

    pub fn give_vote(ctx: Context<GiveVote>, vote: String) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal_account;
        let team = &mut ctx.accounts.team_account;

        if proposal.status != ProposalStatus::Active {
            return err!(ErrorCode::ProposalIsEnded);
        }

        let votes = vote.to_lowercase();

        if proposal.voted_players.contains(&ctx.accounts.signer.key()) {
            return err!(ErrorCode::PlayerAlreadyVoted);
        }

        if votes == "yes" {
            proposal.vote_yes += 1;
        } else if votes == "no" {
            proposal.vote_no += 1;
        } else {
            return err!(ErrorCode::InvalidVoteType);
        }

        proposal.voted_players.push(ctx.accounts.signer.key()); // pushing voter player to voted_players vector for validation check.

        if proposal.voted_players.len() == team.players.len() {
            if proposal.vote_yes > proposal.vote_no {
                proposal.status = ProposalStatus::Accepted;
                if proposal.proposal_type == "Prize Distribution" {
                    team.prize_distribution = proposal.prize_distribution.to_owned();
                } else {
                    team.current_tournament = proposal.tournament_selection.to_owned();
                }
            } else if proposal.vote_yes < proposal.vote_no {
                proposal.status = ProposalStatus::Rejected;
            } else {
                proposal.status = ProposalStatus::Draw;
            }
        }
        Ok(())
    }

    pub fn transfer_ownership(ctx: Context<TransferOwnership>, new_captain: Pubkey) -> Result<()> {
        let team = &mut ctx.accounts.team_account;

        if team.team_captain == new_captain {
            return err!(ErrorCode::PlayerAlreadyTeamCaptain);
        }

        if !team.players.contains(&new_captain) {
            return err!(ErrorCode::PlayerDoesntExist);
        }
        let old_captain = team.team_captain;
        team.team_captain = new_captain;

        msg!("Ownership transfered from {} to {}", old_captain, new_captain);

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(name: String)]
pub struct CreateTeam<'info> {
    #[account(
        init,
        payer = signer,
        //todo: change space later
        space = 1000,
        seeds = ["team_account".as_bytes(), name.as_bytes()],
        bump
    )]
    pub team_account: Account<'info, Team>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(title: String)]
pub struct CreateProposal<'info> {
    #[account(mut, seeds= ["team_account".as_bytes(), team_account.name.as_bytes()], bump)]
    pub team_account: Account<'info, Team>,

    #[account(
        init,
        payer = signer,
        space = 1000,
        seeds = ["proposal_account".as_bytes(), title.as_bytes()],
        bump,
        constraint = team_account.team_captain == signer.key() // Only team captain can create proposal.
    )]
    pub proposal_account: Account<'info, Proposal>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct GiveVote<'info> {
    #[account(mut, seeds= ["team_account".as_bytes(), team_account.name.as_bytes()], bump)]
    pub team_account: Account<'info, Team>,

    #[account(mut, seeds = ["proposal_account".as_bytes(), proposal_account.title.as_bytes()], bump)]
    pub proposal_account: Account<'info, Proposal>,

    #[account(mut, constraint = team_account.players.contains(&signer.key()))] // Voters should be team member.
    pub signer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InvitePlayer<'info> {
    #[account(mut, seeds=["team_account".as_bytes(), team_account.name.as_bytes()], bump, constraint = team_account.team_captain == signer.key())]
    pub team_account: Account<'info, Team>,

    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct JoinTheTeam<'info> {
    #[account(mut, seeds=["team_account".as_bytes(), team_account.name.as_bytes()], bump)]
    pub team_account: Account<'info, Team>,

    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct LeaveTheTeam<'info> {
    #[account(mut, seeds=["team_account".as_bytes(), team_account.name.as_bytes()], bump)]
    pub team_account: Account<'info, Team>,

    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TransferOwnership<'info> {
    #[account(mut, seeds=["team_account".as_bytes(), team_account.name.as_bytes()],bump , constraint = team_account.team_captain == signer.key())] // Only team captain can change the ownership.
    pub team_account: Account<'info, Team>,

    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Team {
    pub name: String,
    pub player_capacity: u32,
    pub players: Vec<Pubkey>,
    pub team_captain: Pubkey,
    pub bump: u8,
    pub invited_players: Vec<Pubkey>,
    pub prize_distribution: Vec<u32>,
    pub current_tournament: String,
}

#[account]
pub struct Proposal {
    pub title: String,
    pub proposal_type: String,
    pub owner: Pubkey,
    pub description: String,
    pub vote_yes: u64,
    pub vote_no: u64,
    pub bump: u8,
    pub prize_distribution: Vec<u32>,
    pub tournament_selection: String,
    pub status: ProposalStatus,
    pub voted_players: Vec<Pubkey>,
    // pub lamports: u64,
}

#[derive(Debug, Clone, PartialEq, AnchorSerialize, AnchorDeserialize)]
pub enum ProposalStatus {
    Active,
    Accepted,
    Rejected,
    Draw,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Team capacity is full.")]
    TeamCapacityFullError,
    #[msg("Player already in the team.")]
    PlayerAlreadyExistsError,
    #[msg("Player is not in the invited list.")]
    PlayerIsNotInTheInvitedList,
    #[msg("Prize distribution parameters are not valid.")]
    PrizeDistributionParametersNotValid,
    #[msg("Please enter a tournament name!")]
    TournamentSelectionIsInvalid,
    #[msg("This proposal is ended.")]
    ProposalIsEnded,
    #[msg("Please enter valid vote type!")]
    InvalidVoteType,
    #[msg("This player already voted for this proposal!")]
    PlayerAlreadyVoted,
    #[msg("Player doesnt exist in the team.")]
    PlayerDoesntExist,
    #[msg("This player is already team captain")]
    PlayerAlreadyTeamCaptain,
}