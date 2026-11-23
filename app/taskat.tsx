import{useStudentDimensions as useWindowDimensions}from'@/lib/student-viewport';
import React, { useMemo, useState } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet, TextInput, Alert,
} from 'react-native';
import Svg, { Circle as SvgCircle } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft, Plus, Trash2, Clock, CheckCircle2, Circle, ChevronRight,
  ChevronDown, BookOpen, FolderOpen, ClipboardList, LayoutGrid,
  CalendarDays, GraduationCap,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';
import { FadeEdges } from '@/components/FadeEdges';
import { TABLET_BREAKPOINT, SCROLL_BOTTOM_PAD } from '@/theme/tokens';
import {useTasks,useStudyPlan} from '@/lib/study-plan';
import {ResourceState} from '@/components/ResourceState';
import {isFixtureMode} from '@/lib/fixtures';
import { FIXTURE_MODULE_BUNDLE, FIXTURE_TASKS, FIXTURE_COMPLETIONS, type FixtureTask } from '@/lib/fixtures';

/** /taskat — pixel match of the site's TaskatClient + DailyFocus +
 *  CurriculumChecklist: progress ring card, Daily Focus / Tracker capsule
 *  switcher, date strip, agenda card, task list with priority-colored left
 *  borders and the add-task form, and the expandable module → subject →
 *  lecture tracker. Fixture data until the wiring phase. */

const PRIORITY = {
  HIGH: { fg: '#F87171', bg: 'rgba(239,68,68,0.10)', border: '#EF4444' },
  MEDIUM: { fg: '#FBBF24', bg: 'rgba(245,158,11,0.10)', border: '#F59E0B' },
  LOW: { fg: '#60A5FA', bg: 'rgba(59,130,246,0.10)', border: '#3B82F6' },
} as const;

export default function TaskatScreen() {
  const { colors, fonts, st } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {viewportWidth, width } = useWindowDimensions();
  const isTablet = viewportWidth >= TABLET_BREAKPOINT;

  const [tab, setTab] = useState<'daily' | 'checklist'>('daily');
  const [localTasks, setTasks] = useState<FixtureTask[]>(FIXTURE_TASKS);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAdding, setIsAdding] = useState(false);
  const [taskType, setTaskType] = useState<'general' | 'lecture'>('general');
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newPriority, setNewPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');
  const [localCompletions, setCompletions] = useState<Record<string, boolean>>(FIXTURE_COMPLETIONS);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});

  const resource=useTasks(selectedDate);const plan=useStudyPlan();
  const tasks=isFixtureMode()?localTasks:resource.data??[];
  const completions=isFixtureMode()?localCompletions:plan.data?.completions??{};
  const readOnly=()=>Alert.alert('Read-only preview','Manage tasks on the website. No changes have been saved.');
  const done = tasks.filter((tk) => tk.completed).length;
  const progress = tasks.length ? (done / tasks.length) * 100 : 0;
  const isDayFinished = tasks.length > 0 && done === tasks.length;

  const modules=plan.data?.modules??[];
  const curriculum = modules.flatMap(m=>m.subjects);
  const allLectures = useMemo(() => curriculum.flatMap((s) => s.lectures), [curriculum]);

  const days = useMemo(() => {
    const arr: Date[] = [];
    const today = new Date();
    for (let i = -1; i < 13; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, []);

  const sameDay = (a: Date, b: Date) =>
    a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();

  const addTask = () => {
    if(!isFixtureMode()){readOnly();return}
    const title = taskType === 'general'
      ? newTitle.trim()
      : `Study: ${allLectures[0]?.title ?? 'Lecture'}`;
    if (!title) return;
    setTasks((ts) => [...ts, {
      id: `t${Date.now()}`,
      title,
      time: newTime || undefined,
      lectureId: taskType === 'lecture' ? allLectures[0]?.id : null,
      priority: newPriority,
      completed: false,
    }]);
    setIsAdding(false);
    setNewTitle('');
    setNewTime('');
    setNewPriority('MEDIUM');
  };

  const toggleTask = (id: string) =>
    !isFixtureMode()?readOnly():setTasks((ts) => ts.map((tk) => (tk.id === id ? { ...tk, completed: !tk.completed } : tk)));
  const deleteTask = (id: string) => !isFixtureMode()?readOnly():setTasks((ts) => ts.filter((tk) => tk.id !== id));

  if(!resource.data||!plan.data)return <ResourceState error={resource.error||plan.error} onRetry={()=>{resource.refetch();plan.refetch()}} title="Taskat"/>;

  const ringR = 16;
  const ringC = 2 * Math.PI * ringR;

  return (
    <View style={[styles.root, { backgroundColor: st.bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top, borderBottomColor: st.border }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.headerBtn}>
          <ArrowLeft size={19} color={st.text} />
        </Pressable>
        <Text style={{ color: st.text, fontSize: 15, fontFamily: fonts.sansSemiBold, flex: 1 }}>Taskat</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + SCROLL_BOTTOM_PAD,
          maxWidth: 1024,
          width: '100%',
          alignSelf: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress card */}
        <View style={[styles.progressCard, { backgroundColor: st.surface, borderColor: st.border }]}>
          <View style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={48} height={48} viewBox="0 0 36 36" style={StyleSheet.absoluteFill}>
              <SvgCircle cx={18} cy={18} r={ringR} fill="none" stroke={colors.muted} strokeWidth={3} />
              <SvgCircle
                cx={18} cy={18} r={ringR} fill="none"
                stroke={colors.primary} strokeWidth={3} strokeLinecap="round"
                strokeDasharray={ringC}
                strokeDashoffset={ringC * (1 - progress / 100)}
                rotation={-90} origin="18,18"
              />
            </Svg>
            <Text style={{ color: st.text, fontSize: 13, fontFamily: fonts.sansBold, fontVariant: ['tabular-nums'] }}>{Math.round(progress)}%</Text>
          </View>
          <View>
            <Text style={{ color: st.muted, fontSize: 10, fontFamily: fonts.sansBold, letterSpacing: 1.4, textTransform: 'uppercase' }}>
              {t('taskat.todayProgress')}
            </Text>
            <Text style={{ color: colors.primary, fontSize: 18, fontFamily: fonts.sansBold }}>
              {progress === 100 ? t('taskat.victory') : progress > 50 ? t('taskat.almostThere') : t('taskat.keepGoing')}
            </Text>
          </View>
        </View>

        {/* Tab switcher */}
        <View style={styles.switcherRow}>
          <View style={[styles.switcher, { backgroundColor: st.surface, borderColor: st.border }]}>
            {(['daily', 'checklist'] as const).map((id) => {
              const active = tab === id;
              const Icon = id === 'daily' ? ClipboardList : LayoutGrid;
              return (
                <Pressable
                  key={id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => setTab(id)}
                  style={[styles.switchPill, active && { backgroundColor: st.pillFill }]}
                >
                  <Icon size={16} color={active ? st.pillText : st.muted} />
                  <Text style={{ color: active ? st.pillText : st.muted, fontSize: 14, fontFamily: fonts.sansBold }}>
                    {id === 'daily' ? t('taskat.dailyFocus') : t('taskat.tracker')}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {tab === 'daily' ? (
          <View style={{ gap: 24 }}>
            {/* Date strip */}
            <View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 8, paddingBottom: 8 }}>
                {days.map((d, i) => {
                  const active = sameDay(d, selectedDate);
                  const isToday = sameDay(d, new Date());
                  const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                  return (
                    <Pressable
                      key={i}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      onPress={() => setSelectedDate(d)}
                      style={[
                        styles.datePill,
                        { backgroundColor: st.surface, borderColor: active ? colors.primary + '80' : st.border },
                        active && { backgroundColor: st.pillFill },
                      ]}
                    >
                      <Text style={{ color: active ? st.pillText : st.muted, fontSize: 9, fontFamily: fonts.sansBold, letterSpacing: 1.2, textTransform: 'uppercase' }}>{dayName}</Text>
                      <Text style={{ color: active ? st.pillText : st.text + '99', fontSize: 18, fontFamily: fonts.sansBold }}>{d.getDate()}</Text>
                      {isToday && !active && <View style={[styles.todayDot, { backgroundColor: colors.primary }]} />}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Agenda card */}
            <View style={[styles.agendaCard, isDayFinished
              ? { backgroundColor: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.2)' }
              : { backgroundColor: st.surface, borderColor: st.border },
            ]}>
              <View style={[styles.agendaIcon, isDayFinished ? { backgroundColor: '#F59E0B' } : { backgroundColor: colors.primary }]}>
                <CalendarDays size={24} color={isDayFinished ? '#FFFFFF' : colors.primaryForeground} />
              </View>
              <View>
                <Text style={{ color: isDayFinished ? '#F59E0B' : st.text, fontSize: 20, fontFamily: fonts.display }}>
                  {isDayFinished ? t('taskat.perfectDay') : sameDay(selectedDate, new Date()) ? t('taskat.todayAgenda') : t('taskat.daySchedule')}
                </Text>
                <Text style={{ color: isDayFinished ? 'rgba(245,158,11,0.7)' : st.muted, fontSize: 10, fontFamily: fonts.sansBold, letterSpacing: 1.4, textTransform: 'uppercase', marginTop: 4 }}>
                  {isDayFinished ? t('taskat.allDone', { n: tasks.length }) : t('taskat.planned', { n: tasks.length })}
                </Text>
              </View>
            </View>

            {/* Task list header + new task */}
            <View style={styles.taskListHead}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 4, height: 16, borderRadius: 2, backgroundColor: colors.primary }} />
                <Text style={{ color: st.muted, fontSize: 11, fontFamily: fonts.sansBold, letterSpacing: 2, textTransform: 'uppercase' }}>
                  {t('taskat.taskList')}
                </Text>
              </View>
              {!isAdding && (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setIsAdding(true)}
                  style={[styles.newTaskBtn, { backgroundColor: colors.primary }]}
                >
                  <Plus size={14} color={colors.primaryForeground} />
                  <Text style={{ color: colors.primaryForeground, fontSize: 11, fontFamily: fonts.sansBold }}>{t('taskat.newTask')}</Text>
                </Pressable>
              )}
            </View>

            {/* Add form */}
            {isAdding && (
              <View style={[styles.addForm, { backgroundColor: st.surface, borderColor: st.border }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12 }}>
                  {(['general', 'lecture'] as const).map((id) => (
                    <Pressable
                      key={id}
                      accessibilityRole="button"
                      accessibilityState={{ selected: taskType === id }}
                      onPress={() => setTaskType(id)}
                      style={[styles.typePill, taskType === id ? { backgroundColor: colors.primary } : { backgroundColor: colors.muted + '66' }]}
                    >
                      <Text style={{ color: taskType === id ? colors.primaryForeground : st.muted, fontSize: 10, fontFamily: fonts.sansBold, letterSpacing: 1.4, textTransform: 'uppercase' }}>
                        {id === 'general' ? t('taskat.routineTask') : t('taskat.academicLink')}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {taskType === 'general' ? (
                  <View style={{ gap: 8 }}>
                    <Text style={[styles.fieldLabel, { color: st.muted }]}>{t('taskat.taskTitle')}</Text>
                    <TextInput
                      value={newTitle}
                      onChangeText={setNewTitle}
                      placeholder={t('taskat.taskTitlePlaceholder')}
                      placeholderTextColor={st.muted + '66'}
                      style={[styles.input, { borderColor: st.border, backgroundColor: colors.muted + '4D', color: st.text, fontFamily: fonts.sansMedium }]}
                    />
                  </View>
                ) : (
                  <View style={{ gap: 8 }}>
                    <Text style={[styles.fieldLabel, { color: st.muted }]}>{t('taskat.selectContent')}</Text>
                    <View style={[styles.input, { borderColor: st.border, backgroundColor: colors.muted + '4D', justifyContent: 'center' }]}>
                      <Text style={{ color: st.text, fontSize: 13, fontFamily: fonts.sansMedium }} numberOfLines={1}>
                        {allLectures[0]?.title}
                      </Text>
                    </View>
                  </View>
                )}

                <View style={{ gap: 8 }}>
                  <Text style={[styles.fieldLabel, { color: st.muted }]}>{t('taskat.priorityLevel')}</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {(['LOW', 'MEDIUM', 'HIGH'] as const).map((p) => {
                      const active = newPriority === p;
                      return (
                        <Pressable
                          key={p}
                          accessibilityRole="button"
                          accessibilityState={{ selected: active }}
                          onPress={() => setNewPriority(p)}
                          style={[
                            styles.priorityBtn,
                            active
                              ? { backgroundColor: PRIORITY[p].bg, borderColor: PRIORITY[p].border + '4D' }
                              : { backgroundColor: colors.muted + '66', borderColor: 'transparent' },
                          ]}
                        >
                          <Text style={{ color: active ? PRIORITY[p].fg : st.muted, fontSize: 10, fontFamily: fonts.sansBold, letterSpacing: 1.4 }}>{p}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                  <View style={[styles.input, styles.timeWrap, { borderColor: st.border, backgroundColor: colors.muted + '4D' }]}>
                    <Clock size={16} color={st.muted} />
                    <TextInput
                      value={newTime}
                      onChangeText={setNewTime}
                      placeholder={t('taskat.timePlaceholder')}
                      placeholderTextColor={st.muted + '66'}
                      style={{ flex: 1, color: st.text, fontSize: 13, fontFamily: fonts.sansMedium, padding: 0 }}
                    />
                  </View>
                  <Pressable accessibilityRole="button" onPress={() => setIsAdding(false)} style={[styles.discardBtn, { backgroundColor: colors.muted + '66' }]}>
                    <Text style={{ color: st.muted, fontSize: 11, fontFamily: fonts.sansBold }}>{t('taskat.discard')}</Text>
                  </Pressable>
                  <Pressable accessibilityRole="button" onPress={addTask} style={[styles.planBtn, { backgroundColor: colors.primary }]}>
                    <Text style={{ color: colors.primaryForeground, fontSize: 11, fontFamily: fonts.sansBold }}>{t('taskat.planIt')}</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Tasks */}
            <View style={{ gap: 16 }}>
              {tasks.map((task) => {
                const p = PRIORITY[task.priority];
                return (
                  <View
                    key={task.id}
                    style={[
                      styles.taskRow,
                      { backgroundColor: task.completed ? colors.muted + '4D' : colors.card, borderColor: st.border },
                      !task.completed && { borderLeftColor: p.border, borderLeftWidth: 3.5 },
                      task.completed && { opacity: 0.5 },
                    ]}
                  >
                    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: task.completed }} onPress={() => toggleTask(task.id)}>
                      {task.completed ? (
                        <View style={[styles.checkbox, { backgroundColor: '#10B981' }]}>
                          <CheckCircle2 size={16} color="#FFFFFF" />
                        </View>
                      ) : (
                        <View style={[styles.checkbox, { borderWidth: 1, borderColor: st.border, backgroundColor: colors.muted + '66' }]} />
                      )}
                    </Pressable>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        numberOfLines={1}
                        style={{
                          color: taskCompletedColor(task.completed, st.text),
                          fontSize: 15,
                          fontFamily: task.completed ? fonts.sans : fonts.sansBold,
                          textDecorationLine: task.completed ? 'line-through' : 'none',
                        }}
                      >
                        {task.title}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        {!!task.time && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Clock size={12} color={st.muted} />
                            <Text style={{ color: st.muted, fontSize: 12 }}>{task.time}</Text>
                          </View>
                        )}
                        {!!task.lectureId && (
                          <View style={[styles.tag, { borderColor: colors.primary + '4D', backgroundColor: colors.primary + '14' }]}>
                            <Text style={{ color: colors.primary, fontSize: 10, fontFamily: fonts.sansMedium }}>{t('taskat.academicLink')}</Text>
                          </View>
                        )}
                        {!task.completed && (
                          <View style={[styles.tag, { borderColor: p.border + '33', backgroundColor: p.bg }]}>
                            <Text style={{ color: p.fg, fontSize: 8, fontFamily: fonts.sansBold, letterSpacing: 1 }}>{task.priority}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <Pressable accessibilityRole="button" accessibilityLabel="Delete" onPress={() => deleteTask(task.id)} style={{ padding: 8 }}>
                      <Trash2 size={16} color={st.muted} />
                    </Pressable>
                  </View>
                );
              })}

              {tasks.length === 0 && !isAdding && (
                <View style={{ alignItems: 'center', paddingVertical: 80 }}>
                  <View style={[styles.emptyIcon, { backgroundColor: colors.muted + '66' }]}>
                    <ClipboardList size={48} color={st.muted + '4D'} />
                  </View>
                  <Text style={{ color: st.muted, fontSize: 20, fontFamily: fonts.display }}>{t('taskat.nothingHere')}</Text>
                  <Text style={{ color: st.muted + '80', fontSize: 14, marginTop: 8, fontFamily: fonts.sansMedium }}>{t('taskat.nothingHereSub')}</Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          /* Tracker (curriculum checklist) */
          <View style={{ gap: 24 }}>
            {modules.map(module=><View key={module.id} style={[styles.moduleCard, { backgroundColor: st.surface, borderColor: st.border }]}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: !!expandedModules[module.id] }}
                onPress={() => setExpandedModules((p) => ({ ...p, [module.id]: !p[module.id] }))}
                style={styles.moduleHead}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                  <View style={[styles.moduleIcon, { backgroundColor: colors.primary + '1A' }]}>
                    <FolderOpen size={24} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={{ color: st.text, fontSize: 16, fontFamily: fonts.sansBold }}>{module.name}</Text>
                    <Text style={{ color: st.muted, fontSize: 10, fontFamily: fonts.sansBold, letterSpacing: 1.4, textTransform: 'uppercase', marginTop: 4 }}>
                      {t('taskat.majorSubjects', { n: module.subjects.length })}
                    </Text>
                  </View>
                </View>
                <View style={[styles.chevronCircle, { backgroundColor: st.surfacePressed }]}>
                  <ChevronDown
                    size={16}
                    color={st.muted}
                    style={{ transform: [{ rotate: expandedModules[module.id] ? '180deg' : '0deg' }] }}
                  />
                </View>
              </Pressable>

              {!!expandedModules[module.id] && (
                <View style={[styles.moduleBody, { borderTopColor: st.border, backgroundColor: colors.muted + '33' }]}>
                  {module.subjects.map((subject) => {
                    const total = subject.lectures.length;
                    const completed = subject.lectures.filter((l) => completions[l.id]).length;
                    const prog = total ? (completed / total) * 100 : 0;
                    const open = !!expandedSubjects[subject.id];
                    return (
                      <View key={subject.id} style={[styles.subjectCard, { backgroundColor: st.surface, borderColor: st.border }]}>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityState={{ expanded: open }}
                          onPress={() => setExpandedSubjects((p) => ({ ...p, [subject.id]: !p[subject.id] }))}
                          style={styles.subjectHead}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 }}>
                            <View style={[styles.subjectIcon, prog === 100 ? { backgroundColor: '#10B981' } : { backgroundColor: colors.primary + '1A' }]}>
                              <BookOpen size={20} color={prog === 100 ? '#FFFFFF' : colors.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={{ color: st.text, fontSize: 14, fontFamily: fonts.sansBold }}>{subject.name}</Text>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                <Text style={{ color: st.muted, fontSize: 10, fontFamily: fonts.sansBold, letterSpacing: 1.4, textTransform: 'uppercase' }}>
                                  {t('taskat.topicsCount', { c: completed, n: total })}
                                </Text>
                                {prog > 0 && (
                                  <Text style={{ color: colors.primary, fontSize: 10, fontFamily: fonts.sansBold }}>{Math.round(prog)}%</Text>
                                )}
                              </View>
                            </View>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            {total > 0 && (
                              <View style={[styles.progTrack, { backgroundColor: colors.muted }]}>
                                <View style={[styles.progFill, { backgroundColor: colors.primary, width: `${prog}%` }]} />
                              </View>
                            )}
                            <View style={[styles.chevronSmall, { backgroundColor: colors.muted }]}>
                              <ChevronRight size={14} color={st.muted} style={{ transform: [{ rotate: open ? '90deg' : '0deg' }] }} />
                            </View>
                          </View>
                        </Pressable>
                        {open && (
                          <View style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 4 }}>
                            {subject.lectures.length === 0 && (
                              <Text style={{ color: st.muted + '66', fontSize: 11, fontFamily: fonts.sansBold, letterSpacing: 1.4, textTransform: 'uppercase', textAlign: 'center', paddingVertical: 24 }}>
                                {t('taskat.zeroContent')}
                              </Text>
                            )}
                            {subject.lectures.map((lecture) => {
                              const doneL = !!completions[lecture.id];
                              return (
                                <Pressable
                                  key={lecture.id}
                                  accessibilityRole="checkbox"
                                  accessibilityState={{ checked: doneL }}
                                  onPress={() => !isFixtureMode()?readOnly():setCompletions((p) => ({ ...p, [lecture.id]: !p[lecture.id] }))}
                                  style={styles.lectureRow}
                                >
                                  {doneL
                                    ? <CheckCircle2 size={20} color="#10B981" />
                                    : <Circle size={20} color={st.muted + '4D'} />}
                                  <Text style={{
                                    color: doneL ? st.muted + '66' : st.text + 'CC',
                                    fontSize: 13,
                                    fontFamily: fonts.sansMedium,
                                    textDecorationLine: doneL ? 'line-through' : 'none',
                                    flex: 1,
                                  }}>
                                    {lecture.title}
                                  </Text>
                                </Pressable>
                              );
                            })}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>)}


          </View>
        )}
      </ScrollView>

      {!isTablet && <FadeEdges bottom />}
    </View>
  );
}

function taskCompletedColor(completed: boolean, base: string) {
  return completed ? base + '4D' : base;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingBottom: 4,
  },
  headerBtn: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
  progressCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    borderRadius: 16, borderWidth: 1, padding: 12, marginBottom: 24,
  },
  switcherRow: { alignItems: 'center', marginBottom: 24 },
  switcher: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 999, borderWidth: 1, padding: 4,
  },
  switchPill: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 999, paddingHorizontal: 24, paddingVertical: 10,
  },
  datePill: {
    width: 48, height: 60, borderRadius: 12, borderWidth: 1,
    flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
  },
  todayDot: { position: 'absolute', bottom: 6, width: 4, height: 4, borderRadius: 2 },
  agendaCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    borderRadius: 16, borderWidth: 1, padding: 16, overflow: 'hidden',
  },
  agendaIcon: {
    width: 48, height: 48, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  taskListHead: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 8, gap: 16,
  },
  newTaskBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 999, paddingHorizontal: 20, paddingVertical: 10,
  },
  addForm: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 20 },
  typePill: { borderRadius: 999, paddingHorizontal: 24, paddingVertical: 8 },
  fieldLabel: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 1.4, textTransform: 'uppercase', marginLeft: 8 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12, fontSize: 13 },
  timeWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16 },
  priorityBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 999, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  discardBtn: { borderRadius: 999, paddingHorizontal: 20, paddingVertical: 12 },
  planBtn: { borderRadius: 999, paddingHorizontal: 24, paddingVertical: 12 },
  taskRow: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    borderRadius: 14, borderWidth: 1, paddingVertical: 16, paddingHorizontal: 20,
    overflow: 'hidden',
  },
  checkbox: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  tag: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2 },
  emptyIcon: {
    width: 96, height: 96, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  moduleCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  moduleHead: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16,
  },
  moduleIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  chevronCircle: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  moduleBody: { borderTopWidth: 1, padding: 16, gap: 16 },
  subjectCard: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  subjectHead: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, gap: 12,
  },
  subjectIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  progTrack: { height: 4, width: 64, borderRadius: 2, overflow: 'hidden' },
  progFill: { height: 4, borderRadius: 2 },
  chevronSmall: { padding: 6, borderRadius: 8 },
  lectureRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 12, padding: 12,
  },
});
