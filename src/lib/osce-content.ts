import type{FixtureQuizQuestion}from'./fixtures';
/** Content-only media URLs. Never carry embedded credentials or local file URLs. */
export function osceMediaUrl(value:unknown):string|undefined{
 if(typeof value!=='string'||!value||value.length>20000)return;
 try{const url=new URL(value,'https://www.medonex.me/');if(url.protocol==='https:'&&!url.username&&!url.password)return url.href}catch{}
}
/** Prevent false feedback for formats or answer keys this practice cannot grade. */
export function osceAnswerBlockReason(question:Pick<FixtureQuizQuestion,'questionType'|'answer'|'choices'>):string|undefined{
 if(question.questionType==='MULTI_SELECT')return'This question format is not graded in this practice.';
 if(!question.answer||!question.choices.some(choice=>choice.key===question.answer))return'The answer key is not available. No answer was graded.';
}
/** Limit the surface to fields used by the source practice UI, not server metadata. */
export function osceQuestionContent(questions:FixtureQuizQuestion[],lectureId:string){
 return questions.map(q=>({id:q.id,body:typeof q.body==='string'?q.body:'',choices:q.choices.map(c=>({key:c.key,text:c.text})),answer:q.answer,explanation:q.explanation,difficulty:q.difficulty,questionType:q.questionType,lectureId,imageUrl:osceMediaUrl(q.imageUrl),videoUrl:osceMediaUrl(q.videoUrl)}));
}
