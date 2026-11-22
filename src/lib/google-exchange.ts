export class ExchangeError extends Error {
 constructor(public code:'endpoint-missing'|'config-missing'|'failed'|'profile-required'|'account-link-required'|'play-services',message:string){super(message)}
}
