import { createTheme, CssBaseline, Paper, Theme, ThemeProvider } from '@mui/material';
import React from 'react';
import SmartScheduleRoot from './components/SmartScheduleRoot';

interface AppState {
    useDarkMode: boolean;
}

export default class App extends React.Component<any, AppState> {
    lightTheme: Theme;
    darkTheme: Theme;

    constructor(props: any) {
        super(props);

        this.lightTheme = createTheme({
            palette: {
                mode: 'light',
            },
        });
        this.darkTheme = createTheme({
            palette: {
                mode: 'dark',
            },
        });

        this.state = {
            useDarkMode: this.isDarkModeEnabled(),
        };
    }

    isDarkModeEnabled(): boolean {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    toggleDarkMode = () => {
        console.log(this.lightTheme, this.darkTheme);
        this.setState({ useDarkMode: !this.state.useDarkMode });
    };

    render() {
        return (
            <ThemeProvider theme={this.state.useDarkMode ? this.darkTheme : this.lightTheme}>
                <CssBaseline />
                <SmartScheduleRoot toggleDarkMode={this.toggleDarkMode} darkMode={this.state.useDarkMode} />
            </ThemeProvider>
        );
    }
}
