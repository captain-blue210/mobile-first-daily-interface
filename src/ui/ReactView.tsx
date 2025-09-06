import * as React from "react";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { Box, Button, Flex, HStack, Input, Textarea } from "@chakra-ui/react";
import { App, Platform, moment, Notice, TFile } from "obsidian";
import { AppHelper, Task } from "../app-helper";
import { sorter } from "../utils/collections";
import {
  ChatIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
} from "@chakra-ui/icons";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import { Moment } from "moment";
import { PostCardView } from "./PostCardView";
import { TaskView } from "./TaskView";
import { replaceDayToJa } from "../utils/strings";
import { PostFormat, Settings, postFormatMap } from "../settings";
import {
  ensureDailyNote,
  getDailyNoteFile,
  resolveDailyNotePath,
} from "src/obsutils/daily-notes";
import { parseHeadingSpec } from "src/utils/markdown";

export interface Post {
  timestamp: Moment;
  message: string;
  offset: number;
}

export function toText(
  input: string,
  asTask: boolean,
  postFormat: PostFormat,
  timestampFormat: string
): string {
  if (asTask) {
    return `
- [ ] ${input}
`;
  }

  const ts = moment().format(timestampFormat);

  if (postFormat.type === "codeblock") {
    return `
\`\`\`\`fw ${ts}
${input}
\`\`\`\`
`;
  }
  if (postFormat.type === "list") {
    return `
- ${ts} ${input}
`;
  }

  return `
${"#".repeat(postFormat.level)} ${ts}

${input}
`;
}

export const ReactView = ({
  app,
  settings,
}: {
  app: App;
  settings: Settings;
}) => {
  const appHelper = useMemo(() => new AppHelper(app), [app]);

  const [date, setDate] = useState<Moment>(moment());
  // デイリーノートが存在しないとnull
  const [currentDailyNote, setCurrentDailyNote] = useState<TFile | null>(null);
  const [input, setInput] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [asTask, setAsTask] = useState(false);
  const canSubmit = useMemo(() => input.trim().length > 0, [input]);

  const updateCurrentDailyNote = () => {
    const n = getDailyNoteFile(app, date, settings) as TFile | null;
    if (n?.path !== currentDailyNote?.path) {
      setCurrentDailyNote(n);
    }
  };

  useEffect(() => {
    updateCurrentDailyNote();
  }, [date]);

  useEffect(() => {
    if (!currentDailyNote) {
      return;
    }

    Promise.all([updatePosts(currentDailyNote), updateTasks(currentDailyNote)]);
  }, [currentDailyNote]);

  const postFormat = postFormatMap[settings.postFormatOption];
  const effectivePostFormat: PostFormat = useMemo(() => {
    if (postFormat.type !== "header") return postFormat;
    const parsed = parseHeadingSpec(settings.appendSectionSpec);
    const lvl = postFormat.level;
    if (parsed && settings.autoDemotePostHeading) {
      return {
        type: "header",
        level: Math.max(lvl, parsed.level + 1),
      } as PostFormat;
    }
    return postFormat;
  }, [postFormat, settings.appendSectionSpec, settings.autoDemotePostHeading]);

  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }

    const text = toText(
      input,
      asTask,
      effectivePostFormat,
      settings.timestampFormat
    );

    let note = currentDailyNote;
    if (!note) {
      new Notice("デイリーノートが存在しなかったので新しく作成しました");
      const created = await ensureDailyNote(app, date, settings);
      note = created;
      // 再読み込みをするためにクローンを入れて参照を更新
      setDate(date.clone());
    }

    if (!note) return;

    const spec = settings.appendSectionSpec?.trim();
    if (spec) {
      await appHelper.insertTextUnderSection(
        note,
        spec,
        text,
        effectivePostFormat,
        settings.appendSectionEnd
      );
    } else {
      await appHelper.insertTextToEnd(note, text);
    }
    setInput("");
  };

  const updatePosts = async (note: TFile) => {
    const _posts =
      postFormat.type === "codeblock"
        ? ((await appHelper.getCodeBlocks(note)) ?? [])
            ?.filter((x) => x.lang === "fw")
            .map((x) => ({
              timestamp: moment(x.meta, settings.timestampFormat, true),
              message: x.code,
              offset: x.offset,
            }))
        : postFormat.type === "list"
        ? (
            (await appHelper.getListItems(
              note,
              settings.appendSectionSpec,
              settings.appendSectionEnd,
              settings.timestampFormat
            )) ?? []
          )
            .map((x) => ({
              timestamp: moment(x.timestamp, settings.timestampFormat, true),
              message: x.message,
              offset: x.offset,
            }))
            .filter((x) => x.timestamp.isValid())
        : (
            (await appHelper.getHeaders(
              note,
              (effectivePostFormat as any).level
            )) ?? []
          )
            .map((x) => ({
              timestamp: moment(x.title, settings.timestampFormat, true),
              message: x.body,
              offset: x.titleOffset,
            }))
            .filter((x) => x.timestamp.isValid());

    setPosts(_posts.sort(sorter((x) => x.timestamp.unix(), "desc")));
  };

  const updateTasks = async (note: TFile) => {
    setTasks((await appHelper.getTasks(note)) ?? []);
  };

  const handleClickOpenDailyNote = async () => {
    let note = currentDailyNote;
    if (!note) {
      new Notice("デイリーノートが存在しなかったので新しく作成しました");
      const created = await ensureDailyNote(app, date, settings);
      note = created;
      // 再読み込みをするためにクローンを入れて参照を更新
      setDate(date.clone());
    }
    if (!note) return;
    const leaf = app.workspace.getLeaf(true);
    await leaf.openFile(note, { active: true });
  };
  const handleChangeCalendarDate = (
    event: ChangeEvent<HTMLInputElement>
  ): void => {
    setDate(moment(event.target.value));
  };
  const handleClickMovePrevious = () => {
    setDate(date.clone().subtract(1, "day"));
  };
  const handleClickMoveNext = async () => {
    setDate(date.clone().add(1, "day"));
  };
  const handleClickToday = async () => {
    setDate(moment());
  };

  const handleKeyUp = (event: React.KeyboardEvent) => {
    if (event.ctrlKey && event.key === "Enter") {
      handleSubmit();
      event.preventDefault();
    }
  };

  const handleClickTime = (post: Post) => {
    (async () => {
      if (!currentDailyNote) {
        return;
      }

      // TODO: 今後必要に応じてAppHelperにだす
      const leaf = app.workspace.getLeaf(true);
      await leaf.openFile(currentDailyNote);

      const editor = appHelper.getActiveMarkdownEditor()!;
      const pos = editor.offsetToPos(post.offset);
      editor.setCursor(pos);
      await leaf.openFile(currentDailyNote, {
        eState: { line: pos.line },
      });
    })();
  };

  useEffect(() => {
    const eventRef = app.metadataCache.on(
      "changed",
      async (file, _data, _cache) => {
        // currentDailyNoteが存在してパスが異なるなら、違う日なので更新は不要
        if (currentDailyNote != null && file.path !== currentDailyNote.path) {
          return;
        }

        if (currentDailyNote == null) {
          const expected = resolveDailyNotePath(app, date, settings);
          // 更新されたファイルがcurrentDailyNoteになるべきファイルではなければ処理は不要
          if (file.path !== expected) {
            return;
          }
        }

        // 同期などで裏でDaily Noteが作成されたときに更新する
        updateCurrentDailyNote();
        await Promise.all([updatePosts(file), updateTasks(file)]);
      }
    );

    const deleteEventRef = app.vault.on("delete", async (file) => {
      // currentDailyNoteとは別のファイルなら関係ない
      if (file.path !== currentDailyNote?.path) {
        return;
      }

      // 再読み込みをするためにクローンを入れて参照を更新
      setDate(date.clone());
      setTasks([]);
      setPosts([]);
    });

    return () => {
      app.metadataCache.offref(eventRef);
      app.vault.offref(deleteEventRef);
    };
  }, [date, currentDailyNote]);

  const updateTaskChecked = async (task: Task, checked: boolean) => {
    if (!currentDailyNote) {
      return;
    }

    const mark = checked ? "x" : " ";
    setTasks(tasks.map((x) => (x.offset === task.offset ? { ...x, mark } : x)));
    await appHelper.setCheckMark(currentDailyNote.path, mark, task.offset);
  };

  const contents = useMemo(
    () =>
      asTask ? (
        <>
          <Box
            borderStyle={"solid"}
            borderRadius={"10px"}
            borderColor={"var(--table-border-color)"}
            borderWidth={"2px"}
            boxShadow={"0 1px 1px 0"}
            marginY={8}
            minHeight={50}
          >
            <TransitionGroup className="list">
              {tasks
                .filter((x) => x.mark === " ")
                .map((x) => (
                  <CSSTransition
                    key={date.format() + x.name + x.mark}
                    timeout={300}
                    classNames="item"
                  >
                    <Box m={10}>
                      <TaskView
                        task={x}
                        onChange={(c) => updateTaskChecked(x, c)}
                      />
                    </Box>
                  </CSSTransition>
                ))}
            </TransitionGroup>
          </Box>
          <Box
            borderStyle={"solid"}
            borderRadius={"10px"}
            borderColor={"var(--table-border-color)"}
            borderWidth={"2px"}
            boxShadow={"0 1px 1px 0"}
            marginY={8}
            minHeight={50}
          >
            <TransitionGroup className="list">
              {tasks
                .filter((x) => x.mark !== " ")
                .map((x) => (
                  <CSSTransition
                    key={date.format() + x.name + x.mark}
                    timeout={300}
                    classNames="item"
                  >
                    <Box m={10}>
                      <TaskView
                        task={x}
                        onChange={(c) => updateTaskChecked(x, c)}
                      />
                    </Box>
                  </CSSTransition>
                ))}
            </TransitionGroup>
          </Box>
        </>
      ) : (
        <TransitionGroup className="list">
          {posts.map((x) => (
            <CSSTransition
              key={x.timestamp.unix()}
              timeout={300}
              classNames="item"
            >
              <PostCardView
                post={x}
                settings={settings}
                onClickTime={handleClickTime}
              />
            </CSSTransition>
          ))}
        </TransitionGroup>
      ),
    [posts, tasks, asTask]
  );

  return (
    <Flex
      flexDirection="column"
      gap="0.75rem"
      height="95%"
      maxWidth="30rem"
      position={"relative"}
    >
      <HStack justify="center">
        <ChevronLeftIcon
          boxSize="1.5em"
          cursor="pointer"
          onClick={handleClickMovePrevious}
        />
        <Box textAlign={"center"}>
          <Button
            marginRight={"0.3em"}
            fontSize={"80%"}
            width="3em"
            height="2em"
            cursor="pointer"
            onClick={handleClickToday}
          >
            今日
          </Button>
          <Input
            size="md"
            type="date"
            value={date.format("YYYY-MM-DD")}
            onChange={handleChangeCalendarDate}
            width={"9em"}
          />
          <Box as="span" marginLeft={"0.2em"} fontSize={"95%"}>
            {replaceDayToJa(date.format("(ddd)"))}
          </Box>
        </Box>
        <ChevronRightIcon
          boxSize="1.5em"
          cursor="pointer"
          onClick={handleClickMoveNext}
        />
      </HStack>
      <Box position="absolute" right={0}>
        <ExternalLinkIcon
          boxSize="1.25em"
          cursor="pointer"
          onClick={handleClickOpenDailyNote}
        />
      </Box>

      <Box flexGrow={1} overflowY="scroll" overflowX="hidden">
        {currentDailyNote && contents}
      </Box>

      <Textarea
        placeholder={asTask ? "タスクを入力" : "思ったことなどを記入"}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        minHeight={"8em"}
        resize="vertical"
        autoFocus={Platform.isMobile && settings.autoOpenInputOnMobile}
        onKeyUp={handleKeyUp}
      />
      <HStack>
        <Button
          isDisabled={!canSubmit}
          className={canSubmit ? "mod-cta" : ""}
          minHeight={"2.4em"}
          maxHeight={"2.4em"}
          flexGrow={1}
          cursor={canSubmit ? "pointer" : ""}
          onClick={handleSubmit}
        >
          {asTask ? "タスク追加" : "投稿"}
        </Button>
        <Box
          display="flex"
          gap="0.5em"
          padding={4}
          marginRight={8}
          borderStyle={"solid"}
          borderRadius={"10px"}
          borderColor={"var(--table-border-color)"}
          borderWidth={"2px"}
          cursor={"pointer"}
          _hover={{
            borderColor: "var(--text-success)",
            transitionDuration: "0.5s",
          }}
          transitionDuration={"0.5s"}
          onClick={() => setAsTask(!asTask)}
        >
          <ChatIcon
            boxSize={"1.5em"}
            color={asTask ? "var(--text-faint)" : "var(--text-success)"}
            opacity={asTask ? 0.2 : 1}
          />
          <CheckCircleIcon
            boxSize={"1.5em"}
            color={asTask ? "var(--text-success)" : "var(--text-faint)"}
            opacity={asTask ? 1 : 0.2}
          />
        </Box>
      </HStack>
    </Flex>
  );
};
