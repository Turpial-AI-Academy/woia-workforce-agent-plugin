# woia-workforce operation contract

Sources: Real Estate ADR-0026, ADR-0027, ADR-0029, ADR-0030; docs21/22/24/25 at eb0a7278188b2f9968e21ed4299f08184d864cac.

Shared Person IDs come from Identity; employee is contextual. Assignment and competence never grant authority; access apply/revoke remains Technology. Guidance resolves approved Knowledge references. Offboarding ends contextual eligibility without claiming permission revocation.

## Execution

The portable scripts/provider.mjs exports initial(organization), actions and execute(state, request). It computes a new serializable state without mutating the input. Authenticated host must provide current exact authority, policy revision, resource list, source-authorized fields and scoped evidence. Request assertions are not authentication: untrusted callers must never mint the authority object. A qualified host must read authoritative policy/identity, persist state+history+operation receipt atomically with compare-and-swap on revision, fence concurrent writers and retry CAS conflicts by recomputing from current state. In-memory return is not durable acceptance. No storage service, credentials, policy values or external adapter is selected/qualified here.

Operation IDs bind action/target/payload/evidence; exact replay returns the original result, changed replay fails. Organization/authority are revalidated even for replay. Historical accepted state remains externally representable; no prompt/chat master. Protected owner approval is bound to payload digest and current policy revision with a distinct principal. Clock validity and revocations must be resolved by the trusted host before marking authority current.

## Actions

- workforce.read
- workforce.assignment.record
- workforce.competence.record
- workforce.coverage.read
- workforce.coverage.update
- workforce.onboarding.record
- workforce.guidance.resolve
- workforce.offboarding.record

## Support

Deterministic local provider-domain behavior is implemented. Physical backend persistence, atomic multiworker storage and authenticated host integration are NOT_QUALIFIED; external effects are unsupported. Tests use synthetic state and do not establish Operator E2E or Production Ready.
