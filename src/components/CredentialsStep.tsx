import React from 'react';
import { styled } from '@mui/material/styles';
import { Typography, Button, TextField, Grid } from '@mui/material';
import ToornamentHelper from '../ToornamentHelper';
const PREFIX = 'CredentialsStep';

const classes = {
    textField: `${PREFIX}-textField`,
    button: `${PREFIX}-button`,
};

const StyledGrid = styled(Grid)(({ theme }) => ({
    [`& .${classes.textField}`]: {
        marginTop: theme.spacing(1),
        marginBottom: theme.spacing(1),
    },

    [`& .${classes.button}`]: {
        marginTop: theme.spacing(1),
        marginBottom: theme.spacing(1),
    },
}));

interface CredentialsStepState {
    apiKey: string;
    clientId: string;
    clientSecret: string;
}

interface CredentialsStepProps {
    toornamentHelper: ToornamentHelper;
    credentialsUpdated: () => void;
    classes?: any;
}

export default class CredentialsStep extends React.Component<CredentialsStepProps, CredentialsStepState> {
    constructor(props: CredentialsStepProps) {
        super(props);

        this.state = {
            apiKey: props.toornamentHelper.getApiKey() || '',
            clientId: '',
            clientSecret: '',
        };
    }

    handleChangeApiKey = (event: any) => {
        this.props.toornamentHelper.updateApiKey(event.target.value);
        this.setState({ apiKey: event.target.value });
        this.props.credentialsUpdated();
    };

    handleChangeClientId = (event: any) => {
        this.setState({ clientId: event.target.value });
    };

    handleChangeClientSecret = (event: any) => {
        this.setState({ clientSecret: event.target.value });
    };

    requestToken = () => {
        if (!this.props.toornamentHelper.tokenIsValid()) {
            const callback = () => {
                this.props.credentialsUpdated();
            };
            this.props.toornamentHelper.getToken(this.state.clientId, this.state.clientSecret, callback);
        }
    };

    render() {
        return (
            <StyledGrid container direction='column'>
                <TextField
                    label='Api Key'
                    className={classes.textField}
                    value={this.state.apiKey}
                    onChange={this.handleChangeApiKey}
                    error={this.props.toornamentHelper.getApiKey() == null}
                    helperText={this.props.toornamentHelper.getApiKey() == null ? 'You must specify an api key' : ''}
                    margin='dense'
                />
                <TextField
                    label='Client Id'
                    className={classes.textField}
                    value={this.state.clientId}
                    onChange={this.handleChangeClientId}
                    margin='dense'
                />
                <TextField
                    label='Client Secret'
                    className={classes.textField}
                    value={this.state.clientSecret}
                    onChange={this.handleChangeClientSecret}
                    margin='dense'
                />
                <div>
                    <Button
                        variant='contained'
                        color={!this.props.toornamentHelper.tokenIsValid() ? 'primary' : 'inherit'}
                        className={classes.button}
                        onClick={this.requestToken}
                    >
                        Request Token
                    </Button>
                </div>
                <Typography hidden={this.props.toornamentHelper.tokenIsValid()}>
                    You must request a token to proceed.
                </Typography>
            </StyledGrid>
        );
    }
}
