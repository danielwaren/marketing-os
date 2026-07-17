import {
  Bookmark,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Send,
} from "lucide-react";

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { MenuPhoto } from "@/features/menu/components/MenuPhoto";

import type { Post } from "../types/post";

interface InstagramPostPreviewProps {
  post: Post | null;
  workspaceName: string;
  instagramUsername: string | null;
  onClose(): void;
}

export function InstagramPostPreview({
  post,
  workspaceName,
  instagramUsername,
  onClose,
}: InstagramPostPreviewProps) {
  if (!post) {
    return null;
  }

  const username =
    instagramUsername?.replace(/^@/, "") ||
    "tu_negocio";

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="border-b">
          <SheetTitle>
            Vista previa de Instagram
          </SheetTitle>

          <SheetDescription>
            Así se verá aproximadamente la publicación.
          </SheetDescription>
        </SheetHeader>

        <div className="p-4">
          <Card className="mx-auto max-w-md gap-0 overflow-hidden bg-white py-0 text-neutral-950 ring-black/10">
            <CardHeader className="flex flex-row items-center gap-3 py-3">
              <Avatar>
                <AvatarFallback className="bg-linear-to-br from-fuchsia-500 to-orange-400 font-semibold text-white">
                  {workspaceName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {username}
                </p>

                <p className="truncate text-xs text-neutral-500">
                  {workspaceName}
                </p>
              </div>

              <MoreHorizontal
                className="size-5"
                aria-hidden="true"
              />
            </CardHeader>

            {post.menu?.media ? (
              <div className="[&_img]:mt-0 [&_img]:aspect-square [&_img]:h-auto [&_img]:rounded-none">
                <MenuPhoto
                  filePath={post.menu.media.file_path}
                />
              </div>
            ) : (
              <div className="flex aspect-square items-center justify-center bg-neutral-100 text-sm text-neutral-500">
                Sin fotografía asociada
              </div>
            )}

            <CardContent className="space-y-3 py-3">
              <div className="flex items-center gap-4">
                <Heart
                  className="size-6"
                  aria-hidden="true"
                />

                <MessageCircle
                  className="size-6"
                  aria-hidden="true"
                />

                <Send
                  className="size-6"
                  aria-hidden="true"
                />

                <Bookmark
                  className="ml-auto size-6"
                  aria-hidden="true"
                />
              </div>

              <p className="whitespace-pre-line text-sm leading-5">
                <span className="mr-1 font-semibold">
                  {username}
                </span>
                {post.content}
              </p>

              <p className="text-xs uppercase text-neutral-500">
                {new Intl.DateTimeFormat("es-CL", {
                  day: "numeric",
                  month: "long",
                }).format(new Date(post.created_at))}
              </p>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}
