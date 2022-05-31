import React from 'react';
import {
    Dialog,
    DialogTitle,
    Grid,
    CircularProgress,
    Typography,
    Theme,
    DialogContent,
} from '@mui/material';
import ToornamentHelper from '../ToornamentHelper';
import CheckIcon from '@mui/icons-material/Check';
import { green } from '@mui/material/colors';
import ScheduleGroup from '../domain/ScheduleGroup';
import ScheduleRound from '../domain/ScheduleRound';
import ScheduleMatch from '../domain/ScheduleMatch';
import ScheduleParticipant from '../domain/ScheduleParticipant';
import { createStyles, withStyles } from '@mui/styles';

const styles = (theme: Theme) =>
    createStyles({
        checkIcon: {
            color: green[300],
        },
        iconContainer: {
            width: 20,
            marginRight: theme.spacing(1),
        },
    });

interface FetchDialogProps {
    open: boolean;
    tournamentId: string;
    stageId: string;
    toornamentHelper: ToornamentHelper;
    callback: (rounds: ScheduleRound[], matches: ScheduleMatch[], groups: ScheduleGroup[]) => void;
    classes?: any;
}

interface FetchDialogState {
    roundsFinished: boolean;
    matchesFinished: boolean;
    groupsFinished: boolean;
    rounds: ScheduleRound[];
    matches: ScheduleMatch[];
    groups: ScheduleGroup[];
    matchIndex: number;
    bracketNodeIndex: number;
}

function getDefaultFetchDialogState(): FetchDialogState {
    return {
        roundsFinished: false,
        matchesFinished: false,
        groupsFinished: false,
        rounds: [],
        matches: [],
        groups: [],
        matchIndex: 0,
        bracketNodeIndex: 0,
    };
}

class FetchDialog extends React.Component<FetchDialogProps, FetchDialogState> {
    fetchOnUpdate: boolean = false;

    constructor(props: FetchDialogProps) {
        super(props);

        this.state = getDefaultFetchDialogState();
    }

    fetchStageData() {
        const { tournamentId, stageId, toornamentHelper, callback } = this.props;

        toornamentHelper.getOrganizerGroups(tournamentId, stageId, (results: any[]) => {
            const groups = results.map((result) => {
                return {
                    id: result.id,
                    name: result.name,
                    number: result.number,
                };
            });

            this.setState({ groups: groups, groupsFinished: true });

            if (this.state.roundsFinished && this.state.matchesFinished) {
                callback(this.state.rounds, this.state.matches, this.state.groups);
            }
        });

        toornamentHelper.getOrganizerRounds(tournamentId, stageId, (results: any[]) => {
            const rounds = results.map((result) => {
                return {
                    id: result.id,
                    groupId: result.group_id,
                    name: result.name,
                    number: result.number,
                    size: result.settings.size,
                    scheduledAt: null,
                    roundLength: 1,
                };
            });

            this.setState({ rounds: rounds, roundsFinished: true });

            if (this.state.matchesFinished && this.state.groupsFinished) {
                callback(this.state.rounds, this.state.matches, this.state.groups);
            }
        });

        toornamentHelper.getOrganizerMatches(tournamentId, stageId, (matchResults: any[]) => {
            const matches = matchResults.map((result) => {
                const participants: ScheduleParticipant[] = [];
                result.opponents.forEach((opponent: any) => {
                    if (opponent.participant) {
                        participants.push({
                            id: opponent.participant.id,
                            name: opponent.participant.name,
                        });
                    }
                });

                return {
                    id: result.id,
                    groupId: result.group_id,
                    roundId: result.round_id,
                    numberOfGames: 0,
                    scheduledAt: null,
                    opponents: [],
                    participants: participants,
                };
            });

            this.setState({ matches: matches });

            const finishMatches = () => {
                if (this.state.roundsFinished && this.state.groupsFinished) {
                    callback(this.state.rounds, this.state.matches, this.state.groups);
                } else {
                    this.setState({ matchesFinished: true });
                }
            };

            const getNodes = () => {
                toornamentHelper.getBracketNodes(tournamentId, stageId, (results: any[]) => {
                    results.forEach((result, index) => {
                        let matchIndex = index;
                        const matches = this.state.matches;
                        let match = matches[matchIndex];

                        if (match == null || match.id !== result.id) {
                            matchIndex = matches.findIndex((m) => m.id === result.id);
                            if (matchIndex < 0) {
                                return;
                            }
                            match = matches[matchIndex];
                        }

                        match.opponents = result.opponents.map((opponent: any) => {
                            return {
                                number: opponent.number,
                                sourceType: opponent.source_type,
                                sourceNodeId: opponent.source_node_id,
                            };
                        });
                        matches[matchIndex] = match;
                        this.setState({ matches: matches, bracketNodeIndex: index + 1 });
                    });
                    finishMatches();
                });
            };

            const callNext = () => {
                if (this.state.matchIndex >= this.state.matches.length) {
                    getNodes();
                    return;
                }

                const matchId = this.state.matches[this.state.matchIndex].id;
                const callback = (results: any[]) => {
                    const matches = this.state.matches;
                    matches[this.state.matchIndex].numberOfGames = results.length;
                    this.setState({ matches: matches, matchIndex: this.state.matchIndex + 1 });
                    callNext();
                };
                toornamentHelper.getOrganizerMatchGames(tournamentId, matchId, callback);
            };

            callNext();
        });
    }

    componentWillReceiveProps(newProps: FetchDialogProps) {
        if (!this.props.open && newProps.open) {
            this.fetchOnUpdate = true;
        }
    }

    componentDidUpdate() {
        if (this.fetchOnUpdate) {
            this.fetchOnUpdate = false;
            this.setState(getDefaultFetchDialogState());
            this.fetchStageData();
        }
    }

    render() {
        const { classes } = this.props;
        const progressSize = 20;
        return (
            <Dialog open={this.props.open}>
                <DialogTitle>Fetching Tournament Properties...</DialogTitle>
                <DialogContent>
                    <Grid container direction='row'>
                        <Grid item container alignContent='center' className={classes.iconContainer}>
                            {this.state.groupsFinished ? (
                                <CheckIcon className={classes.checkIcon} />
                            ) : (
                                <CircularProgress size={progressSize} />
                            )}
                        </Grid>
                        <Typography>Fetching Groups</Typography>
                    </Grid>
                    <Grid container direction='row'>
                        <Grid item container alignContent='center' className={classes.iconContainer}>
                            {this.state.roundsFinished ? (
                                <CheckIcon className={classes.checkIcon} />
                            ) : (
                                <CircularProgress size={progressSize} />
                            )}
                        </Grid>
                        <Typography>Fetching Rounds</Typography>
                    </Grid>
                    <Grid container direction='row'>
                        <Grid item container alignContent='center' className={classes.iconContainer}>
                            {this.state.matches.length !== 0 ? (
                                <CheckIcon className={classes.checkIcon} />
                            ) : (
                                <CircularProgress size={progressSize} />
                            )}
                        </Grid>
                        <Typography>Fetching Matches</Typography>
                    </Grid>
                    <Grid container direction='row' hidden={this.state.matches.length === 0}>
                        <Grid item container alignContent='center' className={classes.iconContainer}>
                            {this.state.matchIndex >= this.state.matches.length ? (
                                <CheckIcon className={classes.checkIcon} />
                            ) : (
                                <CircularProgress size={progressSize} />
                            )}
                        </Grid>
                        <Typography>
                            {this.state.matchIndex}/{this.state.matches.length} Fetching Match Length
                        </Typography>
                    </Grid>
                    <Grid container direction='row' hidden={this.state.matchIndex < this.state.matches.length}>
                        <Grid item container alignContent='center' className={classes.iconContainer}>
                            {this.state.bracketNodeIndex >= this.state.matches.length ? (
                                <CheckIcon className={classes.checkIcon} />
                            ) : (
                                <CircularProgress size={progressSize} />
                            )}
                        </Grid>
                        <Typography>
                            {this.state.bracketNodeIndex}/{this.state.matches.length} Fetching Bracket Nodes
                        </Typography>
                    </Grid>
                </DialogContent>
            </Dialog>
        );
    }
}

export default withStyles(styles)(FetchDialog);
