import React from 'react';
import {
    Stepper,
    Step,
    StepLabel,
    Typography,
    TextField,
    Button,
    withStyles,
    createStyles,
    Theme,
    List,
    ListItem,
    ListItemText,
    CircularProgress,
    Grid,
} from '@material-ui/core';
import ToornamentHelper from './ToornamentHelper';
import CredentialsStep from './CredentialsStep';
import ConfigurationStep, { ScheduleConfig, SchedulingMode } from './ConfigurationStep';
import TournamentStructure from './TournamenStructure';
import FetchDialog from './FetchDialog';
import ReviewSchedule from './ReviewSchedule';
import ApplyDialog from './ApplyDialog';

const tournamentIdItemName = 'tss_i_ti';
const stageIdItemName = 'tss_i_si';

const styles = (theme: Theme) =>
    createStyles({
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
        toorImg: {
            maxWidth: 250,
        },
    });

interface ScheduleStage {
    id: string;
    name: string;
    number: number;
    size: number;
    type: string;
}

export enum BracketType {
    Bracket,
    Rounds,
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

export interface ScheduleParticipant {
    id: string;
    name: string;
}

export interface ScheduleMatch {
    id: string;
    roundId: string;
    groupId: string;
    numberOfGames: number;
    scheduledAt: Date | null;
    opponents: ScheduleMatchOpponent[];
    participants: ScheduleParticipant[];
}

interface ScheduleStepperState {
    activeStep: number;
    credentialsReady: boolean;
    tournamentId: string;
    stages: ScheduleStage[];
    stageId: string;
    scheduleConfig: ScheduleConfig;
    structure: TournamentStructure;
    fetching: boolean;
    fetchDialogOpen: boolean;
    applyOpen: boolean;
    applyProgress: number;
    applyTotal: number;
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
            activeStep: credentialsReady ? 1 : 0,
            credentialsReady: credentialsReady,
            tournamentId: sessionStorage.getItem(tournamentIdItemName) || '',
            stages: [],
            stageId: sessionStorage.getItem(stageIdItemName) || '',
            scheduleConfig: {
                schedulingMode: SchedulingMode.Direct,
                matchLengthSettings: [
                    { numberOfGames: 3, matchLengthMin: 30 },
                    { numberOfGames: 5, matchLengthMin: 45 },
                ],
                phases: [],
                bracketType: BracketType.Bracket,
            },
            structure: new TournamentStructure([], [], [], BracketType.Bracket),
            fetching: false,
            fetchDialogOpen: false,
            applyOpen: false,
            applyProgress: 0,
            applyTotal: 0,
        };
    }

    handleNext = () => {
        switch (this.state.activeStep) {
            case 1:
                this.setState({ fetching: true });
                this.props.toornamentHelper.getOrganizerStages(this.state.tournamentId, (results: any[]) => {
                    console.log(results);
                    const stages: ScheduleStage[] = results.map((result) => {
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
                const stage: ScheduleStage = this.state.stages.find((stage) => stage.id === this.state.stageId)!;
                const newScheduleConfig = this.state.scheduleConfig;
                switch (stage.type) {
                    case 'single_elimination':
                    case 'double_elimination':
                    case 'gauntlet':
                    case 'ffa_single_elimination':
                        newScheduleConfig.schedulingMode = SchedulingMode.Direct;
                        newScheduleConfig.bracketType = BracketType.Bracket;
                        break;
                    case 'bracket_groups':
                    case 'pools':
                    case 'league':
                    case 'swiss':
                    case 'simple':
                    case 'ffa_bracket_groups':
                    default:
                        newScheduleConfig.schedulingMode = SchedulingMode.Weekly;
                        newScheduleConfig.bracketType = BracketType.Rounds;
                        break;
                }

                this.setState({
                    scheduleConfig: newScheduleConfig,
                    fetching: true,
                    fetchDialogOpen: true,
                });
                break;
            case 3:
                this.setState({ fetching: true });
                this.state.structure.scheduleTournament(this.state.scheduleConfig);
                this.setState({ fetching: false, activeStep: this.state.activeStep + 1 });
                break;
            case 4:
                this.setState({ fetching: true });
                this.applySchedule(() =>
                    this.setState({ fetching: false, activeStep: this.state.activeStep + 1, applyOpen: false })
                );
                break;
            default:
                this.setState({ activeStep: this.state.activeStep + 1 });
                break;
        }
    };

    applySchedule = (callback: () => void) => {
        const matches = this.state.structure.getMatches();
        const rounds = this.state.structure.getRounds();
        this.setState({ applyOpen: true, applyTotal: matches.length, applyProgress: 0 });
        let currentIndex = 0;
        const scheduleNext = () => {
            if (currentIndex >= matches.length) {
                callback();
                return;
            }

            const match = matches[currentIndex];
            const round = rounds.find((round) => round.id === match.roundId) || rounds[0];
            const continueApplying = () => {
                currentIndex++;
                this.setState({ applyProgress: currentIndex });
                scheduleNext();
            };

            if (round.scheduledAt === null && match.scheduledAt === null) {
                continueApplying();
                return;
            }

            this.props.toornamentHelper.scheduleMatch(
                this.state.tournamentId,
                match.id,
                match.scheduledAt || round.scheduledAt!,
                (result: any, requestStatus: number) => {
                    if (requestStatus < 200 || requestStatus > 300) {
                        console.log(result);
                    }

                    continueApplying();
                }
            );
        };
        scheduleNext();
    };

    fetchCallback = (rounds: ScheduleRound[], matches: ScheduleMatch[], groups: ScheduleGroup[]) => {
        const newScheduleConfig = this.state.scheduleConfig;
        const gameLengths: number[] = [];
        matches.forEach((match) => {
            if (gameLengths.findIndex((n) => n === match.numberOfGames) < 0) {
                gameLengths.push(match.numberOfGames);
            }

            const roundIndex = rounds.findIndex((round) => round.id === match.roundId);
            if (roundIndex >= 0 && rounds[roundIndex].roundLength < match.numberOfGames) {
                rounds[roundIndex].roundLength = match.numberOfGames;
            }
        });

        newScheduleConfig.matchLengthSettings = gameLengths.map((length) => {
            return { numberOfGames: length, matchLengthMin: 30 };
        });

        const structure = new TournamentStructure(rounds, groups, matches, newScheduleConfig.bracketType);
        const firstRounds = structure.getFirstRounds();

        newScheduleConfig.phases = firstRounds.map((round) => {
            return {
                startingRoundId: round.id,
                groupId: round.groupId,
                startDate: new Date(),
                isFirst: true,
            };
        });

        this.setState({
            activeStep: this.state.activeStep + 1,
            scheduleConfig: newScheduleConfig,
            structure: structure,
            fetching: false,
            fetchDialogOpen: false,
        });
    };

    handleBack = () => {
        if (this.state.activeStep === 0) {
            return;
        }

        this.setState({ activeStep: this.state.activeStep - 1 });
    };

    handleReset = () => {
        this.setState({ activeStep: 0 });
    };

    handleChangeTournamentId = (event: any) => {
        const tournamentId = event.target.value;
        sessionStorage.setItem(tournamentIdItemName, tournamentId);
        this.setState({ tournamentId: tournamentId });
    };

    handleChangeStageId = (event: any) => {
        const stageId = event.target.value;
        sessionStorage.setItem(stageIdItemName, stageId);
        this.setState({ stageId: stageId });
    };

    canProceed = (): boolean => {
        switch (this.state.activeStep) {
            case 0:
                return this.state.credentialsReady;
            case 1:
                return this.state.tournamentId !== '';
            case 2:
                return this.state.stageId !== '';
            default:
                return true;
        }
    };

    getStepContent = (step: number) => {
        const { classes } = this.props;
        switch (step) {
            case 0:
                return (
                    <CredentialsStep
                        toornamentHelper={this.props.toornamentHelper}
                        credentialsUpdated={this.credentialsUpdated}
                    />
                );
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
                        <Typography variant='caption' display='block'>
                            You will find it in the Link to your tournament. In this example the higlighted part is the
                            tournament id:
                        </Typography>
                        <Typography variant='caption' display='block'>
                            https://www.toornament.com/en_US/tournaments/
                            <Typography variant='caption' color='secondary' display='inline'>
                                2859636902129573888
                            </Typography>
                            /information
                        </Typography>
                    </div>
                );
            case 2:
                return (
                    <div>
                        <List>
                            {this.state.stages.map((stage, index) => {
                                return (
                                    <ListItem
                                        button
                                        selected={this.state.stageId === stage.id}
                                        onClick={() => this.setState({ stageId: stage.id })}
                                        key={`stage-${index}`}
                                    >
                                        <ListItemText
                                            primary={`${stage.number}. ${stage.name}`}
                                            secondary={`${stage.size} Teams`}
                                        />
                                    </ListItem>
                                );
                            })}
                        </List>
                        <FetchDialog
                            open={this.state.fetchDialogOpen}
                            tournamentId={this.state.tournamentId}
                            stageId={this.state.stageId}
                            callback={this.fetchCallback}
                            toornamentHelper={this.props.toornamentHelper}
                        />
                    </div>
                );
            case 3:
                return (
                    <ConfigurationStep
                        config={this.state.scheduleConfig}
                        scheduleConfigChanged={this.scheduleConfigChanged}
                        structure={this.state.structure}
                    />
                );
            case 4:
                return <ReviewSchedule structure={this.state.structure} />;
            default:
                return <div></div>;
        }
    };

    scheduleConfigChanged = (config: ScheduleConfig) => {
        this.setState({ scheduleConfig: config });
    };

    credentialsUpdated = () => {
        const credentialsReady = this.props.toornamentHelper.hasApiKey() && this.props.toornamentHelper.tokenIsValid();
        this.setState({ credentialsReady: credentialsReady });
    };

    render() {
        const { classes } = this.props;
        return (
            <div className={classes.root}>
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
                                Your stage has beeen scheduled. If you want to schedule another stage press the button
                                below.
                            </Typography>
                            <Button onClick={this.handleReset} className={classes.button}>
                                Back to start.
                            </Button>
                        </div>
                    ) : (
                        <div>
                            <div className={classes.instructions}>{this.getStepContent(this.state.activeStep)}</div>
                            <Grid container alignContent='center' direction='row'>
                                <Button
                                    disabled={this.state.activeStep === 0}
                                    onClick={this.handleBack}
                                    className={classes.button}
                                >
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
                                <div hidden={!this.state.fetching}>
                                    <CircularProgress size={30} thickness={5} />
                                </div>
                            </Grid>
                        </div>
                    )}
                </div>
                <ApplyDialog
                    open={this.state.applyOpen}
                    progress={this.state.applyProgress}
                    total={this.state.applyTotal}
                />
                <img src={'./PoweredbyToor_Black.png'} className={classes.toorImg} alt='Powered By Toornament'></img>
                <Typography variant='body2' color='textSecondary'>{process.env.REACT_APP_VERSION || 'Version not found'}</Typography>
            </div>
        );
    }
}

export default withStyles(styles)(ScheduleStepper);
