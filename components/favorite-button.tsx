"use client";

import { favoritesStore, useFavoriteIds } from "@/hooks/use-favorites";

export function FavoriteButton({
  linkId,
  name,
}: {
  linkId: string;
  name: string;
}) {
  const favorites = useFavoriteIds();
  const isFavorite = favorites.includes(linkId);

  return (
    <button
      type="button"
      /*
        - relative z-10: 카드 전체를 덮는 앵커(::after) 위로 올라와야 눌린다
        - transition-[color]: Tailwind 의 transition-colors 는 outline-color 까지
          물들여서 키보드 포커스 링이 서서히 붉어진다. 링은 즉시 보여야 한다.
      */
      className="relative z-10 -m-1.5 cursor-pointer rounded-sm p-1.5 text-knu-gray transition-[color] hover:text-knu-red aria-pressed:text-knu-red"
      aria-pressed={isFavorite}
      aria-label={
        isFavorite ? `${name} 즐겨찾기 해제` : `${name} 즐겨찾기에 추가`
      }
      title={isFavorite ? "즐겨찾기 해제" : "즐겨찾기"}
      onClick={() => favoritesStore.toggle(linkId)}
    >
      <svg
        viewBox="0 0 24 24"
        className="size-4"
        fill={isFavorite ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 3.6l2.6 5.27 5.82.85-4.21 4.1.99 5.79L12 16.87l-5.2 2.74.99-5.79-4.21-4.1 5.82-.85z" />
      </svg>
    </button>
  );
}
