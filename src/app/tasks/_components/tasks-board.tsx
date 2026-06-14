"use client";

import { FormEvent, useMemo, useState } from "react";
import styles from "../page.module.css";

type TodoItem = {
  id: string;
  text: string;
  done: boolean;
};

type TodoListStatus = "ongoing" | "completed" | "archived";

type TodoList = {
  id: string;
  groupId: string;
  title: string;
  createdAt: number;
  status: TodoListStatus;
  items: TodoItem[];
};

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(timestamp));
}

function isComplete(items: TodoItem[]) {
  return items.length > 0 && items.every((item) => item.done);
}

function createStatusFromItems(items: TodoItem[]) {
  return isComplete(items) ? "completed" : "ongoing";
}

function mergeUniqueItems(current: TodoItem[], addition: TodoItem[]) {
  const existingIds = new Set(current.map((item) => item.id));
  return [...current, ...addition.filter((item) => !existingIds.has(item.id))];
}

function upsertById<T extends { id: string }>(items: T[], nextItem: T) {
  const index = items.findIndex((item) => item.id === nextItem.id);

  if (index === -1) {
    return [nextItem, ...items];
  }

  return items.map((item) => (item.id === nextItem.id ? nextItem : item));
}

export default function TasksBoard() {
  const [lists, setLists] = useState<TodoList[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newFirstTask, setNewFirstTask] = useState("");
  const [itemInputs, setItemInputs] = useState<Record<string, string>>({});

  const ongoingLists = useMemo(() => lists.filter((list) => list.status === "ongoing"), [lists]);
  const completedLists = useMemo(() => lists.filter((list) => list.status === "completed"), [lists]);
  const archivedLists = useMemo(() => lists.filter((list) => list.status === "archived"), [lists]);

  function updateListItems(listId: string, updater: (items: TodoItem[]) => TodoItem[]) {
    setLists((current) =>
      current.map((list) => {
        if (list.id !== listId) {
          return list;
        }

        const updatedItems = updater(list.items);
        const nextStatus = list.status === "archived" ? list.status : createStatusFromItems(updatedItems);

        return {
          ...list,
          items: updatedItems,
          status: nextStatus,
        };
      }),
    );
  }

  function createList(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = newTitle.trim();
    const firstTask = newFirstTask.trim();

    if (!title || !firstTask) {
      return;
    }

    const id = crypto.randomUUID();
    const firstItem: TodoItem = {
      id: crypto.randomUUID(),
      text: firstTask,
      done: false,
    };

    setLists((current) => [
      {
        id,
        groupId: id,
        title,
        createdAt: Date.now(),
        status: "ongoing",
        items: [firstItem],
      },
      ...current,
    ]);

    setNewTitle("");
    setNewFirstTask("");
  }

  function addItem(event: FormEvent<HTMLFormElement>, listId: string) {
    event.preventDefault();
    const value = (itemInputs[listId] ?? "").trim();

    if (!value) {
      return;
    }

    updateListItems(listId, (items) => [
      ...items,
      {
        id: crypto.randomUUID(),
        text: value,
        done: false,
      },
    ]);

    setItemInputs((current) => ({
      ...current,
      [listId]: "",
    }));
  }

  function updateItemInput(listId: string, value: string) {
    setItemInputs((current) => ({
      ...current,
      [listId]: value,
    }));
  }

  function toggleItem(listId: string, itemId: string) {
    updateListItems(listId, (items) =>
      items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              done: !item.done,
            }
          : item,
      ),
    );
  }

  function archiveDoneItems(listId: string) {
    setLists((current) => {
      const target = current.find((list) => list.id === listId);

      if (!target) {
        return current;
      }

      const doneItems = target.items.filter((item) => item.done);
      const remainingItems = target.items.filter((item) => !item.done);

      if (doneItems.length === 0) {
        return current;
      }

      const nextLists = current.filter(
        (list) => list.id !== listId && !(list.groupId === target.groupId && list.status === "completed"),
      );

      const completedRecord: TodoList = {
        id: crypto.randomUUID(),
        groupId: target.groupId,
        title: target.title,
        createdAt: target.createdAt,
        status: "completed",
        items: mergeUniqueItems(
          current.find((list) => list.groupId === target.groupId && list.status === "completed")?.items ?? [],
          doneItems,
        ),
      };

      if (remainingItems.length === 0) {
        return [completedRecord, ...nextLists];
      }

      const updatedTarget: TodoList = {
        ...target,
        items: remainingItems,
        status: createStatusFromItems(remainingItems),
      };

      return [updatedTarget, completedRecord, ...nextLists];
    });
  }

  function archiveFullList(listId: string) {
    setLists((current) => {
      const target = current.find((list) => list.id === listId);

      if (!target) {
        return current;
      }

      return current.map((list) =>
        list.groupId === target.groupId
          ? {
              ...list,
              status: "archived",
            }
          : list,
      );
    });
  }

  function restoreArchivedList(listId: string) {
    setLists((current) => {
      const target = current.find((list) => list.id === listId && list.status === "archived");

      if (!target) {
        return current;
      }

      const restoredList: TodoList = {
        ...target,
        status: createStatusFromItems(target.items),
      };

      const remaining = current.filter((list) => list.id !== listId);

      return upsertById(remaining, restoredList);
    });
  }

  const renderTaskItems = (list: TodoList, allowToggle: boolean) => (
    <ul className={styles.itemList}>
      {list.items.length === 0 && <li className={styles.emptyItem}>No items in this list.</li>}
      {list.items.map((item) => (
        <li key={item.id} className={styles.item}>
          <label className={styles.itemLabel}>
            <input type="checkbox" checked={item.done} disabled={!allowToggle} onChange={() => toggleItem(list.id, item.id)} />
            <span className={item.done ? styles.itemDone : styles.itemText}>{item.text}</span>
          </label>
          <span className={item.done ? styles.stateDone : styles.stateOpen}>{item.done ? "Done" : "Not done"}</span>
        </li>
      ))}
    </ul>
  );

  const renderListCard = (list: TodoList, section: TodoListStatus) => {
    const doneCount = list.items.filter((item) => item.done).length;
    const totalCount = list.items.length;

    return (
      <article key={list.id} className={styles.listCard}>
        <div className={styles.listHeader}>
          <div>
            <h3 className={styles.listTitle}>{list.title}</h3>
            <p className={styles.meta}>
              Created {formatDate(list.createdAt)} · {doneCount}/{totalCount} done
            </p>
          </div>
          <span className={section === "ongoing" ? styles.badgeOngoing : section === "completed" ? styles.badgeCompleted : styles.badgeArchived}>
            {section}
          </span>
        </div>

        {section === "ongoing" && (
          <form className={styles.itemForm} onSubmit={(event) => addItem(event, list.id)}>
            <input
              className={styles.input}
              placeholder="Add another task"
              value={itemInputs[list.id] ?? ""}
              onChange={(event) => updateItemInput(list.id, event.target.value)}
            />
            <button type="submit" className={styles.primaryButton}>
              Add
            </button>
          </form>
        )}

        {renderTaskItems(list, section !== "archived")}

        <div className={styles.cardActions}>
          {section === "ongoing" && (
            <details className={styles.archiveDetails}>
              <summary className={styles.archiveSummary}>Archive</summary>
              <div className={styles.archivePanel}>
                <button type="button" className={styles.secondaryButton} onClick={() => archiveDoneItems(list.id)} disabled={doneCount === 0}>
                  Archive completed items
                </button>
                <button type="button" className={styles.secondaryButton} onClick={() => archiveFullList(list.id)}>
                  Archive full list
                </button>
              </div>
            </details>
          )}

          {section === "archived" && (
            <button type="button" className={styles.secondaryButton} onClick={() => restoreArchivedList(list.id)}>
              Restore to ongoing
            </button>
          )}
        </div>
      </article>
    );
  };

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <section className={styles.card}>
          <p className={styles.eyebrow}>Tasks</p>
          <h1 className={styles.title}>To-do lists</h1>
          <p className={styles.description}>
            Create named lists with at least one task, keep ongoing work visible, and move finished work into completed or archived views.
          </p>

          <section className={styles.createFrame}>
            <div className={styles.sectionHeading}>
              <h2 className={styles.sectionTitle}>Create a new list</h2>
              <p className={styles.sectionText}>Title and first task are required in the same frame.</p>
            </div>

            <form className={styles.createListForm} onSubmit={createList}>
              <div className={styles.formGrid}>
                <label className={styles.field}>
                  <span className={styles.label}>List title</span>
                  <input
                    className={styles.input}
                    placeholder="Example: Week 1 Sprint"
                    value={newTitle}
                    onChange={(event) => setNewTitle(event.target.value)}
                  />
                </label>

                <label className={styles.field}>
                  <span className={styles.label}>First task</span>
                  <input
                    className={styles.input}
                    placeholder="Example: Draft project outline"
                    value={newFirstTask}
                    onChange={(event) => setNewFirstTask(event.target.value)}
                  />
                </label>
              </div>

              <button type="submit" className={styles.primaryButton}>
                Create List
              </button>
            </form>
          </section>

          <div className={styles.columns}>
            <section className={styles.section}>
              <div className={styles.sectionHeading}>
                <h2 className={styles.sectionTitle}>Ongoing</h2>
                <p className={styles.sectionText}>Partially completed and untouched lists live here.</p>
              </div>

              {ongoingLists.length === 0 ? <p className={styles.empty}>No ongoing lists yet.</p> : ongoingLists.map((list) => renderListCard(list, "ongoing"))}
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeading}>
                <h2 className={styles.sectionTitle}>Completed</h2>
                <p className={styles.sectionText}>Lists where every task is done appear here.</p>
              </div>

              {completedLists.length === 0 ? <p className={styles.empty}>No completed lists yet.</p> : completedLists.map((list) => renderListCard(list, "completed"))}
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeading}>
                <h2 className={styles.sectionTitle}>Archived</h2>
                <p className={styles.sectionText}>Archived lists can be restored back into active work.</p>
              </div>

              {archivedLists.length === 0 ? <p className={styles.empty}>No archived lists yet.</p> : archivedLists.map((list) => renderListCard(list, "archived"))}
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}