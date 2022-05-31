import React from 'react';
import { styled } from '@mui/material/styles';
import { Grid, Tooltip, FormControl, Select, InputLabel, MenuItem, Fab, TextField } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import TournamentStructure from '../TournamenStructure';
import DeleteIcon from '@mui/icons-material/Delete';
import SchedulePhase from '../domain/SchedulePhase';
const PREFIX = 'SchedulePhaseComponent';

const classes = {
    textField: `${PREFIX}-textField`,
    delButton: `${PREFIX}-delButton`,
};

const Root = styled('div')(({ theme }) => ({
    [`& .${classes.textField}`]: {
        margin: theme.spacing(1),
        maxWidth: 220,
    },

    [`& .${classes.delButton}`]: {
        margin: theme.spacing(1),
    },
}));

interface PhaseComponentProps {
    phase: SchedulePhase;
    structure: TournamentStructure;
    phaseChanged: (phase: SchedulePhase | null) => void;
}

export default class PhaseComponent extends React.Component<PhaseComponentProps, any> {
    handleChangeStartDate = (moment: any) => {
        const newPhase = this.props.phase;
        newPhase.startDate = moment == null ? moment : moment.toDate();
        this.props.phaseChanged(newPhase);
    };

    handleChangePhaseRound = (event: any) => {
        const newPhase = this.props.phase;
        newPhase.startingRoundId = event.target.value;
        this.props.phaseChanged(newPhase);
    };

    handleChangePhaseGroup = (event: any) => {
        const newPhase = this.props.phase;
        newPhase.groupId = event.target.value;
        this.props.phaseChanged(newPhase);
    };

    handleDelete = () => {
        this.props.phaseChanged(null);
    };

    render() {
        return (
            <Root>
                <Grid item container direction='row' alignContent='center'>
                    <Tooltip title='Select start date'>
                        <div className={classes.textField}>
                            <DateTimePicker
                                renderInput={(props) => <TextField {...props} />}
                                disablePast
                                ampm={false}
                                value={this.props.phase.startDate}
                                label='Phase Start'
                                onChange={this.handleChangeStartDate}
                            />
                        </div>
                    </Tooltip>
                    <FormControl className={classes.textField}>
                        <InputLabel>Group</InputLabel>
                        <Select
                            value={this.props.phase.groupId}
                            onChange={this.handleChangePhaseGroup}
                            inputProps={{
                                name: 'startRound',
                            }}
                            disabled={this.props.phase.isFirst}
                        >
                            {this.props.structure.getGroups().map((group, index) => {
                                return (
                                    <MenuItem value={group.id} key={`group-${index}-mi`}>
                                        {group.name}
                                    </MenuItem>
                                );
                            })}
                        </Select>
                    </FormControl>
                    <FormControl className={classes.textField}>
                        <InputLabel>Start Round</InputLabel>
                        <Select
                            value={this.props.phase.startingRoundId}
                            onChange={this.handleChangePhaseRound}
                            inputProps={{
                                name: 'startRound',
                            }}
                            disabled={this.props.phase.isFirst}
                        >
                            {this.props.structure
                                .getRounds()
                                .filter((round) => round.groupId === this.props.phase.groupId)
                                .map((round, index) => {
                                    return (
                                        <MenuItem value={round.id} key={`round-${index}-mi`}>
                                            {round.name}
                                        </MenuItem>
                                    );
                                })}
                        </Select>
                    </FormControl>
                    {!this.props.phase.isFirst && (
                        <Fab size='small' aria-label='Delete' className={classes.delButton} onClick={this.handleDelete}>
                            <DeleteIcon />
                        </Fab>
                    )}
                </Grid>
            </Root>
        );
    }
}
