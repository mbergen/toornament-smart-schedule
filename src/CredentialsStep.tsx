import React from 'react';
import { Typography, Button, withStyles, createStyles, Theme, TextField, Grid } from '@material-ui/core';
import ToornamentHelper from './ToornamentHelper';

const styles = (theme: Theme) => createStyles({
    textField: {
        margin: theme.spacing(1),
    },
    button: {
        marginLeft: theme.spacing(2),
        marginTop: theme.spacing(1),
        marginRight: theme.spacing(2),
        marginBottom: theme.spacing(1),
    }
})

interface CredentialsStepState {
    apiKey: string,
    clientId: string,
    clientSecret: string,
}

interface CredentialsStepProps {
    toornamentHelper: ToornamentHelper;
    credentialsUpdated: () => void;
    classes?: any;
}

class CredentialsStep extends React.Component<CredentialsStepProps, CredentialsStepState> {
    constructor(props: CredentialsStepProps) {
        super(props);

        this.state = {
            apiKey: props.toornamentHelper.getApiKey() || '',
            clientId: '',
            clientSecret: '',
        }
    }

    handleChangeApiKey = (event: any) => {
        this.props.toornamentHelper.updateApiKey(event.target.value);
        this.setState({ apiKey: event.target.value });
        this.props.credentialsUpdated();
    }

    handleChangeClientId = (event: any) => {
        this.setState({ clientId: event.target.value });
    }

    handleChangeClientSecret = (event: any) => {
        this.setState({ clientSecret: event.target.value });
    }

    requestToken = () => {
        if (!this.props.toornamentHelper.tokenIsValid()) {
            const callback = () => {
                this.props.credentialsUpdated();
            }
            this.props.toornamentHelper.getToken(this.state.clientId, this.state.clientSecret, callback);
        }
    }

    render() {
        const { classes } = this.props;

        return (
            <Grid
                container
                direction='column'
            >
                <TextField
                    label='Api Key'
                    className={classes.textField}
                    value={this.state.apiKey}
                    onChange={this.handleChangeApiKey}
                    margin='dense'
                    variant='outlined'
                />
                <Typography
                    hidden={this.props.toornamentHelper.getApiKey() != null}
                >Enter your Api Key!</Typography>
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
                <Button
                    variant='contained'
                    color='primary'
                    className={classes.button}
                    onClick={this.requestToken}
                >
                    Request Token
                </Button>
                <Typography
                    hidden={this.props.toornamentHelper.tokenIsValid()}
                >Request a valid token!</Typography>
                <Typography
                    hidden={!this.props.toornamentHelper.tokenIsValid()}
                >You have a valid token, you do not need to request one!</Typography>
            </Grid>
        );
    }
}

export default withStyles(styles)(CredentialsStep);