import{normalizeRichPost}from'./post-rich';
export function postStudyLink(value:unknown):string|undefined{if(typeof value!=='string'||value.length>8000)return;try{const url=new URL(value,'https://www.medonex.me/');if(url.protocol==='https:'&&!url.username&&!url.password)return url.href}catch{}}
/** Data-only source props. Account metadata and unrelated post fields never enter the sheet. */
export function postStudyData(post:any){
 const rich=normalizeRichPost(post),questions=(rich.questions??[]).map(q=>({id:q.id,prompt:q.prompt,choices:q.choices.map(choice=>({id:choice.id,label:choice.label})),correctChoiceId:typeof q.correctChoiceId==='string'?q.correctChoiceId:null,explanation:q.explanation??null,subjectName:q.subjectName??null})),flashcards=(rich.flashcards??[]).map(set=>({title:set.title??null,cards:set.cards.map(card=>({id:card.id,front:card.front,back:card.back}))}));
 const attachments=(Array.isArray(post.attachments)?post.attachments:[]).flatMap((file:any)=>{const url=postStudyLink(file?.url);return url?[{url,name:typeof file.name==='string'?file.name:undefined,type:typeof file.type==='string'?file.type:undefined}]:[]});
 const data={questions,flashcards,attachments,content:typeof post.content==='string'?post.content:'',hashtags:(Array.isArray(post.hashtags)?post.hashtags:[]).filter((value:unknown)=>typeof value==='string')};
 if(questions.length>500||flashcards.length>100||flashcards.some(set=>set.cards.length>500)||attachments.length>1000||JSON.stringify(data).length>1000000)throw Error('This study content is too large to display safely.');return data;
}
