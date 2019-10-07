import React from 'react';
import {
    createStyles, Theme, withStyles, CssBaseline, Typography, AppBar, Toolbar
} from '@material-ui/core';
import ToornamentHelper from './ToornamentHelper';
import ScheduleStepper from './ScheduleStepper';

const styles = (theme: Theme) => createStyles({
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
    toornamentHelper: ToornamentHelper,
}

class App extends React.Component<any, AppState> {

    constructor(props: any) {
        super(props);

        this.state = {
            toornamentHelper: new ToornamentHelper(),
        }
    }

    fetchEverything = () => {
        if (this.state.toornamentHelper.tokenIsValid()) {
            /*
            const matchesCallback = (matchIds: string[]) => {
                let currentIndex = 0;


                const callNext = () => {
                    if (currentIndex >= matchIds.length) {
                        return;
                    }

                    const matchId = matchIds[currentIndex];
                    const callback = (result: any) => {
                        console.log(`games from: ${matchId}`, result);
                        currentIndex++;
                        callNext();
                    }
                    this.state.toornamentHelper.getOrganizerMatchGames(this.state.apiKey, this.state.tournamentId, matchId, callback)
                };
                // callNext();
            }

            this.state.toornamentHelper.getOrganizerRounds(this.state.apiKey, this.state.tournamentId, this.state.stageId, (results: any[]) => {
                let currentIndex = 0;
                console.log('rounds', results);

                const callNext = () => {
                    if (currentIndex >= results.length) {
                        return;
                    }

                    const roundId = results[currentIndex].id;
                    const callback = (result: any) => {
                        console.log(`nodes from round ${roundId}`, result);
                        currentIndex++;
                        callNext();
                    }

                    this.state.toornamentHelper.getOrganizerBracketNodes(this.state.apiKey, this.state.tournamentId, this.state.stageId, roundId, callback)
                };

                callNext();
            });
            // this.state.toornamentHelper.getOrganizerStages(this.state.apiKey, this.state.tournamentId);
            // this.state.toornamentHelper.getOrganizerTournament(this.state.apiKey, this.state.tournamentId);
            this.state.toornamentHelper.getOrganizerMatches(this.state.apiKey, this.state.tournamentId, this.state.stageId, matchesCallback);

        */
        }
    }

    render() {
        const { classes } = this.props;
        
        return (
            <div className={classes.root}>
                <CssBaseline />
                <AppBar
                    position="fixed"
                    className={classes.appBar}
                >
                    <Toolbar variant='dense'>
                        <Typography variant="h6" noWrap>
                            Toornament Smart Schedule
                        </Typography>
                    </Toolbar>
                </AppBar>
                <main
                    className={classes.content}
                >
                    <ScheduleStepper toornamentHelper={this.state.toornamentHelper} />
                </main>
            </div>
        );
    }
}

export default withStyles(styles)(App);
