import moment from 'moment';

const accessTokenItemName = 'tss_t_at';
const expireDateItemName = 'tss_t_ed';
const apiKeyItemName = 'tss_t_ak';

export interface ToornamentToken {
    accessToken: string;
    expireDate: Date;
}

export default class ToornamentHelper {
    private apiKey: string | null;
    private token: ToornamentToken | null;

    constructor() {
        this.apiKey = this.readApiKey();
        this.token = this.readToken();
    }

    public getToken(clientId: string, clientSecret: string, callback: () => void) {
        if (this.apiKey == null) {
            return false;
        }

        let request = new XMLHttpRequest();
        request.open('POST', 'https://api.toornament.com/oauth/v2/token');
        request.setRequestHeader('X-Api-Key', this.apiKey);
        request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        request.addEventListener('load', (_) => {
            const result = JSON.parse(request.responseText);
            this.updateToken(result.access_token, result.expires_in);
            callback();
        });
        const body = `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}&scope=organizer:result`;
        request.send(body);
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

    private readApiKey(): string | null {
        return sessionStorage.getItem(apiKeyItemName);
    }

    public updateApiKey(apiKey: string) {
        if (apiKey === '') {
            this.apiKey = null;
            sessionStorage.removeItem(apiKeyItemName);
            return;
        }

        this.apiKey = apiKey;
        sessionStorage.setItem(apiKeyItemName, apiKey);
    }

    public hasApiKey() {
        return this.apiKey != null && this.apiKey !== '';
    }

    public getApiKey(): string | null {
        return this.apiKey;
    }

    private updateToken(newToken: string, expiresIn: number) {
        const expireMoment = moment().add(expiresIn, 'minutes');
        const expireDate = expireMoment.toDate();
        sessionStorage.setItem(accessTokenItemName, newToken);
        sessionStorage.setItem(expireDateItemName, JSON.stringify(expireDate));
        this.token = { accessToken: newToken, expireDate: expireDate };
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

    public rangedToornamentGETAPICall(
        ressource: string,
        paginationIdentifier: string,
        callback: (result: any[]) => void,
        viewerCall: boolean = false,
        customHeaders: { name: string; value: string }[] = [],
        maxResults: number = -1,
        rangeWidth: number = 50
    ): boolean {
        if (this.apiKey == null) {
            return false;
        }

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
                    this.makePagedAPIGETCall(
                        ressource,
                        paginationIdentifier,
                        minRange + rangeOffset,
                        maxRange + rangeOffset,
                        apiCallback,
                        viewerCall,
                        customHeaders
                    );
                }
            } else {
                console.error(result);
            }
        };
        this.makePagedAPIGETCall(
            ressource,
            paginationIdentifier,
            minRange,
            maxRange,
            apiCallback,
            viewerCall,
            customHeaders
        );

        return true;
    }

    private makePagedAPIGETCall(
        ressource: string,
        paginationIdentifier: string,
        rangeMin: number,
        rangeMax: number,
        callback: (result: any, status: number, remainingItems: number) => void,
        viewerCall: boolean = true,
        customHeaders: { name: string; value: string }[] = []
    ) {
        if (this.apiKey == null) {
            return false;
        }

        let request = new XMLHttpRequest();
        const endpoint = `https://api.toornament.com/${viewerCall ? 'viewer' : 'organizer'}/v2${ressource}`;
        request.open('GET', endpoint);
        request.setRequestHeader('X-Api-Key', this.apiKey);

        if (!viewerCall) {
            if (!this.tokenIsValid()) {
                throw new Error('Access Token invalid. Create new Token.');
            }

            request.setRequestHeader('Authorization', `Bearer ${this.token!.accessToken}`);
        }

        request.setRequestHeader('Range', `${paginationIdentifier}=${rangeMin}-${rangeMax}`);
        customHeaders.forEach((header) => request.setRequestHeader(header.name, header.value));
        request.addEventListener('load', (_) => {
            if (request.status >= 200 && request.status < 300) {
                const result = JSON.parse(request.responseText);
                const remainingItems = result.length >= 50 ? 50 : 0;
                callback(result, request.status, remainingItems);
            } else if (request.status) {
                callback([], 200, 0);
            } else {
                callback(request.statusText, request.status, NaN);
            }
        });
        request.send();
    }

    private makeAPIGETCall(
        ressource: string,
        callback: (result: any, status: number) => void,
        viewerCall: boolean = true,
        customHeaders: { name: string; value: string }[] = []
    ) {
        if (this.apiKey == null) {
            return false;
        }

        let request = new XMLHttpRequest();
        const endpoint = `https://api.toornament.com/${viewerCall ? 'viewer' : 'organizer'}/v2${ressource}`;
        request.open('GET', endpoint);
        request.setRequestHeader('X-Api-Key', this.apiKey);

        if (!viewerCall) {
            if (!this.tokenIsValid()) {
                throw new Error('Access Token invalid. Create new Token.');
            }

            request.setRequestHeader('Authorization', `Bearer ${this.token!.accessToken}`);
        }

        customHeaders.forEach((header) => request.setRequestHeader(header.name, header.value));
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

    public getOrganizerMatches(tournamentId: string, stageId: string, callback: (results: any[]) => void) {
        let ressource = `/tournaments/${tournamentId}/matches?stage_ids=${stageId}`;
        this.rangedToornamentGETAPICall(ressource, 'matches', callback);
    }

    public getOrganizerRounds(tournamentId: string, stageId: string, callback: (result: any) => void) {
        let ressource = `/tournaments/${tournamentId}/rounds?stage_ids=${stageId}`;
        this.rangedToornamentGETAPICall(ressource, 'rounds', callback, false);
    }

    public getOrganizerStages(tournamentId: string, callback: (result: any) => void) {
        let ressource = `/tournaments/${tournamentId}/stages`;
        this.makeAPIGETCall(ressource, callback, false);
    }

    public getOrganizerTournament(tournamentId: string) {
        let ressource = `/tournaments/${tournamentId}`;
        this.makeAPIGETCall(
            ressource,
            (result) => {
                console.log(result);
            },
            false
        );
    }

    public getOrganizerMatchGames(tournamentId: string, matchId: string, callback: (result: any) => void) {
        let ressource = `/tournaments/${tournamentId}/matches/${matchId}/games`;
        this.rangedToornamentGETAPICall(ressource, 'games', callback, false);
    }

    public getBracketNodes(tournamentId: string, stageId: string, callback: (result: any) => void) {
        let ressource = `/tournaments/${tournamentId}/stages/${stageId}/bracket-nodes`;
        this.rangedToornamentGETAPICall(ressource, 'nodes', callback, true);
    }

    public getOrganizerGroups(tournamentId: string, stageId: string, callback: (result: any) => void) {
        let ressource = `/tournaments/${tournamentId}/groups?stage_ids=${stageId}`;
        this.rangedToornamentGETAPICall(ressource, 'groups', callback, false);
    }

    public scheduleMatch(
        tournamentId: string,
        matchId: string,
        date: Date,
        callback: (result: any, requestStatus: number) => void
    ) {
        if (this.apiKey == null) {
            return false;
        }

        const ressource = `https://api.toornament.com/organizer/v2/tournaments/${tournamentId}/matches/${matchId}`;
        const requestBody = { scheduled_datetime: moment(date).format('YYYY-MM-DDTHH:mm:ssZ') }; // 2015-12-31T00:00:00+00:00
        let request = new XMLHttpRequest();
        request.open('PATCH', ressource);
        request.setRequestHeader('X-Api-Key', this.apiKey);

        if (!this.tokenIsValid()) {
            throw new Error('Access Token invalid. Create new Token.');
        }

        request.setRequestHeader('Authorization', `Bearer ${this.token!.accessToken}`);
        request.addEventListener('load', () => {
            if (request.status >= 200 && request.status < 300) {
                const result = JSON.parse(request.responseText);
                callback(result, request.status);
            } else {
                callback(request.statusText, request.status);
            }
        });

        request.send(JSON.stringify(requestBody));
    }
}
