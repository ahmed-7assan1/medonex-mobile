const fs=require('fs'),assert=require('assert/strict'),path=require('path'),root=path.resolve(__dirname,'..');
const video=fs.readFileSync(root+'/src/components/lecture/LectureVideoSection.tsx','utf8');
/* Standalone video/studio page sticky parity with the site's LectureVideoStudio (content/LectureVideoStudio.tsx). */
assert(video.includes('Animated.ScrollView'),'standalone scroller is animated for sticky measurement');
assert(video.includes("useNativeDriver:Platform.OS!=='web'"),'native driver on device');
assert(video.includes('LectureScrollContext.Provider'),'standalone route provides its own scroll context');
assert(video.includes('revision:`${viewportWidth}:${lecture?.videos.length??0}`'),'remeasures on resize');
/* Source sub-header: sticky top-16 md:top-0 z-40 (64px site phone header; native adds device insets). */
assert(video.includes('<LectureSticky enabled={!embedded} top={desktop?0:insets.top+64}>'),'studio sub-header sticky matches source top-16/md:top-0');
assert(video.indexOf('testID="video-studio-header"')>video.indexOf('enabled={!embedded} top={desktop?0:insets.top+64}'),'sticky wraps the studio header');
/* Source aside: sticky top-[100px] on lg+ only. */
assert(video.includes('<LectureSticky enabled={studio&&!embedded&&wide} top={100}>{playlist}</LectureSticky>'),'playlist aside sticky top-[100px] wide-only');
/* Source playlist list: max-h-[calc(100vh-450px)] overflow-y-auto (keeps the aside shorter than the row so sticky has travel). */
assert(video.includes('viewportHeight - 450'),'playlist max height follows source calc(100vh-450px)');
/* Embedded hub theater sticky stays untouched. */
assert(video.includes('enabled={embedded&&!studio&&!wide}'),'embedded theater sticky unchanged');
assert(video.includes('<ScrollShell>'),'provider mounted');
console.log('PASS standalone video/studio sticky wiring: animated scroller, own scroll context, source-matching header/aside sticky offsets');
