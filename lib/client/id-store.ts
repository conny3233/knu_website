/**
 * localStorage에 사는 문자열 id 목록. 즐겨찾기와 최근 방문이 함께 쓴다.
 *
 * useSyncExternalStore 를 쓰는 이유:
 * 서버는 localStorage를 모른다. getServerSnapshot이 항상 빈 배열을 돌려주므로
 * 하이드레이션 시점에는 서버와 같은 것을 그리고, 그 직후 React가 실제 값으로
 * 다시 그린다. "마운트됐나?" 를 useState로 흉내 내지 않아도 불일치가 없다.
 */

const EMPTY: readonly string[] = Object.freeze([]);

export interface IdStore {
  subscribe(listener: () => void): () => void;
  getSnapshot(): readonly string[];
  getServerSnapshot(): readonly string[];
  toggle(id: string): void;
  push(id: string): void;
  remove(id: string): void;
  clear(): void;
}

function createIdStore(key: string, limit?: number): IdStore {
  let snapshot: readonly string[] = EMPTY;
  let hydrated = false;
  const listeners = new Set<() => void>();

  const emit = () => {
    for (const l of listeners) l();
  };

  /** localStorage가 막혀 있거나(사생활 보호 모드) 값이 망가져 있어도 조용히 빈 목록으로 */
  function readStorage(): readonly string[] {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return EMPTY;
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return EMPTY;
      const ids = parsed.filter((v): v is string => typeof v === "string");
      return ids.length ? Object.freeze(ids) : EMPTY;
    } catch {
      return EMPTY;
    }
  }

  function commit(next: readonly string[]) {
    snapshot = next.length ? Object.freeze([...next]) : EMPTY;
    try {
      window.localStorage.setItem(key, JSON.stringify(snapshot));
    } catch {
      // 저장에 실패해도 이번 세션 동안은 메모리 상태로 동작한다
    }
    emit();
  }

  return {
    subscribe(listener) {
      listeners.add(listener);

      // 다른 탭에서 바꾼 것도 따라간다
      const onStorage = (e: StorageEvent) => {
        if (e.key !== key) return;
        snapshot = readStorage();
        emit();
      };
      window.addEventListener("storage", onStorage);

      return () => {
        listeners.delete(listener);
        window.removeEventListener("storage", onStorage);
      };
    },

    getSnapshot() {
      // 하이드레이션 렌더에는 getServerSnapshot이 쓰이므로 여기서 바로 읽어도 안전하다
      if (!hydrated) {
        hydrated = true;
        snapshot = readStorage();
      }
      return snapshot;
    },

    getServerSnapshot() {
      return EMPTY;
    },

    toggle(id) {
      const current = this.getSnapshot();
      commit(
        current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
      );
    },

    /** 맨 앞으로 올리고 중복을 지운다. limit이 있으면 꼬리를 자른다. */
    push(id) {
      const current = this.getSnapshot();
      const next = [id, ...current.filter((x) => x !== id)];
      commit(limit ? next.slice(0, limit) : next);
    },

    remove(id) {
      commit(this.getSnapshot().filter((x) => x !== id));
    },

    clear() {
      commit(EMPTY);
    },
  };
}

export const favoritesStore = createIdStore("knu:favorites:v1");
export const recentStore = createIdStore("knu:recent:v1", 8);
