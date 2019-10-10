import React from 'react';
import { Dialog, DialogTitle, Grid, CircularProgress, Typography, Theme, createStyles, withStyles, DialogContent } from '@material-ui/core';
import ToornamentHelper from "./ToornamentHelper";
import { ScheduleRound, ScheduleMatch, ScheduleGroup } from "./ScheduleStepper";
import CheckIcon from '@material-ui/icons/Check';
import { green } from '@material-ui/core/colors';

const styles = (theme: Theme) => createStyles({
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
    progress: number;
    total: number;
    classes?: any;
}

class ApplyDialog extends React.Component<FetchDialogProps, any> {

    render() {
        const { classes } = this.props
        const progressSize = 20;
        return (
            <Dialog open={this.props.open}>
                <DialogTitle>Applying Changes</DialogTitle>
                <DialogContent>
                    <Grid
                        container
                        direction='row'
                    >
                        <Grid
                            item
                            container
                            alignContent='center'
                            className={classes.iconContainer}
                        >
                            {this.props.progress != this.props.total ? <CheckIcon className={classes.checkIcon} /> : <CircularProgress size={progressSize} />}
                        </Grid>
                        <Typography>{this.props.progress}/{this.props.total} Applying Matches</Typography>
                    </Grid>
                </DialogContent>
            </Dialog>
        );
    }
}

export default withStyles(styles)(ApplyDialog);