import { BracketType } from "./BracketType";
import MatchLengthSettings from "./MatchLenthSettings";
import SchedulePhase from "./SchedulePhase";


export default interface ScheduleConfig {
    schedulingMode: SchedulingMode;
    bracketType: BracketType;
    matchLengthSettings: MatchLengthSettings[];
    phases: SchedulePhase[];
}

export enum SchedulingMode {
    Monthly = 'Monthly',
    Weekly = 'Weekly',
    Daily = 'Daily',
    Direct = 'Direct',
}