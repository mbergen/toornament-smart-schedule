import React from 'react';
import { styled } from '@mui/material/styles';
import { Typography, AppBar, Toolbar, Paper, IconButton, Grid, Tooltip } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import ToornamentHelper from '../ToornamentHelper';
import ScheduleStepper from '../components/ScheduleStepper';

interface AppState {
    toornamentHelper: ToornamentHelper;
}

interface SmartScheduleRootProps {
    toggleDarkMode: () => void;
    darkMode: boolean;
}

export default class SmartScheduleRoot extends React.Component<SmartScheduleRootProps, AppState> {
    constructor(props: SmartScheduleRootProps) {
        super(props);

        this.state = {
            toornamentHelper: new ToornamentHelper(),
        };
    }

    render() {
        return (
            <React.Fragment>
                <AppBar position='fixed'>
                    <Toolbar variant='dense'>
                        <Tooltip title={`v${process.env.REACT_APP_VERSION}`}>
                            <Typography variant='h6' noWrap sx={{ flexGrow: 1 }}>
                                Toornament Smart Schedule
                            </Typography>
                        </Tooltip>
                        <Tooltip title={'Toggle Dark Mode'}>
                            <IconButton onClick={this.props.toggleDarkMode} color='inherit'>
                                {this.props.darkMode ? <Brightness4Icon /> : <DarkModeIcon />}
                            </IconButton>
                        </Tooltip>
                    </Toolbar>
                </AppBar>
                <Paper
                    component='main'
                    elevation={4}
                    sx={{
                        margin: 'auto',
                        maxWidth: 1064,
                        padding: 3,
                        marginTop: 8,
                    }}
                >
                    <ScheduleStepper toornamentHelper={this.state.toornamentHelper} />
                </Paper>
            </React.Fragment>
        );
    }
}
