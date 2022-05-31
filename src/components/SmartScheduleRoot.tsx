import React from 'react';
import { Theme, Typography, AppBar, Toolbar } from '@mui/material';
import ToornamentHelper from '../ToornamentHelper';
import ScheduleStepper from '../components/ScheduleStepper';
import { createStyles, withStyles } from '@mui/styles';

const styles = (theme: Theme) =>
    createStyles({
        root: {
            display: 'flex',
            justifyContent: 'center',
        },
        menuButton: {
            marginRight: theme.spacing(2),
        },
        hide: {
            display: 'none',
        },
        content: {
            flexGrow: 1,
            maxWidth: 1000,
            padding: theme.spacing(3),
            marginTop: theme.spacing(6),
        },
        button: {
            marginLeft: 16,
            marginTop: 8,
            marginRight: 16,
            marginBottom: 8,
        },
        paper: {
            width: '100%',
            marginTop: theme.spacing(3),
            overflowX: 'auto',
        },
        table: {
            minWidth: 650,
        },
    });

interface AppState {
    toornamentHelper: ToornamentHelper;
}

class SmartScheduleRoot extends React.Component<any, AppState> {
    constructor(props: any) {
        super(props);

        this.state = {
            toornamentHelper: new ToornamentHelper(),
        };
    }

    render() {
        const { classes } = this.props;

        return (
            <div className={classes.root}>
                <AppBar position='fixed' className={classes.appBar}>
                    <Toolbar variant='dense'>
                        <Typography variant='h6' noWrap>
                            Toornament Smart Schedule
                        </Typography>
                    </Toolbar>
                </AppBar>
                <main className={classes.content}>
                    <ScheduleStepper toornamentHelper={this.state.toornamentHelper} />
                </main>
            </div>
        );
    }
}

export default withStyles(styles)(SmartScheduleRoot);
