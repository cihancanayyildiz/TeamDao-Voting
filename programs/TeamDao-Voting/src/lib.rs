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
        team.team_captain = ctx.accounts.signer.key();
        team.players.push(ctx.accounts.signer.key());

        msg!("Team {} successfully created. Owner of the team : {}", team.name, team.team_captain);
        Ok(())
    }

    pub fn create_proposal(
        ctx: Context<CreateProposal>,
        title: String,
        description: String
    ) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal_account;
        proposal.bump = *ctx.bumps.get("proposal_account").unwrap();
        proposal.title = title;
        proposal.description = description;
        proposal.vote_yes = 0;
        proposal.vote_no = 0;

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

        msg!("Player: {} joined to the team {}.", ctx.accounts.signer.key(), team_account.name);

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

#[account]
pub struct Team {
    pub name: String,
    pub player_capacity: u32,
    pub players: Vec<Pubkey>,
    pub team_captain: Pubkey,
    pub bump: u8,
    pub invited_players: Vec<Pubkey>,
}

#[account]
pub struct Proposal {
    pub title: String,
    pub owner: Pubkey,
    pub description: String,
    pub vote_yes: u64,
    pub vote_no: u64,
    pub bump: u8,
    // pub lamports: u64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Team capacity is full.")]
    TeamCapacityFullError,
    #[msg("Player already in the team.")]
    PlayerAlreadyExistsError,
    #[msg("Player is not in the invited list.")]
    PlayerIsNotInTheInvitedList,
}