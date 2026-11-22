# Pages phase roadmap (Ahmed directive, 22 Nov 2026)

Build ALL pages with fixture data first (exact site UI), wire to real APIs after.
Backend proposals paused until pages phase completes. Test account via normal
signup, credentials in vault only.

Done: tabs (home/modules/qbank/social), module detail, subject lectures,
settings main, auth screens.
Fixtures layer: src/lib/fixtures.ts (shapes mirror MedQs0 API responses).

## Remaining pages
1. Lecture page /modules/[id]/lectures/[lectureId] (source: MedQs0
   src/components/content/LectureExperienceClient.tsx, 1718 lines, cached notes
   below) — split: (a) shell+hero+tabs, (b) tab panes.
2. Quiz player /quiz/[id] (offline after first load).
3. Tasks (taskat) + Teams.
4. Public profile (medonex.me/@username = /profile/[userId]).
5. Dr Q chat (BYOK keys).
6. Atlas 3D: embed current web page for now.
7. Secondary pages: podcast, downloads, drawmed, about, founders.
8. Settings overlays (Identity/Academic/Privacy/Appearance/AI keys/
   Subscription/Notifications) + tablet DesktopSettingsLayout.
9. Fill 4 tab screens with fixtures (currently guest/empty).

## Lecture page spec (from site source)
- Full-screen app shell (h-dvh, no page scroll; panes scroll internally).
- Sticky header: back, lecture title, share button, AI sparkle toggle.
- Horizontal scrollable tab bar h-11, 13px labels, active = text color +
  2px underline; tabs: overview, videos, materials, recordings, flashcards,
  questions, notes, checklist, drq.
- Overview tab: grid of section cards, each with accent color identity:
  videos=indigo, materials=amber, recordings=rose, flashcards=violet,
  questions=emerald, notes=cyan, checklist=orange; each card: icon, subtitle,
  goal CTA (Watch/Download/Listen/Practice/Test/Write/Verify).
- Notes tab: sub-switcher Cards / Annotator (capsule, surface-pressed track).
- Desktop: centered max-w-960 tab bar, bottom fade behind capsule.
- Lecture data (site getCachedLectureDetail): lecture{id,title,subject{name,
  module{id,name}}, videos[{id,title,url,likesCount,commentsCount}], records
  [{id,title,url,sourceType}], files[{id,name,url,mimeType}], notesMarkdown,
  noteCardsMarkdown, flashcards[{id,front,back}], questions[{id,questionType,
  body,imageUrl,stemLayout,choices,answer,essayReference,explanation,
  difficulty}]}.
- Video URLs: youtube/telegram/embed/mp4 (see video-utils in site).
