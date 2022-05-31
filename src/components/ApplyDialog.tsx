import React from 'react';
import { styled } from '@mui/material/styles';
import { Dialog, DialogTitle, Grid, CircularProgress, Typography, DialogContent } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { green } from '@mui/material/colors';
const PREFIX = 'ApplyDialog';

const classes = {
    checkIcon: `${PREFIX}-checkIcon`,
    iconContainer: `${PREFIX}-iconContainer`,
};

const StyledDialog = styled(Dialog)(({ theme }) => ({
    [`& .${classes.checkIcon}`]: {
        color: green[300],
    },

    [`& .${classes.iconContainer}`]: {
        width: 20,
        marginRight: theme.spacing(1),
    },
}));

interface FetchDialogProps {
    open: boolean;
    progress: number;
    total: number;
    classes?: any;
}

export default class ApplyDialog extends React.Component<FetchDialogProps, any> {
    render() {
        const progressSize = 20;
        return (
            <StyledDialog open={this.props.open}>
                <DialogTitle>Applying Changes</DialogTitle>
                <DialogContent>
                    <Grid container direction='row'>
                        <Grid item container alignContent='center' className={classes.iconContainer}>
                            {this.props.progress !== this.props.total ? (
                                <CheckIcon className={classes.checkIcon} />
                            ) : (
                                <CircularProgress size={progressSize} />
                            )}
                        </Grid>
                        <Typography>
                            {this.props.progress}/{this.props.total} Applying Matches
                        </Typography>
                    </Grid>
                </DialogContent>
            </StyledDialog>
        );
    }
}
