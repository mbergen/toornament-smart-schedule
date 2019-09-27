import React from 'react';
import {
    createStyles, Theme, withStyles, Grid, TextField, CssBaseline, IconButton, Divider,
    Typography, FormControlLabel, Switch, Button, Paper, AppBar, Toolbar, Drawer
} from '@material-ui/core';
import MenuIcon from '@material-ui/icons/Menu';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import moment from 'moment';
import clsx from 'clsx';
import ToornamentHelper from './ToornamentHelper';


const drawerWidth = 360;
const styles = (theme: Theme) => createStyles({
    root: {
        display: 'flex',
    },
    appBar: {
        transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
    },
    appBarShift: {
        width: `calc(100% - ${drawerWidth}px)`,
        marginLeft: drawerWidth,
        transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
        }),
    },
    menuButton: {
        marginRight: theme.spacing(2),
    },
    hide: {
        display: 'none',
    },
    drawer: {
        width: drawerWidth,
        flexShrink: 0,
    },
    drawerPaper: {
        width: drawerWidth,
    },
    drawerHeader: {
        display: 'flex',
        alignItems: 'center',
        padding: theme.spacing(0, 1),
        ...theme.mixins.toolbar,
        justifyContent: 'flex-end',
    },
    content: {
        flexGrow: 1,
        padding: theme.spacing(3),
        transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
        marginLeft: -drawerWidth,
    },
    contentShift: {
        transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
        }),
        marginLeft: 0,
    },
    textField: {
        marginLeft: 16,
        marginTop: 8,
        marginRight: 16,
        marginBottom: 8,
    },
    button: {
        marginLeft: 16,
        marginTop: 8,
        marginRight: 16,
        marginBottom: 8,
    }
});

interface AppState {
    drawerOpen: boolean,
    apiKey: string,
    clientId: string,
    clientSecret: string,
    tournamentId: string,
    stageId: string,
    toornamentHelper: ToornamentHelper,
}

class App extends React.Component<any, AppState> {

    constructor(props: any) {
        super(props);

        this.state = {
            drawerOpen: true,
            apiKey: '',
            clientId: '',
            clientSecret: '',
            tournamentId: '',
            stageId: '',
            toornamentHelper: new ToornamentHelper(),
        }
    }

    handleDrawerOpen = (open: boolean) => () => {
        this.setState({ drawerOpen: open })
    }

    handleChangeApiKey = (event: any) => {
        this.setState({apiKey: event.target.value});
    }

    handleChangeClientId = (event: any) => {
        this.setState({clientId: event.target.value});
    }

    handleChangeClientSecret = (event: any) => {
        this.setState({clientSecret: event.target.value});
    }

    handleChangeTournamentId = (event: any) => {
        this.setState({tournamentId: event.target.value});
    }

    handleChangeStageId = (event: any) => {
        this.setState({stageId: event.target.value});
    }

    requestToken = () => {
        if (!this.state.toornamentHelper.tokenIsValid()) {
            this.state.toornamentHelper.getToken(this.state.apiKey, this.state.clientId, this.state.clientSecret);
        }
    }

    fetchEverything = () => {
        if (this.state.toornamentHelper.tokenIsValid()) {
            this.state.toornamentHelper.getOrganizerMatches(this.state.apiKey, this.state.tournamentId, this.state.stageId);
            this.state.toornamentHelper.getOrganizerRounds(this.state.apiKey, this.state.tournamentId, this.state.stageId);
            this.state.toornamentHelper.getOrganizerStages(this.state.apiKey, this.state.tournamentId);
            this.state.toornamentHelper.getOrganizerTournament(this.state.apiKey, this.state.tournamentId);
        }
    }

    render() {
        const { classes } = this.props
        return (
            <div className={classes.root}>
                <CssBaseline />
                <AppBar
                    position="fixed"
                    className={clsx(classes.appBar, {
                        [classes.appBarShift]: this.state.drawerOpen,
                    })}
                >
                    <Toolbar>
                        <IconButton
                            color="inherit"
                            aria-label="open drawer"
                            onClick={this.handleDrawerOpen(true)}
                            edge="start"
                            className={clsx(classes.menuButton, this.state.drawerOpen && classes.hide)}
                        >
                            <MenuIcon />
                        </IconButton>
                        <Typography variant="h6" noWrap>
                            Toornament Smart Schedule
                </Typography>
                    </Toolbar>
                </AppBar>
                <Drawer
                    className={classes.drawer}
                    variant="persistent"
                    anchor="left"
                    open={this.state.drawerOpen}
                    classes={{
                        paper: classes.drawerPaper,
                    }}
                >
                    <div className={classes.drawerHeader}>
                        <IconButton onClick={this.handleDrawerOpen(false)}>
                            <ChevronLeftIcon />
                        </IconButton>
                    </div>
                    <Divider />
                    <TextField
                        label='Api Key'
                        className={classes.textField}
                        value={this.state.apiKey}
                        onChange={this.handleChangeApiKey}
                        margin='dense'
                        variant='outlined'
                    />
                    <TextField
                        label='Client Id'
                        className={classes.textField}
                        value={this.state.clientId}
                        onChange={this.handleChangeClientId}
                        margin='dense'
                        variant='outlined'
                    />
                    <TextField
                        label='Client Secret'
                        className={classes.textField}
                        value={this.state.clientSecret}
                        onChange={this.handleChangeClientSecret}
                        margin='dense'
                        variant='outlined'
                    />
                    <TextField
                        label='Tournament Id'
                        className={classes.textField}
                        value={this.state.tournamentId}
                        onChange={this.handleChangeTournamentId}
                        margin='dense'
                        variant='outlined'
                    />
                    <TextField
                        label='Stage Id'
                        className={classes.textField}
                        value={this.state.stageId}
                        onChange={this.handleChangeStageId}
                        margin='dense'
                        variant='outlined'
                    />
                    <Button
                        variant='contained'
                        color='primary'
                        className={classes.button}
                        onClick={this.requestToken}
                    >
                        Request Token
                    </Button>
                    <Button
                        variant='contained'
                        color='secondary'
                        className={classes.button}
                        onClick={this.fetchEverything}
                    >
                        Fetch Matches
                    </Button>
                </Drawer>
                <main
                    className={clsx(classes.content, {
                        [classes.contentShift]: this.state.drawerOpen,
                    })}
                >
                    <div className={classes.drawerHeader} />
                    <Typography paragraph>
                        {this.state.tournamentId}
                    </Typography>
                    <Typography paragraph>
                        {this.state.stageId}
                    </Typography>
                </main>
            </div>
        );
    }
}

export default withStyles(styles)(App);
