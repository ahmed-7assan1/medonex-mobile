import React,{useEffect,useRef,useState} from 'react';
import {Alert,Platform,Pressable,Text,TextInput,View} from 'react-native';
import {useTheme} from '@/theme/ThemeContext';
import {useAuth} from '@/lib/auth';
import {AI_PROVIDERS,readAISettings,hasAIKey,saveAISettings,removeAIKey,type AIProvider} from '@/lib/native-ai';
export function AIProviderKeys(){const {user}=useAuth();return <NativeAIProviderKeys key={user?.id||'guest'}/>;}
function NativeAIProviderKeys(){
 const {colors,fonts}=useTheme();const {user,isGuest}=useAuth();const owner=user?.id||'';const currentOwner=useRef(owner);currentOwner.current=owner;
 const [provider,setProvider]=useState<AIProvider>('gemini'),[model,setModel]=useState(''),[key,setKey]=useState(''),[stored,setStored]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{let alive=true;setKey('');setModel('');setStored(false);if(owner&&!isGuest&&Platform.OS!=='web')readAISettings(owner).then(s=>{if(alive&&s){setProvider(s.provider);setModel(s.model)}}).catch(()=>{if(alive)setError('Saved AI settings could not be read.');});return()=>{alive=false}},[owner,isGuest]);
 useEffect(()=>{let alive=true;setKey('');setStored(false);if(owner&&!isGuest&&Platform.OS!=='web')hasAIKey(owner,provider).then(v=>{if(alive)setStored(v)}).catch(()=>{if(alive)setError('Saved key status could not be read.');});return()=>{alive=false}},[owner,provider,isGuest]);
 const text=(s:string,muted=false)=><Text style={{color:muted?colors.mutedForeground:colors.foreground,fontFamily:fonts.sans,lineHeight:22}}>{s}</Text>;
 const button=(label:string,onPress:()=>void)=><Pressable accessibilityRole="button" disabled={busy} onPress={onPress} style={{padding:13,borderRadius:14,backgroundColor:colors.muted}}>{text(label)}</Pressable>;
 if(isGuest||!owner)return text('Sign in to set up your own AI provider. Guest mode sends no AI requests.');
 if(Platform.OS==='web')return text('Use the website AI settings in a browser. Native keys are stored only in the installed app.');
 const run=async(action:()=>Promise<void>,success:string)=>{if(busy)return;setBusy(true);setError('');const account=owner;try{await action();if(currentOwner.current===account){setKey('');setStored(await hasAIKey(account,provider));Alert.alert('AI settings',success)}}catch(e){if(currentOwner.current===account)setError(e instanceof Error?e.message:'Settings could not be saved.')}finally{if(currentOwner.current===account)setBusy(false)}};
 return <View style={{gap:16,width:'100%',maxWidth:672,alignSelf:'center'}}>
 {text('Your key stays in device secure storage, separate for each account. Requests go directly to the selected provider, never through MedOneX/Vercel. Website keys and chats do not sync.')}
 <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{Object.entries(AI_PROVIDERS).map(([id,p])=><Pressable accessibilityRole="radio" accessibilityState={{checked:provider===id}} key={id} disabled={busy} onPress={()=>{setProvider(id as AIProvider);setModel('');setError('')}} style={{padding:12,borderRadius:14,borderWidth:1,borderColor:provider===id?colors.primary:colors.border}}>{text(p.name)}</Pressable>)}</View>
 {text('Model ID (from your provider account)')}
 <TextInput accessibilityLabel="AI model ID" value={model} onChangeText={setModel} editable={!busy} autoCapitalize="none" autoCorrect={false} placeholder="Enter exact model ID" placeholderTextColor={colors.mutedForeground} style={{color:colors.foreground,borderWidth:1,borderColor:colors.border,borderRadius:12,padding:14}}/>
 {text(stored?'A key is saved for this provider. Leave blank to keep it.':'No key saved for this provider.',true)}
 <TextInput accessibilityLabel="Provider API key" value={key} onChangeText={setKey} editable={!busy} secureTextEntry autoCapitalize="none" autoCorrect={false} textContentType="none" placeholder={stored?'Replacement key (optional)':'Paste API key'} placeholderTextColor={colors.mutedForeground} style={{color:colors.foreground,borderWidth:1,borderColor:colors.border,borderRadius:12,padding:14}}/>
 {button(busy?'Saving...':'Save on this device',()=>void run(()=>saveAISettings(owner,{provider,model},key),'Saved on this device. No test request was sent.'))}
 {stored&&button('Remove this provider key',()=>Alert.alert('Remove key?','This removes only the key saved for this app account on this device.',[{text:'Cancel',style:'cancel'},{text:'Remove',style:'destructive',onPress:()=>void run(()=>removeAIKey(owner,provider),'Key removed from this device.')}]))}
 {!!error&&text(error)}
 {text('Saving does not test the key or make a paid request. Sending a chat uses your provider quota and may cost money. No silent fallback. Keys cannot be displayed again. Other website providers, attachments, web search and voice are not supported in this native version.',true)}
 </View>;
}
