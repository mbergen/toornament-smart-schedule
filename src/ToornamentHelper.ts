import moment from 'moment';

const accessTokenItemName = 'tss_t_at';
const expireDateItemName = 'tss_t_ed';

export interface ToornamentToken {
    accessToken: string;
    expireDate: Date;
}

export default class ToornamentHelper {
    private token: ToornamentToken | null;

    constructor() {
        this.token = this.readToken();
    }

    public getToken(apiKey: string, clientId: string, clientSecret: string) {
        let request = new XMLHttpRequest();
        request.open('POST', 'https://api.toornament.com/oauth/v2/token');
        request.setRequestHeader('X-Api-Key', apiKey);
        request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        request.addEventListener('load', (event) => {
            const result = JSON.parse(request.responseText);
            this.updateToken(result.access_token, result.expires_in);
        });
        const body = `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}&scope=organizer:result`
        request.send(body)
    }

    private readToken(): ToornamentToken | null {
        const token = sessionStorage.getItem(accessTokenItemName);
        if (token == null) {
            return null;
        }

        const expireDateString = sessionStorage.getItem(expireDateItemName);
        if (expireDateString == null) {
            return null;
        }

        const expireDate: Date = JSON.parse(expireDateString);
        return { accessToken: token, expireDate: expireDate };
    }

    private updateToken(newToken: string, expiresIn: number) {
        const expireMoment = moment().add(expiresIn, 'minutes');
        const expireDate = expireMoment.toDate();
        sessionStorage.setItem(accessTokenItemName, newToken);
        sessionStorage.setItem(expireDateItemName, JSON.stringify(expireDate));
        this.token = { accessToken: newToken, expireDate: expireDate }
    }

    public rangedToornamentGETAPICall(ressource: string, apiKey: string, paginationIdentifier: string, callback: (result: any[]) => void, viewerCall: boolean = false,
        customHeaders: { name: string, value: string }[] = [], maxResults: number = -1, rangeWidth: number = 50): void {

        if (!viewerCall && !this.tokenIsValid()) {
            throw new Error('Access Token invalid. Create new Token.');
        }

        if (!ressource.startsWith('/')) {
            ressource = '/' + ressource;
        }

        const minRange = 0;
        const maxRange = rangeWidth - 1;
        const rangeStep = rangeWidth;
        let rangeOffset = 0;

        const finalResult: any[] = [];
        const apiCallback = (result: any, status: number, remainingItems: number) => {
            if (status >= 200 && status < 300) {
                finalResult.push(...result);

                if (remainingItems <= 0 || (result.length >= maxResults && maxResults > 0)) {
                    callback(finalResult);
                } else {
                    rangeOffset += rangeStep;
                    this.makePagedAPIGETCall(ressource, apiKey, paginationIdentifier, minRange + rangeOffset, maxRange + rangeOffset, apiCallback, viewerCall, customHeaders);
                }
            } else {
                console.error(result);
            }
        };
        this.makePagedAPIGETCall(ressource, apiKey, paginationIdentifier, minRange, maxRange, apiCallback, viewerCall, customHeaders);
    }

    public tokenIsValid(): boolean {
        if (this.token == null) {
            return false;
        }

        if (this.token.expireDate < new Date()) {
            return false;
        }

        return true;
    }

    private makePagedAPIGETCall(ressource: string, apiKey: string, paginationIdentifier: string, rangeMin: number, rangeMax: number,
        callback: (result: any, status: number, remainingItems: number) => void, viewerCall: boolean = true, customHeaders: { name: string, value: string }[] = []) {
        let request = new XMLHttpRequest();
        const endpoint = `https://api.toornament.com/${viewerCall ? 'viewer' : 'organizer'}/v2${ressource}`;
        request.open('GET', endpoint);
        request.setRequestHeader('X-Api-Key', apiKey);

        if (!viewerCall) {
            if (!this.tokenIsValid()) {
                throw new Error('Access Token invalid. Create new Token.');
            }

            request.setRequestHeader('Authorization', `Bearer ${this.token!.accessToken}`);
        }

        request.setRequestHeader('Range', `${paginationIdentifier}=${rangeMin}-${rangeMax}`);
        console.log(`${paginationIdentifier}=${rangeMin}-${rangeMax}`);
        customHeaders.forEach(header => request.setRequestHeader(header.name, header.value));
        request.addEventListener('load', (event) => {
            if (request.status >= 200 && request.status < 300) {
                let remainingItems = 0;
                const result = JSON.parse(request.responseText);
                const regex = /.*\s*(?<start>\d+)-(?<end>\d+)\/(?<total>\d+)/;
                const contentRangeHeader = request.getResponseHeader('Content-Range');
                if (contentRangeHeader != null) {
                    const contentRange = contentRangeHeader.match(regex);
                    if (contentRange != null && contentRange.length >= 4) {
                        const endIndex = Number(contentRange.groups!['end']);
                        const totalItems = Number(contentRange.groups!['total']);
                        remainingItems = Math.max(remainingItems, totalItems - endIndex - 1);
                    }
                } else {
                    remainingItems = result.length >= 50 ? 50 : 0;
                    console.log(result.length, result);
                }

                callback(result, request.status, remainingItems);
            } else {
                callback(request.statusText, request.status, NaN);
            }
        });
        request.send();
    }

    private makeAPIGETCall(ressource: string, apiKey: string, callback: (result: any, status: number) => void, viewerCall: boolean = true, 
        customHeaders: { name: string, value: string }[] = []) {
        let request = new XMLHttpRequest();
        const endpoint = `https://api.toornament.com/${viewerCall ? 'viewer' : 'organizer'}/v2${ressource}`;
        request.open('GET', endpoint);
        request.setRequestHeader('X-Api-Key', apiKey);

        if (!viewerCall) {
            if (!this.tokenIsValid()) {
                throw new Error('Access Token invalid. Create new Token.');
            }

            request.setRequestHeader('Authorization', `Bearer ${this.token!.accessToken}`);
        }

        customHeaders.forEach(header => request.setRequestHeader(header.name, header.value));
        request.addEventListener('load', (event) => {
            if (request.status >= 200 && request.status < 300) {
                const result = JSON.parse(request.responseText);
                callback(result, request.status);
            } else {
                callback(request.statusText, request.status);
            }
        });
        request.send();
    }

    public getOrganizerMatches(apiKey: string, tournamentId: string, stageId: string) {
        let ressource = `/tournaments/${tournamentId}/matches?stage_ids=${stageId}`
        this.rangedToornamentGETAPICall(ressource, apiKey, 'matches', (result) => {
            console.log(result);
            const matchId = result[0].id;
            let ressource2 = `/tournaments/${tournamentId}/matches/${matchId}`
            this.makeAPIGETCall(ressource2, apiKey, (result) => {
                console.log(result);
            });
        });
    }

    public getOrganizerRounds(apiKey: string, tournamentId: string, stageId: string) {
        let ressource = `/tournaments/${tournamentId}/rounds?stage_ids=${stageId}`
        this.rangedToornamentGETAPICall(ressource, apiKey, 'rounds', (result) => {
            console.log(result);
        }, false);
    }

    public getOrganizerStages(apiKey: string, tournamentId: string) {
        let ressource = `/tournaments/${tournamentId}/stages`
        this.makeAPIGETCall(ressource, apiKey, (result) => {
            console.log(result);
        }, false);
    }

    public getOrganizerTournament(apiKey: string, tournamentId: string) {
        let ressource = `/tournaments/${tournamentId}`
        this.makeAPIGETCall(ressource, apiKey, (result) => {
            console.log(result);
        }, false);
    }
}