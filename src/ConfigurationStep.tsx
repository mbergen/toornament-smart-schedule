import React from 'react';
import {
    Typography, Button, withStyles, createStyles, Theme, TextField, Grid, Select, MenuItem,
    Table, TableHead, TableRow, TableCell, TableBody, FormControl, InputLabel
} from '@material-ui/core';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import MomentUtils from '@date-io/moment';
import TournamentStructure from './TournamenStructure';
import SchedulePhaseComponent from './SchedulePhaseComponent';
import { BracketType } from './ScheduleStepper';

const styles = (theme: Theme) => createStyles({
    textField: {
        marginTop: theme.spacing(1),
        marginRight: theme.spacing(2),
        marginBottom: theme.spacing(1),
        maxWidth: 300,
    },
    button: {
        marginLeft: theme.spacing(2),
        marginTop: theme.spacing(1),
        marginRight: theme.spacing(2),
        marginBottom: theme.spacing(1),
    },
    table: {
        minWidth: 450,
        maxWidth: 600,
    },
    tableHeader: {
        fontSize: '1em',
        fontWeight: 'bolder',
        color: theme.palette.text.primary,
    },
    title: {
        marginTop: theme.spacing(3),
        marginBottom: theme.spacing(1),
        borderBottomColor: theme.palette.secondary.main,
        borderBottomStyle: 'solid',
        borderBottomWidth: 4,
        flexShrink: 1,
    }
});

export interface MatchLengthSettings {
    numberOfGames: number;
    matchLengthMin: number;
}

export enum SchedulingMode {
    Monthly = 'Monthly',
    Weekly = 'Weekly',
    Daily = 'Daily',
    Direct = 'Direct',
}

export interface SchedulePhase {
    groupId: string;
    startingRoundId: string;
    startDate: Date;
    isFirst: boolean;
}

export interface ScheduleConfig {
    schedulingMode: SchedulingMode;
    bracketType: BracketType;
    matchLengthSettings: MatchLengthSettings[];
    phases: SchedulePhase[];
}

interface ConfigurationStepProps {
    structure: TournamentStructure;
    config: ScheduleConfig;
    scheduleConfigChanged: (config: ScheduleConfig) => void;
    classes?: any;
}

class ConfigurationStep extends React.Component<ConfigurationStepProps, {}> {

    renderMatchLengthConfig = () => {
        const { classes } = this.props;
        return (
            <Table className={classes.table} size='small'>
                <TableHead>
                    <TableRow >
                        <TableCell className={classes.tableHeader} align='right'>Games per Match</TableCell>
                        <TableCell className={classes.tableHeader} >Time per Match (Minutes)</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {this.props.config.matchLengthSettings.map((matchLengthSetting, index) => (
                        <TableRow key={`row-${index}`}>
                            <TableCell component='th' scope='row' align='right'>
                                {matchLengthSetting.numberOfGames}
                            </TableCell>
                            <TableCell >
                                <TextField
                                    label='Match Length'
                                    className={classes.textField}
                                    value={matchLengthSetting.matchLengthMin}
                                    onChange={this.handleChangeMatchLength(index)}
                                    margin='dense'
                                    variant='outlined'
                                    type='number'
                                    error={!this.isValidMatchLength(matchLengthSetting.matchLengthMin)}
                                />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        );
    }

    handleChangeMatchLength = (index: number) => (event: any) => {
        const newCfg = this.props.config;
        newCfg.matchLengthSettings[index].matchLengthMin = Number(event.target.value);
        this.props.scheduleConfigChanged(newCfg);
    }

    handleChangeMatchMode = (event: any) => {
        const newCfg = this.props.config;
        newCfg.schedulingMode = event.target.value;
        this.props.scheduleConfigChanged(newCfg);
    }

    isValidMatchLength = (length: number): boolean => {
        return length > 0 && Number.isInteger(length);
    }

    onPhaseChanged = (index: number) => (phase: SchedulePhase | null) => {
        const newCfg = this.props.config;
        if (phase != null) {
            newCfg.phases[index] = phase;
        } else {
            newCfg.phases.splice(index, 1);
        }
        this.props.scheduleConfigChanged(newCfg);
    }

    canAddNewPhase(): boolean {
        return this.props.config.phases.length < this.props.structure.getRounds().length;
    }

    addPhase = () => {
        const newCfg = this.props.config;
        const newRound = this.props.structure.getRounds().find(round => this.props.config.phases.findIndex(phase => phase.startingRoundId === round.id) < 0);
        if (newRound === undefined) {
            return; //add user feedback
        }

        newCfg.phases.push({
            groupId: newRound.groupId,
            startingRoundId: newRound.id,
            startDate: newCfg.phases[newCfg.phases.length - 1].startDate,
            isFirst: false,
        });

        this.props.scheduleConfigChanged(newCfg);
    }

    render() {
        const { classes } = this.props;
        const modes: SchedulingMode[] = [SchedulingMode.Direct, SchedulingMode.Daily, SchedulingMode.Weekly, SchedulingMode.Monthly]

        const phases = this.props.config.phases.map((phase, index) => {
            return (
                <SchedulePhaseComponent
                    phase={phase}
                    structure={this.props.structure}
                    phaseChanged={this.onPhaseChanged(index)}
                    key={`phase-${index}`}
                />
            );
        });

        return (
            <Grid
                container
                direction='column'
            >
                <Typography className={classes.title} variant='h6'>Schedule Mode</Typography>
                <Typography paragraph>Decide how rounds should be scheduled. By specifying a mode other than {SchedulingMode.Direct} you
                can schedule your matches on a daily, weekly or monthly basis. Each round is going to take place
                at a new date. In {SchedulingMode.Direct} mode matches will occur at the earliest time after all previous matches have been played.
                Therefore it is well suited for brackets.</Typography>
                <FormControl className={classes.textField}>
                    <InputLabel>Schedule Mode</InputLabel>
                    <Select
                        value={this.props.config.schedulingMode}
                        onChange={this.handleChangeMatchMode}
                        inputProps={{
                            name: 'schedulingMode',
                        }}
                    >
                        {modes.map((mode, index) => {
                            return (<MenuItem value={mode} key={`mode-${index}-mi`}>{mode}</MenuItem>)
                        })}
                    </Select>
                </FormControl>
                <Typography className={classes.title} variant='h6' component='div'>Manage Phases</Typography>
                <Typography>
                    You can use Phases to start a part of your tournament at a different time. For example
                    if you wanted to skip a day in your weekly round robin because its christmas eve or something, you would
                    add a new phase starting at the first match day after the skipped day.
                </Typography>
                <Typography>
                    This also enables you to use the {SchedulingMode.Direct} mode to schedule a bracket over the course of two days
                    by adding a phase for the second day.
                </Typography>
                <Typography>
                    Please note that the integrety of your structure will not be verified. You are resposible for starting phases at the right time and date.
                    If you do not need to use phases just use the first one as the starting date for your tournament.
                </Typography>
                <MuiPickersUtilsProvider utils={MomentUtils}>
                    {phases}
                    <Button
                        variant='contained'
                        color='primary'
                        onClick={this.addPhase}
                        disabled={!this.canAddNewPhase()}
                    >
                        Add Phase
                    </Button>
                </MuiPickersUtilsProvider>
                <Typography className={classes.title} variant='h6'>Match Length</Typography>
                {this.renderMatchLengthConfig()}
            </Grid>
        );
    }
}

export default withStyles(styles)(ConfigurationStep);