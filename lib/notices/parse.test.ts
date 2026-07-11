import assert from "node:assert/strict";
import { test } from "node:test";
import { parseLatestNotice } from "./parse.ts";

// 실제 페이지에서 뽑은 마크업의 최소 재현. 학교가 필드를 더 넣거나 빼도
// 이 구조(td.subject 안의 a[href*=doc_no])만 유지되면 파서는 안 깨진다.
const WBBS_FIXTURE = `
<table>
  <tbody>
    <tr>
      <td class="num notice">공지</td>
      <td class="subject">
        <a href="/wbbs/wbbs/bbs/btin/viewBtin.action?btin.doc_no=1337591&menu_idx=67" onclick="doRead('1337591');return false;">
          [긴급] 사칭 사기 주의 안내
        </a>
      </td>
      <td class="writer">시설과</td>
      <td class="date">2026/06/09</td>
    </tr>
    <tr>
      <td class="num">244</td>
      <td class="subject">
        <a href="/wbbs/wbbs/bbs/btin/viewBtin.action?btin.doc_no=1337856&menu_idx=67" onclick="doRead('1337856');return false;">
          생활관 BTL사업 부속시설 임대 입찰 공고
        </a>
      </td>
      <td class="writer">생활관</td>
      <td class="date">2026/07/10</td>
    </tr>
  </tbody>
</table>
`;

const EN_BOARD_FIXTURE = `
<ul>
  <li><a href="/board/notice01.htm?mode=view&amp;mv_data=aWR4PTM5NTMmdGFibGU9Y3NfYmJzX2RhdGE=">Spring 2026 KNU Video Contest</a></li>
  <li><a href="/board/notice01.htm?mode=view&amp;mv_data=aWR4PTM4NTYmdGFibGU9Y3NfYmJzX2RhdGE=">Application Guidelines for GKS-G</a></li>
</ul>
`;

test("parseLatestNotice: wbbs 게시판 — 목록 첫 항목(고정 공지)을 뽑는다", () => {
  const notice = parseLatestNotice("wbbs", WBBS_FIXTURE);
  assert.ok(notice);
  assert.equal(notice.externalId, "1337591");
  assert.equal(notice.title, "[긴급] 사칭 사기 주의 안내");
  assert.match(notice.url, /^https:\/\/www\.knu\.ac\.kr\//);
});

test("parseLatestNotice: en-board — mv_data를 디코딩해 idx를 식별자로 쓴다", () => {
  const notice = parseLatestNotice("en-board", EN_BOARD_FIXTURE);
  assert.ok(notice);
  assert.equal(notice.externalId, "3953");
  assert.equal(notice.title, "Spring 2026 KNU Video Contest");
  assert.match(notice.url, /^https:\/\/en\.knu\.ac\.kr\//);
});

test("parseLatestNotice: 알아볼 수 없는 HTML이면 null을 돌려준다 (throw 아님)", () => {
  assert.equal(parseLatestNotice("wbbs", "<html></html>"), null);
  assert.equal(parseLatestNotice("en-board", ""), null);
});
