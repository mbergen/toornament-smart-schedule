import { ScheduleRound, ScheduleGroup, ScheduleMatch } from "./ScheduleStepper";


interface RoundDependency {
    roundId: string;
    precedingRoundIds: string[];
    followingRoundIds: string[];
}

export default class TournamentStructure {
    rounds: ScheduleRound[];
    groups: ScheduleGroup[];
    matches: ScheduleMatch[];
    roundDependencies: RoundDependency[];

    constructor(rounds: ScheduleRound[], groups: ScheduleGroup[], matches: ScheduleMatch[]) {
        this.rounds = rounds;
        this.groups = groups;
        this.matches = matches;
        this.roundDependencies = [];
        this.createDependencies();
    }

    private createDependencies() {
        this.matches.forEach(match => {
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
                if (source != undefined && dependency.precedingRoundIds.findIndex(id => id == match.roundId) < 0) {
                    precedingRoundIds.push(match.roundId);
                }
            });

            let followingRoundIds = this.roundDependencies.filter(dep => dep.precedingRoundIds.findIndex(id => id == match.roundId) >= 0)
                .map(dep => dep.roundId);
            followingRoundIds = followingRoundIds.filter(id => dependency.followingRoundIds.findIndex(dId => id == dId) < 0);

            this.roundDependencies.push({
                roundId: match.roundId,
                precedingRoundIds: precedingRoundIds,
                followingRoundIds: followingRoundIds,
            });

            precedingRoundIds.forEach(id => {
                const depIndex = this.roundDependencies.findIndex(d => d.roundId == id);
                if (depIndex >= 0 && this.roundDependencies[depIndex].followingRoundIds.findIndex(fId => fId == id) < 0) {
                    this.roundDependencies[depIndex].followingRoundIds.push(id);
                }
            });

            this.roundDependencies[dependencyIndex] = dependency
        });
    }

    public getFirstRounds(): ScheduleRound[] {
        let roundDeps = this.roundDependencies.filter(roundDep => roundDep.precedingRoundIds.length == 0);
        const rounds: ScheduleRound[] = [];
        roundDeps.forEach(roundDep => {
            const round = this.rounds.find(round => round.id == roundDep.roundId);
            if (round != undefined) {
                rounds.push(round);
            }
        });
        return rounds;
    }
}