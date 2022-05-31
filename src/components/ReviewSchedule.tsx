import React from 'react';
import { Table, TableBody, TableRow, TableCell } from '@mui/material';
import TournamentStructure from '../TournamenStructure';
import moment from 'moment';
import ScheduleRound from '../domain/ScheduleRound';

interface ReviewScheduleProps {
    structure: TournamentStructure;
}

export default class ReviewSchedule extends React.Component<ReviewScheduleProps, any> {
    getGroupName = (round: ScheduleRound): string => {
        const group = this.props.structure.getGroups().find((group) => group.id === round.groupId);
        return group !== undefined ? group.name : 'Unknown Group';
    };

    render() {
        const tableRows = this.props.structure
            .getRounds()
            .sort((a, b) => {
                if (a.scheduledAt == null) {
                    return -1;
                }

                if (b.scheduledAt == null) {
                    return 1;
                }

                return a.scheduledAt.getTime() - b.scheduledAt.getTime();
            })
            .map((round) => {
                return (
                    <TableRow>
                        <TableCell>{this.getGroupName(round)}</TableCell>
                        <TableCell>{round.name}</TableCell>
                        <TableCell>
                            {round.scheduledAt != null
                                ? moment(round.scheduledAt).format('llll')
                                : 'Error while scheduling, please contact dev.'}
                        </TableCell>
                    </TableRow>
                );
            });

        return (
            <Table>
                <TableBody>{tableRows}</TableBody>
            </Table>
        );
    }
}
