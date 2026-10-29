export type Rule={id:string;starts_on:string;ends_on:string;skill_group_size:number;skill_group_points:number;game_points:number};
export type MappedAward={external_id:string;activity_id:string|null;kind:'skill_badge'|'game'|'other';earned_on:string|null};
export function calculatePoints(awards:MappedAward[],rule:Rule){
 const seen=new Set<string>();let skills=0,games=0,excluded=0;
 for(const a of awards){if(!a.activity_id||!a.earned_on||a.earned_on<rule.starts_on||a.earned_on>rule.ends_on||a.kind==='other'){excluded++;continue;}
 if(seen.has(a.activity_id))continue;seen.add(a.activity_id);if(a.kind==='skill_badge')skills++;else games++;}
 return {rule_version:rule.id,points:games*rule.game_points+Math.floor(skills/rule.skill_group_size)*rule.skill_group_points,skills,games,excluded,remaining_skill_badges:skills%rule.skill_group_size,estimated:true};
}
