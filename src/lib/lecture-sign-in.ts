/** Only the lecture hub may be a return destination for its guest sign-in button. */
export function lectureSignInReturn(value:unknown):string|undefined{
 if(typeof value!=='string'||value.length>2000||!/^\/modules\/[A-Za-z0-9_-]+\/lectures\/[A-Za-z0-9_-]+$/.test(value))return;
 return value;
}
