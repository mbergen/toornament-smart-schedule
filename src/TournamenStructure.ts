import { ScheduleRound, ScheduleGroup, ScheduleMatch, BracketType } from "./ScheduleStepper";
import { MatchLengthSettings, SchedulePhase, SchedulingMode, ScheduleConfig } from "./ConfigurationStep";
import moment from 'moment';


interface RoundDependency {
    roundId: string;
    precedingRoundIds: string[];
    followingRoundIds: string[];
}

export default class TournamentStructure {
    private rounds: ScheduleRound[];
    private groups: ScheduleGroup[];
    private matches: ScheduleMatch[];
    private bracketType: BracketType;

    private roundDependencies: RoundDependency[];

    constructor(rounds: ScheduleRound[], groups: ScheduleGroup[], matches: ScheduleMatch[], bracketType: BracketType) {
        this.rounds = rounds;
        this.groups = groups;
        this.matches = matches;
        this.bracketType = bracketType;
        this.roundDependencies = [];
        this.createDependencies();
    }

    private createDependencies() {
        this.matches.forEach((match, index) => {
            let dependencyIndex = this.roundDependencies.findIndex(dep => dep.roundId == match.roundId);
            if (dependencyIndex < 0) {
                dependencyIndex = this.roundDependencies.length;
                this.roundDependencies.push({
                    roundId: match.roundId,
                    precedingRoundIds: [],
                    followingRoundIds: [],
                });
            }

            const dependency = this.roundDependencies[dependencyIndex];
            const precedingRoundIds: string[] = [];
            const sourceNodeIds = match.opponents.map(opp => opp.sourceNodeId).filter(s => s != null);

            sourceNodeIds.forEach(nodeId => {
                const source = this.matches.find(match => match.id == nodeId);
                if (source != undefined && dependency.precedingRoundIds.findIndex(id => id == source.roundId) < 0
                    && precedingRoundIds.findIndex(id => id == source.roundId) < 0) {
                    precedingRoundIds.push(source.roundId);
                }
            });

            let followingRoundIds = this.roundDependencies.filter(dep => dep.precedingRoundIds.findIndex(id => id == match.roundId) >= 0)
                .map(dep => dep.roundId);
            followingRoundIds = followingRoundIds.filter(id => dependency.followingRoundIds.findIndex(dId => id == dId) < 0);

            this.roundDependencies[dependencyIndex].precedingRoundIds.push(...precedingRoundIds);
            this.roundDependencies[dependencyIndex].followingRoundIds.push(...followingRoundIds);

            precedingRoundIds.forEach(id => {
                const depIndex = this.roundDependencies.findIndex(d => d.roundId == id);
                if (depIndex >= 0 && this.roundDependencies[depIndex].followingRoundIds.findIndex(fId => fId == match.roundId) < 0) {
                    this.roundDependencies[depIndex].followingRoundIds.push(match.roundId);
                }
            });

            this.roundDependencies[dependencyIndex] = dependency
        });
    }

    public getRounds(): ScheduleRound[] {
        return this.rounds;
    }

    public getMatches(): ScheduleMatch[] {
        return this.matches;
    }

    public getGroups(): ScheduleGroup[] {
        return this.groups;
    }

    public getFirstRounds(): ScheduleRound[] {
        const rounds: ScheduleRound[] = [];
        switch (this.bracketType) {
            case BracketType.Bracket:
                let roundDeps = this.roundDependencies.filter(roundDep => roundDep.precedingRoundIds.length == 0);
                roundDeps.forEach(roundDep => {
                    const round = this.rounds.find(round => round.id == roundDep.roundId);
                    if (round != undefined) {
                        rounds.push(round);
                    }
                });
                break;
            default:
            case BracketType.Rounds:
                this.groups.forEach(group => {
                    const firstRound = this.rounds.find(round => round.groupId == group.id);
                    if (firstRound != undefined) {
                        rounds.push(firstRound);
                    }
                })
                break;
        }
        return rounds;
    }

    public getFollowingRounds(roundId: string): ScheduleRound[] {
        const roundDep = this.roundDependencies.find(rDep => rDep.roundId == roundId);
        if (roundDep == undefined) {
            return [];
        }

        const result = this.rounds.filter(round => roundDep.followingRoundIds.findIndex(rId => rId == round.id) >= 0);
        return result;
    }

    public getPrecedingRounds(roundId: string): ScheduleRound[] {
        let result: ScheduleRound[] = [];
        switch (this.bracketType) {
            case BracketType.Bracket:
                const roundDep = this.roundDependencies.find(rDep => rDep.roundId == roundId);
                if (roundDep == undefined) {
                    break;
                }

                result = this.rounds.filter(round => roundDep.precedingRoundIds.findIndex(rId => rId == round.id) >= 0);
                break;
            case BracketType.Rounds:
            default:
                const roundsByGroup = this.groups.map(group => {
                    return this.rounds.filter(round => round.groupId == group.id);
                });
                roundsByGroup.forEach(rounds => {
                    const roundIndex = rounds.findIndex(round => round.id == roundId);
                    if (roundIndex > 0) {
                        result.push(rounds[roundIndex - 1]);
                    }
                })
                break;
        }

        return result;
    }

    public getLastRounds() {
        return this.rounds.filter(round => this.roundDependencies.findIndex(rDep => rDep.roundId == round.id && rDep.followingRoundIds.length == 0) >= 0);
    }

    public scheduleTournament(config: ScheduleConfig) {
        const lastRounds = this.getLastRounds();
        lastRounds.forEach(round => this.scheduleRound(round.id, config))
    }

    private scheduleRound(roundId: string, config: ScheduleConfig): Date {
        const { matchLengthSettings, phases, schedulingMode } = config;
        const roundIndex = this.rounds.findIndex(r => r.id == roundId);
        if (roundIndex < 0) {
            throw new Error('Round must be in TournamentStructure.');
        }

        const round = this.rounds[roundIndex];
        // check if round is first round of a phase
        const phase = phases.find(p => p.startingRoundId == round.id);
        const previousRounds: ScheduleRound[] = this.getPrecedingRounds(round.id);
        if (phase != undefined) {
            // return phase start date as start date
            this.rounds[roundIndex].scheduledAt = phase.startDate;
            previousRounds.forEach(r => this.scheduleRound(r.id, config));
        } else {
            // schedule round based on max of previous rounds
            if (previousRounds.length == 0) {
                // or start phase if they are first rounds
                this.rounds[roundIndex].scheduledAt = phases[0].startDate;

            } else {
                const previousDates = previousRounds.map(r => {
                    return { date: this.scheduleRound(r.id, config), round: r }
                });
                previousDates.sort((a, b) => {
                    return b.date.getTime() - a.date.getTime();
                }); // dates sorted desc
                const prevStart = moment(previousDates[0].date);
                switch (schedulingMode) {
                    case SchedulingMode.Daily: this.rounds[roundIndex].scheduledAt = prevStart.add(1, 'days').toDate();
                        break;
                    case SchedulingMode.Weekly: this.rounds[roundIndex].scheduledAt = prevStart.add(1, 'weeks').toDate();
                        break;
                    case SchedulingMode.Monthly: this.rounds[roundIndex].scheduledAt = prevStart.add(1, 'months').toDate();
                        break;
                    case SchedulingMode.Direct:
                    default:
                        const lengthSetting = matchLengthSettings.find(l => l.numberOfGames == previousDates[0].round.roundLength) || { matchLengthMin: 30, numberOfGames: 1 };
                        this.rounds[roundIndex].scheduledAt = prevStart.add(lengthSetting.matchLengthMin, 'minutes').toDate();
                        break;
                }
            }
        }

        return this.rounds[roundIndex].scheduledAt!;
    }
}