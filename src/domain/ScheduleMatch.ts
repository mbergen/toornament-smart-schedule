import ScheduleMatchOpponent from "./ScheduleMatchOpponent";
import ScheduleParticipant from "./ScheduleParticipant";


export default interface ScheduleMatch {
    id: string;
    roundId: string;
    groupId: string;
    numberOfGames: number;
    scheduledAt: Date | null;
    opponents: ScheduleMatchOpponent[];
    participants: ScheduleParticipant[];
}