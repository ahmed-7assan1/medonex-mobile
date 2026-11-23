// Bundle the site's practical-lecture OSCE UI. Account and write effects stay disabled.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const website=path.resolve(process.argv[2]||'../medqs-mobile-auth');
const req=createRequire(website+'/package.json'),ts=req('typescript');
const file=website+'/src/components/content/LectureClient.tsx',source=fs.readFileSync(file,'utf8');
const ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
function declaration(name){const item=ast.statements.find(node=>(ts.isFunctionDeclaration(node)&&node.name?.text===name)||(ts.isVariableStatement(node)&&node.declarationList.declarations.some(d=>d.name.getText(ast)===name)));if(!item)throw Error('Source OSCE declaration changed: '+name);return item.getText(ast)}
function replaceRequired(text,needle,replacement){if(!text.includes(needle))throw Error('Source OSCE adapter structure changed');return text.replace(needle,replacement)}
let question=declaration('QuestionItem');
// Existing explanations can be shown without generating or saving new AI content.
question=replaceRequired(question,'useState<string | null>(null);\n  const [loadingExplain','useState<string | null>(question.explanation || null);\n  const [loadingExplain');
question=replaceRequired(question,'  const setSelected = (k: string) => {','  const setSelected = (k: string) => { const blocked=osceAnswerBlockReason(question);if(blocked){toast.error(blocked);return;}');
let stepper=declaration('QuestionsStepper');
stepper=replaceRequired(stepper,'      if (typingTarget(e.target)) return;','      if (typingTarget(e.target)||(e.target instanceof Element&&e.target.closest("button"))) return;');
const component=`import React,{useState,useEffect,useRef,useCallback}from'react';
import{Layers,HelpCircle,Loader2,Sparkles,Lightbulb,MessageCircle}from'lucide-react';
import{osceAnswerBlockReason}from'__OSCE_POLICY__';
import{cn}from'@/lib/utils';import{MarkdownBody}from'@/components/ui/MarkdownBody';import{normalizeImageUrl}from'@/lib/markdown-helpers';
import{PremiumVideoPlayer}from'@/components/content/PremiumVideoPlayer';import ReactMarkdown from'react-markdown';import toast from'react-hot-toast';
const guard=action=>window.__osceEmit({type:'guard',action});const useGuestGate=()=>({requireAuth:()=>{guard('ai');return false}});
const useRouter=()=>({push:()=>guard('discussion')});const useCommunityShareStore=selector=>selector({setSharedQuestion:()=>{}});
const apiFetch=async()=>{throw Error('Account actions are not enabled in this local practice')};
const FlashcardDeck=()=>null,QuizStyleStepper=()=>null;
${declaration('DIFF_COLORS')}\n${question}\n${declaration('OsceCountdown')}\n${stepper}\n${declaration('LectureClient')}`;
execFileSync(website+'/node_modules/.bin/tailwindcss',['-c',website+'/tailwind.config.ts','-i',website+'/src/styles/globals.css','-o','/tmp/osce-tailwind.css','--minify'],{cwd:website,stdio:'inherit'});
const result=await req('esbuild').build({stdin:{contents:fs.readFileSync(root+'/scripts/lecture-osce-entry.jsx','utf8'),loader:'jsx',resolveDir:website},tsconfig:website+'/tsconfig.json',bundle:true,write:false,outfile:'/tmp/lecture-osce.js',format:'iife',jsx:'automatic',minify:true,define:{'process.env.NODE_ENV':'"production"'},loader:{'.woff2':'dataurl','.woff':'dataurl','.ttf':'dataurl','.svg':'dataurl'},plugins:[{name:'source-osce',setup(b){b.onResolve({filter:/^__OSCE_POLICY__$/},()=>({path:root+'/src/lib/osce-content.ts'}));b.onResolve({filter:/^__LECTURE_OSCE__$/},()=>({path:file,namespace:'osce'}));b.onLoad({filter:/.*/,namespace:'osce'},()=>({contents:component,loader:'tsx',resolveDir:path.dirname(file)}))}}]});
let fonts='';for(const family of ['Cairo'])for(const[weight,suffix]of[[400,'Regular'],[500,'Medium'],[600,'SemiBold'],[700,'Bold']]){const p=root+'/node_modules/@expo-google-fonts/'+family.toLowerCase()+'/'+weight+suffix+'/'+family+'_'+weight+suffix+'.ttf';fonts+=`@font-face{font-family:${family};src:url(data:font/ttf;base64,${fs.readFileSync(p).toString('base64')});font-weight:${weight}}`}
const js=result.outputFiles.find(f=>f.path.endsWith('.js')).text;
const cssRoot=req('postcss').parse(fonts+fs.readFileSync('/tmp/osce-tailwind.css','utf8')+result.outputFiles.filter(f=>f.path.endsWith('.css')).map(f=>f.text).join('\n'));
cssRoot.walkDecls(declaration=>{declaration.value=declaration.value.replace(/(\d*\.?\d+)(?:dvh|svh|vh)/g,(_,amount)=>'calc(var(--osce-viewport-height,100vh) * '+(Number(amount)/100)+')')});
const css=cssRoot.toString();
const html=`<!doctype html><html class="medonex-font-variables"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base href="https://www.medonex.me/"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' https: blob:; style-src 'unsafe-inline'; media-src https: blob:; img-src https: data: blob:; font-src data:; connect-src https:; frame-src https://www.youtube.com https://www.youtube-nocookie.com https://drive.google.com; worker-src blob:; form-action 'none'"><style>${css}html,body{margin:0;padding:0;background:transparent!important;font-family:Arial,sans-serif;overflow:hidden}#root{width:100%}html{--font-inter:Arial;--font-sans:Arial,sans-serif;--font-display:Arial,sans-serif;--font-arabic:Cairo,Arial,sans-serif}html[dir=rtl] body{font-family:Cairo,Arial,sans-serif}</style></head><body><div id="root"></div><script>${js.replaceAll('</script','<\\/script')}</script></body></html>`;
fs.writeFileSync(root+'/assets/lecture-osce.html',html);console.log('Source OSCE asset bytes',Buffer.byteLength(html));
