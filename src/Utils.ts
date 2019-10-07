import ToornamentHelper from "./ToornamentHelper";
import { ScheduleRound, ScheduleMatch, ScheduleGroup } from "./ScheduleStepper";
import { SchedulingMode } from "./ConfigurationStep";

export function fetchStageData(tournamentId: string, stageId: string, toornamentHelper: ToornamentHelper, mode: SchedulingMode,
    callback: (rounds: ScheduleRound[], matches: ScheduleMatch[], groups: ScheduleGroup[]) => void) {

    let roundsFinished = false;
    let matchesFinished = false;
    let groupsFinished = false;
    let rounds: ScheduleRound[] = [];
    let matches: ScheduleMatch[] = [];
    let groups: ScheduleGroup[] = [];
    
    toornamentHelper.getOrganizerRounds(tournamentId, stageId, (results: any[]) => {
        rounds = results.map(result => {
            return {
                id: result.id,
                groupId: result.group_id,
                name: result.name,
                number: result.number,
                size: result.settings.size,
                scheduledAt: null,
                roundLength: 1,
            };
        });

        if (matchesFinished && groupsFinished) {
            callback(rounds, matches, groups);
        }
        else {
            roundsFinished = true;
        }
    });

    toornamentHelper.getOrganizerMatches(tournamentId, stageId, (matchResults: any[]) => {
        matches = matchResults.map(result => {
            return {
                id: result.id,
                groupId: result.group_id,
                roundId: result.round_id,
                numberOfGames: 0,
                opponents: []
            }
        });

        let currentIndex = 0;
        const finishMatches = () => {
            if (roundsFinished && groupsFinished) {
                callback(rounds, matches, groups);
            }
            else {
                matchesFinished = true;
            }
        }

        const getNodes = () => {
            toornamentHelper.getBracketNodes(tournamentId, stageId, (results: any[]) => {
                results.forEach((result, index) => {
                    let match = matches[index];

                    if (match == null || match.id != result.id) {
                        const matchIndex = matches.findIndex(m => m.id == result.id);
                        if (matchIndex < 0) {
                            return;
                        }
                        match = matches[matchIndex];
                    }

                    match.opponents = result.opponents.map((opponent: any) => {
                        return {
                            number: opponent.number,
                            sourceType: opponent.source_type,
                            sourceNodeId: opponent.source_node_id,
                        };
                    });
                });
                finishMatches();
            });
        }

        const callNext = () => {
            if (currentIndex >= matches.length) {
                getNodes();
                return;
            }

            const matchId = matches[currentIndex].id;
            const callback = (results: any[]) => {
                matches[currentIndex].numberOfGames = results.length
                callNext();
            }
            toornamentHelper.getOrganizerMatchGames(tournamentId, matchId, callback)
        };

        callNext();
    });

    toornamentHelper.getOrganizerGroups(tournamentId, stageId, (results: any[]) => {
        groups = results.map(result => {
            return {
                id: result.id,
                name: result.name,
                number: result.number,
            };
        });

        if (roundsFinished && matchesFinished) {
            callback(rounds, matches, groups);
        }
        else {
            groupsFinished = true;
        }
    });
}