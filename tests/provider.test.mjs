import test from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {initial,execute,actions} from '../skills/woia-workforce/scripts/provider.mjs';
 const hash=p=>createHash('sha256').update(JSON.stringify(p)).digest('hex');
 const department="People";
 function request(s,action,payload,approved=false,target='subject',overrides={}){return {organization:s.organization,action,target,payload,operation_id:'op-'+s.revision,expected_revision:s.revision,evidence:{source:'synthetic-source',reference:'synthetic-reference',recorded_at:'2026-10-07T00:00:00Z'},authority:{authenticated:true,current:true,organization:s.organization,actor:'synthetic-actor',policy_revision:'synthetic-policy-1',actions,resources:['subject','other'],fields:['kind','display_name','contact_identifiers'],source_fields:['kind','display_name','contact_identifiers'],department,owner:'Synthetic owner',identity_verified:true,relationship_conflicts_checked:true,knowledge_binding:{reference:'synthetic-sop',version:'1',published:true},...(approved?{approval:{approved:true,current:true,principal:'synthetic-independent-owner',payload_digest:hash(payload),action,target,organization:s.organization,policy_revision:'synthetic-policy-1'}}:{}),...overrides}}}
 function run(s,a,p,approved=false,target='subject',overrides={}){return execute(s,request(s,a,p,approved,target,overrides))}
test('workforce lifecycle guidance coverage and competence create no powers',()=>{
 let s=run(initial('synthetic-org'),'workforce.onboarding.record',{person_ref:'subject',effective_at:'2026-10-07T00:00:00Z'}).state;
 s=run(s,'workforce.assignment.record',{purpose:'synthetic-internal',role:'synthetic-staff',effective_from:'2026-10-07'}).state;
 s=run(s,'workforce.competence.record',{competence:'synthetic-course',evidence_ref:'synthetic-record'}).state;
 s=run(s,'workforce.coverage.update',{purpose:'synthetic-internal',person_ids:['subject'],effective_from:'2026-10-07'}).state;
 assert.equal(run(s,'workforce.coverage.read',{}).result.person_ids.length,1);
 assert.equal(run(s,'workforce.read',{}).result.competence[0].authority_granted,false);
 assert.equal(run(s,'workforce.guidance.resolve',{knowledge_ref:'synthetic-sop',published_version:'1'}).result.corpus_copied,false);
 s=run(s,'workforce.offboarding.record',{effective_at:'2026-10-08'}).state;
 assert.equal(s.people.subject.active,false);assert.equal(s.people.subject.technology_contribution.status,'REQUIRED_NOT_EXECUTED');
 assert.throws(()=>run(s,'workforce.assignment.record',{purpose:'x',role:'y',effective_from:'z'}),/WORKFORCE_INACTIVE/);
});
test('workforce enforces People and identity reference without access grants',()=>{
 const s=initial('synthetic-org');
 assert.throws(()=>run(s,'workforce.onboarding.record',{person_ref:'subject',effective_at:'2026-10-07'},false,'subject',{department:'Sales'}),/PEOPLE_ONLY/);
 assert.throws(()=>run(s,'workforce.onboarding.record',{person_ref:'subject',effective_at:'2026-10-07'},false,'subject',{identity_verified:false}),/SHARED_PERSON/);
 assert.throws(()=>run(s,'workforce.onboarding.record',{person_ref:'subject',effective_at:'2026-10-07',permissions:['all']}),/UNOWNED_FIELDS/);
});
test('organization authentication action resource and provenance guards fail closed',()=>{const s=initial('synthetic-org');const q=request(s,'workforce.onboarding.record',{"person_ref":"subject","effective_at":"2026-10-07"});assert.throws(()=>execute(s,{...q,organization:'other-org'}),/ORGANIZATION_SCOPE/);for(const authority of [{...q.authority,authenticated:false},{...q.authority,revoked:true},{...q.authority,current:false},{...q.authority,hold:true}])assert.throws(()=>execute(s,{...q,authority}),/AUTHORITY_REQUIRED/);assert.throws(()=>execute(s,{...q,authority:{...q.authority,resources:[]}}),/RESOURCE_SCOPE/);assert.throws(()=>execute(s,{...q,authority:{...q.authority,actions:[]}}),/ACTION_DENIED/);assert.throws(()=>execute(s,{...q,evidence:{}}),/PROVENANCE_REQUIRED/)});
test('idempotent receipt collision and stale concurrent revision preserve original state',()=>{const s=initial('synthetic-org');const q=request(s,'workforce.onboarding.record',{"person_ref":"subject","effective_at":"2026-10-07"});const out=execute(s,q);assert.equal(s.revision,0);assert.deepEqual(execute(out.state,q),out);assert.throws(()=>execute(out.state,{...q,payload:{...q.payload,unexpected:true}}),/OPERATION_CONFLICT/);assert.throws(()=>execute(out.state,{...q,operation_id:'concurrent'}),/REVISION_CONFLICT/);assert.equal(out.state.history.length,1)});

test('caller mutation cannot alter accepted state or saved operation result',()=>{const s=initial('synthetic-org');const q=request(s,'workforce.onboarding.record',{person_ref: 'subject', effective_at: '2026-10-07'});const out=execute(s,q);const accepted=JSON.stringify(out.state);q.evidence.reference='changed-after';q.payload.injected='changed-after';if(q.payload.contact_identifiers)q.payload.contact_identifiers[0].id='changed-after';out.result.injected='changed-after';assert.equal(JSON.stringify(out.state),accepted)});
