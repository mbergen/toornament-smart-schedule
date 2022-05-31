import { createTheme, Paper, Theme } from '@mui/material';
import { ThemeProvider } from '@mui/styles';
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

        this.lightTheme = createTheme();
        this.darkTheme = createTheme({
            palette: {
                mode: 'dark',
            },
        });

        this.state = {
            useDarkMode: this.isDarkModeEnabled(),
        };

        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', this.updateDarkMode);
    }

    isDarkModeEnabled(): boolean {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    updateDarkMode = (event: MediaQueryListEvent) => {
        const browserIsInDarkMode = event.matches;

        if (browserIsInDarkMode !== this.state.useDarkMode) {
            this.setState({ useDarkMode: browserIsInDarkMode });
        }
    };

    render() {
        return (
            <ThemeProvider theme={this.state.useDarkMode ? this.darkTheme : this.lightTheme}>
                <SmartScheduleRoot />
            </ThemeProvider>
        );
    }
}
