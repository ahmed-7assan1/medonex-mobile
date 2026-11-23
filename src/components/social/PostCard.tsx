import{useStudentDimensions as useWindowDimensions}from'@/lib/student-viewport';
import React, { useState } from 'react';
import { View, Text, Pressable, Image, ScrollView, Share, StyleSheet, Alert,Platform } from 'react-native';
import { BadgeCheck, EyeOff, Pin, Heart, MessageCircle, Share2, Bookmark, ChevronDown, Layers } from 'lucide-react-native';
import {useRouter} from 'expo-router';
import {CommentsSheet} from './CommentsSheet';
import{WebsitePostStudy}from'./WebsitePostStudy';
import{PostRichContent}from'./PostRichContent';
import {isFixtureMode} from '@/lib/fixtures';
import { useTheme } from '@/theme/ThemeContext';
import { timeAgo, compact } from './format';
import type { Post } from '@/lib/community';

/** Site: post/PostRow.tsx + community-mobile/PostCard.tsx — flat row on the
 *  page background: 44px avatar, name · rank · time · forum line, content
 *  (15px/20, collapsible), image carousel, action bar. */
export function PostCard({ post,contentWidth }: { post: Post;contentWidth?:number }) {
  const { st, colors, fonts:themeFonts } = useTheme();
  const fonts=contentWidth?{...themeFonts,sans:Platform.OS==='android'?'sans-serif':'Arial',sansBold:Platform.OS==='android'?'sans-serif':'Arial'}:themeFonts;
  const {viewportWidth, width } = useWindowDimensions();
  const router=useRouter();
  const [commentsOpen,setCommentsOpen]=useState(false);
  const [studyOpen,setStudyOpen]=useState(false);
  const readOnly=()=>Alert.alert('Read-only preview','No changes have been saved to your account.');
  const [expanded, setExpanded] = useState(false);
  const [liked, setLiked] = useState(Boolean(post.userReaction));
  const [saved, setSaved] = useState(Boolean(post.isSaved));
  const likes = (post.likesCount ?? post.reactionCounts?.HEART ?? 0) + (liked && !post.userReaction ? 1 : 0);

  const isAnon = post.isAnonymous || !post.author;
  const name = isAnon ? 'Anonymous' : post.author!.name;
  const images = (post.attachments ?? []).filter((a) => a.type === 'image').map((a) => a.url);
  if (images.length === 0 && post.imageUrl) images.push(post.imageUrl);

  const share = async () => {
    if(isFixtureMode()){Alert.alert('Guest preview','Sample posts cannot be shared.');return}
    try {
      await Share.share({ message: `https://www.medonex.me/social?post=${encodeURIComponent(post.id)}` });
    } catch { /* dismissed */ }
  };

  return (
    <View style={[styles.article, { borderColor: st.border }]}>
      <View style={styles.row}>
        {isAnon ? (
          <View style={[styles.avatar, { backgroundColor: st.surface }]}>
            <EyeOff size={18} color={st.muted} />
          </View>
        ) : post.author!.avatarUrl ? (
          <Image source={{ uri: post.author!.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: st.surface }]}>
            <Text style={{ color: st.text, fontSize: 14, fontWeight: '700' }}>{name.charAt(0).toUpperCase()}</Text>
          </View>
        )}

        <View style={styles.body}>
          <View style={styles.nameLine}>
            <Text onPress={()=>{if(!isAnon&&post.author?.id)router.push(`/profile/${post.author.id}` as never)}} numberOfLines={1} style={[styles.name, { color: st.text, fontFamily: fonts.sansBold }]}>{name}</Text>
            {!isAnon && post.author!.telegramVerified && <BadgeCheck size={16} color="#1DA1F2" />}
            {!isAnon && post.author!.rankLabel && (
              <View style={[styles.rankPill, { backgroundColor: colors.primary + '1A' }]}>
                <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '600' }}>{post.author!.rankLabel}</Text>
              </View>
            )}
            {post.isPinned && (
              <View style={[styles.pinPill, { backgroundColor: colors.primary + '1A' }]}>
                <Pin size={10} color={colors.primary} />
                <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '700' }}>Pinned</Text>
              </View>
            )}
            <Text style={{ color: st.muted, fontSize: 15 }}>· {timeAgo(post.createdAt)}</Text>
            {post.forumName && <Text numberOfLines={1} style={{ color: st.muted, fontSize: 15, flexShrink: 1 }}>· {post.forumName}</Text>}
          </View>
          {!isAnon && post.author!.handle && (
            <Text numberOfLines={1} style={{ color: st.muted, fontSize: 13, lineHeight: 18 }}>@{post.author!.handle}</Text>
          )}

          {post.content ? (
            <View>
              <Text
                numberOfLines={expanded ? undefined : 3}
                style={{ color: st.text, fontSize: 15, lineHeight: 20, fontFamily: fonts.sans }}
              >
                {post.content}
              </Text>
              {post.content.length > 140 && (
                <Pressable accessibilityRole="button" onPress={() => setExpanded((v) => !v)} style={styles.showMore}>
                  <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '600' }}>
                    {expanded ? 'Show less' : 'Show more'}
                  </Text>
                  <ChevronDown size={16} color={colors.primary} style={expanded ? { transform: [{ rotate: '180deg' }] } : undefined} />
                </Pressable>
              )}
            </View>
          ) : null}

          {post.hashtags?.length > 0 && (
            <View style={styles.tagsRow}>
              {post.hashtags.map((h) => (
                <Text key={h} style={{ color: colors.primary, fontSize: 14 }}>#{h}</Text>
              ))}
            </View>
          )}

          {images.length > 0 && (
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.images}>
              {images.map((url, i) => (
                <Image
                  key={`${url}-${i}`}
                  source={{ uri: url }}
                  style={{ width: (contentWidth??width) - 32 - 56, height: ((contentWidth??width) - 32 - 56) * 0.66, borderRadius: 16 }}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          )}

          <PostRichContent post={post}/>
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" onPress={()=>setCommentsOpen(true)} style={styles.actionBtn}>
              <MessageCircle size={18} color={st.muted} />
              <Text style={[styles.actionCount, { color: st.muted }]}>{compact(post.commentCount)}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={()=>isFixtureMode()?setLiked(v=>!v):readOnly()} style={styles.actionBtn} accessibilityState={{ selected: liked }}>
              <Heart size={18} color={liked ? '#F91880' : st.muted} fill={liked ? '#F91880' : 'transparent'} />
              <Text style={[styles.actionCount, { color: liked ? '#F91880' : st.muted }]}>{compact(likes)}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={share} style={styles.actionBtn}>
              <Share2 size={18} color={st.muted} />
            </Pressable>
            <Pressable accessibilityRole="button" onPress={()=>isFixtureMode()?setSaved(v=>!v):readOnly()} style={styles.actionBtn} accessibilityState={{ selected: saved }}>
              <Bookmark size={18} color={saved ? colors.primary : st.muted} fill={saved ? colors.primary : 'transparent'} />
            </Pressable>
            {!!(post.questions?.length||post.flashcards?.length)&&<Pressable accessibilityRole="button" accessibilityLabel="Study content" onPress={()=>setStudyOpen(true)} style={styles.actionBtn}><Layers size={18} strokeWidth={1.7} color={colors.primary}/></Pressable>}
          </View>
        </View>
      </View>
      <WebsitePostStudy post={post} open={studyOpen} onClose={()=>setStudyOpen(false)}/>
      <CommentsSheet postId={commentsOpen?post.id:null} onClose={()=>setCommentsOpen(false)}/>
    </View>
  );
}

const styles = StyleSheet.create({
  article: { borderBottomWidth: StyleSheet.hairlineWidth },
  row: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingTop: 12 },
  avatar: { width: 44, height: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  body: { flex: 1, minWidth: 0 },
  nameLine: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 4 },
  name: { fontSize: 15, fontWeight: '700', lineHeight: 22, maxWidth: '60%' },
  rankPill: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  pinPill: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  showMore: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  images: { marginTop: 12 },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 2, paddingBottom: 4, marginLeft: -8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, padding: 8 },
  actionCount: { fontSize: 13 },
});
