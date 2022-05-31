import { styled, Typography } from '@mui/material';
import React from 'react';
import PoweredbyToor_Black from '../assets/PoweredbyToor_Black.png'

const Root = styled('div')(({ theme }) => ({
    marginTop: theme.spacing(2)
}));

export default class Footer extends React.Component<any, any> {
    render() {
        return (
            <Root>
                <img src={PoweredbyToor_Black} style={{maxWidth: 250}} alt='Powered By Toornament'></img>
                <Typography variant='body2' color='textSecondary'>
                    v{process.env.REACT_APP_VERSION}
                </Typography>
            </Root>
        );
    }
}
