export default interface ScheduleRound {
    id: string;
    groupId: string;
    name: string;
    number: number;
    size: number;
    scheduledAt: Date | null;
    roundLength: number;
}