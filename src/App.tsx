import { createTheme, CssBaseline, Theme } from '@mui/material';
import { ThemeProvider } from '@mui/styles';
import React from 'react';
import SmartScheduleRoot from './components/SmartScheduleRoot';

export default class App extends React.Component<any, any> {
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
    }

    render() {
        return (
            <ThemeProvider theme={this.darkTheme}>
                <SmartScheduleRoot />
            </ThemeProvider>
        );
    }
}
