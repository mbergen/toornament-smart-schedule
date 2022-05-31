import React from 'react';
import { styled } from '@mui/material/styles';
import { Typography, AppBar, Toolbar } from '@mui/material';
import ToornamentHelper from '../ToornamentHelper';
import ScheduleStepper from '../components/ScheduleStepper';
import Footer from './Footer';
const PREFIX = 'SmartScheduleRoot';

const classes = {
    root: `${PREFIX}-root`,
    menuButton: `${PREFIX}-menuButton`,
    hide: `${PREFIX}-hide`,
    content: `${PREFIX}-content`,
    button: `${PREFIX}-button`,
    paper: `${PREFIX}-paper`,
    table: `${PREFIX}-table`,
};

const Root = styled('div')(({ theme }) => ({
    [`&.${classes.root}`]: {
        display: 'flex',
        justifyContent: 'center',
    },

    [`& .${classes.menuButton}`]: {
        marginRight: theme.spacing(2),
    },

    [`& .${classes.hide}`]: {
        display: 'none',
    },

    [`& .${classes.content}`]: {
        flexGrow: 1,
        maxWidth: 1000,
        padding: theme.spacing(3),
        marginTop: theme.spacing(6),
    },

    [`& .${classes.button}`]: {
        marginLeft: 16,
        marginTop: 8,
        marginRight: 16,
        marginBottom: 8,
    },

    [`& .${classes.paper}`]: {
        width: '100%',
        marginTop: theme.spacing(3),
        overflowX: 'auto',
    },

    [`& .${classes.table}`]: {
        minWidth: 650,
    },
}));

interface AppState {
    toornamentHelper: ToornamentHelper;
}

export default class SmartScheduleRoot extends React.Component<any, AppState> {
    constructor(props: any) {
        super(props);

        this.state = {
            toornamentHelper: new ToornamentHelper(),
        };
    }

    render() {
        return (
            <Root className={classes.root}>
                <AppBar position='fixed'>
                    <Toolbar variant='dense'>
                        <Typography variant='h6' noWrap>
                            Toornament Smart Schedule
                        </Typography>
                    </Toolbar>
                </AppBar>
                <main className={classes.content}>
                    <ScheduleStepper toornamentHelper={this.state.toornamentHelper} />
                    <Footer />
                </main>
            </Root>
        );
    }
}
