import React from 'react';
import {
    Typography, Button, withStyles, createStyles, Theme, TextField, Grid, Select, MenuItem,
    Table, TableHead, TableRow, TableCell, TableBody, FormControl, InputLabel, Tooltip
} from '@material-ui/core';
import { MuiPickersUtilsProvider, KeyboardDateTimePicker } from '@material-ui/pickers';
import moment from 'moment';
import MomentUtils from '@date-io/moment';
import { ScheduleRound, ScheduleGroup } from './ScheduleStepper';

const styles = (theme: Theme) => createStyles({
    textField: {
        margin: theme.spacing(1),
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
    }
});

interface MatchLengthSettings {
    numberOfGames: number;
    matchLengthMin: number;
}

export enum SchedulingMode {
    Monthly = 'Monthly',
    Weekly = 'Weekly',
    Daily = 'Daily',
    Direct = 'Direct',
}

interface SchedulePhase {
    groupId: string;
    startingRoundId: string;
    startDate: Date;
}

export interface ScheduleConfig {
    schedulingMode: SchedulingMode;
    matchLengthSettings: MatchLengthSettings[];
    phases: SchedulePhase[];
}

interface ConfigurationStepProps {
    rounds: ScheduleRound[];
    groups: ScheduleGroup[];
    config: ScheduleConfig;
    scheduleConfigChanged: (config: ScheduleConfig) => void;
    classes?: any;
}

class ConfigurationStep extends React.Component<ConfigurationStepProps, {}> {
    constructor(props: ConfigurationStepProps) {
        super(props);
    }

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

    handleChangeStartDate = (index: number) => (moment: any) => {
        const newCfg = this.props.config;
        newCfg.phases[index].startDate = moment.toDate();
        this.props.scheduleConfigChanged(newCfg);
    }

    handleChangeMatchMode = (event: any) => {
        const newCfg = this.props.config;
        newCfg.schedulingMode = event.target.value;
        this.props.scheduleConfigChanged(newCfg);
    }

    handleChangePhaseRound = (index: number) => (event: any) => {
        const newCfg = this.props.config;
        newCfg.phases[index].startingRoundId = event.target.value;
        this.props.scheduleConfigChanged(newCfg);
    }

    handleChangePhaseGroup = (index: number) => (event: any) => {
        const newCfg = this.props.config;
        newCfg.phases[index].startingRoundId = event.target.value;
        this.props.scheduleConfigChanged(newCfg);
    }

    isValidMatchLength = (length: number): boolean => {
        return length > 0 && Number.isInteger(length);
    }

    render() {
        const { classes } = this.props;
        const modes: SchedulingMode[] = [SchedulingMode.Direct, SchedulingMode.Daily, SchedulingMode.Weekly, SchedulingMode.Monthly]

        const phases = this.props.config.phases.map((phase, index) => {
            return (
                <Grid
                    item
                    container
                    direction='row'
                    key={`phase-${index}`}
                >
                    <Tooltip title='Select start date'>
                        <KeyboardDateTimePicker
                            disablePast
                            className={classes.textField}
                            ampm={false}
                            value={phase.startDate}
                            label='Phase Start'
                            onChange={this.handleChangeStartDate(index)}
                        />
                    </Tooltip>
                    <FormControl className={classes.textField}>
                        <InputLabel>Group</InputLabel>
                        <Select
                            value={phase.groupId}
                            onChange={this.handleChangeMatchMode}
                            inputProps={{
                                name: 'startRound',
                            }}
                        >
                            {this.props.groups.map(group => {
                                return (<MenuItem value={group.id}>{group.name}</MenuItem>)
                            })}
                        </Select>
                    </FormControl>
                    <FormControl className={classes.textField}>
                        <InputLabel>Start Round</InputLabel>
                        <Select
                            value={phase.startingRoundId}
                            onChange={this.handleChangeMatchMode}
                            inputProps={{
                                name: 'startRound',
                            }}
                        >
                            {this.props.rounds.filter(round => round.groupId == phase.groupId).map(round => {
                                return (<MenuItem value={round.id}>{round.name}</MenuItem>)
                            })}
                        </Select>
                    </FormControl>
                </Grid>
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
                        {modes.map(mode => {
                            return (<MenuItem value={mode}>{mode}</MenuItem>)
                        })}
                    </Select>
                </FormControl>
                <Typography className={classes.title} variant='h6'>Manage Phases</Typography>
                <MuiPickersUtilsProvider utils={MomentUtils}>
                    {phases}
                </MuiPickersUtilsProvider>
                <Typography className={classes.title} variant='h6'>Match Length</Typography>
                {this.renderMatchLengthConfig()}
            </Grid>
        );
    }
}

export default withStyles(styles)(ConfigurationStep);