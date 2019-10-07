import React from 'react';
import {
    Stepper, Step, StepLabel, Typography, TextField, Button, withStyles, createStyles, Theme,
    List, ListItem, ListItemText, CircularProgress, Grid
} from '@material-ui/core';
import ToornamentHelper from './ToornamentHelper';
import CredentialsStep from './CredentialsStep';
import ConfigurationStep, { ScheduleConfig, SchedulingMode } from './ConfigurationStep';
import { fetchStageData } from './Utils';

const tournamentIdItemName = 'tss_i_ti';
const stageIdItemName = 'tss_i_si';

const styles = (theme: Theme) => createStyles({
    root: {
        width: '90%',
    },
    button: {
        marginRight: theme.spacing(1),
    },
    instructions: {
        marginTop: theme.spacing(1),
        marginBottom: theme.spacing(1),
    },
});

interface ScheduleStage {
    id: string;
    name: string;
    number: number;
    size: number;
    type: string;
}

export interface ScheduleGroup {
    id: string;
    name: string;
    number: number;
}

export interface ScheduleRound {
    id: string;
    groupId: string;
    name: string;
    number: number;
    size: number;
    scheduledAt: Date | null;
    roundLength: number;
}

export interface ScheduleMatchOpponent {
    number: number;
    sourceNodeId: string;
    sourceType: string;
}

export interface ScheduleMatch {
    id: string;
    roundId: string;
    groupId: string;
    numberOfGames: number;
    opponents: ScheduleMatchOpponent[];
}

interface ScheduleStepperState {
    activeStep: number;
    credentialsReady: boolean;
    tournamentId: string;
    stages: ScheduleStage[];
    stageId: string;
    scheduleConfig: ScheduleConfig;
    groups: ScheduleGroup[];
    matches: ScheduleMatch[];
    rounds: ScheduleRound[];
    fetching: boolean;
}

interface ScheduleStepperProps {
    toornamentHelper: ToornamentHelper;
    classes?: any;
}

class ScheduleStepper extends React.Component<ScheduleStepperProps, ScheduleStepperState> {
    steps = ['Credentials', 'Tournament', 'Stage', 'Configuration', 'Review'];

    constructor(props: ScheduleStepperProps) {
        super(props);

        const credentialsReady = props.toornamentHelper.hasApiKey() && props.toornamentHelper.tokenIsValid();
        this.state = {
            activeStep: credentialsReady ? 3 : 0,
            credentialsReady: credentialsReady,
            tournamentId: sessionStorage.getItem(tournamentIdItemName) || '',
            stages: [],
            stageId: sessionStorage.getItem(stageIdItemName) || '',
            scheduleConfig: {
                schedulingMode: SchedulingMode.Direct,
                matchLengthSettings: [{ numberOfGames: 3, matchLengthMin: 30 }, { numberOfGames: 5, matchLengthMin: 45 }],
                phases: [],
            },
            matches: [],
            groups: [],
            rounds: [],
            fetching: false,
        }
    }

    handleNext = () => {
        switch (this.state.activeStep) {
            case 1:
                this.setState({ fetching: true });
                this.props.toornamentHelper.getOrganizerStages(this.state.tournamentId, (results: any[]) => {
                    console.log(results);
                    const stages: ScheduleStage[] = results.map(result => {
                        return {
                            id: result.id,
                            name: result.name,
                            number: result.number,
                            size: result.settings.size,
                            type: result.type,
                        };
                    });
                    this.setState({ stages: stages, activeStep: this.state.activeStep + 1, fetching: false });
                });
                break;
            case 2:
                const stage: ScheduleStage = this.state.stages.find(stage => stage.id == this.state.stageId)!;
                let mode: SchedulingMode = SchedulingMode.Direct;
                switch (stage.type) {
                    case 'single_elimination':
                    case 'double_elimination':
                    case 'gauntlet':
                    case 'ffa_single_elimination':
                        mode = SchedulingMode.Direct;
                        break;
                    case 'bracket_groups':
                    case 'pools':
                    case 'league':
                    case 'swiss':
                    case 'simple':
                    case 'ffa_bracket_groups':
                    default:
                        mode = SchedulingMode.Weekly;
                        break;
                }
                
                const callback = (rounds: ScheduleRound[], matches: ScheduleMatch[], groups: ScheduleGroup[]) => {
                    const newScheduleConfig = this.state.scheduleConfig;
                    
                    const gameLengths: number[] = [];
                    matches.forEach(match => {
                        if (gameLengths.findIndex(n => n == match.numberOfGames) < 0) {
                            gameLengths.push(match.numberOfGames);
                        }

                        const roundIndex = rounds.findIndex(round => round.id == match.roundId);
                        if (roundIndex >= 0 && rounds[roundIndex].roundLength < match.numberOfGames) {
                            rounds[roundIndex].roundLength = match.numberOfGames;
                        }
                    });

                    newScheduleConfig.schedulingMode = mode;
                    newScheduleConfig.matchLengthSettings = gameLengths.map(length => {
                        return { numberOfGames: length, matchLengthMin: 30 };
                    });

                    newScheduleConfig.phases = [{
                        startingRoundId: rounds[0].id,
                        groupId: rounds[0].groupId,
                        startDate: new Date(),
                    }]

                    this.setState({
                        activeStep: this.state.activeStep + 1,
                        scheduleConfig: newScheduleConfig,
                        rounds: rounds,
                        groups: groups,
                        matches: matches,
                    });
                }

                fetchStageData(this.state.tournamentId, this.state.stageId, this.props.toornamentHelper, mode, callback);
                break;
            default:
                this.setState({ activeStep: this.state.activeStep + 1 });
                break;
        }

    };

    handleBack = () => {
        if (this.state.activeStep == 0) {
            return;
        }

        this.setState({ activeStep: this.state.activeStep - 1 });
    };

    handleReset = () => {
        this.setState({ activeStep: 0 });
    };

    handleChangeTournamentId = (event: any) => {
        const tournamentId = event.target.value;
        sessionStorage.setItem(tournamentIdItemName, tournamentId)
        this.setState({ tournamentId: tournamentId });
    }

    handleChangeStageId = (event: any) => {
        const stageId = event.target.value;
        sessionStorage.setItem(stageIdItemName, stageId)
        this.setState({ stageId: stageId });
    }

    canProceed = (): boolean => {
        switch (this.state.activeStep) {
            case 0:
                return this.state.credentialsReady;
            case 1:
                return this.state.tournamentId != '';
            case 2:
                return this.state.stageId != '';
            default:
                return true;
        }
    }

    getStepContent = (step: number) => {
        const { classes } = this.props;
        switch (step) {
            case 0:
                return <CredentialsStep toornamentHelper={this.props.toornamentHelper} credentialsUpdated={this.credentialsUpdated} />;
            case 1:
                return (
                    <div>
                        <TextField
                            label='Tournament Id'
                            className={classes.textField}
                            value={this.state.tournamentId}
                            onChange={this.handleChangeTournamentId}
                            margin='dense'
                            variant='outlined'
                        />
                        <Typography>Enter the tournament id.</Typography>
                        <Typography variant='caption' display='block'>You will find it in the Link to your tournament. In this example the higlighted part is the tournament id:</Typography>
                        <Typography variant='caption' display='block'>
                            https://www.toornament.com/en_US/tournaments/
                                <Typography variant='caption' color='secondary' display='inline'>2859636902129573888</Typography>
                            /information
                        </Typography>
                    </div>
                );
            case 2:
                return (
                    <List>
                        {this.state.stages.map(stage => {
                            return (
                                <ListItem
                                    button
                                    selected={this.state.stageId == stage.id}
                                    onClick={() => this.setState({ stageId: stage.id })}>
                                    <ListItemText primary={`${stage.number}. ${stage.name}`} secondary={`${stage.size} Teams`} />
                                </ListItem>
                            );
                        })}
                    </List>
                );
            case 3:
                return <ConfigurationStep 
                            groups={this.state.groups}
                            rounds={this.state.rounds}
                            config={this.state.scheduleConfig} 
                            scheduleConfigChanged={this.scheduleConfigChanged} 
                        />;
            default:
                return <div></div>;
        }
    }

    scheduleConfigChanged = (config: ScheduleConfig) => {
        this.setState({ scheduleConfig: config });
    }

    credentialsUpdated = () => {
        const credentialsReady = this.props.toornamentHelper.hasApiKey() && this.props.toornamentHelper.tokenIsValid();
        this.setState({ credentialsReady: credentialsReady });
    }

    render() {
        const { classes } = this.props;
        return (
            <div className={classes.root} >
                <Stepper activeStep={this.state.activeStep}>
                    {this.steps.map((label, index) => {
                        const stepProps: { completed?: boolean } = {};
                        const labelProps: { optional?: React.ReactNode } = {};
                        return (
                            <Step key={label} {...stepProps}>
                                <StepLabel {...labelProps}>{label}</StepLabel>
                            </Step>
                        );
                    })}
                </Stepper>
                <div>
                    {this.state.activeStep === this.steps.length ? (
                        <div>
                            <Typography className={classes.instructions}>
                                All steps completed - you&apos;re finished
                            </Typography>
                            <Button onClick={this.handleReset} className={classes.button}>
                                Back to start.
                            </Button>
                        </div>
                    ) : (
                            <div>
                                <Typography className={classes.instructions}>{this.getStepContent(this.state.activeStep)}</Typography>
                                <Grid
                                    container
                                    alignItems='center'
                                    direction='row'
                                >
                                    <Button disabled={this.state.activeStep === 0} onClick={this.handleBack} className={classes.button}>
                                        Back
                                    </Button>
                                    <Button
                                        variant='contained'
                                        color='primary'
                                        onClick={this.handleNext}
                                        className={classes.button}
                                        disabled={!this.canProceed()}
                                    >
                                        {this.state.activeStep === this.steps.length - 1 ? 'Finish' : 'Next'}
                                    </Button>
                                    <div
                                        hidden={!this.state.fetching}
                                    >
                                        <CircularProgress size={30} thickness={5} />
                                    </div>
                                </Grid>
                            </div>
                        )}
                </div>
            </div>
        );
    }
}

export default withStyles(styles)(ScheduleStepper);