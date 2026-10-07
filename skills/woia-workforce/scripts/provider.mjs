import {begin,finish,requireValue,ownKeys,approval,digest} from './guard.mjs';
export const actions=["workforce.read","workforce.assignment.record","workforce.competence.record","workforce.coverage.read","workforce.coverage.update","workforce.onboarding.record","workforce.guidance.resolve","workforce.offboarding.record"];
const writes=actions.filter(a=>!["workforce.read","workforce.coverage.read","workforce.guidance.resolve"].includes(a));
export const initial=organization=>({organization,revision:0,operations:{},history:[],people:{},coverage:{}});
export function execute(state,q){const c=begin(state,q,actions,writes);if(c.replay)return {state:c.next,result:c.replay};
 const people=c.next.people??={};const coverage=c.next.coverage??={};let r=people[q.target];
 if(q.action==='workforce.coverage.read')return finish(c,q,structuredClone(coverage[q.target]??null));
 if(q.action==='workforce.read'){requireValue(r,'WORKFORCE_NOT_FOUND');return finish(c,q,structuredClone(r))}
 if(q.action==='workforce.guidance.resolve'){requireValue(q.authority.department==='People'&&q.payload?.knowledge_ref&&q.payload?.published_version&&q.authority.knowledge_binding?.reference===q.payload.knowledge_ref&&q.authority.knowledge_binding?.version===q.payload.published_version&&q.authority.knowledge_binding?.published===true,'APPROVED_KNOWLEDGE_REFERENCE_REQUIRED');return finish(c,q,{knowledge_ref:q.payload.knowledge_ref,published_version:q.payload.published_version,corpus_copied:false,authority_granted:false})}
 requireValue(q.authority.department==='People','PEOPLE_ONLY');
 if(q.action==='workforce.coverage.update'){ownKeys(q.payload,['purpose','person_ids','effective_from','effective_to']);requireValue(q.payload.purpose&&Array.isArray(q.payload.person_ids)&&q.payload.person_ids.every(id=>people[id]?.active&&q.authority.resources.includes(id))&&q.payload.effective_from,'COVERAGE_SCOPE');coverage[q.target]=structuredClone(q.payload);return finish(c,q,coverage[q.target])}
 if(q.action==='workforce.onboarding.record'){ownKeys(q.payload,['person_ref','effective_at']);requireValue(q.payload.person_ref===q.target&&q.payload.effective_at&&q.authority.identity_verified===true,'SHARED_PERSON_REQUIRED');requireValue(!r,'WORKFORCE_EXISTS');r=people[q.target]={person_ref:q.target,active:true,assignments:[],competence:[],onboarded_at:q.payload.effective_at};}
 else {requireValue(r,'WORKFORCE_NOT_FOUND');
 if(q.action==='workforce.offboarding.record'){ownKeys(q.payload,['effective_at']);requireValue(q.payload.effective_at,'EFFECTIVE_TIME_REQUIRED');r.active=false;r.offboarded_at=q.payload.effective_at;r.technology_contribution={action:'technology.access.revoke',person_ref:q.target,status:'REQUIRED_NOT_EXECUTED'};}
 else {requireValue(r.active,'WORKFORCE_INACTIVE');if(q.action==='workforce.assignment.record'){ownKeys(q.payload,['purpose','role','effective_from','effective_to']);requireValue(q.payload.purpose&&q.payload.role&&q.payload.effective_from,'ASSIGNMENT_REQUIRED');r.assignments.push({...q.payload,evidence:q.evidence})}else {ownKeys(q.payload,['competence','evidence_ref']);requireValue(q.payload.competence&&q.payload.evidence_ref,'COMPETENCE_EVIDENCE_REQUIRED');r.competence.push({...q.payload,authority_granted:false})}}}
 return finish(c,q,structuredClone(r));
}
