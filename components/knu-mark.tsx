import Image from "next/image";

/**
 * 경북대학교 공식 UI 자산.
 *
 * public/brand/ 에 둔 원본은 학교 공식 다운로드(상징·캐릭터 페이지)에서
 * 받은 것이다. 비공식 사이트임은 푸터에 명시한다.
 *
 * - crest      : 교표(꽃 문양 + 첨성대). 정사각. 헤더·파비콘용.
 * - signature  : 교표 + KNU 워드마크 가로 조합. 푸터용.
 * - hobanu     : 마스코트 호반우(칡소). 투명 배경 입상.
 */

export function KnuCrest({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/crest.png"
      alt="경북대학교 교표"
      width={276}
      height={276}
      className={className}
      priority
    />
  );
}

export function KnuSignature({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/signature.png"
      alt="경북대학교"
      width={1028}
      height={276}
      className={className}
    />
  );
}

export function Hobanu({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/brand/hobanu.png"
      alt="경북대학교 마스코트 호반우"
      width={200}
      height={300}
      className={className}
      priority={priority}
    />
  );
}
